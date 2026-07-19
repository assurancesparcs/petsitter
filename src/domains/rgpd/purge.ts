import "server-only";
import type { PrismaClient } from "@prisma/client";
import { remove } from "@/lib/storage";

/**
 * Purge RGPD — limitation de la conservation (art. 5 RGPD).
 *
 * Ce module regroupe, dans une seule fonction ordonnancée par le cron
 * (voir /api/cron/rgpd-purge), l'effacement des données personnelles dont la
 * durée de conservation est écoulée. Le schéma documente la cible de chaque
 * purge en commentaire ; les durées sont ici, nommées et exportées, source de
 * vérité unique (et reprises dans la politique de confidentialité).
 *
 * PRINCIPES — code DESTRUCTIF, donc prudent :
 *  1. IDEMPOTENT : chaque purge est gardée (« déjà vide » → aucune écriture),
 *     de sorte qu'une réexécution ne fait rien et ne casse rien.
 *  2. BORNÉ : les purges qui itèrent (fichiers, comptes) traitent un lot
 *     plafonné par exécution ; la planification quotidienne draine le reste.
 *  3. INTÉGRITÉ RÉFÉRENTIELLE PRÉSERVÉE : on ne supprime JAMAIS en cascade un
 *     utilisateur (transactions, avis, journal d'audit en dépendent). Un compte
 *     effacé est PSEUDONYMISÉ, pas détruit. Seules les lignes de liste d'attente
 *     (données autonomes) sont supprimées.
 *  4. AUCUNE DONNÉE PERSONNELLE en sortie : la fonction ne renvoie QUE des
 *     compteurs.
 */

/** Adresse exacte d'une mission : effacée N jours après la fin d'une garde terminée. */
export const ADDRESS_RETENTION_DAYS = 30;
/** Fichiers d'identité orphelins (soumission abandonnée) : effacés au-delà de N jours. */
export const IDENTITY_FILE_ORPHAN_DAYS = 90;
/** Listes d'attente (sitters ET propriétaires) non converties : supprimées au-delà de N jours. */
export const WAITLIST_RETENTION_DAYS = 180;
/** Droit à l'effacement : délai de grâce après le soft-delete avant pseudonymisation. */
export const SOFT_DELETE_GRACE_DAYS = 30;

/** Plafond de lignes traitées par exécution pour les purges itératives. */
const IDENTITY_BATCH = 200;
const USER_BATCH = 200;

/** Statuts terminaux d'une demande : plus aucune garde en cours → adresse inutile. */
const TERMINAL_STATUSES = [
  "COMPLETED",
  "EXPIRED",
  "CANCELLED_BY_OWNER",
  "CANCELLED_BY_SITTER_PRE_CONFIRMATION",
  "CANCELLED_BY_SITTER_POST_CONFIRMATION",
] as const;

/** Domaine tombstone des comptes pseudonymisés — sert aussi de marqueur d'idempotence. */
const TOMBSTONE_DOMAIN = "@allopetsitter.invalid";

/** Compteurs renvoyés par une exécution (aucune donnée personnelle). */
export interface RgpdPurgeSummary {
  missionAddressesPurged: number;
  identityFilesPurged: number;
  waitlistDeleted: number;
  ownerWaitlistDeleted: number;
  usersAnonymized: number;
  /** Noms des étapes en échec (aucune donnée personnelle) — vide = tout OK. */
  errors: string[];
}

/** Renvoie la date « maintenant - jours ». */
function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Exécute toutes les purges RGPD et renvoie les compteurs. Chaque étape est
 * indépendante, idempotente et bornée. ISOLATION PAR ÉTAPE : une étape en échec
 * est journalisée (nom seul) mais ne prive JAMAIS les suivantes de s'exécuter —
 * en particulier, un échec durable d'une purge technique ne doit pas bloquer
 * indéfiniment le droit à l'effacement (dernière étape).
 */
export async function runRgpdPurge(db: PrismaClient): Promise<RgpdPurgeSummary> {
  const now = new Date();
  const errors: string[] = [];

  const step = async (name: string, fn: () => Promise<number>): Promise<number> => {
    try {
      return await fn();
    } catch (err) {
      errors.push(name);
      // Nom d'erreur seulement — jamais de donnée personnelle ni de secret.
      console.error(`[rgpd] Étape « ${name} » en échec : ${(err as Error).name}`);
      return 0;
    }
  };

  const missionAddressesPurged = await step("mission_addresses", () =>
    purgeMissionAddresses(db, now),
  );
  const identityFilesPurged = await step("identity_files", () =>
    purgeIdentityFileOrphans(db, now),
  );
  const waitlistDeleted = await step("waitlist", () => purgeWaitlist(db, now));
  const ownerWaitlistDeleted = await step("owner_waitlist", () =>
    purgeOwnerWaitlist(db, now),
  );
  const usersAnonymized = await step("users_anonymize", () =>
    anonymizeSoftDeletedUsers(db, now),
  );

  return {
    missionAddressesPurged,
    identityFilesPurged,
    waitlistDeleted,
    ownerWaitlistDeleted,
    usersAnonymized,
    errors,
  };
}

/**
 * Adresse exacte chiffrée : on la vide (`addressEncrypted = null`) pour toute
 * mission dont la demande est dans un statut terminal ET dont la fin de garde
 * remonte à plus de ADDRESS_RETENTION_DAYS. Le garde `addressEncrypted != null`
 * rend la réexécution neutre.
 */
async function purgeMissionAddresses(db: PrismaClient, now: Date): Promise<number> {
  const cutoff = daysAgo(now, ADDRESS_RETENTION_DAYS);
  const res = await db.mission.updateMany({
    where: {
      addressEncrypted: { not: null },
      careRequest: {
        status: { in: [...TERMINAL_STATUSES] },
        endDate: { lt: cutoff },
      },
    },
    data: { addressEncrypted: null },
  });
  return res.count;
}

