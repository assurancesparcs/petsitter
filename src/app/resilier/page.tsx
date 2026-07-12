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
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="kicker">Sans dark pattern</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Résilier, en{" "}
        <span className="font-mono text-primary">3 clics</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-body">
        Chez {BRAND}, la résiliation est un droit qui s&apos;exerce ici, en
        trois clics, sans appeler personne et sans lettre recommandée. Les
        abonnements n&apos;ont pas encore ouvert ; le jour venu, cette page
        permettra de résilier immédiatement, et un rappel vous sera envoyé
        avant chaque prélèvement.
      </p>

      <div className="mt-8 rounded-[20px] border border-forest-border bg-forest-tint p-6 sm:p-8">
        <p className="kicker">Ce qu&apos;on s&apos;interdit</p>
        <ul className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2">
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>Sans appeler personne</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>Sans lettre recommandée</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>Effet immédiat, le jour venu</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">
              ✓
            </span>
            <span>Un rappel avant chaque prélèvement</span>
          </li>
        </ul>
      </div>
    </article>
  );
}
