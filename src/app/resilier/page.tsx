import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { pauseAbonnement, resilierAbonnement } from "@/app/compte/abonnement/actions";

// Libellé de l'offre repris de la grille tarifaire (jamais en dur).
const PRICING_LABEL = `(${PRICING.abonnement.price} ${PRICING.abonnement.unit})`;

export const metadata: Metadata = {
  title: "Résilier son abonnement",
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function Cadre({ children }: { children: React.ReactNode }) {
  return <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">{children}</article>;
}

function Garanties() {
  return (
    <div className="mt-8 rounded-[20px] border border-forest-border bg-forest-tint p-6 sm:p-8">
      <p className="kicker text-forest-text">Ce qu&apos;on s&apos;interdit</p>
      <ul className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2">
        <li className="flex gap-3">
          <span aria-hidden className="font-mono font-bold text-success">✓</span>
          <span>Sans appeler personne, sans lettre recommandée</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="font-mono font-bold text-success">✓</span>
          <span>Effet immédiat</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="font-mono font-bold text-success">✓</span>
          <span>Un rappel avant chaque prélèvement</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden className="font-mono font-bold text-success">✓</span>
          <span>La pause reste possible, sans résilier</span>
        </li>
      </ul>
    </div>
  );
}

// Parcours natif de résiliation ≤ 3 clics (décret n° 2023-182), jamais plus long
// que l'inscription : (1) explication + PAUSE offerte en premier, (2) confirmation,
// (3) fait. La PAUSE est présentée comme alternative non piégeuse avant tout.
export default async function Resilier({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const etape = one(sp.etape);

  const session = await auth();
  const db = getPrisma();
  const userId = session?.user?.id;
  const isOwner = session?.user?.role === "OWNER";

  // Abonnement actif (non résilié) de la SESSION uniquement — IDOR-safe.
  const sub =
    db && userId && isOwner
      ? await db.subscription.findFirst({
          where: { userId, cancelledAt: null },
        })
      : null;

  // ── Écran final (clic 3) : confirmation honnête ──────────────────────────
  if (etape === "fait") {
    return (
      <Cadre>
        <p className="kicker">Sans dark pattern</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Résiliation prise en compte
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-body">
          Votre abonnement est résilié, avec effet immédiat. Aucun nouveau
          prélèvement ne sera effectué. Merci d&apos;avoir utilisé {BRAND} — vous
          pouvez revenir quand vous le souhaitez.
        </p>
        <Link
          href="/compte"
          className="mt-8 inline-block rounded-[14px] bg-primary px-6 py-3 font-bold text-surface hover:bg-primary-dark"
        >
          Retour à mon compte
        </Link>
      </Cadre>
    );
  }

  // ── Aucun abonnement à résilier : état honnête (pas de faux parcours) ─────
  if (!sub) {
    return (
      <Cadre>
        <p className="kicker">Sans dark pattern</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Résilier, en <span className="font-mono text-primary">3 clics</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-body">
          Chez {BRAND}, la résiliation s&apos;exerce ici même, en trois clics,
          sans appeler personne et sans lettre recommandée.{" "}
          <strong className="text-ink">
            Vous n&apos;avez aucun abonnement actif à résilier pour le moment
          </strong>{" "}
          — rien n&apos;est prélevé. Le jour où vous en aurez un, cette page vous
          permettra de le résilier immédiatement.
        </p>
        <Garanties />
        <Link
          href="/compte/abonnement"
          className="mt-8 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
        >
          Voir mon abonnement →
        </Link>
      </Cadre>
    );
  }

  // ── Clic 2 : confirmation, avec la PAUSE encore proposée ──────────────────
  if (etape === "confirmer") {
    return (
      <Cadre>
        <p className="kicker">Dernière étape</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Confirmer la résiliation
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-body">
          En confirmant, votre abonnement est résilié immédiatement. Vous ne
          serez plus prélevé.
        </p>

        <form action={resilierAbonnement} className="mt-8">
          <button
            type="submit"
            className="rounded-[14px] bg-primary px-6 py-3 font-bold text-surface hover:bg-primary-dark"
          >
            Confirmer la résiliation
          </button>
        </form>

        {/* Alternative non piégeuse, toujours offerte */}
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <p className="font-display font-bold text-ink">
            Vous préférez faire une pause ?
          </p>
          <p className="mt-1 text-sm text-body">
            La pause suspend les prélèvements sans résilier : vous reprenez quand
            vous voulez, sans rien perdre.
          </p>
          <form action={pauseAbonnement} className="mt-3">
            <button
              type="submit"
              className="rounded-[14px] border border-line px-5 py-2.5 text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
            >
              Mettre en pause plutôt
            </button>
          </form>
        </div>

        <Link
          href="/compte/abonnement"
          className="mt-6 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
        >
          ← Annuler et revenir à mon abonnement
        </Link>
      </Cadre>
    );
  }

  // ── Clic 1 : explication + PAUSE offerte EN PREMIER comme alternative ─────
  return (
    <Cadre>
      <p className="kicker">Sans dark pattern</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Résilier, en <span className="font-mono text-primary">3 clics</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-body">
        Résilier met fin à votre abonnement {PRICING_LABEL} avec effet immédiat :
        vous ne serez plus prélevé, et vous perdez l&apos;accès aux mises en
        relation illimitées. C&apos;est réversible à tout moment en souscrivant à
        nouveau.
      </p>

      {/* PAUSE proposée AVANT la résiliation — alternative non piégeuse */}
      <div className="mt-8 rounded-[20px] border border-primary-border bg-primary-tint p-6 sm:p-8">
        <p className="font-display text-lg font-bold text-primary-deep">
          Avant de résilier : une pause suffit peut-être ?
        </p>
        <p className="mt-2 text-sm text-body">
          La pause suspend vos prélèvements sans résilier votre abonnement. Vous
          le reprenez quand vous voulez, sans aucune démarche.
        </p>
        <form action={pauseAbonnement} className="mt-4">
          <button
            type="submit"
            className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Mettre en pause plutôt
          </button>
        </form>
      </div>

      <div className="mt-6">
        <Link
          href="/resilier?etape=confirmer"
          className="inline-block rounded-[14px] border border-line px-6 py-3 text-sm font-semibold text-muted transition-colors hover:border-primary hover:text-primary"
        >
          Continuer la résiliation →
        </Link>
      </div>

      <Garanties />
    </Cadre>
  );
}
