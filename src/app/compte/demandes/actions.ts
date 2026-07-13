"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkFreeText } from "@/domains/fraud/filter";
import { declareMissionDone } from "@/domains/missions/completion";

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
