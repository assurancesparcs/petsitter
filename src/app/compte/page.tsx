import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { choisirRole, seDeconnecter } from "./actions";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Votre espace personnel AlloPetsitter.",
  robots: { index: false },
};

/** Page protégée : session requise, sinon retour à /connexion. */
export default async function Compte() {
  const session = await auth();
  if (!session?.user) {
    redirect("/connexion");
  }

  const { email, role } = session.user;

  // Sitter : le profil est-il publié ? Détermine la CTA principale (terminer la
  // mise en ligne tant que le profil n'est pas publié). Dégradation gracieuse.
  const db = getPrisma();
  const sitterPublie =
    role === "SITTER" && db && session.user.id
      ? Boolean(
          (
            await db.sitterProfile.findUnique({
              where: { userId: session.user.id },
              select: { publishedAt: true },
            })
          )?.publishedAt,
        )
      : false;

  // Compteur de notifications non lues — scoped STRICTEMENT à la session.
  // Dégradation gracieuse : 0 si la base n'est pas configurée.
  const notifsNonLues =
    db && session.user.id
      ? await db.notification.count({
          where: { userId: session.user.id, readAt: null },
        })
      : 0;

  const lienNotifications = (
    <Link
      href="/compte/notifications"
      className="flex items-center justify-between gap-2 rounded-[14px] border border-line px-4 py-3 text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
    >
      <span>Notifications</span>
      {notifsNonLues > 0 && (
        <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-surface">
          {notifsNonLues}
        </span>
      )}
    </Link>
  );

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-20">
      <p className="kicker">Espace personnel</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        Mon compte
      </h1>

      <div className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <p className="kicker">Connecté avec l&apos;adresse</p>
        <p className="mt-1 font-semibold break-all text-ink">{email}</p>
        {role === "OWNER" && (
          <>
            <p className="mt-3 inline-block rounded-full border border-primary-border bg-primary-tint px-3 py-1 text-sm font-semibold text-primary-dark">
              Compte propriétaire
            </p>
            <div className="mt-4 grid gap-3">
              <Link
                href="/compte/tableau-de-bord"
                className="block rounded-[14px] bg-primary px-4 py-3 text-center text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
              >
                Tableau de bord →
              </Link>
              <Link
                href="/demande"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Déposer une demande de garde
              </Link>
              <Link
                href="/compte/mes-demandes"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Mes demandes et candidatures reçues
              </Link>
              <Link
                href="/compte/animaux"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Mes animaux
              </Link>
              <Link
                href="/compte/gardes"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Mes gardes &amp; reçus
              </Link>
              <Link
                href="/compte/messages"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Messages
              </Link>
              <Link
                href="/compte/pass-3-mois"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Pass 3 mois
              </Link>
              {lienNotifications}
            </div>
          </>
        )}
        {role === "SITTER" && (
          <>
            <p className="mt-3 inline-block rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-sm font-semibold text-forest-text">
              Compte pet sitter
            </p>
            <div className="mt-4 grid gap-3">
              {sitterPublie ? (
                <Link
                  href="/compte/demarrage"
                  className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
                >
                  Ma mise en ligne
                </Link>
              ) : (
                <Link
                  href="/compte/demarrage"
                  className="block rounded-[14px] bg-primary px-4 py-3 text-center text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
                >
                  Terminer ma mise en ligne →
                </Link>
              )}
              <Link
                href="/compte/profil"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Mon profil pet sitter
              </Link>
              <Link
                href="/compte/profil/identite"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Vérifier mon identité (requis pour être visible)
              </Link>
              <Link
                href="/compte/disponibilites"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Gérer mes disponibilités
              </Link>
              <Link
                href="/compte/demandes"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Demandes près de chez vous
              </Link>
              <Link
                href="/compte/messages"
                className="block rounded-[14px] border border-line px-4 py-3 text-center text-sm font-semibold text-body transition-colors hover:border-primary hover:text-primary"
              >
                Messages
              </Link>
              {lienNotifications}
            </div>
          </>
        )}
        {role === "ADMIN" && (
          <p className="mt-3 inline-block rounded-full border border-line bg-surface-2 px-3 py-1 text-sm font-semibold text-body">
            Compte administrateur
          </p>
        )}
      </div>

      {!role && (
        <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel">
          <h2 className="text-lg font-bold">Vous êtes plutôt…</h2>
          <p className="mt-2 text-sm text-muted">
            Dites-nous comment vous comptez utiliser la plateforme : cela
            adapte votre espace (recherche de pet sitter, ou profil et
            candidatures).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <form action={choisirRole}>
              <input type="hidden" name="role" value="OWNER" />
              <button
                type="submit"
                className="w-full rounded-[14px] bg-primary px-4 py-3 text-sm font-semibold text-surface transition-colors hover:bg-primary-dark"
              >
                Propriétaire d&apos;animal
              </button>
            </form>
            <form action={choisirRole}>
              <input type="hidden" name="role" value="SITTER" />
              <button
                type="submit"
                className="w-full rounded-[14px] border border-line bg-cream px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Pet sitter
              </button>
            </form>
          </div>
        </section>
      )}

      <form action={seDeconnecter} className="mt-8">
        <button
          type="submit"
          className="rounded-[14px] border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
