import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { centsLabel } from "@/lib/pricing";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { hasReceipt, paymentStatusView, TONE_CLASS } from "./receipt";
import type { CareRequestStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Mes gardes & reçus",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

/** Statuts terminaux : une garde y est classée « passée » quel que soit le jour. */
const TERMINAL: CareRequestStatus[] = [
  "COMPLETED",
  "EXPIRED",
  "CANCELLED_BY_OWNER",
  "CANCELLED_BY_SITTER_PRE_CONFIRMATION",
  "CANCELLED_BY_SITTER_POST_CONFIRMATION",
];

const STATUS_LABEL: Record<string, { label: string; tone: "open" | "action" | "done" | "closed" }> = {
  OPEN: { label: "En attente de candidatures", tone: "open" },
  ACCEPTED: { label: "Paiement en cours", tone: "action" },
  UNLOCKED: { label: "Mise en relation débloquée", tone: "done" },
  CONFIRMED: { label: "Garde confirmée", tone: "done" },
  COMPLETED: { label: "Garde terminée", tone: "done" },
  PAYMENT_REQUIRED: { label: "Action requise — paiement à finaliser", tone: "action" },
  EXPIRED: { label: "Expirée — jamais débité", tone: "closed" },
  CANCELLED_BY_OWNER: { label: "Annulée par vous", tone: "closed" },
  CANCELLED_BY_SITTER_PRE_CONFIRMATION: { label: "Annulée par le pet sitter", tone: "closed" },
  CANCELLED_BY_SITTER_POST_CONFIRMATION: { label: "Annulée par le pet sitter", tone: "closed" },
  REPLACEMENT_IN_PROGRESS: { label: "Remplacement en cours", tone: "action" },
};

const TONE_STATUS: Record<string, string> = {
  open: "border border-forest-border bg-forest-tint text-forest-text",
  action: "border border-primary-border bg-primary-tint text-primary-deep",
  done: "border border-forest-border bg-forest-tint text-forest-text",
  closed: "border border-line bg-surface-2 text-muted",
};

type GardeRow = {
  id: string;
  service: string;
  species: string;
  startDate: Date;
  endDate: Date;
  communeName: string | null;
  communeCode: string;
  animalCount: number;
  status: CareRequestStatus;
  payment: { amountCents: number; status: import("@prisma/client").PaymentStatus } | null;
};

function Carte({ d }: { d: GardeRow }) {
  const st = STATUS_LABEL[d.status] ?? { label: "Clôturée", tone: "closed" as const };
  const pay = d.payment ? paymentStatusView(d.payment.status) : null;

  return (
    <div className="rounded-[20px] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-bold text-ink">
          {serviceLabel(d.service)} · {speciesLabel(d.species)}
          {d.animalCount > 1 ? ` ×${d.animalCount}` : ""}
        </h3>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE_STATUS[st.tone]}`}>
          {st.label}
        </span>
      </div>
      <p className="mt-1 font-mono text-sm text-body">
        {dateFr(d.startDate)} → {dateFr(d.endDate)} · {d.communeName ?? d.communeCode}
      </p>

      {d.payment && pay && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASS[pay.tone]}`}>
              {pay.label}
            </span>
            <span className="font-mono text-sm font-bold text-ink">
              {centsLabel(d.payment.amountCents)}
            </span>
          </div>
          {hasReceipt(d.payment.status) && (
            <Link
              href={`/compte/gardes/${d.id}/recu`}
              className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
            >
              Voir le reçu →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default async function MesGardes() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const db = getPrisma();
  // STRICTEMENT scopé : uniquement les demandes du propriétaire de la session.
  const demandes = db
    ? await db.careRequest.findMany({
        where: { ownerId: session.user.id },
        orderBy: { startDate: "desc" },
        select: {
          id: true,
          service: true,
          species: true,
          startDate: true,
          endDate: true,
          communeName: true,
          communeCode: true,
          animalCount: true,
          status: true,
          payment: { select: { amountCents: true, status: true } },
        },
      })
    : [];

  const now = new Date();
  const aVenir: GardeRow[] = [];
  const passees: GardeRow[] = [];
  for (const d of demandes) {
    const estPassee = TERMINAL.includes(d.status) || d.endDate < now;
    (estPassee ? passees : aVenir).push(d);
  }
  // « À venir » du plus proche au plus lointain.
  aVenir.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/compte/tableau-de-bord"
        className="text-sm font-semibold text-primary hover:text-primary-dark"
      >
        ← Retour au tableau de bord
      </Link>
      <p className="kicker mt-4">Espace propriétaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Mes gardes &amp; reçus
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        L&apos;historique de vos gardes. Chaque mise en relation réglée dispose
        d&apos;un reçu détaillé, consultable à tout moment.
      </p>

      {!db && (
        <p className="mt-6 rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          L&apos;historique sera de nouveau accessible dans un instant.
        </p>
      )}

      {db && demandes.length === 0 && (
        <div className="mt-8 rounded-[20px] border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold text-ink">Aucune garde pour le moment</p>
          <p className="mt-1 text-sm text-muted">
            Vos gardes à venir et passées apparaîtront ici, avec leurs reçus.
          </p>
          <Link
            href="/demande"
            className="mt-4 inline-flex rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
          >
            Déposer une demande de garde →
          </Link>
        </div>
      )}

      {aVenir.length > 0 && (
        <section className="mt-8">
          <h2 className="kicker">À venir</h2>
          <div className="mt-3 space-y-4">
            {aVenir.map((d) => (
              <Carte key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}

      {passees.length > 0 && (
        <section className="mt-10">
          <h2 className="kicker">Passées</h2>
          <div className="mt-3 space-y-4">
            {passees.map((d) => (
              <Carte key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
