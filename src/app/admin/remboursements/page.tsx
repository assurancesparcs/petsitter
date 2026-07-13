import type { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { centsLabel, passLabelFromKey } from "@/lib/pricing";
import { displayName } from "@/domains/marketplace/sitters";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";

export const metadata: Metadata = {
  title: "Remboursements",
  robots: { index: false, follow: false },
};

// Lecture en base à chaque affichage (données vivantes).
export const dynamic = "force-dynamic";

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const dateCourte = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function Remboursements() {
  const db = getPrisma();
  if (!db) {
    return (
      <Shell>
        <p className="text-muted">
          Base de données non connectée. Vérifiez <code>DATABASE_URL</code> dans
          Vercel.
        </p>
      </Shell>
    );
  }

  const [totals, refunds, inflight] = await Promise.all([
    // KPI : nombre + montant total remboursé (agrégés en base).
    db.payment.aggregate({
      where: { status: "REFUNDED" },
      _count: true,
      _sum: { amountCents: true },
    }),
    // Remboursements émis — LE seul cas : annulation du sitter après confirmation.
    db.payment.findMany({
      where: { status: "REFUNDED" },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        careRequest: {
          select: {
            service: true,
            species: true,
            startDate: true,
            endDate: true,
            communeName: true,
            communeCode: true,
            owner: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
    // Cas « en vol » : Plan B en cours (le sitter a annulé, décision du propriétaire
    // attendue). Aucune action ici — parcours piloté par l'utilisateur + automatique.
    db.careRequest.findMany({
      where: { status: "REPLACEMENT_IN_PROGRESS" },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        owner: { select: { firstName: true, lastName: true } },
        _count: { select: { applications: true } },
      },
    }),
  ]);

  // Date de remboursement fiable = évènement "refunded" (append-only) ; à défaut
  // l'horodatage de bascule du paiement. On résout les évènements en une requête.
  const refundCrIds = refunds.map((p) => p.careRequestId);
  const refundEvents = refundCrIds.length
    ? await db.requestEvent.findMany({
        where: { careRequestId: { in: refundCrIds }, type: "refunded" },
        orderBy: { createdAt: "asc" },
        select: { careRequestId: true, createdAt: true },
      })
    : [];
  const refundDateByCr = new Map<string, Date>();
  for (const e of refundEvents) refundDateByCr.set(e.careRequestId, e.createdAt);

  // Depuis quand une demande est en Plan B = évènement d'annulation du sitter.
  const inflightIds = inflight.map((c) => c.id);
  const cancelEvents = inflightIds.length
    ? await db.requestEvent.findMany({
        where: {
          careRequestId: { in: inflightIds },
          type: "cancelled_by_sitter_post_confirmation",
        },
        orderBy: { createdAt: "asc" },
        select: { careRequestId: true, createdAt: true },
      })
    : [];
  const cancelDateByCr = new Map<string, Date>();
  for (const e of cancelEvents) cancelDateByCr.set(e.careRequestId, e.createdAt);

  const count = totals._count;
  const totalCents = totals._sum.amountCents ?? 0;

  return (
    <Shell>
      <p className="text-muted">
        Supervision en lecture seule des remboursements de la mise en relation.
        C&apos;est le seul cas de remboursement : le pet sitter confirmé a dû
        annuler. La plateforme l&apos;initie d&apos;elle-même, sans démarche du
        propriétaire ; seul le montant de la mise en relation est concerné.
      </p>

      {/* KPI */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Stat label="Remboursements émis" value={count} />
        <Stat label="Montant total remboursé" value={centsLabel(totalCents)} tone="forest" />
      </div>

      {/* Remboursements émis */}
      <Section title={`Remboursements émis (${refunds.length})`}>
        {refunds.length === 0 ? (
          <Empty>Aucun remboursement émis pour le moment.</Empty>
        ) : (
          <Table
            headers={["Propriétaire", "Service", "Animal", "Zone", "Dates", "Pass", "Montant", "Remboursé le"]}
          >
            {refunds.map((p) => {
              const cr = p.careRequest;
              const refundedAt = refundDateByCr.get(p.careRequestId) ?? p.updatedAt;
              return (
                <tr key={p.id} className="border-b border-line-2 last:border-0">
                  <Td>{displayName(cr.owner.firstName, cr.owner.lastName)}</Td>
                  <Td>{serviceLabel(cr.service)}</Td>
                  <Td>{speciesLabel(cr.species)}</Td>
                  <Td>{cr.communeName ?? cr.communeCode}</Td>
                  <Td className="font-mono text-xs">
                    {dateCourte(cr.startDate)} → {dateCourte(cr.endDate)}
                  </Td>
                  <Td>{passLabelFromKey(p.packLabel)}</Td>
                  <Td className="font-mono">{centsLabel(p.amountCents)}</Td>
                  <Td className="font-mono text-xs">{dateFr(refundedAt)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Section>

      {/* En vol : Plan B en cours */}
      <Section title={`Plan B en cours (${inflight.length})`}>
        <p className="mb-3 text-sm text-muted">
          Demandes où le pet sitter a annulé après confirmation : le propriétaire
          choisit un remplaçant (Plan B) ou le remboursement s&apos;enclenche
          automatiquement. Vue de supervision — aucune action à mener ici.
        </p>
        {inflight.length === 0 ? (
          <Empty>Aucun Plan B en cours.</Empty>
        ) : (
          <Table headers={["Propriétaire", "Service", "Zone", "Dates", "Candidats Plan B", "Depuis"]}>
            {inflight.map((c) => {
              const since = cancelDateByCr.get(c.id);
              return (
                <tr key={c.id} className="border-b border-line-2 last:border-0">
                  <Td>{displayName(c.owner.firstName, c.owner.lastName)}</Td>
                  <Td>{serviceLabel(c.service)}</Td>
                  <Td>{c.communeName ?? c.communeCode}</Td>
                  <Td className="font-mono text-xs">
                    {dateCourte(c.startDate)} → {dateCourte(c.endDate)}
                  </Td>
                  <Td className="font-mono">{c._count.applications}</Td>
                  <Td className="font-mono text-xs">{since ? dateFr(since) : "—"}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-line-2 pb-5">
        <p className="kicker">Console {BRAND}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">
          Remboursements
        </h1>
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "forest";
}) {
  const border = tone === "forest" ? "border-forest-border bg-forest-tint" : "border-line bg-surface";
  const valueColor = tone === "forest" ? "text-forest-text" : "text-primary";
  return (
    <div className={`rounded-[20px] border p-5 ${border}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-body ${className}`}>{children}</td>;
}
