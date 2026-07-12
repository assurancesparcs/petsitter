import type { Metadata } from "next";
import { getPrisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

// Lecture en base à chaque affichage (données vivantes).
export const dynamic = "force-dynamic";

function isTest(email: string) {
  return (
    email.includes("@example.com") ||
    email.includes("verification-deploiement@") ||
    email.includes("audit")
  );
}

export default async function Admin() {
  const db = getPrisma();

  if (!db) {
    return (
      <Shell>
        <p className="text-ink/70">
          Base de données non connectée. Vérifiez <code>DATABASE_URL</code> dans
          Vercel.
        </p>
      </Shell>
    );
  }

  const waitlist = await db.sitterWaitlist.findMany({
    orderBy: { createdAt: "desc" },
  });
  const real = waitlist.filter((w) => !isTest(w.email));
  const tests = waitlist.length - real.length;

  return (
    <Shell>
      {/* Cartes de synthèse */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Pré-inscrits (réels)" value={real.length} />
        <Stat label="Pet sitters inscrits" value="—" hint="arrive en P2" />
        <Stat label="Réservations" value="—" hint="arrive en P3" />
      </div>

      {tests > 0 && (
        <p className="mt-4 rounded-lg bg-primary-tint px-4 py-2 text-sm">
          {tests} enregistrement(s) de test présent(s) (audits de sécurité) —
          exclus du compte ci-dessus, à purger.
        </p>
      )}

      {/* Liste d'attente */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">
          Liste d&apos;attente pet sitter ({real.length})
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Personnes pré-inscrites via « Devenir pet sitter », à convertir à
          l&apos;ouverture des inscriptions (P2).
        </p>
        {real.length === 0 ? (
          <p className="mt-4 text-ink/60">Aucune pré-inscription pour le moment.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-ink/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">E-mail</th>
                  <th className="px-4 py-3 font-semibold">Code postal</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {real.map((w) => (
                  <tr key={w.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">{w.email}</td>
                    <td className="px-4 py-3">{w.postalCode}</td>
                    <td className="px-4 py-3 text-ink/60">
                      {w.createdAt.toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ce qui arrivera */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Prochainement dans cette console</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink/80">
          <li>
            <strong>P2</strong> — Profils pet sitters (validation, vérification
            d&apos;identité), calendriers, demandes et candidatures.
          </li>
          <li>
            <strong>P3</strong> — Réservations et paiements, litiges, Plan B,
            file anti-fraude, indicateurs (liquidité, conversion, désistements).
          </li>
        </ul>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">Console {BRAND}</h1>
        <span className="text-sm text-ink/50">Espace privé</span>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-primary">{value}</p>
      {hint && <p className="text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
