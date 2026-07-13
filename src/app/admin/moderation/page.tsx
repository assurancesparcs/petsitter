import type { Metadata } from "next";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { displayName } from "@/domains/marketplace/sitters";
import { suspendreSitter, reactiverSitter, traiterSignal } from "../actions";

export const metadata: Metadata = {
  title: "Modération",
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

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Moderation({
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

  const [sitters, filterHits, signals] = await Promise.all([
    db.sitterProfile.findMany({
      orderBy: [{ suspendedAt: "desc" }, { user: { createdAt: "desc" } }],
      take: 200,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    db.contentFilterHit.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    db.fraudSignal.findMany({
      where: { reviewedAt: null },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  // Emails des utilisateurs concernés par les signaux (pas de relation directe
  // sur ces modèles : on résout les userId en une seule requête).
  const userIds = Array.from(
    new Set([
      ...filterHits.map((h) => h.userId),
      ...signals.map((s) => s.userId).filter((v): v is string => !!v),
    ]),
  );
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      })
    : [];
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  const suspended = sitters.filter((s) => s.suspendedAt).length;

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
        Suspension / réactivation des pet sitters et revue des signaux
        anti-fuite. Chaque décision est motivée et tracée.
      </p>

      {/* Pet sitters */}
      <Section
        title={`Pet sitters (${sitters.length}${suspended > 0 ? ` · ${suspended} suspendu(s)` : ""})`}
      >
        {sitters.length === 0 ? (
          <Empty>Aucun pet sitter inscrit pour le moment.</Empty>
        ) : (
          <Table headers={["Public", "E-mail", "Commune", "État", "Action"]}>
            {sitters.map((s) => (
              <tr key={s.id} className="border-b border-line-2 align-top last:border-0">
                <Td>{displayName(s.user.firstName, s.user.lastName)}</Td>
                <Td className="text-muted">{s.user.email}</Td>
                <Td>{s.communeName ?? "—"}</Td>
                <Td>
                  {s.suspendedAt ? (
                    <>
                      <span className="font-semibold text-primary-deep">
                        Suspendu
                      </span>
                      <span className="mt-0.5 block text-xs text-faint">
                        {dateFr(s.suspendedAt)}
                        {s.suspensionReason ? ` — ${s.suspensionReason}` : ""}
                      </span>
                    </>
                  ) : s.publishedAt ? (
                    <span className="font-semibold text-forest-text">
                      Actif · publié
                    </span>
                  ) : (
                    <span className="text-faint">Actif · non publié</span>
                  )}
                </Td>
                <Td>
                  {s.suspendedAt ? (
                    <form action={reactiverSitter}>
                      <input type="hidden" name="sitterId" value={s.id} />
                      <button
                        type="submit"
                        className="rounded-[14px] border border-forest-border bg-forest-tint px-4 py-2 text-sm font-bold text-forest-text hover:bg-forest hover:text-surface"
                      >
                        Réactiver
                      </button>
                    </form>
                  ) : (
                    <form action={suspendreSitter} className="flex flex-col gap-2">
                      <input type="hidden" name="sitterId" value={s.id} />
                      <input
                        type="text"
                        name="motif"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder="Motif (obligatoire)"
                        className="w-56 rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-body placeholder:text-faint focus:border-primary focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-fit rounded-[14px] bg-primary px-4 py-2 text-sm font-bold text-surface hover:bg-primary-dark"
                      >
                        Suspendre
                      </button>
                    </form>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Signaux anti-fuite non revus */}
      <Section title={`Signaux anti-fuite à revoir (${signals.length})`}>
        {signals.length === 0 ? (
          <Empty>Aucun signal en attente de revue.</Empty>
        ) : (
          <Table headers={["Date", "Type", "Utilisateur", "Détail", "Action"]}>
            {signals.map((sig) => (
              <tr key={sig.id} className="border-b border-line-2 align-top last:border-0">
                <Td className="font-mono text-xs">{dateFr(sig.createdAt)}</Td>
                <Td className="font-semibold">{sig.type}</Td>
                <Td className="text-muted">
                  {(sig.userId && emailById.get(sig.userId)) || "—"}
                </Td>
                <Td className="max-w-xs text-xs text-muted">
                  {sig.payload ? (
                    <code className="break-words">{JSON.stringify(sig.payload)}</code>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  <form action={traiterSignal} className="flex flex-col gap-2">
                    <input type="hidden" name="signalId" value={sig.id} />
                    <input
                      type="text"
                      name="note"
                      required
                      minLength={3}
                      maxLength={500}
                      placeholder="Note de revue (obligatoire)"
                      className="w-56 rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-body placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-fit rounded-[14px] bg-ink px-4 py-2 text-sm font-bold text-surface hover:opacity-90"
                    >
                      Marquer traité
                    </button>
                  </form>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      {/* Filtre anti-fuite : détections récentes (lecture seule) */}
      <Section title={`Détections du filtre anti-fuite (${filterHits.length})`}>
        {filterHits.length === 0 ? (
          <Empty>Aucune détection récente.</Empty>
        ) : (
          <Table headers={["Date", "Utilisateur", "Champ", "Motif détecté"]}>
            {filterHits.map((h) => (
              <tr key={h.id} className="border-b border-line-2 last:border-0">
                <Td className="font-mono text-xs">{dateFr(h.createdAt)}</Td>
                <Td className="text-muted">{emailById.get(h.userId) ?? h.userId}</Td>
                <Td>{h.field}</Td>
                <Td className="text-muted">{h.pattern}</Td>
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
      <div>
        <p className="kicker">Espace privé</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink">
          Modération {BRAND}
        </h1>
        <Link
          href="/admin"
          className="mt-2 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
        >
          ← Retour à la console
        </Link>
      </div>
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

function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-surface">
      <table className="w-full min-w-[640px] text-left text-sm">
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
