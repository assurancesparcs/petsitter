"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkFreeText } from "@/domains/fraud/filter";
import { declareMissionDone } from "@/domains/missions/completion";
import { notify } from "@/domains/notifications/notify";
import { rembourserMiseEnRelation } from "@/domains/refunds/refund";

export async function candidater(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/demandes?erreur=indisponible");

  const profile = await db.sitterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, publishedAt: true },
  });
  if (!profile?.publishedAt) redirect("/compte/profil?erreur=incomplet");

  const requestId = String(formData.get("requestId") ?? "");
  const raw = String(formData.get("price") ?? "").trim().replace(",", ".");
  const euros = Number(raw);
  if (!Number.isFinite(euros) || euros <= 0 || euros > 5000) {
    redirect(`/compte/demandes?erreur=tarif`);
  }

  // Candidature cadrée : UN champ court, filtré anti-fuite avant remise.
  const pitch = String(formData.get("pitch") ?? "").trim().slice(0, 300);
  if (pitch) {
    const check = checkFreeText(pitch);
    if (!check.ok) {
      await db.contentFilterHit.create({
        data: { userId: session.user.id, field: "pitch", pattern: "regex" },
      });
      redirect(`/compte/demandes?erreur=filtre&detail=${encodeURIComponent(check.reason)}`);
    }
  }

  // La demande doit être encore ouverte et dans les délais.
  const request = await db.careRequest.findFirst({
    where: { id: requestId, status: "OPEN", responseDeadline: { gt: new Date() } },
    select: { id: true },
  });
  if (!request) redirect("/compte/demandes?erreur=fermee");

  try {
    await db.application.create({
      data: {
        careRequestId: requestId,
        sitterProfileId: profile.id,
        accepted: true, // candidature = acceptation ferme (PLAN §5-A)
        priceCents: Math.round(euros * 100),
        shortPitch: pitch || null,
        filterStatus: "delivered", // passe regex OK (passe LLM en P3)
      },
    });
    await db.requestEvent.create({
      data: { careRequestId: requestId, type: "application_received" },
    });
  } catch {
    // Unicité (careRequestId, sitterProfileId) : déjà candidaté.
    redirect("/compte/demandes?erreur=deja");
  }

  redirect("/compte/demandes?ok=envoyee");
}

/**
 * Le pet sitter confirmé déclare la garde terminée (après la date de fin).
 * Même verrou d'état partagé que côté propriétaire — l'une ou l'autre partie
 * peut la déclarer, la transition n'a lieu qu'une fois.
 */
export async function declarerGardeTermineeSitter(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/demandes?erreur=indisponible");

  const requestId = String(formData.get("requestId") ?? "");
  const res = await declareMissionDone(db, {
    userId: session.user.id,
    role: "SITTER",
    requestId,
  });

  if (res === "introuvable") redirect("/compte/demandes?erreur=introuvable");
  if (res === "trop_tot") redirect("/compte/demandes?erreur=trop_tot");
  if (res === "etat") redirect("/compte/demandes?erreur=fermee");
  redirect("/compte/demandes?ok=terminee");
}

/**
 * Le pet sitter CONFIRMÉ annule une garde APRÈS confirmation (Plan B). C'est le
 * seul événement qui déclenche un remboursement. Honnête et sans détour :
 *  - IDOR : seul le sitter confirmé de CETTE mission peut annuler (résolu via
 *    son propre sitterProfile.id, jamais un id venu du client) ;
 *  - on refuse honnêtement une garde déjà commencée/terminée (endDate passée) —
 *    elle ne se « rembourse » pas ;
 *  - verrou d'état : UNLOCKED|CONFIRMED → REPLACEMENT_IN_PROGRESS (un gagnant) ;
 *  - s'il existe d'autres candidats sur la demande → on laisse l'owner choisir
 *    un remplaçant OU demander un remboursement (notif plan_b) ;
 *  - sinon → remboursement proactif immédiat de la mise en relation.
 * Le tarif de la garde n'a jamais transité par nous ; seule la mise en relation
 * peut être remboursée.
 */
