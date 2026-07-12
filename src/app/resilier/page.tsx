import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Résilier son abonnement",
};

// P3 : cette page orchestrera la résiliation réelle en 3 clics via l'API
// Stripe (bouton « résilier » accessible en permanence — décret n° 2023-182),
// testée par Playwright. En P1 le service n'a encore aucun abonné.
export default function Resilier() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Résilier, en 3 clics</h1>
      <p className="mt-4 text-ink/80">
        Chez {BRAND}, la résiliation est un droit qui s&apos;exerce ici, en
        trois clics, sans appeler personne et sans lettre recommandée. Les
        abonnements n&apos;ont pas encore ouvert ; le jour venu, cette page
        permettra de résilier immédiatement, et un rappel vous sera envoyé
        avant chaque prélèvement.
      </p>
    </article>
  );
}
