"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkFreeText } from "@/domains/fraud/filter";

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