/**
 * Fichiers d'identité orphelins. Le cas nominal (décision admin) supprime déjà
 * les fichiers ; ce filet rattrape les restes : décisions passées dont un chemin
 * subsisterait, ou soumissions abandonnées jamais traitées. Pour chaque ligne,
 * suppression best-effort des deux blobs PUIS mise à null des deux colonnes ;
 * statut et horodatages sont conservés. Lot borné : le reste est drainé au
 * prochain passage.
 */
async function purgeIdentityFileOrphans(db: PrismaClient, now: Date): Promise<number> {
  const cutoff = daysAgo(now, IDENTITY_FILE_ORPHAN_DAYS);
  const orphans = await db.identityVerification.findMany({
    where: {
      OR: [{ docStoragePath: { not: null } }, { selfieStoragePath: { not: null } }],
      AND: {
        OR: [
          { status: { in: ["verified", "rejected"] } },
          { status: "submitted", submittedAt: { lt: cutoff } },
        ],
      },
    },
    select: { id: true, docStoragePath: true, selfieStoragePath: true },
    take: IDENTITY_BATCH,
  });

  let purged = 0;
  for (const o of orphans) {
    // Best-effort : une suppression déjà faite / introuvable ne bloque pas.
    await remove(o.docStoragePath);
    await remove(o.selfieStoragePath);
    await db.identityVerification.update({
      where: { id: o.id },
      data: { docStoragePath: null, selfieStoragePath: null },
    });
    purged += 1;
  }
  return purged;
}

/**
 * Liste d'attente pet sitters : finalité unique (être prévenu de l'ouverture).
 * Suppression des lignes non converties au-delà de WAITLIST_RETENTION_DAYS.
 * Données autonomes (aucune relation) → suppression franche autorisée.
 */
async function purgeWaitlist(db: PrismaClient, now: Date): Promise<number> {
  const cutoff = daysAgo(now, WAITLIST_RETENTION_DAYS);
  const res = await db.sitterWaitlist.deleteMany({
    where: { convertedAt: null, createdAt: { lt: cutoff } },
  });
  return res.count;
}

/**
 * Liste d'attente propriétaires (pré-lancement) : même finalité unique, même
 * règle que les sitters — suppression des lignes non converties au-delà de
 * WAITLIST_RETENTION_DAYS. Données autonomes → suppression franche autorisée.
 */
async function purgeOwnerWaitlist(db: PrismaClient, now: Date): Promise<number> {
  const cutoff = daysAgo(now, WAITLIST_RETENTION_DAYS);
  const res = await db.ownerWaitlist.deleteMany({
    where: { convertedAt: null, createdAt: { lt: cutoff } },
  });
  return res.count;
}

/**
 * Droit à l'effacement. Un compte soft-deleted depuis plus de
 * SOFT_DELETE_GRACE_DAYS est PSEUDONYMISÉ (jamais supprimé) : on efface les
 * données personnelles directes tout en préservant la ligne et ses relations
 * (paiements, avis, audit reposent sur l'intégrité référentielle). L'e-mail
 * tombstone `deleted+<id>@allopetsitter.invalid` sert de marqueur : les comptes
 * déjà pseudonymisés (e-mail sur ce domaine) sont exclus → idempotent. Lot borné.
 */
async function anonymizeSoftDeletedUsers(db: PrismaClient, now: Date): Promise<number> {
  const cutoff = daysAgo(now, SOFT_DELETE_GRACE_DAYS);
  const users = await db.user.findMany({
    where: {
      deletedAt: { not: null, lt: cutoff },
      email: { not: { endsWith: TOMBSTONE_DOMAIN } },
    },
    select: {
      id: true,
      sitterProfile: {
        select: {
          id: true,
          identityVerification: {
            select: { id: true, docStoragePath: true, selfieStoragePath: true },
          },
        },
      },
    },
    take: USER_BATCH,
  });

  let anonymized = 0;
  for (const u of users) {
    // Fichiers d'identité éventuels de CE compte : suppression best-effort + null.
    const iv = u.sitterProfile?.identityVerification;
    if (iv && (iv.docStoragePath || iv.selfieStoragePath)) {
      await remove(iv.docStoragePath);
      await remove(iv.selfieStoragePath);
      await db.identityVerification.update({
        where: { id: iv.id },
        data: { docStoragePath: null, selfieStoragePath: null },
      });
    }

    // Profil sitter : effacer les données personnelles NON soumises à une
    // obligation de conservation (localisation exacte, texte libre, commune) et
    // dépublier (un compte effacé ne doit jamais rester visible en recherche).
    // On CONSERVE les champs à base légale de rétention (DAC7 : siret,
    // birthDate, taxAddress ; ACACED) — leur purge suit leur propre échéance.
    if (u.sitterProfile) {
      await db.sitterProfile.update({
        where: { id: u.sitterProfile.id },
        data: {
          publishedAt: null,
          lat: null,
          lng: null,
          communeCode: null,
          communeName: null,
          bio: null,
          experience: null,
          ownAnimals: null,
          housingType: null,
        },
      });
    }

    // Pseudonymisation des données personnelles directes. La ligne et toutes ses
    // relations sont conservées (aucune cascade). E-mail tombstone unique (id).
    await db.user.update({
      where: { id: u.id },
      data: {
        email: `deleted+${u.id}${TOMBSTONE_DOMAIN}`,
        name: null,
        firstName: null,
        lastName: null,
        lastNameInitial: null,
        phone: null,
        phoneVerifiedAt: null,
        image: null,
      },
    });
    anonymized += 1;
  }
  return anonymized;
}
