import "server-only";
import type { PrismaClient, ServiceType, Species } from "@prisma/client";
import { findByPostalCode } from "@/domains/geo/communes";

/**
 * Données de DÉMONSTRATION pour parcourir le processus en conditions réelles
 * (recherche → fiche → dépôt → candidature reçue → mur du paiement). Réservé aux
 * routes d'administration protégées. Aucune donnée trompeuse : le pet sitter de
 * démo affiche « Nouveau » (pas de faux avis), et sa bio indique qu'il s'agit
 * d'un profil de démonstration. Les objets créés portent un marqueur pour un
 * nettoyage propre.
 */

export const DEMO_SITTER_EMAIL = "demo-sitter-caen@allo-pet-sitter.invalid";

const DEMO_BIO =
  "Bonjour ! Je m'occupe des chats, chiens et NAC avec beaucoup d'attention, " +
  "chez vous ou chez moi. Maison avec jardin clôturé, disponible en semaine " +
  "comme le week-end. Rencontre préalable avec plaisir avant toute garde. " +
  "(Profil de démonstration, le temps de découvrir le parcours AlloPetsitter.)";

const DEMO_SERVICES: Array<{
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

/** Crée (ou rafraîchit) le pet sitter de démo publié + vérifié à Caen (14000). */
export async function ensureDemoSitter(
  db: PrismaClient,
): Promise<{ userId: string; profileId: string } | null> {
  const commune = findByPostalCode("14000")[0];
  if (!commune) return null;
  const now = new Date();

  const user = await db.user.upsert({
    where: { email: DEMO_SITTER_EMAIL },
    update: {
      role: "SITTER",
      firstName: "Camille",
      lastName: "Durand",
      lastNameInitial: "D",
      name: "Camille Durand",
    },
    create: {
      email: DEMO_SITTER_EMAIL,
      role: "SITTER",
      firstName: "Camille",
      lastName: "Durand",
      lastNameInitial: "D",
      name: "Camille Durand",
    },
  });

  const profileData = {
    bio: DEMO_BIO,
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

  await db.sitterService.deleteMany({ where: { sitterProfileId: profile.id } });
  await db.sitterService.createMany({
    data: DEMO_SERVICES.map((s) => ({ ...s, sitterProfileId: profile.id })),
  });

  return { userId: user.id, profileId: profile.id };
}

/** Supprime le pet sitter de démo et ses enfants (aucune cascade). */
export async function removeDemoSitter(db: PrismaClient): Promise<number> {
  const user = await db.user.findUnique({
    where: { email: DEMO_SITTER_EMAIL },
    select: { id: true, sitterProfile: { select: { id: true } } },
  });
  if (!user) return 0;
  if (user.sitterProfile) {
    const sp = user.sitterProfile.id;
    await db.application.deleteMany({ where: { sitterProfileId: sp } });
    await db.sitterService.deleteMany({ where: { sitterProfileId: sp } });
    await db.availabilitySlot.deleteMany({ where: { sitterProfileId: sp } });
    await db.reliabilityScore.deleteMany({ where: { sitterProfileId: sp } });
    await db.identityVerification.deleteMany({ where: { sitterProfileId: sp } });
    await db.sitterProfile.deleteMany({ where: { id: sp } });
  }
  await db.user.delete({ where: { id: user.id } });
  return 1;
}

/** Marqueur porté par les demandes de démonstration (pour un nettoyage ciblé). */
const DEMO_TAG = { demo: true, note: "Scénario de démonstration AlloPetsitter" };

/** Supprime les demandes de démo d'un propriétaire (+ candidatures et évènements). */
async function removeDemoRequestsFor(db: PrismaClient, ownerId: string): Promise<void> {
  const demandes = await db.careRequest.findMany({
    where: { ownerId, constraints: { path: ["demo"], equals: true } },
    select: { id: true },
  });
  for (const d of demandes) {
    await db.application.deleteMany({ where: { careRequestId: d.id } });
    await db.requestEvent.deleteMany({ where: { careRequestId: d.id } });
    await db.payment.deleteMany({ where: { careRequestId: d.id } });
    await db.mission.deleteMany({ where: { careRequestId: d.id } });
    await db.careRequest.delete({ where: { id: d.id } });
  }
}

/**
 * Monte un scénario complet AVANT PAIEMENT : le pet sitter de démo, le compte
 * PROPRIÉTAIRE (l'adresse fournie — celle avec laquelle l'utilisateur se
 * connectera), une demande OUVERTE à Caen et UNE candidature du pet sitter sur
 * cette demande. L'utilisateur, connecté comme propriétaire, verra la
 * candidature reçue et pourra aller jusqu'au mur du paiement (Stripe dormant).
 * Idempotent : rejoue en nettoyant les demandes de démo précédentes du compte.
 */
export async function ensureDemoScenario(
  db: PrismaClient,
  ownerEmail: string,
): Promise<
  | { ok: true; ownerId: string; careRequestId: string; sitterProfileId: string }
  | { ok: false; reason: string }
> {
  const commune = findByPostalCode("14000")[0];
  if (!commune) return { ok: false, reason: "commune_introuvable" };

  const sitter = await ensureDemoSitter(db);
  if (!sitter) return { ok: false, reason: "sitter_introuvable" };

  // Compte propriétaire = l'adresse fournie. Rôle OWNER pour accéder à l'espace
  // client. (Si le compte existait en SITTER, il bascule en OWNER — c'est le
  // compte de test choisi par l'utilisateur.)
  const owner = await db.user.upsert({
    where: { email: ownerEmail },
    update: { role: "OWNER" },
    create: { email: ownerEmail, role: "OWNER", firstName: "Client", name: "Client test" },
  });

  // On repart propre : on retire les demandes de démo précédentes de ce compte.
  await removeDemoRequestsFor(db, owner.id);

  const now = new Date();
  const startDate = new Date(now.getTime() + 14 * 24 * 3600 * 1000); // dans 14 j
  const endDate = new Date(startDate.getTime() + 2 * 3600 * 1000); // même jour
  const responseDeadline = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  const demande = await db.careRequest.create({
    data: {
      ownerId: owner.id,
      service: "HOME_VISIT",
      species: "CAT",
      startDate,
      endDate,
      communeCode: commune.code,
      communeName: commune.nom,
      lat: commune.lat,
      lng: commune.lng,
      radiusKm: 10,
      animalCount: 1,
      constraints: DEMO_TAG,
      status: "OPEN",
      responseDeadline,
    },
  });

  // Candidature du pet sitter de démo sur cette demande (acceptation ferme).
  await db.application.create({
    data: {
      careRequestId: demande.id,
      sitterProfileId: sitter.profileId,
      accepted: true,
      priceCents: 1800,
      shortPitch:
        "Bonjour ! Je serais ravie de m'occuper de votre chat lors de votre absence. Rencontre préalable avec plaisir.",
      filterStatus: "delivered",
    },
  });
  await db.requestEvent.create({
    data: { careRequestId: demande.id, type: "application_received", payload: { demo: true } },
  });

  return { ok: true, ownerId: owner.id, careRequestId: demande.id, sitterProfileId: sitter.profileId };
}

/** Nettoie le scénario : demandes de démo du propriétaire + pet sitter de démo. */
export async function removeDemoScenario(
  db: PrismaClient,
  ownerEmail: string,
): Promise<void> {
  const owner = await db.user.findUnique({ where: { email: ownerEmail }, select: { id: true } });
  if (owner) await removeDemoRequestsFor(db, owner.id);
  await removeDemoSitter(db);
}
