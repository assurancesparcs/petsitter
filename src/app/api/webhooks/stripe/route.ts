import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { capturePassPurchase } from "@/domains/payments/pass";

/**
 * Webhook Stripe — filet de sécurité de la machine à états paiement :
 *  - setup_intent.succeeded        → Payment SETUP_PENDING → SETUP_COMPLETED
 *  - payment_intent.succeeded      → Payment → CAPTURED (si pas déjà fait par
 *    l'action serveur) + déblocage complété via les metadata (Mission, statut)
 *  - payment_intent.payment_failed → Payment CHARGE_FAILED + demande PAYMENT_REQUIRED
 *
 * Signature vérifiée (STRIPE_WEBHOOK_SECRET), traitement IDEMPOTENT : toutes
 * les transitions sont des updateMany conditionnels — un événement rejoué ou
 * arrivant après l'action serveur ne change rien. Jamais de données de carte
 * dans les logs (identifiants d'objets et codes d'erreur uniquement).
 *
 * Endpoint à déclarer : https://<domaine>/api/webhooks/stripe
 * (Dashboard Stripe → Développeurs → Webhooks).
 */

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const db = getPrisma();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !db || !secret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature absente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Corps BRUT obligatoire pour la vérification de signature.
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "setup_intent.succeeded": {
        const si = event.data.object;
        const updated = await db.payment.updateMany({
          where: { stripeSetupIntentId: si.id, status: "SETUP_PENDING" },
          data: { status: "SETUP_COMPLETED" },
        });
        if (updated.count === 1 && si.metadata?.careRequestId) {
          await db.requestEvent.create({
            data: { careRequestId: si.metadata.careRequestId, type: "setup_completed" },
          });
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object;

        // Achat du Pass 3 mois (metadata.passPurchaseId) — RATTRAPAGE : la
        // transition de premier plan se fait au retour de paiement ; ici on
        // capture si elle n'a pas encore eu lieu, via le MÊME verrou
        // (updateMany conditionnel, idempotent — un événement rejoué ou
        // arrivant après le retour ne change rien). LIAISON VÉRIFIÉE (audit
        // F4) : l'événement ne capture la ligne QUE si le PaymentIntent est
        // bien CELUI enregistré sur cette ligne ET du bon montant — un
        // metadata pointant ailleurs (code futur, erreur d'intégration) ne
        // devient jamais une capture gratuite.
        if (pi.metadata?.passPurchaseId) {
          const ligne = await db.passPurchase.findUnique({
            where: { id: pi.metadata.passPurchaseId },
            select: { stripePaymentIntentId: true, amountCents: true },
          });
          if (
            ligne &&
            ligne.stripePaymentIntentId === pi.id &&
            ligne.amountCents === pi.amount
          ) {
            await capturePassPurchase(db, pi.metadata.passPurchaseId);
          } else {
            console.error(
              "[webhook] payment_intent.succeeded pass : liaison PI/ligne invalide — capture refusée.",
            );
          }
          break;
        }

        const paymentId = pi.metadata?.paymentId;
        if (!paymentId) break; // PaymentIntent étranger à ce parcours.

        // CAPTURED si pas déjà fait (l'action serveur passe généralement avant).
        const updated = await db.payment.updateMany({
          where: { id: paymentId, status: { in: ["CHARGE_PENDING", "CHARGE_FAILED"] } },
          data: { status: "CAPTURED", stripePaymentIntentId: pi.id },
        });
        if (updated.count === 1 && pi.metadata?.careRequestId) {
          const careRequestId = pi.metadata.careRequestId;
          // Filet : si l'action serveur a été interrompue après le débit, on
          // termine le déblocage ici (Mission + statut), idempotent.
          if (pi.metadata?.sitterProfileId) {
            await db.mission.upsert({
              where: { careRequestId },
              create: { careRequestId, confirmedSitterId: pi.metadata.sitterProfileId },
              update: {},
            });
          }
          await db.careRequest.updateMany({
            where: { id: careRequestId, status: { in: ["ACCEPTED", "PAYMENT_REQUIRED"] } },
            data: { status: "UNLOCKED" },
          });
          await db.requestEvent.create({
            data: { careRequestId, type: "captured", payload: { source: "webhook" } },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const paymentId = pi.metadata?.paymentId;
        if (!paymentId) break;

        const updated = await db.payment.updateMany({
          where: { id: paymentId, status: "CHARGE_PENDING" },
          data: { status: "CHARGE_FAILED", stripePaymentIntentId: pi.id },
        });
        if (updated.count === 1 && pi.metadata?.careRequestId) {
          await db.careRequest.updateMany({
            where: { id: pi.metadata.careRequestId, status: "ACCEPTED" },
            data: { status: "PAYMENT_REQUIRED" },
          });
          await db.requestEvent.create({
            data: {
              careRequestId: pi.metadata.careRequestId,
              type: "charge_failed",
              payload: { source: "webhook", code: pi.last_payment_error?.code ?? null },
            },
          });
        }
        break;
      }

      default:
        // Type non géré : accusé de réception sans action (évite les retries).
        break;
    }
  } catch (err) {
    // Erreur interne : 500 → Stripe rejouera l'événement (traitement idempotent).
    console.error(`[webhook] Échec du traitement ${event.type} :`, (err as Error).name);
    return NextResponse.json({ error: "Traitement différé." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
