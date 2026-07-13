"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { checkFreeText } from "@/domains/fraud/filter";
import { declareMissionDone } from "@/domains/missions/completion";
import { recomputeReliability } from "@/domains/reliability/score";
import { notify } from "@/domains/notifications/notify";
import { envoyerRelancePaiement } from "@/domains/notifications/email";
import { rembourserMiseEnRelation } from "@/domains/refunds/refund";

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
    // Effets de bord BEST-EFFORT, après le commit de la transaction et AVANT la
    // redirection : notifier l'owner (mise en relation débloquée) et le pet
    // sitter confirmé (candidature acceptée). Tout est isolé dans un try/catch —
    // un échec ici ne casse ni l'état débité ni la redirection.
    try {
      await notify(db, {
        userId: session.user.id,
        type: "unlocked",
        title: "Mise en relation débloquée",
        body: "Vous pouvez maintenant échanger avec votre pet sitter et organiser la garde.",
        careRequestId: request.id,
      });
      const sitter = await db.sitterProfile.findUnique({
        where: { id: application.sitterProfileId },
        select: { userId: true },
      });
      if (sitter?.userId) {
        await notify(db, {
          userId: sitter.userId,
          type: "accepted",
          title: "Votre candidature a été retenue",
          body: "Un propriétaire vous a choisi pour une garde. Retrouvez la conversation dans vos messages.",
          careRequestId: request.id,
        });
      }
    } catch (err) {
      console.error(`[choisirCandidature] effets de bord (ok) ignorés (${(err as Error)?.name ?? "Error"})`);
    }
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

  // Effets de bord BEST-EFFORT (une seule fois, on est déjà dans la seule
  // branche d'échec) : notification in-app + UN e-mail de relance à l'owner.
  // Isolé : aucun échec ne casse la redirection. Jamais de donnée carte en logs.
  try {
    await notify(db, {
      userId: session.user.id,
      type: "payment_failed",
      title: "Votre carte n'a pas pu être débitée",
      body: "Aucun montant n'a été prélevé (0 €). Vous pouvez réessayer quand vous le souhaitez.",
      careRequestId: requestId,
    });
    const email = session.user.email;
    if (email) {
      await envoyerRelancePaiement({ to: email, requestId });
    }
  } catch (err) {
    console.error(`[choisirCandidature] effets de bord (échec) ignorés (${(err as Error)?.name ?? "Error"})`);
  }

  redirect("/compte/mes-demandes?erreur=paiement");
}

/**
 * Plan B — le propriétaire choisit un REMPLAÇANT après l'annulation du sitter
 * confirmé. Strictement borné :
 *  - appartenance : la demande est celle de l'owner ET en REPLACEMENT_IN_PROGRESS ;
 *  - la candidature choisie est validée EN BASE comme une candidature de CETTE
 *    demande, et un AUTRE profil que le sitter qui a annulé ;
 *  - transition atomique : Mission.confirmedSitterId ← remplaçant (l'accès aux
 *    coordonnées via la messagerie bascule vers lui ; l'annulé le PERD, car
 *    l'accès post-déblocage est réservé au sitter confirmé/backup) et
 *    CareRequest REPLACEMENT_IN_PROGRESS → UNLOCKED (verrou : un gagnant).
 * AUCUN nouveau débit : la mise en relation est déjà CAPTURED.
 */
