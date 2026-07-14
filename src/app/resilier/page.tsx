import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Résilier — il n'y a rien à résilier",
  description:
    "AlloPetsitter ne propose aucun abonnement : nos Pass se paient une fois, sans reconduction tacite. Cette page reste publiée comme preuve de cet engagement.",
};

/**
 * Page conservée VOLONTAIREMENT depuis la décision n° 13 (DECISIONS.md) :
 * l'ancien produit récurrent a été remplacé par le Pass 3 mois, un achat
 * unique prépayé. Il n'existe donc plus rien à résilier — et cette page le
 * dit tel quel, sans faux parcours. Elle reste liée depuis le pied de page et
 * la charte comme PREUVE de la promesse : si un produit récurrent existait un
 * jour, sa résiliation en 3 clics s'exercerait ici (décret n° 2023-182).
 */
export default function Resilier() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="kicker">Sans dark pattern</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Résilier ? Il n&apos;y a rien à résilier.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-body">
        {BRAND} ne propose <strong className="text-ink">aucun abonnement</strong>{" "}
        : nos trois Pass sont des achats uniques, payés une fois. Aucune
        reconduction, ni tacite ni automatique, aucun prélèvement récurrent —
        il n&apos;existe donc aucune démarche de résiliation à faire, et
        c&apos;est voulu.
      </p>
      <p className="mt-4 max-w-2xl text-body">
        Même le Pass 3 mois, qui couvre des mises en relation illimitées
        pendant 3 mois, s&apos;arrête tout seul à son échéance. Le prolonger
        sera toujours votre geste : un nouvel achat explicite, jamais un débit
        décidé pour vous.
      </p>

      <div className="mt-8 rounded-[20px] border border-forest-border bg-forest-tint p-6 sm:p-8">
        <p className="kicker text-forest-text">Ce que cette page garantit</p>
        <ul className="mt-4 grid gap-3 text-sm text-body sm:grid-cols-2">
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Chaque Pass se paie une fois — jamais de reconduction tacite</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Aucun prélèvement récurrent, aucun renouvellement automatique</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>Rien à annuler : un Pass expiré s&apos;arrête tout seul</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="font-mono font-bold text-success">✓</span>
            <span>
              Si un produit récurrent existait un jour, sa résiliation en
              3 clics s&apos;exercerait ici — sans appeler personne, sans
              lettre recommandée
            </span>
          </li>
        </ul>
      </div>

      <p className="mt-8 max-w-2xl text-sm text-muted">
        Pourquoi garder cette page, alors ? Parce que la promesse doit rester
        vérifiable : elle est liée depuis notre pied de page et notre{" "}
        <Link href="/charte-qualite" className="font-semibold text-primary underline">
          charte de qualité
        </Link>
        , et le jour où quelque chose changerait, c&apos;est ici que vous le
        verriez en premier. Le détail de nos revenus, ligne par ligne, est sur{" "}
        <Link href="/notre-modele" className="font-semibold text-primary underline">
          notre modèle
        </Link>
        .
      </p>

      <Link
        href="/compte"
        className="mt-8 inline-block text-sm text-muted underline-offset-2 hover:text-primary hover:underline"
      >
        ← Retour à mon compte
      </Link>
    </article>
  );
}
