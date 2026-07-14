"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { passFromService, sejourAmountFor } from "@/lib/pricing";
import { ensureStripeCustomer } from "@/domains/payments/payments";
import { findByPostalCode } from "@/domains/geo/communes";
import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";
import { CONSTRAINT_KEYS } from "@/domains/marketplace/constraints";
import type { ServiceType, Species } from "@prisma/client";

// Fenêtre de réponse par défaut : 72 h (paramètre — PLAN §7, migrera en base).
const RESPONSE_WINDOW_H = 72;

export async function deposerDemande(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/demande?erreur=indisponible");

  const service = String(formData.get("service") ?? "");
  const species = String(formData.get("species") ?? "");
  if (
    !SERVICES.some((s) => s.key === service) ||
    !SPECIES.some((s) => s.key === species)
  ) {
    redirect("/demande?erreur=champs");
  }

  // Dates : début >= aujourd'hui, fin >= début.
  const start = new Date(String(formData.get("startDate") ?? ""));
  const end = new Date(String(formData.get("endDate") ?? formData.get("startDate") ?? ""));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start < today || end < start) {
    redirect("/demande?erreur=dates");
  }

  const cp = String(formData.get("cp") ?? "").trim();
  const commune = /^\d{5}$/.test(cp) ? findByPostalCode(cp)[0] : undefined;
  if (!commune) redirect("/demande?erreur=cp");
  const radiusKm = Math.min(
    Math.max(parseInt(String(formData.get("rayon") ?? "15"), 10) || 15, 1),
    50,
  );
  const animalCount = Math.min(
    Math.max(parseInt(String(formData.get("animalCount") ?? "1"), 10) || 1, 1),
    10,
  );

  // Puces pré-définies uniquement — on ne stocke que les clés connues.
  const constraints = CONSTRAINT_KEYS.filter(
    (c) => formData.get(`c_${c.key}`) === "on",
  ).map((c) => c.key);

  const deadline = new Date(Date.now() + RESPONSE_WINDOW_H * 3600 * 1000);

  // Récurrence — OPTION décochée par défaut. Le produit réel du Pass 3 mois :
  // la garde qui se répète. Weekdays dédupliqués et bornés à 0-6, timeSlot
  // trituré/capé. Si la case est cochée sans aucun jour valide → erreur douce.
  const recurring = formData.get("recurring") === "on";
  const weekdays = recurring
    ? [
        ...new Set(
          formData
            .getAll("weekday")
            .map((v) => parseInt(String(v), 10))
            .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
        ),
      ].sort((a, b) => a - b)
    : [];
  if (recurring && weekdays.length === 0) {
    redirect("/demande?erreur=recurrence");
  }
  const timeSlot =
    String(formData.get("timeSlot") ?? "").trim().slice(0, 60) || null;

  // Pass DÉDUIT du type de service (jamais choisi — anti-arbitrage, DECISIONS
  // n° 9 et n° 14), montant figé CÔTÉ SERVEUR (jamais depuis le client).
  // Pass Séjour : −30 % automatique sur EXACTEMENT le 2e de ce propriétaire —
  // éligible quand son historique compte UN SEUL Pass Séjour antérieur
  // réellement facturé (CAPTURED, ou REFUNDED : remboursé après un vrai
  // débit). Historique lu en base sur l'ownerId de SESSION (IDOR-safe) —
  // déterministe et idempotent : même historique ⇒ même montant.
  const pass = passFromService(service as ServiceType);
  let amountCents = pass.cents;
  let deuxiemeSejour = false;
  if (pass.key === "pass_sejour") {
    const priorChargedSejours = await db.payment.count({
      where: {
        packLabel: "pass_sejour",
        status: { in: ["CAPTURED", "REFUNDED"] },
        careRequest: { ownerId: session.user.id },
      },
    });
    ({ cents: amountCents, discounted: deuxiemeSejour } =
      sejourAmountFor(priorChargedSejours));
  }

  // CareRequest + RecurringRequest créés dans la MÊME transaction : la
  // récurrence est liée à la demande du propriétaire authentifié (IDOR-safe),
  // ou rien n'est écrit. Sans option cochée : comportement strictement inchangé.
  const request = await db.$transaction(async (tx) => {
    const cr = await tx.careRequest.create({
      data: {
        ownerId: session.user.id,
        service: service as ServiceType,
        species: species as Species,
        startDate: start,
        endDate: end,
        communeCode: commune.code,
        communeName: commune.nom,
        lat: commune.lat,
        lng: commune.lng,
        radiusKm,
        animalCount,
        constraints,
        responseDeadline: deadline,
        events: {
          create: {
            type: "created",
            // amountCents + deuxiemeSejour tracés pour l'audit : le montant
            // figé au dépôt doit rester explicable des années plus tard.
            payload: { constraints, pass: pass.key, amountCents, deuxiemeSejour, recurring },
          },
        },
      },
    });
    if (recurring) {
      await tx.recurringRequest.create({
        data: {
          careRequestId: cr.id,
          weekdays,
          timeSlot,
          renewSitter: true,
        },
      });
    }
    return cr;
  });

  // Stripe configuré → empreinte carte (0 € débité) : ligne Payment SETUP_PENDING
  // puis redirection vers l'écran d'empreinte. Sinon, comportement inchangé.
  const stripe = getStripe();
  let versPaiement = false;
  if (stripe) {
    try {
      const customerId = await ensureStripeCustomer(db, stripe, session.user.id);
      await db.payment.create({
        data: {
          careRequestId: request.id,
          stripeCustomerId: customerId,
          amountCents, // FIGÉ ici : c'est ce montant que Stripe débitera
          packLabel: pass.key,
          status: "SETUP_PENDING",
        },
      });
      versPaiement = true;
    } catch (e) {
      // Stripe momentanément indisponible : la demande existe, l'empreinte
      // pourra être enregistrée depuis « Mes demandes ». Aucune donnée de
      // carte ici — on ne loggue que le type d'erreur.
      console.error("[paiement] Création client/Payment impossible au dépôt :", (e as Error).name);
    }
  }

  if (versPaiement) redirect(`/demande/paiement/${request.id}`);
  redirect(`/compte/mes-demandes?ok=creee&id=${request.id}`);
}

export async function annulerDemande(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes");

  const id = String(formData.get("id") ?? "");
  // Bornée au propriétaire de la session ET aux demandes encore ouvertes.
  const updated = await db.careRequest.updateMany({
    where: { id, ownerId: session.user.id, status: "OPEN" },
    data: { status: "CANCELLED_BY_OWNER" },
  });
  if (updated.count === 1) {
    await db.requestEvent.create({
      data: { careRequestId: id, type: "cancelled_by_owner" },
    });
  }
  redirect("/compte/mes-demandes?ok=annulee");
}
