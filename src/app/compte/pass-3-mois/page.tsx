import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PRICING } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pass 3 mois",
  robots: { index: false },
};

/**
 * Pass 3 mois — achat UNIQUE prépayé (décision n° 13, DECISIONS.md).
 * Ce n'est PAS un produit récurrent : payé une fois, valable 3 mois, aucune
 * reconduction (ni tacite ni automatique), aucun prélèvement ultérieur, rien
 * à résilier. Un renouvellement serait un NOUVEL achat, explicite.
 * Paiement DORMANT : aucun moyen de paiement demandé tant que l'achat
 * n'est pas ouvert — la page l'affiche honnêtement (« bientôt disponible »).
 */
export default async function PassTroisMois() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role !== "OWNER") redirect("/compte");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="kicker">Espace propriétaire</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        {PRICING.passTrimestre.label}
      </h1>

      {/* L'offre — montant depuis PRICING, jamais en dur */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">
            {PRICING.passTrimestre.label}
          </h2>
          <p className="font-mono text-2xl font-bold text-ink">
            {PRICING.passTrimestre.price}
            <span className="ml-1 text-sm font-normal text-muted">
              {PRICING.passTrimestre.unit}
            </span>
          </p>
        </div>
        <p className="mt-2 text-sm text-body">{PRICING.passTrimestre.detail}</p>
      </section>

      {/* Achat non encore ouvert — état honnête, clairement affiché */}
      <section className="mt-5 rounded-[20px] border border-line bg-surface p-6">
        <span className="inline-block rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-bold text-muted">
          Bientôt disponible
        </span>
        <p className="mt-3 text-sm text-body">
          L&apos;achat du {PRICING.passTrimestre.label} n&apos;est pas encore
          ouvert : aucun moyen de paiement ne vous est demandé et aucun débit
          n&apos;est possible aujourd&apos;hui. En attendant, déposez vos
          demandes de garde normalement — le Pass ponctuel est déduit des dates,
          et la récurrence est déjà disponible dans le formulaire de dépôt.
        </p>
        <Link
          href="/demande"
          className="mt-4 inline-block rounded-[14px] bg-primary px-5 py-2.5 text-sm font-bold text-surface hover:bg-primary-dark"
        >
          Déposer une demande de garde →
        </Link>
      </section>

      {/* Les règles, honnêtes — toujours affichées */}
      <section className="mt-5 rounded-[20px] border border-forest-border bg-forest-tint p-6">
        <p className="kicker text-forest-text">Comment il fonctionne</p>
        <ul className="mt-4 grid gap-3 text-sm text-body">
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">Payé une seule fois.</strong> Aucune
              reconduction, ni tacite ni automatique : à l&apos;échéance des
              3 mois, il s&apos;arrête tout seul. Aucun prélèvement ultérieur,
              rien à résilier.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">
                Mises en relation illimitées pendant 3 mois
              </strong>{" "}
              — autant de demandes que vous voulez, sans Pass ponctuel à régler.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">
                Utile à partir de 2 mises en relation.
              </strong>{" "}
              En dessous, un Pass ponctuel vous coûte moins cher — on préfère
              vous le dire.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              <strong className="text-ink">
                Le renouveler sera toujours VOTRE geste
              </strong>{" "}
              — un nouvel achat explicite, jamais un débit décidé pour vous.
            </span>
          </li>
        </ul>
      </section>

      <Link
        href="/compte"
        className="mt-8 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
      >
        ← Retour à mon compte
      </Link>
    </div>
  );
}
