import "server-only";
import { getPrisma } from "@/lib/prisma";
import { distanceKm } from "@/domains/geo/communes";
import {
  addDaysISO,
  isCalendarStale,
  slotDate,
  slotISO,
  todayISOParis,
} from "@/domains/marketplace/availability";
import type { ServiceType, Species } from "@prisma/client";

/**
 * Requêtes marketplace côté serveur. Anonymisation stricte pré-paiement :
 * on n'expose JAMAIS le nom complet ni l'adresse — prénom + initiale,
 * commune + distance uniquement (PLAN §5-A).
 */

export type SitterCard = {
  id: string;
  displayName: string; // « Prénom L. »
  bio: string | null;
  communeName: string | null;
  distanceKm: number;
  priceCents: number;
  priceUnit: string;
  // Note moyenne affichable UNIQUEMENT si le sitter est au-delà du seuil de
  // fiabilité ET a au moins un avis vérifié — sinon null (badge « Nouveau »).
  // Jamais 0 comme note : une absence de score reste null.
  rating: number | null;
};

const UNIT_LABEL: Record<string, string> = {
  per_night: "/ nuit",
  per_visit: "/ visite",
  per_walk: "/ promenade",
  per_day: "/ jour",
};

export function priceLabel(cents: number, unit: string): string {
  const euros = (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
  return `${euros} € ${UNIT_LABEL[unit] ?? ""}`.trim();
}

export function displayName(firstName: string | null, lastName: string | null): string {
  const prenom = firstName?.trim() || "Pet sitter";
  const initiale = lastName?.trim()?.[0]?.toUpperCase();
  return initiale ? `${prenom} ${initiale}.` : prenom;
}

/** Pet sitters publiés, dans le rayon, proposant service × espèce. */
export async function searchSitters(params: {
  lat: number;
  lng: number;
  radiusKm: number;
  service: ServiceType;
  species: Species;
}): Promise<SitterCard[]> {
  const db = getPrisma();
  if (!db) return [];

  // Pré-filtre bounding-box en SQL, Haversine précis en JS (volumes V1).
  const dLat = params.radiusKm / 111;
  const dLng = params.radiusKm / (111 * Math.cos((params.lat * Math.PI) / 180) || 1);

  const rows = await db.sitterProfile.findMany({
    where: {
      publishedAt: { not: null },
      suspendedAt: null,
      lat: { gte: params.lat - dLat, lte: params.lat + dLat },
      lng: { gte: params.lng - dLng, lte: params.lng + dLng },
      services: { some: { service: params.service, species: params.species } },
      user: { deletedAt: null },
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      services: {
        where: { service: params.service, species: params.species },
        take: 1,
      },
      // Score de fiabilité dénormalisé : on n'affiche la note que si le sitter
      // est éligible (au-delà du seuil) et a au moins un avis vérifié.
      reliability: {
        select: { displayEligible: true, averageRating: true, reviewCount: true },
      },
    },
    take: 100,
  });

  return rows
    .map((r) => {
      const d = distanceKm(params.lat, params.lng, r.lat!, r.lng!);
      const svc = r.services[0];
      const rel = r.reliability;
      const rating =
        rel && rel.displayEligible && rel.reviewCount >= 1
          ? rel.averageRating
          : null;
      return d <= params.radiusKm + (r.radiusKm ?? 0) && svc
        ? {
            id: r.id,
            displayName: displayName(r.user.firstName, r.user.lastName),
            bio: r.bio,
            communeName: r.communeName ?? null,
            distanceKm: Math.round(d * 10) / 10,
            priceCents: svc.priceCents,
            priceUnit: svc.priceUnit,
            rating,
          }
        : null;
    })
    .filter((x): x is SitterCard => x !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Fiche publique anonymisée d'un pet sitter publié. */
export async function getSitterPublic(id: string) {
  const db = getPrisma();
  if (!db) return null;

  const p = await db.sitterProfile.findFirst({
    where: { id, publishedAt: { not: null }, suspendedAt: null, user: { deletedAt: null } },
    include: {
      user: { select: { firstName: true, lastName: true, createdAt: true } },
      services: { orderBy: { priceCents: "asc" } },
      reliability: true,
    },
  });
  if (!p) return null;

  // Disponibilités à venir (14 jours) : lecture seule, jamais de donnée sensible.
  // Rappel sémantique : ligne available=false = jour bloqué ; absence = dispo.
  const today = todayISOParis();
  const horizonISO = addDaysISO(today, 13); // fenêtre de 14 jours (aujourd'hui inclus)
  const blockedRows = await db.availabilitySlot.findMany({
    where: {
      sitterProfileId: p.id,
      available: false,
      date: { gte: slotDate(today), lte: slotDate(horizonISO) },
    },
    select: { date: true },
  });
  const blockedSet = new Set(blockedRows.map((r) => slotISO(r.date)));

  const next14: Array<{ iso: string; available: boolean }> = [];
  for (let i = 0; i < 14; i++) {
    const iso = addDaysISO(today, i);
    next14.push({ iso, available: !blockedSet.has(iso) });
  }
  const availableCount14 = next14.filter((d) => d.available).length;

  // Avis VÉRIFIÉS de ce pet sitter (chacun adossé à une garde réellement réglée
  // via la plateforme). On exclut les avis masqués par modération motivée
  // (moderatedAt != null) — mais JAMAIS un avis sur son seul caractère négatif.
  // Tri par défaut : du plus récent au plus ancien (critère affiché côté fiche).
  // Pas de moyenne agrégée ici : le score de fiabilité est une feature séparée,
  // à seuil (« Nouveau » sous le seuil).
  const reviewRows = await db.review.findMany({
    where: {
      moderatedAt: null,
      mission: { confirmedSitterId: p.id },
    },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { firstName: true, lastName: true } } },
    take: 100,
  });
  const reviews = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.createdAt, // date de publication (D111-16)
    experienceDate: r.experienceDate, // date de l'expérience (D111-16)
    authorName: displayName(r.author.firstName, r.author.lastName),
  }));

  return {
    id: p.id,
    displayName: displayName(p.user.firstName, p.user.lastName),
    bio: p.bio,
    communeName: p.communeName ?? null,
    radiusKm: p.radiusKm,
    hasGarden: p.hasGarden,
    housingType: p.housingType,
    ownAnimals: p.ownAnimals,
    memberSince: p.user.createdAt,
    services: p.services.map((s) => ({
      service: s.service,
      species: s.species,
      priceCents: s.priceCents,
      priceUnit: s.priceUnit,
    })),
    // Disponibilité publique (lecture seule).
    availability: {
      calendarUpdated: p.calendarUpdated,
      stale: isCalendarStale(p.calendarUpdated), // règle des 14 jours → « à confirmer »
      next14, // bande jour par jour sur 14 jours
      availableCount14, // nb de jours dispo sur les 14 prochains
      blockedCount14: 14 - availableCount14,
    },
    // Liste d'avis vérifiés + total (aucune moyenne agrégée dans CETTE liste :
    // la moyenne vit dans le bloc `reliability` ci-dessous, sous condition de seuil).
    reviews,
    reviewCount: reviews.length,
    // Score de fiabilité. `null` si jamais calculé (aucune activité). Les
    // métriques CHIFFRÉES ne sont exposées QUE si `displayEligible` : sinon la
    // fiche garde le badge « Nouveau » (jamais de vide déguisé en chiffre).
    reliability: buildPublicReliability(p.reliability),
  };
}

