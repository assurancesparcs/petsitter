import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  loadOnboarding,
  STEP_LABELS,
  type OnboardingStep,
  type StepStatus,
} from "@/domains/marketplace/onboarding";
import { publierProfil, depublierProfil } from "../profil/actions";

export const metadata: Metadata = {
  title: "Ma mise en ligne",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const BADGE_CLASSES: Record<StepStatus, string> = {
  todo: "border-line bg-surface-2 text-muted",
  in_progress: "border-primary-border bg-primary-tint text-primary-deep",
  done: "border-forest-border bg-forest-tint text-forest-text",
  redo: "border-primary-border bg-primary-tint text-primary-deep",
};

export default async function Demarrage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");

  const db = getPrisma();

  if (!db) {
    return (
      <Shell>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Service momentanément indisponible
          </h2>
          <p className="mt-1 text-sm text-muted">
            La mise en ligne de votre profil sera de nouveau accessible dans un
            instant. Merci de réessayer un peu plus tard.
          </p>
        </div>
      </Shell>
    );
  }

  const state = await loadOnboarding(db, session.user.id);
  if (!state) {
    return (
      <Shell>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <p className="text-sm text-muted">
            Impossible de charger votre progression pour le moment. Réessayez.
          </p>
        </div>
      </Shell>
    );
  }

  const { steps, nextStep, doneCount, currentIndex, publishGateMet, published, missing } =
    state;

  return (
    <Shell>
      {/* Indicateur de progression */}
      <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-ink">
            {published
              ? "Profil publié"
              : publishGateMet
                ? "Prêt à publier"
                : `Étape ${currentIndex} sur ${steps.length}`}
          </p>
          <p className="kicker">
            {doneCount} / {steps.length} terminées
          </p>
        </div>
        <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
          {steps.map((s) => (
            <span
              key={s.key}
              className={`h-2 flex-1 rounded-full ${
                s.status === "done" ? "bg-primary" : "bg-line"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {published
            ? "Votre profil est visible dans la recherche."
            : "Complétez les étapes ci-dessous, puis publiez votre profil. La vérification d'identité est requise pour être visible."}
        </p>
      </div>

      {/* Cartes d'étape */}
      <ol className="mt-6 space-y-4">
        {steps.map((s) => (
          <StepCard
            key={s.key}
            step={s}
            isCurrent={!published && nextStep?.key === s.key}
          />
        ))}
      </ol>

      {/* Zone de publication */}
      <PublicationBloc
        published={published}
        publishGateMet={publishGateMet}
        missing={missing}
        userId={session.user.id}
        db={db}
      />
    </Shell>
  );
}

function StepCard({
  step,
  isCurrent,
}: {
  step: OnboardingStep;
  isCurrent: boolean;
}) {
  const cta =
    step.status === "done"
      ? "Modifier"
      : isCurrent
        ? "Continuer →"
        : step.status === "redo"
          ? "Reprendre →"
          : "Compléter →";

  return (
    <li
      className={`rounded-[20px] border p-5 ${
        isCurrent ? "border-primary bg-surface shadow-panel" : "border-line bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              step.status === "done"
                ? "bg-forest-tint text-forest-text"
                : "bg-primary-tint text-primary-deep"
            }`}
            aria-hidden="true"
          >
            {step.status === "done" ? "✓" : step.index}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {step.title}
              {step.optional && (
                <span className="ml-2 align-middle text-xs font-normal text-muted">
                  (recommandé)
                </span>
              )}
            </p>
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                BADGE_CLASSES[step.status]
              }`}
            >
              {STEP_LABELS[step.status]}
            </span>
          </div>
        </div>
        <Link
          href={step.href}
          className={`shrink-0 rounded-[12px] px-5 py-2.5 text-sm font-bold ${
            isCurrent
              ? "bg-primary text-surface hover:bg-primary-dark"
              : "border border-line text-body hover:border-primary hover:text-primary"
          }`}
        >
          {cta}
        </Link>
      </div>
    </li>
  );
}

async function PublicationBloc({
  published,
  publishGateMet,
  missing,
  userId,
  db,
}: {
  published: boolean;
  publishGateMet: boolean;
  missing: string[];
  userId: string;
  db: NonNullable<ReturnType<typeof getPrisma>>;
}) {
  if (published) {
    const profile = await db.sitterProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return (
      <div className="mt-8 rounded-[20px] border border-forest-border bg-forest-tint p-6">
        <p className="font-semibold text-ink">Profil publié</p>
        <p className="mt-1 text-sm text-muted">
          Votre profil apparaît dans la recherche. Vous pouvez le retirer à tout
          moment depuis votre profil.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {profile && (
            <Link
              href={`/petsitter/${profile.id}`}
              className="rounded-[14px] border border-forest-border px-5 py-2.5 text-sm font-bold text-forest-text hover:bg-surface"
            >
              Voir ma fiche publique
            </Link>
          )}
          <Link
            href="/compte/profil"
            className="rounded-[14px] border border-line px-5 py-2.5 text-sm font-semibold text-body hover:border-primary hover:text-primary"
          >
            Voir mon profil
          </Link>
          <form action={depublierProfil}>
            <button className="rounded-[14px] border border-line px-5 py-2.5 text-sm font-semibold text-muted hover:text-ink">
              Dépublier
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (publishGateMet) {
    return (
      <div className="mt-8 rounded-[20px] border border-primary-border bg-primary-tint p-6">
        <p className="font-semibold text-ink">Tout est prêt</p>
        <p className="mt-1 text-sm text-muted">
          Les étapes requises sont terminées. Publiez votre profil pour
          apparaître dans la recherche. Pensez à renseigner vos disponibilités
          si ce n&apos;est pas encore fait — ce n&apos;est pas obligatoire pour
          publier.
        </p>
        <form action={publierProfil} className="mt-4">
          <button className="rounded-[14px] bg-primary px-6 py-3 text-sm font-bold text-surface hover:bg-primary-dark">
            Publier mon profil
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-[20px] border border-line bg-surface p-6">
      <p className="font-semibold text-ink">Publication</p>
      <p className="mt-1 text-sm text-muted">
        Il reste à compléter avant de pouvoir publier votre profil :
      </p>
      <ul className="mt-3 space-y-2">
        {missing.map((m) => (
          <li key={m} className="flex items-center gap-2 text-sm text-body">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/compte"
        className="text-sm font-semibold text-primary hover:text-primary-dark"
      >
        ← Retour à mon compte
      </Link>
      <p className="kicker mt-4">Espace pet sitter</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Ma mise en ligne
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Quatre étapes pour publier votre profil et recevoir des demandes. Vous
        pouvez vous arrêter et reprendre où vous en êtes à tout moment.
      </p>
      {children}
    </div>
  );
}
