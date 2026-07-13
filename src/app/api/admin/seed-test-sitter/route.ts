import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { verifyBasicAuth } from "@/lib/admin-auth";
import { findByPostalCode } from "@/domains/geo/communes";
import { BASE_URL } from "@/lib/brand";
import type { ServiceType, Species } from "@prisma/client";

/**
 * Crée (ou met à jour) UN pet sitter de DÉMONSTRATION à Caen (14000), publié et
 * vérifié, pour parcourir le processus client (recherche → fiche → dépôt de
 * demande). Outil interne, protégé par les identifiants ADMIN (HTTP Basic, les
 * mêmes que la console /admin). Idempotent : rejouable sans doublon.
 *
 *   POST   → crée/rafraîchit le sitter de démo
 *   DELETE → le retire proprement
 *
 *   curl -X POST   -u "ADMIN_USER:ADMIN_PASSWORD" https://<site>/api/admin/seed-test-sitter
 *   curl -X DELETE -u "ADMIN_USER:ADMIN_PASSWORD" https://<site>/api/admin/seed-test-sitter
 *
 * Aucun faux avis ni chiffre inventé : le profil s'affiche « Nouveau » (état
 * honnête). La bio indique qu'il s'agit d'un profil de démonstration.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_EMAIL = "demo-sitter-caen@allo-pet-sitter.invalid";

const BIO =
  "Bonjour ! Je m'occupe des chats, chiens et NAC avec beaucoup d'attention, " +
  "chez vous ou chez moi. Maison avec jardin clôturé, disponible en semaine " +
  "comme le week-end. Rencontre préalable avec plaisir avant toute garde. " +
  "(Profil de démonstration, le temps de découvrir le parcours AlloPetsitter.)";

// Services × espèces × tarifs — chat = chien = NAC. Unités cohérentes avec la
// grille du profil (visite/promenade/nuit).
const SERVICES: Array<{
  service: ServiceType;
  species: Species;
  priceCents: number;
  priceUnit: string;
}> = [
  { service: "HOME_VISIT", species: "CAT", priceCents: 1800, priceUnit: "per_visit" },
  { service: "HOUSE_SITTING", species: "CAT", priceCents: 3000, priceUnit: "per_night" },
  { service: "WALK", species: "DOG", priceCents: 1600, priceUnit: "per_walk" },
  { service: "BOARDING", species: "DOG", priceCents: 2800, priceUnit: "per_night" },
  { service: "HOME_VISIT", species: "OTHER", priceCents: 1500, priceUnit: "per_visit" },
];

function authorized(req: Request): boolean {
  // Mêmes identifiants que la console /admin (HTTP Basic, comparaison à temps
  // constant). Sans identifiants configurés → refus (fail-closed).
  return verifyBasicAuth(req.headers.get("authorization"));
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  const commune = findByPostalCode("14000")[0];
  if (!commune) {
    return NextResponse.json({ error: "Commune 14000 introuvable." }, { status: 500 });
  }

  const now = new Date();

  // Utilisateur SITTER de démo (e-mail .invalid : non délivrable, clairement test).
  const user = await db.user.upsert({
    where: { email: TEST_EMAIL },
    update: {
      role: "SITTER",
      firstName: "Camille",
      lastName: "Durand",
      lastNameInitial: "D",
      name: "Camille Durand",
    },
    create: {
      email: TEST_EMAIL,
      role: "SITTER",
      firstName: "Camille",
      lastName: "Durand",
      lastNameInitial: "D",
      name: "Camille Durand",
    },
  });

  const profileData = {
    bio: BIO,
    communeCode: commune.code,
    communeName: commune.nom,
    lat: commune.lat,
    lng: commune.lng,
    radiusKm: 15,
    housingType: "Maison avec jardin",
    hasGarden: true,
    ownAnimals: "Un chat et un chien",
    publishedAt: now,
    suspendedAt: null,
    suspensionReason: null,
    calendarUpdated: now,
  };
  const profile = await db.sitterProfile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: { userId: user.id, ...profileData },
  });

  // Identité vérifiée (le sitter est ainsi publiable/visible comme un vrai).
  await db.identityVerification.upsert({
    where: { sitterProfileId: profile.id },
    update: {
      provider: "manual",
      status: "verified",
      submittedAt: now,
      reviewedAt: now,
      verifiedAt: now,
      rejectionReason: null,
    },
    create: {
      sitterProfileId: profile.id,
      provider: "manual",
      status: "verified",
      submittedAt: now,
      reviewedAt: now,
      verifiedAt: now,
    },
  });

  // Services : on remplace l'ensemble (idempotent).
  await db.sitterService.deleteMany({ where: { sitterProfileId: profile.id } });
  await db.sitterService.createMany({
    data: SERVICES.map((s) => ({ ...s, sitterProfileId: profile.id })),
  });

  return NextResponse.json({
    ok: true,
    sitterId: profile.id,
    ficheUrl: `${BASE_URL}/petsitter/${profile.id}`,
    rechercheUrl: `${BASE_URL}/recherche?cp=14000&service=HOME_VISIT&species=CAT`,
    note: "Pet sitter de démonstration à Caen (14000), publié + identité vérifiée. Rejouable (idempotent). DELETE pour le retirer.",
  });
}

export async function DELETE(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ error: "Base indisponible." }, { status: 503 });
  }

  const user = await db.user.findUnique({
    where: { email: TEST_EMAIL },
    select: { id: true, sitterProfile: { select: { id: true } } },
  });
  if (!user) return NextResponse.json({ ok: true, deleted: 0 });

  if (user.sitterProfile) {
    const sp = user.sitterProfile.id;
    // Enfants d'abord (aucune cascade sur ces relations).
    await db.sitterService.deleteMany({ where: { sitterProfileId: sp } });
    await db.availabilitySlot.deleteMany({ where: { sitterProfileId: sp } });
    await db.reliabilityScore.deleteMany({ where: { sitterProfileId: sp } });
    await db.identityVerification.deleteMany({ where: { sitterProfileId: sp } });
    await db.sitterProfile.deleteMany({ where: { id: sp } });
  }
  await db.user.delete({ where: { id: user.id } });

  return NextResponse.json({ ok: true, deleted: 1 });
}
