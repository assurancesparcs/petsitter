import type { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Vérifications d'identité",
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

const fichierUrl = (path: string) =>
  `/admin/verifications/fichier?p=${encodeURIComponent(path)}`;

export default async function Verifications({
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

  // Import différé des actions pour ne pas les charger si la base est absente.
  const { validerIdentite, refuserIdentite } = await import("./actions");

  const [aTraiter, traitees] = await Promise.all([
    db.identityVerification.findMany({
      where: { status: "submitted" },
      orderBy: { submittedAt: "asc" },
      take: 100,
      include: {
        sitterProfile: {
          select: {
            communeName: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    }),
    db.identityVerification.findMany({
      where: { status: { in: ["verified", "rejected"] } },
      orderBy: { reviewedAt: "desc" },
      take: 40,
      include: {
        sitterProfile: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
  ]);

  const storageOn = isStorageConfigured();

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
      {!storageOn && (
        <p className="mb-4 rounded-[12px] border border-line bg-surface-2 px-4 py-2 text-sm text-muted">
          Stockage non configuré (<code>BLOB_READ_WRITE_TOKEN</code>) — la
          consultation des fichiers est indisponible.
        </p>
      )}
      <p className="text-muted">
        Contrôle d&apos;identité des pet sitters (pièce + selfie). Chaque décision
        supprime les fichiers du stockage — seuls le statut et l&apos;horodatage
        sont conservés.
      </p>

      {/* À traiter */}
      <Section title={`À traiter (${aTraiter.length})`}>
        {aTraiter.length === 0 ? (
          <Empty>Aucune vérification en attente.</Empty>
        ) : (
          <div className="grid gap-4">
            {aTraiter.map((v) => {
              const u = v.sitterProfile.user;
              const nomComplet = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
              return (
                <article
                  key={v.id}
                  className="rounded-[20px] border border-line bg-surface p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{nomComplet}</p>
                      <p className="text-sm text-muted">
                        {u.email}
                        {v.sitterProfile.communeName
                          ? ` · ${v.sitterProfile.communeName}`
                          : ""}
                      </p>
                    </div>
                    <p className="font-mono text-xs text-faint">
                      Soumis le {v.submittedAt ? dateFr(v.submittedAt) : "—"}
                    </p>
                  </div>

                  {/* Consultation des fichiers */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {storageOn && v.docStoragePath ? (
                      <a
                        href={fichierUrl(v.docStoragePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[14px] border border-line px-4 py-2 text-sm font-semibold text-body hover:border-primary hover:text-primary"
                      >
                        Voir la pièce d&apos;identité
                      </a>
                    ) : (
                      <span className="rounded-[14px] border border-line px-4 py-2 text-sm text-faint">
                        Pièce indisponible
                      </span>
                    )}
                    {storageOn && v.selfieStoragePath ? (
                      <a
                        href={fichierUrl(v.selfieStoragePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[14px] border border-line px-4 py-2 text-sm font-semibold text-body hover:border-primary hover:text-primary"
                      >
                        Voir le selfie
                      </a>
                    ) : (
                      <span className="rounded-[14px] border border-line px-4 py-2 text-sm text-faint">
                        Selfie indisponible
                      </span>
                    )}
                  </div>

                  {/* Décision */}
                  <div className="mt-4 flex flex-col gap-3 border-t border-line-2 pt-4 sm:flex-row sm:items-start sm:justify-between">
                    <form action={validerIdentite}>
                      <input type="hidden" name="verifId" value={v.id} />
                      <button
                        type="submit"
                        className="rounded-[14px] bg-forest px-5 py-2.5 text-sm font-bold text-surface hover:opacity-90"
                      >
                        Valider
                      </button>
                    </form>
                    <form action={refuserIdentite} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <input type="hidden" name="verifId" value={v.id} />
                      <input
                        type="text"
                        name="motif"
                        required
                        minLength={3}
                        maxLength={500}
                        placeholder="Motif du refus (obligatoire)"
                        className="w-64 rounded-[12px] border border-line bg-cream px-3 py-2 text-sm text-body placeholder:text-faint focus:border-primary focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-fit rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
                      >
                        Refuser
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      {/* Décisions récentes */}
      <Section title={`Décisions récentes (${traitees.length})`}>
        {traitees.length === 0 ? (
          <Empty>Aucune décision pour le moment.</Empty>
        ) : (
          <Table headers={["Pet sitter", "Décision", "Date", "Motif"]}>
            {traitees.map((v) => {
              const u = v.sitterProfile.user;
              const nomComplet = [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
              return (
                <tr key={v.id} className="border-b border-line-2 last:border-0">
                  <Td>{nomComplet}</Td>
                  <Td>
                    {v.status === "verified" ? (
                      <span className="font-semibold text-forest-text">Validée</span>
                    ) : (
                      <span className="font-semibold text-primary-deep">Refusée</span>
                    )}
                  </Td>
                  <Td className="font-mono text-xs">
                    {v.reviewedAt ? dateFr(v.reviewedAt) : "—"}
                  </Td>
                  <Td className="text-muted">{v.rejectionReason ?? "—"}</Td>
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
          Vérifications d&apos;identité
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
