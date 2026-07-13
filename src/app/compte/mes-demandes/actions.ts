"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { checkFreeText } from "@/domains/fraud/filter";
import { declareMissionDone } from "@/domains/missions/completion";

/**
 * LE moment du paiement (Q14) : le propriétaire choisit un pet sitter →
 * débit OFF-SESSION du Pass avec l'empreinte carte enregistrée au dépôt.
 * Jamais de débit avant ; jamais de double débit :
 *  - verrou d'état : updateMany conditionnel OPEN/PAYMENT_REQUIRED → ACCEPTED
 *    (une seule requête gagne, même en double-clic) ;
 *  - second verrou sur Payment : SETUP_COMPLETED → CHARGE_PENDING ;
 *  - clé d'idempotence Stripe dérivée du Payment (et de l'empreinte utilisée,
 *    pour qu'une NOUVELLE carte après échec ne rejoue pas la réponse en cache).
 * L'argent de la garde ne transite jamais par nous : on ne débite QUE la
 * mise en relation.
 */
export async function choisirCandidature(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  const stripe = getStripe();
  if (!db || !stripe) redirect("/compte/mes-demandes?erreur=indisponible");

  const requestId = String(formData.get("requestId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");

  // Vérifications de propriété STRICTES : demande de la session, candidature
  // de cette demande — rien d'autre ne passe.
  const request = await db.careRequest.findFirst({
    where: { id: requestId, ownerId: session.user.id },
    include: {
      payment: true,
      applications: { where: { id: applicationId }, select: { id: true, sitterProfileId: true } },
    },
  });
  const application = request?.applications[0];
  const payment = request?.payment;

  if (!request || !application) redirect("/compte/mes-demandes?erreur=introuvable");
  if (request.status !== "OPEN" && request.status !== "PAYMENT_REQUIRED") {
    redirect("/compte/mes-demandes?erreur=fermee");
  }
  // Expiration paresseuse : une demande OPEN hors fenêtre ne se paie plus.
  if (request.status === "OPEN" && request.responseDeadline <= new Date()) {
    redirect("/compte/mes-demandes?erreur=expiree");
  }
  // Empreinte carte posée + renonciation L221-18 horodatée : sinon pas de débit.
  if (!payment || !payment.stripeSetupIntentId) {
    redirect(`/demande/paiement/${request.id}`);
  }
  if (payment.status !== "SETUP_COMPLETED") {
    redirect(`/demande/paiement/${request.id}`);
  }
  if (!payment.withdrawalWaiverAt || !payment.immediateExecutionRequestedAt) {
    redirect(`/demande/paiement/${request.id}`);
  }

  const statutInitial = request.status;

  // Verrou n°1 — une seule transition gagne (idempotence applicative).
  const verrou = await db.careRequest.updateMany({
    where: {
      id: request.id,
      ownerId: session.user.id,
      status: { in: ["OPEN", "PAYMENT_REQUIRED"] },
    },
    data: { status: "ACCEPTED" },
  });
  if (verrou.count !== 1) redirect("/compte/mes-demandes?erreur=fermee");

  // Verrou n°2 — le Payment ne peut être débité qu'une fois.
  const verrouPaiement = await db.payment.updateMany({
    where: { id: payment.id, status: "SETUP_COMPLETED" },
    data: { status: "CHARGE_PENDING" },
  });
  if (verrouPaiement.count !== 1) {
    await db.careRequest.updateMany({
      where: { id: request.id, status: "ACCEPTED" },
      data: { status: statutInitial },
    });
    redirect("/compte/mes-demandes?erreur=fermee");
  }

  await db.requestEvent.create({
    data: {
      careRequestId: request.id,
      type: "accepted",
      payload: { applicationId: application.id, sitterProfileId: application.sitterProfileId },
    },
  });

  // Débit off-session : moyen de paiement de l'empreinte, montant FIGÉ en base
  // au dépôt (jamais depuis le client).
  let resultat: "ok" | "echec" = "echec";
  let codeEchec: string | null = null;
  try {
    const si = await stripe.setupIntents.retrieve(payment.stripeSetupIntentId);
    const paymentMethod =
      typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
    if (si.status !== "succeeded" || !paymentMethod) {
      throw Object.assign(new Error("Empreinte carte inutilisable."), {
        code: "setup_intent_unusable",
      });
    }

    const pi = await stripe.paymentIntents.create(
      {
        amount: payment.amountCents,
        currency: "eur",
        customer: payment.stripeCustomerId,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: `Mise en relation AlloPetsitter — ${payment.packLabel}`,
        metadata: {
          careRequestId: request.id,
          paymentId: payment.id,
          applicationId: application.id,
          sitterProfileId: application.sitterProfileId,
        },
      },
      // Un retry réseau rejoue la même requête ; une nouvelle empreinte
      // (après échec) forme une nouvelle clé — jamais de double débit.
      { idempotencyKey: `charge-${payment.id}-${payment.stripeSetupIntentId}` },
    );

    if (pi.status === "succeeded") {
      await db.$transaction([
        db.payment.updateMany({
          where: { id: payment.id, status: "CHARGE_PENDING" },
          data: { status: "CAPTURED", stripePaymentIntentId: pi.id },
        }),
        db.careRequest.updateMany({
          where: { id: request.id, status: "ACCEPTED" },
          data: { status: "UNLOCKED" },
        }),
        db.mission.upsert({
          where: { careRequestId: request.id },
          create: { careRequestId: request.id, confirmedSitterId: application.sitterProfileId },
          update: {},
        }),
        db.requestEvent.create({
          data: { careRequestId: request.id, type: "captured", payload: { paymentId: payment.id } },
        }),
        db.requestEvent.create({
          data: {
            careRequestId: request.id,
            type: "unlocked",
            payload: { sitterProfileId: application.sitterProfileId },
          },
        }),
      ]);
      resultat = "ok";
    } else {
      // processing / requires_action off-session : traité comme un échec de
      // premier plan — le webhook payment_intent.succeeded rattrapera le cas
      // où la banque finit par valider.
      codeEchec = pi.status;
      await db.payment.updateMany({
        where: { id: payment.id, status: "CHARGE_PENDING" },
        data: { status: "CHARGE_FAILED", stripePaymentIntentId: pi.id },
      });
    }
  } catch (err) {
    // Échec du débit (3DS exigé, carte expirée, fonds…) — parcours de premier
    // plan, jamais de donnée de carte dans les logs : code d'erreur seulement.
    const e = err as { code?: string; raw?: { payment_intent?: { id?: string } } };
    codeEchec = e.code ?? "erreur_inconnue";
    console.error(`[paiement] Débit off-session refusé (${codeEchec}) — payment ${payment.id}`);
    await db.payment.updateMany({
      where: { id: payment.id, status: "CHARGE_PENDING" },
      data: {
        status: "CHARGE_FAILED",
        stripePaymentIntentId: e.raw?.payment_intent?.id ?? undefined,
      },
    });
  }

  if (resultat === "ok") {
    redirect("/compte/mes-demandes?ok=debloquee");
  }

  // Échec : statut PAYMENT_REQUIRED + événement — l'interface propose de
  // mettre à jour la carte puis de choisir à nouveau.
  await db.careRequest.updateMany({
    where: { id: requestId, status: "ACCEPTED" },
    data: { status: "PAYMENT_REQUIRED" },
  });
  await db.requestEvent.create({
    data: { careRequestId: requestId, type: "charge_failed", payload: { code: codeEchec } },
  });
  redirect("/compte/mes-demandes?erreur=paiement");
}

/**
 * Le propriétaire déclare la garde terminée (après la date de fin). Transition
 * UNLOCKED/CONFIRMED → COMPLETED, déléguée au verrou d'état partagé. Débloque
 * le dépôt d'un avis vérifié (une expérience réelle, réglée via la plateforme).
 */
export async function declarerGardeTerminee(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes?erreur=indisponible");

  const requestId = String(formData.get("requestId") ?? "");
  const res = await declareMissionDone(db, {
    userId: session.user.id,
    role: "OWNER",
    requestId,
  });

  if (res === "introuvable") redirect("/compte/mes-demandes?erreur=introuvable");
  if (res === "trop_tot") redirect("/compte/mes-demandes?erreur=trop_tot");
  if (res === "etat") redirect("/compte/mes-demandes?erreur=fermee");
  redirect("/compte/mes-demandes?ok=terminee");
}

/**
 * Avis client conforme (Code conso. L111-7-2 / D111-16). Réservé au
 * propriétaire de la demande, sur une mission déclarée terminée :
 *  - note 1–5 obligatoire, validée côté serveur ;
 *  - texte optionnel (≤ 1500), passé au filtre anti-fuite comme la bio/pitch ;
 *  - experienceDate = date de fin réelle de la garde (l'expérience) ;
 *    createdAt = date de publication (les deux exigées par D111-16) ;
 *  - un seul avis par mission (missionId @unique) — doublon géré sans 500.
 */
export async function laisserAvis(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes?erreur=indisponible");

  const requestId = String(formData.get("requestId") ?? "");

  // Note 1–5 obligatoire — entier STRICT (on rejette "3.5", "4abc", "5e0"…).
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  if (!/^[1-5]$/.test(ratingRaw)) {
    redirect("/compte/mes-demandes?erreur=note");
  }
  const rating = Number(ratingRaw);

  // Texte libre optionnel — filtre anti-fuite AVANT enregistrement (comme bio).
  const body = String(formData.get("body") ?? "").trim().slice(0, 1500);
  if (body) {
    const check = checkFreeText(body);
    if (!check.ok) {
      await db.contentFilterHit.create({
        data: { userId: session.user.id, field: "review", pattern: "regex" },
      });
      redirect(`/compte/mes-demandes?erreur=filtre&detail=${encodeURIComponent(check.reason)}`);
    }
  }

  // Appartenance + éligibilité STRICTES : mission du propriétaire de la session,
  // garde déclarée terminée. La date d'expérience = la date de fin réelle.
  const mission = await db.mission.findFirst({
    where: {
      careRequestId: requestId,
      declaredDone: true,
      careRequest: { ownerId: session.user.id, status: "COMPLETED" },
    },
    select: { id: true, careRequest: { select: { endDate: true } } },
  });
  if (!mission) redirect("/compte/mes-demandes?erreur=avis_impossible");

  try {
    await db.review.create({
      data: {
        missionId: mission.id,
        authorId: session.user.id,
        rating,
        body: body || null,
        experienceDate: mission.careRequest.endDate,
      },
    });
  } catch (e) {
    // Unicité missionId (P2002) : un avis existe déjà pour cette garde. Jamais de
    // 500. Toute autre erreur (base indisponible…) NE doit PAS être maquillée en
    // « déjà noté » — on la laisse remonter.
    if ((e as { code?: string }).code === "P2002") {
      redirect("/compte/mes-demandes?erreur=deja_avis");
    }
    throw e;
  }

  await db.requestEvent.create({
    data: { careRequestId: requestId, type: "review_posted", payload: { rating } },
  });
  redirect("/compte/mes-demandes?ok=avis");
}
