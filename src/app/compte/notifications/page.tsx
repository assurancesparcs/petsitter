import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { marquerToutLu } from "./actions";

export const metadata: Metadata = {
  title: "Mes notifications",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const dateFr = (d: Date) =>
  d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default async function Notifications({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  // Session requise — OWNER comme SITTER (aucune restriction de rôle au-delà).
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);

  const db = getPrisma();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <Link
        href="/compte"
        className="text-sm font-semibold text-primary hover:text-primary-dark"
      >
        ← Retour à mon compte
      </Link>
      <p className="kicker mt-4">Espace personnel</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Mes notifications
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        L&apos;essentiel de vos gardes au même endroit : mise en relation
        débloquée, candidature retenue, paiement à finaliser, garde terminée.
      </p>

      {ok === "lu" && (
        <p className="mt-4 rounded-[12px] border border-forest-border bg-forest-tint px-4 py-3 text-sm font-semibold text-forest-text">
          Toutes vos notifications sont marquées comme lues.
        </p>
      )}
      {erreur === "indisponible" && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          Service momentanément indisponible, réessayez.
        </p>
      )}

      {!db ? (
        <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Service momentanément indisponible
          </h2>
          <p className="mt-1 text-sm text-muted">
            Vos notifications seront de nouveau accessibles dans un instant.
            Merci de réessayer un peu plus tard.
          </p>
        </div>
      ) : (
        await Liste({ userId: session.user.id, db })
      )}
    </div>
  );
}

/** Liste scoped STRICTEMENT à l'utilisateur de la session (jamais un id client). */
async function Liste({
  userId,
  db,
}: {
  userId: string;
  db: NonNullable<ReturnType<typeof getPrisma>>;
}) {
  const items = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const nonLues = items.filter((n) => n.readAt === null).length;

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-[20px] border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          Aucune notification pour l&apos;instant
        </h2>
        <p className="mt-1 text-sm text-muted">
          Vous serez prévenu ici dès qu&apos;un événement concerne l&apos;une de
          vos gardes.
        </p>
      </div>
    );
  }

  return (
    <>
      {nonLues > 0 && (
        <form action={marquerToutLu} className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            {nonLues} non&nbsp;lue{nonLues > 1 ? "s" : ""}
          </p>
          <button
            type="submit"
            className="rounded-[14px] border border-line px-4 py-2 text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
          >
            Tout marquer comme lu
          </button>
        </form>
      )}

      <ul className="mt-4 grid gap-3">
        {items.map((n) => {
          const nonLue = n.readAt === null;
          const contenu = (
            <div
              className={`rounded-[16px] border p-5 transition-colors ${
                nonLue
                  ? "border-primary-border bg-primary-tint"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">{n.title}</p>
                {nonLue && (
                  <span
                    className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                    aria-label="Non lue"
                  />
                )}
              </div>
              {n.body && <p className="mt-1 text-sm text-muted">{n.body}</p>}
              <p className="mt-2 text-xs text-muted">{dateFr(n.createdAt)}</p>
            </div>
          );

          return (
            <li key={n.id}>
              {n.careRequestId ? (
                <Link
                  href={`/compte/messages/${n.careRequestId}`}
                  className="block hover:opacity-90"
                >
                  {contenu}
                </Link>
              ) : (
                contenu
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
