import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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
          <p className="mt-3 inline-block rounded-full border border-primary-border bg-primary-tint px-3 py-1 text-sm font-semibold text-primary-dark">
            Compte propriétaire
          </p>
        )}
        {role === "SITTER" && (
          <>
            <p className="mt-3 inline-block rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-sm font-semibold text-forest-text">
              Compte pet sitter
            </p>
            <Link
              href="/compte/profil"
              className="mt-4 block rounded-[14px] bg-primary px-4 py-3 text-center text-sm font-bold text-surface transition-colors hover:bg-primary-dark"
            >
              Compléter mon profil pet sitter →
            </Link>
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
