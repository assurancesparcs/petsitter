import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  STALE_AFTER_DAYS,
  dateFrShort,
  isCalendarStale,
  isoDate,
  parseMonthKey,
  shiftMonth,
  slotDate,
  slotISO,
  todayISOParis,
} from "@/domains/marketplace/availability";
import {
  loadOnboarding,
  nextStepExcluding,
} from "@/domains/marketplace/onboarding";
import {
  OnboardingBreadcrumb,
  OnboardingContinue,
} from "@/components/OnboardingChrome";
import { enregistrerDisponibilites } from "./actions";
import { CalendrierEditor } from "./CalendrierEditor";

export const metadata: Metadata = {
  title: "Mes disponibilités",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERREURS: Record<string, string> = {
  indisponible: "Service momentanément indisponible, réessayez.",
  profil: "Complétez d'abord votre profil pet sitter avant de gérer vos disponibilités.",
  mois: "Mois invalide — réessayez.",
  payload: "Enregistrement impossible : données du calendrier invalides.",
};

export default async function Disponibilites({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "SITTER") redirect("/compte");

  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);

  // Mois visible : ?mois=YYYY-MM, sinon le mois courant (Europe/Paris).
  const today = todayISOParis();
  const fallback = parseMonthKey(today.slice(0, 7))!;
  const parsed = parseMonthKey(one(sp.mois)) ?? fallback;
  const { year, month } = parsed;

  const db = getPrisma();

  // Dégradation gracieuse si la base n'est pas configurée.
  if (!db) {
    return (
      <Shell>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Service momentanément indisponible
          </h2>
          <p className="mt-1 text-sm text-muted">
            La gestion des disponibilités sera de nouveau accessible dans un
            instant. Merci de réessayer un peu plus tard.
          </p>
        </div>
      </Shell>
    );
  }

  const profile = await db.sitterProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      calendarUpdated: true,
      publishedAt: true,
      communeCode: true,
      _count: { select: { services: true } },
    },
  });

  // Pas encore de profil : on guide, comme les autres pages de l'espace.
  if (!profile) {
    return (
      <Shell>
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Créez d&apos;abord votre profil
          </h2>
          <p className="mt-1 text-sm text-muted">
            Renseignez votre prénom, votre commune et vos services : vous pourrez
            ensuite indiquer vos jours d&apos;indisponibilité.
          </p>
          <Link
            href="/compte/profil"
            className="mt-4 inline-flex rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Compléter mon profil →
          </Link>
        </div>
      </Shell>
    );
  }

  // Jours bloqués (available = false) du mois visible.
  const monthStart = slotDate(isoDate(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const slots = await db.availabilitySlot.findMany({
    where: {
      sitterProfileId: profile.id,
      available: false,
      date: { gte: monthStart, lt: monthEnd },
    },
    select: { date: true },
  });
  const initialBlocked = slots.map((s) => slotISO(s.date));

  const stale = isCalendarStale(profile.calendarUpdated);
  const incomplete = !profile.communeCode || profile._count.services === 0;

  // Parcours de mise en ligne — chrome affiché tant que le profil n'est pas
  // publié. Étape 4 sur 4 (recommandée, non bloquante).
  const onboarding = await loadOnboarding(db, session.user.id);
  const showChrome = onboarding ? !onboarding.published : false;
  const suiteDispo = onboarding
    ? nextStepExcluding(onboarding, ["disponibilites"])
    : null;

  return (
    <Shell>
      {showChrome && onboarding && (
        <OnboardingBreadcrumb current={4} doneCount={onboarding.doneCount} />
      )}

      {/* Messages */}
      {ok && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          Disponibilités enregistrées pour ce mois.
        </p>
      )}
      {showChrome && ok && (
        <OnboardingContinue
          href={suiteDispo?.href ?? "/compte/demarrage"}
          label={suiteDispo?.title ?? "Récapitulatif de ma mise en ligne"}
        />
      )}
      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {ERREURS[erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      {/* Dernière mise à jour + rappel des 14 jours */}
      <div
        className={`mt-6 rounded-[20px] border p-5 ${
          stale ? "border-primary-border bg-primary-tint" : "border-forest-border bg-forest-tint"
        }`}
      >
        <p className="font-semibold text-ink">
          {profile.calendarUpdated
            ? `Dernière mise à jour le ${dateFrShort(profile.calendarUpdated)}`
            : "Calendrier jamais mis à jour"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {stale
            ? `Pensez à confirmer vos disponibilités : passé ${STALE_AFTER_DAYS} jours sans mise à jour, elles sont signalées « à confirmer » aux propriétaires (aucune sanction automatique).`
            : "Vos disponibilités sont à jour. Un simple enregistrement suffit à les reconfirmer."}
        </p>
      </div>

      {/* Rappel si le profil n'est pas complet / publié */}
      {incomplete && (
        <p className="mt-4 rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Astuce : complétez votre commune et au moins un service dans{" "}
          <Link href="/compte/profil" className="font-semibold text-primary hover:text-primary-dark">
            votre profil
          </Link>{" "}
          pour apparaître dans la recherche — votre calendrier y sera alors visible.
        </p>
      )}

      <CalendrierEditor
        year={year}
        month={month}
        initialBlocked={initialBlocked}
        today={today}
        prevMonthKey={shiftMonth(year, month, -1)}
        nextMonthKey={shiftMonth(year, month, 1)}
        action={enregistrerDisponibilites}
      />
    </Shell>
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
        Mes disponibilités
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Indiquez les jours où vous n&apos;êtes pas disponible. Par défaut, vous
        êtes considéré disponible : inutile de tout cocher, marquez seulement vos
        absences. Tenez ce calendrier à jour, c&apos;est ce que regardent les
        propriétaires.
      </p>
      {children}
    </div>
  );
}
