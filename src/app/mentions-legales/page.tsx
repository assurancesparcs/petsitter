import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false },
};

// ⚠️ GABARIT (P1) — à compléter dès que l'entité juridique est créée (Q4) :
// dénomination, forme, capital, SIREN, siège, directeur de publication,
// hébergeur, médiateur de la consommation (P3).
// ⛔ Aucune mention du statut d'intermédiaire ici tant que
// flags.insurance_live = false : l'afficher avant l'immatriculation effective
// serait une infraction (PLAN.md, revue juridique A2).
export default function MentionsLegales() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="kicker">Informations légales</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        Mentions légales
      </h1>
      <div className="mt-8 space-y-4 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        <p className="text-body">
          <strong className="text-ink">Éditeur</strong> : {BRAND} est un projet
          en cours de lancement, édité par son fondateur (société en cours de
          constitution). La dénomination sociale, la forme juridique, le numéro
          d&apos;immatriculation et l&apos;adresse du siège seront publiés ici
          dès l&apos;immatriculation de la société.
        </p>
        <p className="text-body">
          <strong className="text-ink">Contact</strong> :{" "}
          <a
            href="mailto:contact@allo-pet-sitter.fr"
            className="underline hover:text-primary"
          >
            contact@allo-pet-sitter.fr
          </a>{" "}
          — données personnelles :{" "}
          <a
            href="mailto:rgpd@allo-pet-sitter.fr"
            className="underline hover:text-primary"
          >
            rgpd@allo-pet-sitter.fr
          </a>
        </p>
        <p className="text-body">
          <strong className="text-ink">Hébergement</strong> : Vercel Inc.
          (déploiement en région Union européenne). Base de données hébergée
          dans l&apos;Union européenne.
        </p>
      </div>
    </article>
  );
}
