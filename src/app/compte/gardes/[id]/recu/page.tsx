import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { centsLabel, passLabelFromKey } from "@/lib/pricing";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { hasReceipt, paymentStatusView, TONE_CLASS } from "../../receipt";

export const metadata: Metadata = {
  title: "Reçu de mise en relation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const dateFrLong = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export default async function Recu({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  const { id } = await params;
  const db = getPrisma();
  if (!db) redirect("/compte/gardes");

  // STRICTEMENT scopé : la demande DOIT appartenir au propriétaire de la session.
  // Un id d'autrui ne matche jamais (findFirst → null → 404).
  const demande = await db.careRequest.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      service: true,
      species: true,
      startDate: true,
      endDate: true,
      communeName: true,
      communeCode: true,
      animalCount: true,
      payment: {
        select: {
          amountCents: true,
          packLabel: true,
          status: true,
          createdAt: true,
          stripePaymentIntentId: true,
        },
      },
    },
  });

  if (!demande) notFound();

  // Un reçu ne reflète qu'un débit réel (ou remboursé) — jamais une empreinte.
  const payment = demande.payment;
  if (!payment || !hasReceipt(payment.status)) redirect("/compte/gardes");
  // Demande COUVERTE par le Pass 3 mois : aucun débit propre à cette demande —
  // pas de reçu individuel (le règlement, c'est l'achat du Pass lui-même).
  if (payment.packLabel === "pass_trimestre") redirect("/compte/gardes");

  const pay = paymentStatusView(payment.status);

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <Link
        href="/compte/gardes"
        className="text-sm font-semibold text-primary hover:text-primary-dark"
      >
        ← Retour à mes gardes
      </Link>

      <div className="mt-6 overflow-hidden rounded-[20px] border border-line bg-surface shadow-panel">
        {/* En-tête du reçu */}
        <div className="border-b border-line-2 bg-cream px-6 py-5">
          <p className="kicker">Reçu — mise en relation</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">{BRAND}</h1>
          <p className="mt-1 text-sm text-muted">
            Émis le {dateFrLong(payment.createdAt)}
          </p>
        </div>

        {/* Corps du reçu */}
        <div className="space-y-4 px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">Statut</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE_CLASS[pay.tone]}`}>
              {pay.label}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted">Prestation</span>
            <span className="text-right text-sm font-semibold text-ink">
              {serviceLabel(demande.service)} · {speciesLabel(demande.species)}
              {demande.animalCount > 1 ? ` ×${demande.animalCount}` : ""}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted">Dates de garde</span>
            <span className="text-right font-mono text-sm text-body">
              {dateFrLong(demande.startDate)} → {dateFrLong(demande.endDate)}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted">Lieu</span>
            <span className="text-right text-sm text-body">
              {demande.communeName ?? demande.communeCode}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-muted">Formule</span>
            <span className="text-right text-sm font-semibold text-ink">
              {passLabelFromKey(payment.packLabel)}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-line-2 pt-4">
            <span className="font-semibold text-ink">Mise en relation réglée</span>
            <span className="font-mono text-lg font-bold text-ink">
              {centsLabel(payment.amountCents)}
            </span>
          </div>

          {payment.stripePaymentIntentId && (
            <p className="break-all font-mono text-xs text-faint">
              Référence : {payment.stripePaymentIntentId}
            </p>
          )}
        </div>

        {/* Note de transparence — honnête, aucune donnée inventée */}
        <div className="bg-forest px-6 py-5">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-on-forest">
            La transparence, sans surprise
          </p>
          <p className="mt-2 text-sm leading-relaxed text-surface">
            Ce montant règle la <strong>mise en relation</strong> à {BRAND}.{" "}
            <strong className="font-mono">0&nbsp;% de commission</strong> sur la
            garde : le tarif de garde revient à 100&nbsp;% au pet sitter, réglé en
            direct.
          </p>
        </div>
      </div>
    </div>
  );
}
