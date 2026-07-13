import Link from "next/link";

/**
 * Éléments de navigation du parcours de mise en ligne, ajoutés au-dessus des
 * pages d'étape existantes UNIQUEMENT tant que le profil n'est pas publié.
 * Purement présentationnels : les statuts sont calculés par la page appelante
 * via `computeOnboarding` (domains/marketplace/onboarding.ts).
 */

/** Fil d'ariane discret « Étape N sur 4 » + mini barre de progression. */
export function OnboardingBreadcrumb({
  current,
  to,
  doneCount,
  total = 4,
}: {
  current: number;
  to?: number;
  doneCount: number;
  total?: number;
}) {
  const libelle =
    to && to !== current
      ? `Étapes ${current}–${to} sur ${total}`
      : `Étape ${current} sur ${total}`;

  return (
    <Link
      href="/compte/demarrage"
      className="mt-4 flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-surface-2 px-4 py-2.5 text-sm transition-colors hover:border-primary"
    >
      <span className="kicker text-primary">Mise en ligne</span>
      <span className="font-semibold text-ink">{libelle}</span>
      <span
        className="flex items-center gap-1"
        aria-hidden="true"
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i < doneCount ? "bg-primary" : "bg-line"
            }`}
          />
        ))}
      </span>
      <span className="ml-auto font-semibold text-primary">
        Voir le récapitulatif →
      </span>
    </Link>
  );
}

/** Lien « Continuer » vers l'étape suivante à compléter. */
export function OnboardingContinue({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-forest-border bg-forest-tint px-4 py-3">
      <p className="text-sm font-semibold text-forest-text">
        Étape suivante : {label}
      </p>
      <Link
        href={href}
        className="rounded-[12px] bg-primary px-5 py-2 text-sm font-bold text-surface hover:bg-primary-dark"
      >
        Continuer →
      </Link>
    </div>
  );
}
