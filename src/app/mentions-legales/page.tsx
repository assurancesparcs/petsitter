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
        {BRAND} est en cours de lancement. Les informations légales complètes
        de l&apos;éditeur (dénomination sociale, forme juridique,
        immatriculation, siège, hébergeur, contact) seront publiées sur cette
        page avant l&apos;ouverture du service.
      </p>
      <p className="mt-3 text-ink/80">
        Contact : <a href="mailto:contact@allopetsitter.fr" className="underline">contact@allopetsitter.fr</a>
      </p>
    </article>
  );
}
