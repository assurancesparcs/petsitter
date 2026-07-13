import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { RELIABILITY_THRESHOLD } from "@/domains/reliability/score";

export const metadata: Metadata = {
  title: "Comment le score de fiabilité est calculé",
  description:
    "Le score de fiabilité d'un pet sitter, expliqué en clair : d'où viennent les chiffres, ce qui reste masqué, et le droit de contester (RGPD art. 22).",
  alternates: { canonical: `${BASE_URL}/transparence-score` },
};

// Chaque métrique : ce qu'elle mesure, sa source EXACTE, et si elle est
// volontairement laissée vide en V1. Aucun chiffre inventé, aucun exemple faux.
const METRIQUES = [
  {
    t: "Note moyenne",
    d: (
      <>
        Moyenne des avis vérifiés du pet sitter — chacun adossé à une garde
        réellement réglée via {BRAND}. Les avis masqués par une modération
        motivée sont exclus du calcul ; un avis négatif, lui, compte toujours.
        Tant qu&apos;aucun avis n&apos;existe, aucune note n&apos;est affichée —
        jamais un « 0 » à la place d&apos;un vide.
      </>
    ),
    live: true,
  },
  {
    t: "Gardes réalisées",
    d: (
      <>
        Nombre de gardes déclarées terminées dont ce pet sitter était le sitter
        confirmé. C&apos;est aussi le compteur qui décide de l&apos;affichage du
        score (voir le seuil ci-dessous).
      </>
    ),
    live: true,
  },
  {
    t: "Taux d'annulation",
    d: (
      <>
        Part des gardes que le pet sitter a annulées <em>après</em>{" "}
        confirmation, rapportée à ses gardes confirmées. Affiché seulement si le
        calcul a un sens (au moins une garde confirmée) — sinon masqué.
      </>
    ),
    live: true,
  },
  {
    t: "Délai de réponse médian",
    d: (
      <>
        Temps médian entre l&apos;ouverture d&apos;une demande et la candidature
        du pet sitter, en heures. Médian (et non moyen) pour ne pas être
        déformé par un cas isolé. Masqué tant qu&apos;il n&apos;y a pas de
        candidature à mesurer.
      </>
    ),
    live: true,
  },
  {
    t: "Taux de réponse",
    d: (
      <>
        Volontairement <strong>non affiché</strong> pour l&apos;instant. Nous ne
        savons pas mesurer honnêtement combien de demandes un pet sitter a
        réellement « vues » : sans ce dénominateur fiable, un taux de réponse
        serait un chiffre fabriqué. Nous préférons ne rien afficher.
      </>
    ),
    live: false,
  },
];

export default function TransparenceScore() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="max-w-2xl">
        <p className="kicker">Transparence · score de fiabilité</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.02em] sm:text-5xl">
          D&apos;où vient le score, en clair.
        </h1>
        <p className="mt-4 text-lg text-body">
          Le score de fiabilité se calcule tout seul, à partir de gardes
          réellement réalisées et d&apos;avis vérifiés. Rien n&apos;est saisi à
          la main, rien n&apos;est gonflé. Voici exactement ce qu&apos;il
          contient — et ce qu&apos;il ne contient pas.
        </p>
      </header>

      {/* Seuil d'affichage + badge « Nouveau » */}
      <section className="mt-10 rounded-[20px] border border-forest-border bg-forest-tint p-6 sm:p-8">
        <p className="kicker">Le seuil, assumé</p>
        <p className="mt-3 text-body">
          En dessous de{" "}
          <strong>
            {RELIABILITY_THRESHOLD} garde
            {RELIABILITY_THRESHOLD > 1 ? "s" : ""} déclarée
            {RELIABILITY_THRESHOLD > 1 ? "s" : ""} terminée
            {RELIABILITY_THRESHOLD > 1 ? "s" : ""}
          </strong>
          , un score chiffré ne veut statistiquement rien dire. Tant que ce
          seuil n&apos;est pas atteint, le pet sitter porte simplement le badge
          «&nbsp;Nouveau sur {BRAND}&nbsp;» — pas un score bas, pas un vide
          déguisé en note. Une fois le seuil franchi, le bloc chiffré
          apparaît ; chaque métrique inconnue y reste masquée plutôt
          qu&apos;inventée.
        </p>
      </section>

      {/* Détail des métriques */}
      <section className="mt-6">
        <h2 className="font-display text-xl font-bold text-ink">
          Ce que contient le score
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {METRIQUES.map((m) => (
            <div
              key={m.t}
              className="rounded-[20px] border border-line bg-surface p-6"
            >
              <div className="flex items-baseline justify-between gap-2">
                <dt className="font-display text-lg font-bold text-ink">
                  {m.t}
                </dt>
                <span
                  className={
                    "shrink-0 rounded-full border px-3 py-0.5 text-xs font-bold " +
                    (m.live
                      ? "border-forest-border bg-forest-tint text-forest-text"
                      : "border-line-2 bg-surface-2 text-muted")
                  }
                >
                  {m.live ? "Affiché" : "Non affiché"}
                </span>
              </div>
              <dd className="mt-2 text-sm leading-relaxed text-body">{m.d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Mise à jour automatique */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink">
          Un score qui se met à jour tout seul
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-body">
          Le score est recalculé automatiquement à chaque événement qui le
          concerne : une garde déclarée terminée, un avis vérifié publié. Aucune
          intervention manuelle, aucun réglage caché — les mêmes règles pour
          tout le monde. Aucun pet sitter ne peut payer pour améliorer son score
          ou remonter dans les résultats.
        </p>
      </section>

      {/* Droit de contestation — RGPD art. 22 */}
      <section className="mt-6 rounded-[20px] bg-forest p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
          Votre droit de contester
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-surface">
          Un score calculé, une décision humaine possible.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-on-forest">
          Le score est produit par un traitement automatisé. Conformément à
          l&apos;article 22 du RGPD, tout pet sitter concerné peut demander un
          réexamen par une personne, contester le résultat, exprimer son point
          de vue et obtenir une explication. Il suffit d&apos;écrire à{" "}
          <a
            href="mailto:contact@allopetsitter.fr"
            className="font-semibold text-surface underline"
          >
            contact@allopetsitter.fr
          </a>{" "}
          : un humain revoit le calcul, jamais une machine seule.
        </p>
      </section>

      <p className="mt-8 text-sm text-muted">
        Cette page fait partie de nos engagements de transparence, comme{" "}
        <Link
          href="/charte-qualite"
          className="font-semibold text-primary underline"
        >
          notre charte de qualité
        </Link>{" "}
        et{" "}
        <Link href="/nos-limites" className="font-semibold text-primary underline">
          ce que nous ne faisons pas
        </Link>
        .
      </p>
    </article>
  );
}