export async function annulerGardeSitter(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/demandes?erreur=indisponible");
  const userId = session.user.id;

  const requestId = String(formData.get("requestId") ?? "");

  // IDOR : le sitter est identifié par SON profil, jamais par un id du formulaire.
  const profile = await db.sitterProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) redirect("/compte/demandes?erreur=introuvable");

  // Mission dont l'appelant est le sitter CONFIRMÉ — rien d'autre ne passe.
  const mission = await db.mission.findFirst({
    where: { careRequestId: requestId, confirmedSitterId: profile.id },
    include: {
      careRequest: { select: { id: true, ownerId: true, status: true, endDate: true } },
    },
  });
  if (!mission) redirect("/compte/demandes?erreur=introuvable");
  const cr = mission.careRequest;

  const now = new Date();
  if (!["UNLOCKED", "CONFIRMED"].includes(cr.status)) {
    redirect("/compte/demandes?erreur=annulation_impossible");
  }
  // Garde déjà commencée/terminée : on le dit franchement plutôt que de simuler.
  if (cr.endDate <= now) {
    redirect("/compte/demandes?erreur=annulation_trop_tard");
  }

  // Verrou d'état : une seule transition gagne (même en double-soumission).
  const gagne = await db.$transaction(async (tx) => {
    const verrou = await tx.careRequest.updateMany({
      where: {
        id: cr.id,
        status: { in: ["UNLOCKED", "CONFIRMED"] },
        endDate: { gt: now },
      },
      data: { status: "REPLACEMENT_IN_PROGRESS" },
    });
    if (verrou.count !== 1) return false;
    await tx.requestEvent.create({
      data: {
        careRequestId: cr.id,
        type: "cancelled_by_sitter_post_confirmation",
        payload: { sitterProfileId: profile.id },
      },
    });
    return true;
  });
  if (!gagne) redirect("/compte/demandes?erreur=annulation_impossible");

  // Candidats Plan B = les autres candidatures de CETTE demande (hors annulé).
  const candidats = await db.application.count({
    where: { careRequestId: cr.id, sitterProfileId: { not: profile.id } },
  });

  if (candidats > 0) {
    // Des remplaçants existent : on laisse l'owner arbitrer (choisir / rembourser).
    // Effets de bord best-effort, isolés — n'altèrent ni l'état ni le redirect.
    try {
      await notify(db, {
        userId: cr.ownerId,
        type: "plan_b",
        title: "Votre pet sitter a dû annuler",
        body: "Choisissez un remplaçant parmi les autres candidats, ou demandez le remboursement de la mise en relation — à vous de décider.",
        careRequestId: cr.id,
      });
      await notify(db, {
        userId,
        type: "plan_b",
        title: "Annulation enregistrée",
        body: "Le propriétaire va pouvoir choisir un remplaçant ou être remboursé de la mise en relation.",
        careRequestId: cr.id,
      });
    } catch (err) {
      console.error(
        `[annulerGardeSitter] effets de bord (plan_b) ignorés (${(err as Error)?.name ?? "Error"})`,
      );
    }
    redirect("/compte/demandes?ok=annulee_planb");
  }

  // Aucun remplaçant possible → remboursement proactif immédiat (idempotent).
  await rembourserMiseEnRelation(db, cr.id, "sitter_cancel_no_backup");
  try {
    await notify(db, {
      userId,
      type: "plan_b",
      title: "Annulation enregistrée",
      body: "Aucun autre candidat n'était disponible : le propriétaire est remboursé de la mise en relation.",
      careRequestId: cr.id,
    });
  } catch (err) {
    console.error(
      `[annulerGardeSitter] effet de bord (remboursement) ignoré (${(err as Error)?.name ?? "Error"})`,
    );
  }
  redirect("/compte/demandes?ok=annulee_remboursee");
}

/**
 * Signalement d'un avis reçu par le pet sitter concerné → revue humaine
 * motivée. Ne supprime JAMAIS l'avis (art. L111-7-2 : pas de retrait d'un avis
 * négatif ; seulement une modération motivée). Pose `reportedAt` une seule fois.
 */
export async function signalerAvis(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/demandes?erreur=indisponible");

  const reviewId = String(formData.get("reviewId") ?? "");

  // Le pet sitter ne peut signaler QUE l'avis d'une mission dont il est le
  // sitter confirmé. Verrou : reportedAt encore nul (idempotent).
  const profile = await db.sitterProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) redirect("/compte/demandes?erreur=introuvable");

  const signale = await db.review.updateMany({
    where: {
      id: reviewId,
      reportedAt: null,
      mission: { confirmedSitterId: profile.id },
    },
    data: { reportedAt: new Date() },
  });

  if (signale.count === 1) {
    await db.fraudSignal.create({
      data: { type: "review_reported", userId: session.user.id, payload: { reviewId } },
    });
  }
  redirect("/compte/demandes?ok=signale");
}
