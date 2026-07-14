import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "À propos — notre mission et nos convictions",
  description:
    "AlloPetsitter, une entreprise française de mise en relation entre propriétaires d'animaux et pet sitters indépendants. 0 % de commission, chat = chien = NAC, zéro dark pattern.",
  alternates: { canonical: `${BASE_URL}/a-propos` },
};

const CONVICTIONS = [
  {
    n: "01",
    t: "0 % de commission sur la garde",
    d: "Le pet sitter touche 100 % de ce que vous lui versez. Notre seul revenu est la mise en relation, payée uniquement quand un pet sitter a accepté. Aucun frais caché, aucun prélèvement sur la prestation.",
  },
  {
    n: "02",
    t: "Chat = chien = NAC",
    d: "Aucune espèce reléguée au second plan. La même vérification d'identité, les mêmes avis vérifiés et la même rencontre préalable, que vous confiiez un chat, un chien ou un NAC.",
  },
  {
    n: "03",
    t: "Zéro dark pattern",
    d: "Pas de fausse urgence, pas de case pré-cochée, pas de compteur gonflé, pas de faux avis. Et aucune reconduction tacite : nos Pass se paient une fois, il n'y a rien à résilier.",
  },
];

export default function APropos() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* En-tête */}
      <header className="max-w-2xl">
        <p className="kicker">À propos · notre raison d&apos;être</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-ink sm:text-5xl">
          Aider chacun à trouver la bonne personne pour son animal.
        </h1>
        <p className="mt-4 text-lg text-body">
          {BRAND} est une plateforme de mise en relation entre propriétaires
          d&apos;animaux et pet sitters indépendants, partout en France. Nous ne
          gardons pas les animaux : nous vous aidons à trouver la bonne
          personne, honnêtement, sans prélever un centime sur la garde.
        </p>
      </header>

      {/* Notre mission */}
      <section className="mt-12">
        <p className="kicker">Notre mission</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Rendre la confiance vérifiable
        </h2>
        <div className="mt-4 space-y-4 text-body">
          <p>
            Confier son animal, c&apos;est confier une partie de son foyer. Cette
            confiance ne devrait pas reposer sur une jolie photo de profil, mais
            sur des repères concrets : une identité vérifiée, des avis adossés à
            de vraies gardes, une rencontre avant de s&apos;engager, et un prix
            clair. Notre travail est de rendre ces repères visibles, et de ne
            jamais gonfler ce que nous ne pouvons pas prouver.
          </p>
          <p>
            La garde reste proposée et exécutée par le pet sitter, en toute
            indépendance, avec un contrat de garde type conclu entre vous et
            lui. Nous vous aidons à trouver la bonne personne — le choix final
            vous appartient.
          </p>
        </div>
      </section>

      {/* Trois convictions */}
      <section className="mt-12">
        <p className="kicker">Ce qui nous tient</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Trois convictions, non négociables
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {CONVICTIONS.map((c) => (
            <div
              key={c.n}
              className="rounded-[20px] border border-line bg-surface p-6"
            >
              <span className="font-mono text-sm font-bold text-success">
                {c.n}
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-ink">
                {c.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Qui sommes-nous */}
      <section className="mt-12">
        <p className="kicker">Qui sommes-nous</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Une entreprise française, transparente
        </h2>
        <div className="mt-4 space-y-4 text-body">
          <p>
            {BRAND} est éditée par une entreprise française. Nous sommes une
            jeune structure : nous préférons le dire plutôt que d&apos;afficher
            des chiffres impressionnants que nous n&apos;avons pas. Vous ne
            trouverez donc ici ni statistiques inventées, ni témoignages
            fabriqués — seulement ce que nous faisons réellement, et ce que nous
            ne faisons pas.
          </p>
          <p>
            Le contact et le support se font par écrit, via notre assistant en
            ligne et une réponse humaine sous 24 h. Pour toute question, écrivez
            à{" "}
            <a
              href="mailto:contact@allo-pet-sitter.fr"
              className="font-semibold text-primary underline"
            >
              contact@allo-pet-sitter.fr
            </a>
            . Les informations légales complètes figurent dans nos{" "}
            <Link
              href="/mentions-legales"
              className="font-semibold text-primary underline"
            >
              mentions légales
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Pour aller plus loin */}
      <section className="mt-12 rounded-[20px] bg-forest p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
          Pour aller plus loin
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-surface">
          Tout est écrit, en clair.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-forest">
          Nos engagements ne valent que s&apos;ils sont vérifiables. Trois pages
          les détaillent noir sur blanc :
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link
            href="/notre-modele"
            className="rounded-[14px] bg-surface/5 p-4 text-on-forest transition-colors hover:bg-surface/10"
          >
            <span className="font-semibold text-surface">Notre modèle</span>
            <span className="mt-1 block text-sm">
              Comment nous gagnons notre argent, ligne par ligne.
            </span>
          </Link>
          <Link
            href="/nos-limites"
            className="rounded-[14px] bg-surface/5 p-4 text-on-forest transition-colors hover:bg-surface/10"
          >
            <span className="font-semibold text-surface">Nos limites</span>
            <span className="mt-1 block text-sm">
              Ce que nous ne faisons pas, dit aussi clairement.
            </span>
          </Link>
          <Link
            href="/charte-qualite"
            className="rounded-[14px] bg-surface/5 p-4 text-on-forest transition-colors hover:bg-surface/10"
          >
            <span className="font-semibold text-surface">
              Notre charte de qualité
            </span>
            <span className="mt-1 block text-sm">
              Des engagements publics et opposables.
            </span>
          </Link>
        </div>
      </section>
    </article>
  );
}
