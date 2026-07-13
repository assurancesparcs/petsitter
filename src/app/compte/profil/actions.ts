"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { checkFreeText } from "@/domains/fraud/filter";
import { findByPostalCode } from "@/domains/geo/communes";
import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";
import type { ServiceType, Species } from "@prisma/client";

const UNIT_BY_SERVICE: Record<string, string> = {
  BOARDING: "per_night",
  HOUSE_SITTING: "per_night",
  HOME_VISIT: "per_visit",
  WALK: "per_walk",
};

async function requireSitter() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");
  const db = getPrisma();
  if (!db) redirect("/compte/profil?erreur=indisponible");
  return { userId: session.user.id, db };
}

export async function enregistrerProfil(formData: FormData) {
  const { userId, db } = await requireSitter();

  // Identité (le nom complet reste privé : seul « Prénom I. » est public)
  const firstName = String(formData.get("firstName") ?? "").trim().slice(0, 60);
  const lastName = String(formData.get("lastName") ?? "").trim().slice(0, 80);
  if (!firstName || !lastName) redirect("/compte/profil?erreur=identite");

  // Bio — filtre anti-fuite AVANT enregistrement
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 1200);
  if (bio) {
    const check = checkFreeText(bio);
    if (!check.ok) {
      // Journalise la tentative (récidive → revue humaine, jamais de sanction auto)
      await db.contentFilterHit.create({
        data: { userId, field: "bio", pattern: "regex" },
      });
      redirect(`/compte/profil?erreur=filtre&detail=${encodeURIComponent(check.reason)}`);
    }
  }

  // Localisation : code postal → commune (centroïde). Jamais d'adresse exacte.
  const cp = String(formData.get("cp") ?? "").trim();
  const commune = /^\d{5}$/.test(cp) ? findByPostalCode(cp)[0] : undefined;
  if (!commune) redirect("/compte/profil?erreur=cp");
  const radiusKm = Math.min(
    Math.max(parseInt(String(formData.get("rayon") ?? "10"), 10) || 10, 1),
    50,
  );

  const hasGarden = formData.get("hasGarden") === "on";
  const housingType = String(formData.get("housingType") ?? "").trim().slice(0, 60) || null;
  const ownAnimalsRaw = String(formData.get("ownAnimals") ?? "").trim().slice(0, 200);
  if (ownAnimalsRaw) {
    const check = checkFreeText(ownAnimalsRaw);
    if (!check.ok) redirect(`/compte/profil?erreur=filtre&detail=${encodeURIComponent(check.reason)}`);
  }

  // Services × espèces × tarifs libres — champs price_<SERVICE>_<SPECIES> en euros
  const services: Array<{ service: ServiceType; species: Species; priceCents: number; priceUnit: string }> = [];
  for (const s of SERVICES) {
    for (const sp of SPECIES) {
      const raw = String(formData.get(`price_${s.key}_${sp.key}`) ?? "").trim().replace(",", ".");
      if (!raw) continue;
      const euros = Number(raw);
      if (!Number.isFinite(euros) || euros <= 0 || euros > 500) continue;
      services.push({
        service: s.key as ServiceType,
        species: sp.key as Species,
        priceCents: Math.round(euros * 100),
        priceUnit: UNIT_BY_SERVICE[s.key] ?? "per_day",
      });
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { firstName, lastName, lastNameInitial: lastName[0]?.toUpperCase() ?? null },
    });
    const profile = await tx.sitterProfile.upsert({
      where: { userId },
      update: {
        bio: bio || null,
        communeCode: commune.code,
        communeName: commune.nom,
        lat: commune.lat,
        lng: commune.lng,
        radiusKm,
        hasGarden,
        housingType,
        ownAnimals: ownAnimalsRaw || null,
      },
      create: {
        userId,
        bio: bio || null,
        communeCode: commune.code,
        communeName: commune.nom,
        lat: commune.lat,
        lng: commune.lng,
        radiusKm,
        hasGarden,
        housingType,
        ownAnimals: ownAnimalsRaw || null,
      },
    });
    await tx.sitterService.deleteMany({ where: { sitterProfileId: profile.id } });
    if (services.length) {
      await tx.sitterService.createMany({
        data: services.map((s) => ({ ...s, sitterProfileId: profile.id })),
      });
    }
  });

  redirect("/compte/profil?ok=1");
}

export async function publierProfil() {
  const { userId, db } = await requireSitter();
  const profile = await db.sitterProfile.findUnique({
    where: { userId },
    include: {
      services: true,
      user: { select: { firstName: true } },
      identityVerification: { select: { status: true } },
    },
  });
  // Publication seulement si le profil est complet — sinon retour avec motif.
  if (!profile || !profile.user.firstName || !profile.communeCode || profile.services.length === 0) {
    redirect("/compte/profil?erreur=incomplet");
  }
  // Contrôle d'identité obligatoire avant toute publication : un profil non
  // vérifié n'est jamais visible dans la recherche.
  if (profile.identityVerification?.status !== "verified") {
    redirect("/compte/profil?erreur=identite_requise");
  }
  await db.sitterProfile.update({
    where: { userId },
    data: { publishedAt: new Date() },
  });
  redirect("/compte/profil?ok=publie");
}

export async function depublierProfil() {
  const { userId, db } = await requireSitter();
  await db.sitterProfile.update({
    where: { userId },
    data: { publishedAt: null },
  });
  redirect("/compte/profil?ok=depublie");
}
