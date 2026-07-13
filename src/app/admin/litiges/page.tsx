import type { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { displayName } from "@/domains/marketplace/sitters";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { modererAvis, laisserEnLigne } from "./actions";

export const metadata: Metadata = {
  title: "Litiges & Plan B",
  robots: { index: false, follow: false },
};

// Lecture en base à chaque affichage (données vivantes) + revalidée par les actions.
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

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

// Statuts couverts par la section « annulations post-confirmation ».
const CANCEL_STATUS_LABEL: Record<string, string> = {
  REPLACEMENT_IN_PROGRESS: "Plan B en cours",
  CANCELLED_BY_SITTER_POST_CONFIRMATION: "Annulée (sitter, après confirmation)",
};

// Libellés des évènements du fil (RequestEvent, append-only).
const EVENT_LABEL: Record<string, string> = {
  cancelled_by_sitter_post_confirmation: "Annulation du pet sitter (après confirmation)",
  plan_b: "Plan B proposé au propriétaire",
  replacement_confirmed: "Remplaçant confirmé (Plan B)",
  refunded: "Remboursement de la mise en relation",
};
const TIMELINE_TYPES = Object.keys(EVENT_LABEL);

export default async function Litiges({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);

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

  const [reported, cancellations] = await Promise.all([
    // Avis signalés en attente de revue : signalés ET non encore modérés.
    db.review.findMany({
      where: { reportedAt: { not: null }, moderatedAt: null },
      orderBy: { reportedAt: "desc" },
      take: 100,
      include: {
        mission: {
          select: {
            confirmedSitterId: true,
            careRequest: {
              select: {
                service: true,
                species: true,
                startDate: true,
                endDate: true,
                communeName: true,
                communeCode: true,
              },
            },
          },
        },
      },
    }),
    // Annulations post-confirmation & Plan B en cours : fil d'évènements (lecture seule).
    db.careRequest.findMany({
      where: {
        status: { in: ["REPLACEMENT_IN_PROGRESS", "CANCELLED_BY_SITTER_POST_CONFIRMATION"] },
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        owner: { select: { firstName: true, lastName: true } },
        events: {
          where: { type: { in: TIMELINE_TYPES } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { applications: true } },
      },
    }),
  ]);

  // Résolution des pet sitters concernés par les avis signalés (le lien va vers
  // un SitterProfile.id ; on résout les noms publics en une seule requête).
  const sitterIds = Array.from(new Set(reported.map((r) => r.mission.confirmedSitterId)));
  const sitters = sitterIds.length
    ? await db.sitterProfile.findMany({
        where: { id: { in: sitterIds } },
        select: { id: true, user: { select: { firstName: true, lastName: true } } },
      })
    : [];
  const sitterNameById = new Map(
    sitters.map((s) => [s.id, displayName(s.user.firstName, s.user.lastName)]),
  );

  return (
    <Shell>
      {ok && (
        <p className="mb-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-2 text-sm font-semibold text-forest-text">
          {ok}
        </p>
      )}
      {erreur && (
        <p className="mb-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-2 text-sm font-semibold text-primary-deep">
          {erreur}
        </p>
      )}
      <p className="text-muted">
        Revue des avis signalés et suivi des annulations post-confirmation (Plan
        B). Un avis n&apos;est jamais supprimé ni retiré pour son seul caractère
        négatif : seule une modération motivée le masque du public, l&apos;avis
        restant conservé en base (art. L111-7-2).
      </p>

      {/* Avis signalés */}
      <Section title={`Avis signalés en attente (${reported.length})`}>
        {reported.length === 0 ? (
          <Empty>Aucun avis signalé en attente de revue.</Empty>
        ) : (
          <div className="grid gap-4">
            {reported.map((r) => {
              const cr = r.mission.careRequest;
              const sitterNom = sitterNameById.get(r.mission.confirmedSitterId) ?? "—";
              return (
                <article
                  key={r.id}
                  className="rounded-[20px] border border-line bg-surface p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">
                        Avis sur {sitterNom}
                      </p>
                      <p className="text-sm text-muted">
                        {serviceLabel(cr.service)} · {speciesLabel(cr.species)} ·{" "}
                        {cr.communeName ?? cr.communeCode} ·{" "}
                        {dateCourte(cr.startDate)} → {dateCourte(cr.endDate)}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-faint">
                      Signalé le {r.reportedAt ? dateFr(r.reportedAt) : "—"}
                    </p>
                  </div>

                  {/* Contenu de l'avis */}
                  <div className="mt-3 rounded-[14px] border border-line-2 bg-cream p-4">
                    <p className="text-sm font-semibold text-ink">
                      Note : {r.rating}/5
                      <span className="ml-2 font-normal text-faint">
                        Expérience du {dateCourte(r.experienceDate)}
                      </span>
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-sm text-body">
                      {r.body ? r.body : <span className="text-faint">(Aucun commentaire écrit.)</span>}
                    </p>
                  </div>

                  {/* Décision motivée */}
                  <p className="mt-4 text-xs text-muted">
                    Une note motivée est obligatoire dans les deux cas. Masquer ne
                    supprime pas l&apos;avis (il reste en base) ; un avis négatif ne
                    se masque jamais pour ce seul motif.
                  </p>
                  <div className="mt-2 flex flex-col gap-3 border-t border-line-2 pt-4 lg:flex-row lg:items-start lg:justify-between">
                    <form action={modererAvis} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <input type="hidden" name="reviewId" value={r.id} />
                      <input
                        type="text"
                        name="note"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder="Motif de la modération (obligatoire)"
                        className="w-72 rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-body placeholder:text-faint focus:border-primary focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-fit rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
                      >
                        Masquer (modérer)
                      </button>
                    </form>
                    <form action={laisserEnLigne} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <input type="hidden" name="reviewId" value={r.id} />
                      <input
                        type="text"
                        name="note"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder="Note de revue (obligatoire)"
                        className="w-72 rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-body placeholder:text-faint focus:border-primary focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-fit rounded-[14px] border border-forest-border bg-forest-tint px-5 py-2.5 text-sm font-bold text-forest-text hover:bg-forest hover:text-surface"
                      >
                        Laisser en ligne
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      {/* Annulations post-confirmation & Plan B */}
      <Section title={`Annulations post-confirmation & Plan B (${cancellations.length})`}>
        {cancellations.length === 0 ? (
          <Empty>Aucune annulation post-confirmation en cours ou récente.</Empty>
        ) : (
          <div className="grid gap-4">
            {cancellations.map((c) => (
              <article
                key={c.id}
                className="rounded-[20px] border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">
                      {serviceLabel(c.service)} · {speciesLabel(c.species)}
                      {c.animalCount > 1 ? ` ×${c.animalCount}` : ""}
                    </p>
                    <p className="text-sm text-muted">
                      {displayName(c.owner.firstName, c.owner.lastName)} ·{" "}
                      {c.communeName ?? c.communeCode} ·{" "}
                      {dateCourte(c.startDate)} → {dateCourte(c.endDate)} ·{" "}
                      {c._count.applications} candidature(s)
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      c.status === "REPLACEMENT_IN_PROGRESS"
                        ? "bg-primary-tint text-primary-deep"
                        : "border border-line bg-surface-2 text-muted"
                    }`}
                  >
                    {CANCEL_STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>

                {/* Fil d'évènements (append-only, lecture seule) */}
                {c.events.length === 0 ? (
                  <p className="mt-3 text-sm text-faint">Aucun évènement enregistré.</p>
                ) : (
                  <ol className="mt-4 border-l-2 border-line-2 pl-4">
                    {c.events.map((e) => (
                      <li key={e.id} className="relative pb-3 last:pb-0">
                        <span
                          aria-hidden
                          className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary"
                        />
                        <p className="text-sm font-semibold text-ink">
                          {EVENT_LABEL[e.type] ?? e.type}
                        </p>
                        <p className="font-mono text-xs text-faint">{dateFr(e.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
          </div>
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
          Litiges &amp; Plan B
        </h1>
      </header>
      <div className="mt-8">{children}</div>
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
