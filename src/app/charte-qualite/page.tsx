import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Notre charte de qualité — engagements publics et opposables",
  description:
    "Les 6 engagements d'AlloPetsitter et les 5 interdits que nous nous imposons. Publics, opposables, vérifiables.",
  alternates: { canonical: `${BASE_URL}/charte-qualite` },
};

// Contenu : maquette « Charte Qualite Desktop — LOT A » (livrable design v2).
const ENGAGEMENTS = [
  {
    t: "Le pet sitter touche 100 %.",
    d: "Aucune commission sur la garde, jamais.",
  },
  {
    t: "Aucun débit tant qu'un pet sitter n'a pas accepté.",
    d: "L'empreinte carte n'est pas un prélèvement.",
  },
  {
    t: "Prix affichés, aucun frais caché.",
    d: "39 € · 14,90 € · 19 €/mois. Rien d'autre.",
  },
  {
    t: "Résiliation en 3 clics, jamais plus longue que l'achat.",
    d: "Rappel J-3 avant chaque prélèvement.",
  },
  {
    t: "Zéro faux avis, zéro score gonflé.",
    d: "Sous le seuil : badge « Nouveau », assumé.",
  },
  {
    t: "Chat, chien et NAC à égalité.",
    d: "Aucun animal traité comme secondaire.",
  },
];

const INTERDITS = [
  "Fausse urgence",
  "Case pré-cochée",
  "Prix barré fictif",
  "Frais au checkout",
  "Conversion silencieuse",
];

export default function CharteQualite() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="kicker">Charte de qualité</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.02em] sm:text-5xl">
          Des engagements publics et opposables.
        </h1>
        <p className="mt-4 text-lg text-body">
          Si nous les violons, vous êtes en droit de nous le rappeler — et de
          nous quitter en{" "}
          <Link href="/resilier" className="font-semibold text-primary underline">
            3 clics
          </Link>
          .
        </p>
      </header>

      {/* Les 6 engagements */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {ENGAGEMENTS.map((e, i) => (
          <div
            key={e.t}
            className="rounded-[20px] border border-line bg-surface p-6"
          >
            <span className="font-mono text-sm font-bold text-success">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2 className="mt-2 font-display text-lg font-bold text-ink">
              {e.t}
            </h2>
            <p className="mt-1 text-sm text-muted">{e.d}</p>
          </div>
        ))}
      </section>

      {/* Les 5 interdits */}
      <section className="mt-10 rounded-[20px] bg-forest p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
          Interdits que nous nous imposons
        </p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {INTERDITS.map((i) => (
            <li
              key={i}
              className="rounded-full border border-on-forest/30 px-4 py-2 text-sm font-semibold text-surface"
            >
              <span aria-hidden className="mr-2 font-bold text-primary">
                ✕
              </span>
              {i}
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-on-forest">
          Ces interdits s&apos;appliquent à notre propre design. Un doute sur
          une de nos interfaces ? Écrivez à{" "}
          <a
            href="mailto:contact@allo-pet-sitter.fr"
            className="font-semibold text-surface underline"
          >
            contact@allo-pet-sitter.fr
          </a>{" "}
          : on corrige, ou on s&apos;explique.
        </p>
      </section>

      <p className="mt-8 text-sm text-muted">
        Cette charte engage {BRAND}. Chaque modification sera datée et archivée
        publiquement, comme pour{" "}
        <Link href="/notre-modele" className="font-semibold text-primary underline">
          notre modèle
        </Link>{" "}
        et{" "}
        <Link href="/nos-limites" className="font-semibold text-primary underline">
          nos limites
        </Link>
        .
      </p>
    </article>
  );
}
