import "server-only";

import type { PrismaClient } from "@prisma/client";

/**
 * Parcours de mise en ligne du pet sitter — 4 étapes ordonnées et reprenables.
 *
 * Source unique de vérité pour :
 *  - le statut de chacune des 4 étapes (calculé à partir des données réelles) ;
 *  - l'étape suivante à compléter ;
 *  - la condition de publication (« porte » du profil).
 *
 * ⚠️ La porte de publication reproduit À L'IDENTIQUE la règle de `publierProfil`
 * (src/app/compte/profil/actions.ts) : prénom + commune + ≥ 1 service + identité
 * vérifiée. Elle ne DOIT jamais être assouplie ici — cet helper ne publie rien,
 * il ne fait que refléter l'état pour l'affichage.
 */

export type StepKey = "profil" | "services" | "identite" | "disponibilites";

export type StepStatus = "todo" | "in_progress" | "done" | "redo";

export type OnboardingStep = {
  /** Position 1-based dans le parcours. */
  index: number;
  key: StepKey;
  title: string;
  status: StepStatus;
  /** Étape recommandée mais non bloquante pour la publication. */
  optional: boolean;
  href: string;
};

export type OnboardingData = {
  firstName: string | null;
  lastName: string | null;
  communeCode: string | null;
  servicesCount: number;
  /** IdentityVerification.status ; « pending » par défaut si absent. */
  identityStatus: string;
  calendarUpdated: Date | null;
  publishedAt: Date | null;
};

export type OnboardingState = {
  steps: OnboardingStep[];
  /** Première étape non terminée (dans l'ordre 1→4), ou null si tout est fait. */
  nextStep: OnboardingStep | null;
  /** Nombre d'étapes terminées (sur 4). */
  doneCount: number;
  /** Numéro d'étape courant (1-based) pour l'indicateur « Étape N sur 4 ». */
  currentIndex: number;
  /** Porte de publication (identique à publierProfil). */
  publishGateMet: boolean;
  published: boolean;
  /** Libellés des étapes requises encore manquantes pour publier. */
  missing: string[];
};

export const STEP_LABELS: Record<StepStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Fait",
  redo: "À refaire",
};

const IDENTITE_STATUS: Record<string, StepStatus> = {
  pending: "todo",
  submitted: "in_progress",
  verified: "done",
  rejected: "redo",
};

function profilStatus(d: OnboardingData): StepStatus {
  const complete = Boolean(d.firstName && d.lastName && d.communeCode);
  if (complete) return "done";
  const started = Boolean(d.firstName || d.lastName || d.communeCode);
  return started ? "in_progress" : "todo";
}

/** Calcule l'état du parcours à partir des données déjà chargées (sans requête). */
export function computeOnboarding(d: OnboardingData): OnboardingState {
  const steps: OnboardingStep[] = [
    {
      index: 1,
      key: "profil",
      title: "Profil & présentation",
      status: profilStatus(d),
      optional: false,
      href: "/compte/profil",
    },
    {
      index: 2,
      key: "services",
      title: "Services & tarifs",
      status: d.servicesCount > 0 ? "done" : "todo",
      optional: false,
      href: "/compte/profil#services",
    },
    {
      index: 3,
      key: "identite",
      title: "Vérification d'identité",
      status: IDENTITE_STATUS[d.identityStatus] ?? "todo",
      optional: false,
      href: "/compte/profil/identite",
    },
    {
      index: 4,
      key: "disponibilites",
      title: "Disponibilités",
      status: d.calendarUpdated ? "done" : "todo",
      optional: true,
      href: "/compte/disponibilites",
    },
  ];

  const nextStep = steps.find((s) => s.status !== "done") ?? null;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const currentIndex = nextStep ? nextStep.index : steps.length;

  // Porte de publication — À L'IDENTIQUE de publierProfil : prénom + commune +
  // ≥ 1 service + identité « verified ». (publierProfil ne teste que le prénom,
  // pas le nom — on reproduit exactement cette condition.)
  const profilComplet = Boolean(d.firstName && d.communeCode);
  const auMoinsUnService = d.servicesCount > 0;
  const identiteVerifiee = d.identityStatus === "verified";
  const publishGateMet = profilComplet && auMoinsUnService && identiteVerifiee;

  const missing: string[] = [];
  if (!profilComplet) missing.push("Profil (prénom et commune)");
  if (!auMoinsUnService) missing.push("Au moins un service avec un tarif");
  if (!identiteVerifiee) missing.push("Vérification d'identité");

  return {
    steps,
    nextStep,
    doneCount,
    currentIndex,
    publishGateMet,
    published: Boolean(d.publishedAt),
    missing,
  };
}

/**
 * Prochaine étape à compléter en EXCLUANT certaines clés (typiquement l'étape
 * éditée sur la page courante, pour éviter un lien « Continuer » qui boucle sur
 * elle-même). Renvoie null si aucune autre étape n'est à compléter.
 */
export function nextStepExcluding(
  state: OnboardingState,
  exclude: StepKey[],
): OnboardingStep | null {
  return (
    state.steps.find(
      (s) => s.status !== "done" && !exclude.includes(s.key),
    ) ?? null
  );
}

/**
 * Charge les données du parcours pour un sitter donné en une seule requête,
 * puis calcule l'état. Renvoie null si la base n'est pas disponible.
 */
export async function loadOnboarding(
  db: PrismaClient,
  userId: string,
): Promise<OnboardingState | null> {
  const profile = await db.sitterProfile.findUnique({
    where: { userId },
    select: {
      communeCode: true,
      calendarUpdated: true,
      publishedAt: true,
      _count: { select: { services: true } },
      user: { select: { firstName: true, lastName: true } },
      identityVerification: { select: { status: true } },
    },
  });

  return computeOnboarding({
    firstName: profile?.user.firstName ?? null,
    lastName: profile?.user.lastName ?? null,
    communeCode: profile?.communeCode ?? null,
    servicesCount: profile?._count.services ?? 0,
    identityStatus: profile?.identityVerification?.status ?? "pending",
    calendarUpdated: profile?.calendarUpdated ?? null,
    publishedAt: profile?.publishedAt ?? null,
  });
}