/** Métriques de fiabilité exposables. */
export type PublicReliability = {
  displayEligible: boolean;
  completedCount: number;
  // Chiffres masqués (mis à null) tant que displayEligible est faux.
  averageRating: number | null;
  reviewCount: number;
  cancellationRate: number | null;
  medianResponseH: number | null;
};

/**
 * Projette un `ReliabilityScore` en objet public honnête. Sous le seuil
 * (`displayEligible === false`), on N'EXPOSE AUCUN chiffre de score : la fiche
 * affiche le badge « Nouveau ». La note n'est fournie que s'il existe au moins
 * un avis vérifié (jamais 0 comme note).
 */
function buildPublicReliability(
  rel: {
    displayEligible: boolean;
    completedCount: number;
    averageRating: number | null;
    reviewCount: number;
    cancellationRate: number | null;
    medianResponseH: number | null;
  } | null,
): PublicReliability | null {
  if (!rel) return null;
  if (!rel.displayEligible) {
    return {
      displayEligible: false,
      completedCount: rel.completedCount,
      averageRating: null,
      reviewCount: rel.reviewCount,
      cancellationRate: null,
      medianResponseH: null,
    };
  }
  return {
    displayEligible: true,
    completedCount: rel.completedCount,
    averageRating: rel.reviewCount >= 1 ? rel.averageRating : null,
    reviewCount: rel.reviewCount,
    cancellationRate: rel.cancellationRate,
    medianResponseH: rel.medianResponseH,
  };
}
