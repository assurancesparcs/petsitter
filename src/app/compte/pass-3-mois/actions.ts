"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { PASS_TRIMESTRE_CENTS } from "@/lib/pricing";
import { ensureStripeCustomer } from "@/domains/payments/payments";
import { addThreeMonths, findActivePass } from "@/domains/payments/pass";

/**
 * Achat du Pass 3 mois — PaymentIntent ON-SESSION (débit immédiat de 59 €,
 * jamais un abonnement : aucune reconduction, aucun moyen de paiement mémorisé
 * pour un débit futur). Parcours : cette action crée la ligne PassPurchase
 * (pending) + le PaymentIntent, puis redirige vers l'écran de paiement
 * (PaymentElement). La capture en base se fait au RETOUR (+ webhook rattrapage).
 *
 * Garde-fous (money safety) :
 *  - montant UNIQUEMENT depuis PASS_TRIMESTRE_CENTS (jamais depuis le client) ;
 *  - Pass déjà ACTIF → refus (?erreur=deja_actif) : jamais deux Pass actifs ;
 *  - achat pending existant → réutilisé (double-clic / double onglet ne crée
 *    pas deux PaymentIntent) ;
 *  - clé d'idempotence Stripe dérivée de la ligne PassPurchase.
 *
 * L221-18 : la case de renonciation (JAMAIS pré-cochée côté page) est validée
 * ici et horodatée CÔTÉ SERVEUR sur la ligne PassPurchase — ce recueil couvre
 * ensuite TOUTES les demandes couvertes par ce Pass (on ne redemande pas).
 */
export async function acheterPass3Mois(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const db = getPrisma();
  const stripe = getStripe();
  if (!db || !stripe) redirect("/compte/pass-3-mois?erreur=indisponible");

  const userId = session.user.id;

  // Jamais deux Pass actifs : un Pass capturé et non échu bloque tout rachat.
  const actif = await findActivePass(db, userId);
  if (actif) redirect("/compte/pass-3-mois?erreur=deja_actif");

  // Renonciation L221-18 : la case décochée ne passe pas — validée SERVEUR.
  if (formData.get("renonciation") !== "on") {
    redirect("/compte/pass-3-mois?erreur=renonciation");
  }

  // Achat déjà engagé (pending) : on le RÉUTILISE au lieu d'en créer un
  // deuxième — QUELLE que soit l'étape atteinte (avec ou sans PaymentIntent :
  // s'il manque, il sera créé ci-dessous avec la même clé d'idempotence).
  // L'écran de paiement vérifie lui-même que le PaymentIntent est encore
  // confirmable (et le solde sinon).
  const enCours = await db.passPurchase.findFirst({
    where: { userId, status: "pending" },
    orderBy: { purchasedAt: "desc" },
    select: { id: true, stripePaymentIntentId: true },
  });
  if (enCours?.stripePaymentIntentId) {
    redirect(`/compte/pass-3-mois/paiement/${enCours.id}`);
  }

  const now = new Date();
  const customerId = await ensureStripeCustomer(db, stripe, userId);

  // expiresAt provisoire (champ requis) — RECALCULÉ à la capture : la
  // couverture court depuis le paiement effectif (capturePassPurchase).
  // La création est protégée par l'index UNIQUE partiel (userId, pending —
  // migration 0011) : en double-soumission strictement PARALLÈLE, une seule
  // ligne gagne ; le perdant (P2002) réutilise celle du gagnant.
  let purchase: { id: string };
  if (enCours) {
    purchase = enCours; // ligne pending sans PaymentIntent : on la complète.
  } else {
    try {
      purchase = await db.passPurchase.create({
        data: {
          userId,
          amountCents: PASS_TRIMESTRE_CENTS, // SEULE source du montant
          status: "pending",
          expiresAt: addThreeMonths(now),
          // Recueil L221-18 horodaté serveur — comme demanderExecutionImmediate.
          immediateExecutionRequestedAt: now,
          withdrawalWaiverAt: now,
        },
        select: { id: true },
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002") {
        const gagnant = await db.passPurchase.findFirst({
          where: { userId, status: "pending" },
          orderBy: { purchasedAt: "desc" },
          select: { id: true },
        });
        if (gagnant) redirect(`/compte/pass-3-mois/paiement/${gagnant.id}`);
        redirect("/compte/pass-3-mois?erreur=indisponible");
      }
      throw e;
    }
  }
  await db.auditLog.create({
    data: {
      userId,
      action: "withdrawal_waiver_recorded",
      payload: { passPurchaseId: purchase.id },
    },
  });

  try {
    const pi = await stripe.paymentIntents.create(
      {
        amount: PASS_TRIMESTRE_CENTS,
        currency: "eur",
        customer: customerId,
        payment_method_types: ["card"],
        description:
          "AlloPetsitter — Pass 3 mois (achat unique, aucune reconduction)",
        metadata: { passPurchaseId: purchase.id, userId },
      },
      // Un retry réseau rejoue la même requête — jamais deux PaymentIntent
      // pour la même ligne d'achat.
      { idempotencyKey: `pass-${purchase.id}` },
    );
    await db.passPurchase.update({
      where: { id: purchase.id },
      data: { stripePaymentIntentId: pi.id },
    });
  } catch (e) {
    // Stripe indisponible : la ligne est soldée (failed), rien n'a été débité.
    // Jamais de donnée de paiement en logs — nom de l'erreur seulement.
    console.error(
      `[pass] Création du PaymentIntent impossible (${(e as Error)?.name ?? "Error"})`,
    );
    await db.passPurchase.updateMany({
      where: { id: purchase.id, status: "pending" },
      data: { status: "failed" },
    });
    redirect("/compte/pass-3-mois?erreur=indisponible");
  }

  redirect(`/compte/pass-3-mois/paiement/${purchase.id}`);
}
