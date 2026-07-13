import type { Metadata } from "next";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { displayName } from "@/domains/marketplace/sitters";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

// Lecture en base à chaque affichage (données vivantes).
export const dynamic = "force-dynamic";

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ouvertes",
  ACCEPTED: "Acceptées",
  UNLOCKED: "Débloquées (payées)",
  CONFIRMED: "Confirmées",
  COMPLETED: "Terminées",
  EXPIRED: "Expirées",
  CANCELLED_BY_OWNER: "Annulées (propriétaire)",
  CANCELLED_BY_SITTER_PRE_CONFIRMATION: "Annulées (sitter, avant confirmation)",
  CANCELLED_BY_SITTER_POST_CONFIRMATION: "Annulées (sitter, après confirmation)",
  REPLACEMENT_IN_PROGRESS: "Plan B en cours",
  PAYMENT_REQUIRED: "Paiement à régulariser",
};

export default async function Admin() {
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

  const now = new Date();
  // Filtre des enregistrements de test (audits) pour la waitlist, exprimé
  // en base (plus de chargement complet de la table — audit §3.3).
  const testWhere = {
    OR: [
      { email: { contains: "@example.com" } },
      { email: { contains: "verification-deploiement@" } },
      { email: { contains: "audit" } },
    ],
  };
  const realWhere = { NOT: testWhere };

  const [
    usersByRole,
    sitterTotal,
    sitterPublished,
    sittersWithApp,
    requestsByStatus,
    requestsTotal,
    openLive,
    requestsWithApp,
    applicationsTotal,
    unlockNoReview,
    filterHits,
    fraudSignals,
    waitlistRealCount,
    waitlistTestCount,
    recentWaitlist,
    recentRequests,
    recentSitters,
  ] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: true }),
    db.sitterProfile.count(),
    db.sitterProfile.count({ where: { publishedAt: { not: null } } }),
    db.sitterProfile.count({ where: { applications: { some: {} } } }),
    db.careRequest.groupBy({ by: ["status"], _count: true }),
    db.careRequest.count(),
    db.careRequest.count({ where: { status: "OPEN", responseDeadline: { gt: now } } }),
    db.careRequest.count({ where: { applications: { some: {} } } }),
    db.application.count(),
    db.mission.count({
      where: {
        review: null,
        careRequest: { status: { in: ["UNLOCKED", "CONFIRMED", "COMPLETED"] } },
      },
    }),
    db.contentFilterHit.count(),
    db.fraudSignal.count({ where: { reviewedAt: null } }),
    db.sitterWaitlist.count({ where: realWhere }),
    db.sitterWaitlist.count({ where: testWhere }),
    db.sitterWaitlist.findMany({
      where: realWhere,
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.careRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { applications: true } } },
    }),
    db.sitterProfile.findMany({
      orderBy: { user: { createdAt: "desc" } },
      take: 8,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);

  const roleCount = (r: string) =>
    usersByRole.find((u) => u.role === r)?._count ?? 0;
  const owners = roleCount("OWNER");
  const sitters = roleCount("SITTER");
  const statusCount = (s: string) =>
    requestsByStatus.find((x) => x.status === s)?._count ?? 0;

  const realWaitlist = recentWaitlist;
  const testWaitlist = waitlistTestCount;

  // Liquidité : part des demandes ayant reçu >= 1 candidature.
  const liquidite =
    requestsTotal > 0 ? Math.round((requestsWithApp / requestsTotal) * 100) : null;
  // Conversion : part des demandes menant à une garde confirmée/terminée.
  const confirmees = statusCount("CONFIRMED") + statusCount("COMPLETED");
  const tauxConfirme =
    requestsTotal > 0 ? Math.round((confirmees / requestsTotal) * 100) : null;
  // Activation sitter : part des pet sitters ayant déjà candidaté au moins une fois.
  const tauxActivation =
    sitterTotal > 0 ? Math.round((sittersWithApp / sitterTotal) * 100) : null;
  // Désistements : annulations par le sitter (avant ou après confirmation).
  const desistements =
    statusCount("CANCELLED_BY_SITTER_PRE_CONFIRMATION") +
    statusCount("CANCELLED_BY_SITTER_POST_CONFIRMATION");

  return (
    <Shell>
      {/* KPIs principaux */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Propriétaires" value={owners} />
        <Stat
          label="Pet sitters"
          value={sitters}
          hint={`${sitterPublished}/${sitterTotal} profil(s) publié(s)`}
        />
        <Stat label="Demandes de garde" value={requestsTotal} hint={`${openLive} ouverte(s) actuellement`} />
        <Stat label="Candidatures" value={applicationsTotal} />
      </div>

      {/* Santé de la marketplace */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Liquidité — demandes avec ≥ 1 candidature"
          value={liquidite === null ? "—" : `${liquidite} %`}
          hint="Indicateur vital d'une marketplace"
          tone="forest"
        />
        <Stat
          label="Conversion — demandes → garde confirmée"
          value={tauxConfirme === null ? "—" : `${tauxConfirme} %`}
          hint="Entonnoir de bout en bout"
          tone="forest"
        />
        <Stat
          label="Activation sitter — inscrit → 1ʳᵉ candidature"
          value={tauxActivation === null ? "—" : `${tauxActivation} %`}
          hint={`${sittersWithApp}/${sitterTotal} pet sitter(s)`}
          tone="forest"
        />
      </section>

      {/* Confiance & anti-fuite */}
      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Mises en relation débloquées"
          value={statusCount("UNLOCKED") + statusCount("CONFIRMED") + statusCount("COMPLETED")}
          hint="Demandes payées"
        />
        <Stat
          label="Désistements pet sitter"
          value={desistements}
          hint="KPI signature (anti-annulation)"
          tone={desistements > 0 ? "alert" : undefined}
        />
        <Stat
          label="Tentatives de fuite détectées"
          value={filterHits}
          hint={
            [
              fraudSignals > 0 ? `${fraudSignals} signal(aux) à revoir` : null,
              unlockNoReview > 0 ? `${unlockNoReview} déblocage(s) sans avis` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "Filtre anti-fuite"
          }
          tone={filterHits > 0 || unlockNoReview > 0 ? "alert" : undefined}
        />
      </section>

      {/* Demandes par statut */}
      {requestsTotal > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">
            Demandes par statut
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {requestsByStatus.map((s) => (
              <span
                key={s.status}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-body"
              >
                {STATUS_LABEL[s.status] ?? s.status} ·{" "}
                <strong className="font-mono">{s._count}</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Dernières demandes */}
      <Section title={`Dernières demandes (${recentRequests.length})`}>
        {recentRequests.length === 0 ? (
          <Empty>Aucune demande déposée pour le moment.</Empty>
        ) : (
          <Table headers={["Service", "Animal", "Zone", "Dates", "Candid.", "Statut"]}>
            {recentRequests.map((r) => (
              <tr key={r.id} className="border-b border-line-2 last:border-0">
                <Td>{serviceLabel(r.service)}</Td>
                <Td>{speciesLabel(r.species)}{r.animalCount > 1 ? ` ×${r.animalCount}` : ""}</Td>
                <Td>{r.communeName ?? r.communeCode}</Td>
                <Td className="font-mono text-xs">
                  {dateFr(r.startDate)} → {dateFr(r.endDate)}
                </Td>
                <Td className="font-mono">{r._count.applications}</Td>
                <Td>
                  {r.status === "OPEN" && r.responseDeadline < now
                    ? "Expirée"
                    : STATUS_LABEL[r.status] ?? r.status}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Derniers pet sitters */}
      <Section title={`Derniers pet sitters (${recentSitters.length})`}>
        {recentSitters.length === 0 ? (
          <Empty>Aucun pet sitter inscrit pour le moment.</Empty>
        ) : (
          <Table headers={["Public", "E-mail", "Commune", "Publié"]}>
            {recentSitters.map((s) => (
              <tr key={s.id} className="border-b border-line-2 last:border-0">
                <Td>{displayName(s.user.firstName, s.user.lastName)}</Td>
                <Td className="text-muted">{s.user.email}</Td>
                <Td>{s.communeName ?? "—"}</Td>
                <Td>
                  {s.publishedAt ? (
                    <span className="font-semibold text-forest-text">Oui</span>
                  ) : (
                    <span className="text-faint">Non</span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Liste d'attente */}
      <Section title={`Liste d'attente pet sitter (${waitlistRealCount})`}>
        {testWaitlist > 0 && (
          <p className="mb-3 rounded-[12px] bg-primary-tint px-4 py-2 text-sm text-primary-deep">
            {testWaitlist} enregistrement(s) de test (audits) — exclus du compte,
            à purger.
          </p>
        )}
        {realWaitlist.length === 0 ? (
          <Empty>Aucune pré-inscription pour le moment.</Empty>
        ) : (
          <Table headers={["E-mail", "Code postal", "Date", "Converti"]}>
            {realWaitlist.slice(0, 30).map((w) => (
              <tr key={w.id} className="border-b border-line-2 last:border-0">
                <Td>{w.email}</Td>
                <Td className="font-mono">{w.postalCode}</Td>
                <Td className="text-muted">{dateFr(w.createdAt)}</Td>
                <Td>{w.convertedAt ? "Oui" : "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="kicker">Espace privé</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">
            Console {BRAND}
          </h1>
        </div>
        <Link
          href="/admin/moderation"
          className="rounded-[14px] bg-ink px-4 py-2 text-sm font-bold text-surface hover:opacity-90"
        >
          Modération
        </Link>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "forest" | "alert";
}) {
  const border =
    tone === "forest"
      ? "border-forest-border bg-forest-tint"
      : tone === "alert"
        ? "border-primary-border bg-primary-tint"
        : "border-line bg-surface";
  const valueColor =
    tone === "forest" ? "text-forest-text" : tone === "alert" ? "text-primary-deep" : "text-primary";
  return (
    <div className={`rounded-[20px] border p-5 ${border}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${valueColor}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
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

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-surface">
      <table className="w-full min-w-[520px] text-left text-sm">
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

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-body ${className}`}>{children}</td>;
}