export async function choisirRemplacant(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes?erreur=indisponible");
  const userId = session.user.id;

  const requestId = String(formData.get("requestId") ?? "");
  const applicationId = String(formData.get("applicationId") ?? "");

  const request = await db.careRequest.findFirst({
    where: { id: requestId, ownerId: userId },
    select: {
      status: true,
      mission: { select: { confirmedSitterId: true } },
      applications: {
        where: { id: applicationId },
        select: { id: true, sitterProfileId: true },
      },
    },
  });
  const backup = request?.applications[0];
  if (!request || !backup) redirect("/compte/mes-demandes?erreur=introuvable");
  if (request.status !== "REPLACEMENT_IN_PROGRESS") {
    redirect("/compte/mes-demandes?erreur=remplacement_clos");
  }
  // Le remplaçant doit être un AUTRE profil que le sitter qui a annulé.
  if (request.mission?.confirmedSitterId === backup.sitterProfileId) {
    redirect("/compte/mes-demandes?erreur=introuvable");
  }

  const gagne = await db.$transaction(async (tx) => {
    const verrou = await tx.careRequest.updateMany({
      where: { id: requestId, ownerId: userId, status: "REPLACEMENT_IN_PROGRESS" },
      data: { status: "UNLOCKED" },
    });
    if (verrou.count !== 1) return false;
    // Réassignation : le remplaçant devient le sitter confirmé → seul lui (avec
    // l'owner) accède désormais aux coordonnées ; l'annulé bascule hors périmètre.
    await tx.mission.update({
      where: { careRequestId: requestId },
      data: { confirmedSitterId: backup.sitterProfileId },
    });
    await tx.requestEvent.create({
      data: {
        careRequestId: requestId,
        type: "replacement_confirmed",
        payload: { sitterProfileId: backup.sitterProfileId, applicationId: backup.id },
      },
    });
    return true;
  });
  if (!gagne) redirect("/compte/mes-demandes?erreur=remplacement_clos");

  // Effets de bord best-effort isolés : owner (relation rétablie) + remplaçant.
  try {
    await notify(db, {
      userId,
      type: "unlocked",
      title: "Remplaçant confirmé",
      body: "Les coordonnées de votre nouveau pet sitter sont affichées. Aucun nouveau paiement — la mise en relation reste réglée.",
      careRequestId: requestId,
    });
    const sitter = await db.sitterProfile.findUnique({
      where: { id: backup.sitterProfileId },
      select: { userId: true },
    });
    if (sitter?.userId) {
      await notify(db, {
        userId: sitter.userId,
        type: "accepted",
        title: "Vous prenez le relais sur une garde",
        body: "Un propriétaire vous a choisi comme remplaçant. Retrouvez la conversation dans vos messages.",
        careRequestId: requestId,
      });
    }
  } catch (err) {
    console.error(
      `[choisirRemplacant] effets de bord ignorés (${(err as Error)?.name ?? "Error"})`,
    );
  }
  redirect("/compte/mes-demandes?ok=remplacant");
}

/**
 * Plan B — le propriétaire préfère un REMBOURSEMENT plutôt qu'un remplaçant
 * (même s'il existe des candidats : c'est son choix). Borné à sa demande, en
 * REPLACEMENT_IN_PROGRESS. Délègue au remboursement proactif partagé (idempotent,
 * dormant-safe). La plateforme initie le remboursement, sans obstacle.
 */
export async function demanderRemboursement(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/mes-demandes?erreur=indisponible");
  const userId = session.user.id;

  const requestId = String(formData.get("requestId") ?? "");
  const request = await db.careRequest.findFirst({
    where: { id: requestId, ownerId: userId, status: "REPLACEMENT_IN_PROGRESS" },
    select: { id: true },
  });
  if (!request) redirect("/compte/mes-demandes?erreur=remplacement_clos");

  const res = await rembourserMiseEnRelation(
    db,
    requestId,
    "owner_requested_after_sitter_cancel",
  );
  // `already`/`no_payment` : la demande a été résolue autrement entre-temps
  // (ex. un remplaçant confirmé en parallèle) → aucun remboursement engagé, on
  // ne prétend pas le contraire.
  if (res !== "refunded") {
    redirect("/compte/mes-demandes?erreur=remplacement_clos");
  }
  redirect("/compte/mes-demandes?ok=rembourse");
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
    select: {
      id: true,
      confirmedSitterId: true,
      careRequest: { select: { endDate: true } },
    },
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

  // Recalcul best-effort du score de fiabilité (moyenne + volume d'avis) après
  // publication. `recomputeReliability` ne lève jamais : un échec ici ne casse
  // pas la publication de l'avis ni la redirection.
  await recomputeReliability(db, mission.confirmedSitterId);

  redirect("/compte/mes-demandes?ok=avis");
}
