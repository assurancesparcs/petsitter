import type { Metadata } from "next";
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
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold">Mon compte</h1>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        <p className="text-sm text-ink/60">Connecté avec l&apos;adresse</p>
        <p className="mt-1 font-medium break-all">{email}</p>
        {role === "OWNER" && (
          <p className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium">
            Compte propriétaire
          </p>
        )}
        {role === "SITTER" && (
          <p className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium">
            Compte pet sitter
          </p>
        )}
        {role === "ADMIN" && (
          <p className="mt-3 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-medium">
            Compte administrateur
          </p>
        )}
      </div>

      {!role && (
        <section className="mt-6 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-bold">Vous êtes plutôt…</h2>
          <p className="mt-2 text-sm text-ink/70">
            Dites-nous comment vous comptez utiliser la plateforme : cela
            adapte votre espace (recherche de pet sitter, ou profil et
            candidatures).
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <form action={choisirRole}>
              <input type="hidden" name="role" value="OWNER" />
              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Propriétaire d&apos;animal
              </button>
            </form>
            <form action={choisirRole}>
              <input type="hidden" name="role" value="SITTER" />
              <button
                type="submit"
                className="w-full rounded-full border border-line bg-cream px-4 py-3 text-sm font-medium text-ink hover:border-primary hover:text-primary"
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
          className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:border-primary hover:text-primary"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
