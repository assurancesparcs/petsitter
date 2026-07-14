import type { Metadata } from "next";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/brand";
import { DEMO_SITTER_EMAIL } from "@/domains/dev/seed";
import { creerScenario, nettoyerScenario } from "./actions";

export const metadata: Metadata = {
  title: "Démonstration",
  robots: { index: false, follow: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminDemo({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const ok = one(sp.ok);
  const erreur = one(sp.erreur);
  const owner = one(sp.owner) ?? "";

  // Fiche du pet sitter de démo (si déjà créé) pour proposer un lien direct.
  const db = getPrisma();
  const demoSitter = db
    ? await db.user.findUnique({
        where: { email: DEMO_SITTER_EMAIL },
        select: { sitterProfile: { select: { id: true } } },
      })
    : null;
  const ficheId = demoSitter?.sitterProfile?.id ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <p className="kicker">Console · outil interne</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        Démonstration du parcours client
      </h1>
      <p className="mt-3 text-muted">
        Crée un pet sitter de démonstration à Caen, une demande de garde et une
        candidature — pour parcourir le côté client en conditions réelles,
        jusqu&apos;au paiement.
      </p>

      {ok === "scenario" && (
        <div className="mt-6 rounded-[16px] border border-forest-border bg-forest-tint p-5">
          <p className="font-semibold text-forest-text">
            ✓ Scénario créé pour <span className="font-mono">{owner}</span>
          </p>
          <p className="mt-2 text-sm text-body">
            Suivez ces étapes, dans l&apos;ordre :
          </p>
          <ol className="mt-3 space-y-2 text-sm text-body">
            <li>
              <span className="font-bold">1.</span>{" "}
              <a
                href={`${BASE_URL}/connexion`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-forest-text underline"
              >
                Se connecter
              </a>{" "}
              avec l&apos;adresse <span className="font-mono">{owner}</span> (le
              lien magique arrive par e-mail).
            </li>
            <li>
              <span className="font-bold">2.</span>{" "}
              <a
                href={`${BASE_URL}/compte/mes-demandes`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-forest-text underline"
              >
                Ouvrir « Mes demandes »
              </a>{" "}
              — la demande à Caen affiche déjà une candidature (18 €).
            </li>
            <li>
              <span className="font-bold">3.</span> Cliquer « Choisir » → vous
              arrivez au mur du paiement (en veille tant que Stripe n&apos;est
              pas branché).
            </li>
            {ficheId && (
              <li>
                <span className="font-bold">+</span>{" "}
                <a
                  href={`${BASE_URL}/petsitter/${ficheId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-forest-text underline"
                >
                  Voir la fiche du pet sitter
                </a>{" "}
                (ou chercher « 14000 » sur l&apos;accueil).
              </li>
            )}
          </ol>
        </div>
      )}
      {ok === "nettoye" && (
        <p className="mt-6 rounded-[16px] border border-line bg-surface-2 px-5 py-4 text-sm font-semibold text-body">
          ✓ Données de démonstration nettoyées.
        </p>
      )}
      {erreur && (
        <p className="mt-6 rounded-[16px] border border-primary-border bg-primary-tint px-5 py-4 text-sm font-semibold text-primary-deep">
          {erreur === "email"
            ? "Adresse e-mail invalide — indiquez l'adresse avec laquelle vous vous connecterez."
            : erreur === "indisponible"
              ? "Base de données indisponible."
              : "Le scénario n'a pas pu être monté (commune de Caen introuvable ?)."}
        </p>
      )}

      {/* Étape 1 : créer le scénario */}
      <section className="mt-8 rounded-[20px] border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          1. Créer le scénario
        </h2>
        <p className="mt-1 text-sm text-muted">
          Indiquez <strong>votre adresse de connexion</strong> (celle qui reçoit
          les e-mails — en mode test, seule cette adresse reçoit le lien). Le
          compte passe en rôle propriétaire.
        </p>
        <form action={creerScenario} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="owner"
            required
            defaultValue={owner}
            placeholder="vous@exemple.fr"
            className="flex-1 rounded-[12px] border border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-[14px] bg-primary px-6 py-3 font-bold text-surface hover:bg-primary-dark"
          >
            Créer le scénario
          </button>
        </form>
      </section>

      {/* Étape 2 : nettoyer */}
      <section className="mt-4 rounded-[20px] border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          2. Nettoyer (quand vous avez fini)
        </h2>
        <p className="mt-1 text-sm text-muted">
          Retire la demande de démonstration du compte et le pet sitter de démo.
        </p>
        <form action={nettoyerScenario} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="owner"
            required
            defaultValue={owner}
            placeholder="vous@exemple.fr"
            className="flex-1 rounded-[12px] border border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-[14px] border border-line px-6 py-3 font-semibold text-body hover:border-primary hover:text-primary"
          >
            Tout nettoyer
          </button>
        </form>
      </section>

      <p className="mt-6 text-xs text-faint">
        Le pet sitter de démo s&apos;affiche « Nouveau » (aucun faux avis). Le
        parcours côté pet sitter n&apos;est pas accessible par connexion (adresse
        de démo non délivrable) : la candidature est simulée en base.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
      >
        ← Retour au tableau de bord
      </Link>
    </div>
  );
}
