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
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Mentions légales</h1>
      <p className="mt-4 text-ink/80">
        <strong>Éditeur</strong> : {BRAND} est un projet en cours de lancement,
        édité par son fondateur (société en cours de constitution). La
        dénomination sociale, la forme juridique, le numéro
        d&apos;immatriculation et l&apos;adresse du siège seront publiés ici dès
        l&apos;immatriculation de la société.
      </p>
      <p className="mt-3 text-ink/80">
        <strong>Contact</strong> :{" "}
        <a href="mailto:contact@allopetsitter.fr" className="underline">
          contact@allopetsitter.fr
        </a>{" "}
        — données personnelles :{" "}
        <a href="mailto:rgpd@allopetsitter.fr" className="underline">
          rgpd@allopetsitter.fr
        </a>
      </p>
      <p className="mt-3 text-ink/80">
        <strong>Hébergement</strong> : Vercel Inc. (déploiement en région
        Union européenne). Base de données hébergée dans l&apos;Union
        européenne.
      </p>
    </article>
  );
}
