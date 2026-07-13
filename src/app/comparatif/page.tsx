import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Commission ou frais fixe : comparer les modèles de pet sitting",
  description:
    "AlloPetsitter ne prélève aucune commission sur la garde : le pet sitter touche 100 %, la plateforme se rémunère par un frais de mise en relation fixe. Comparaison honnête avec le modèle à commission classique.",
  alternates: { canonical: `${BASE_URL}/comparatif` },
};

// Phrase-réponse citable (AEO/GEO) — reprise à l'identique dans le JSON-LD.
const REPONSE_COURTE = `${BRAND} ne prélève aucune commission sur la garde : le pet sitter touche 100 %, et la plateforme se rémunère par un frais de mise en relation fixe.`;

// Lignes du tableau comparatif. Le « modèle à commission classique » est décrit
// de façon générique et loyale (typique/courant), jamais rattaché à une
// plateforme nommée ni à un taux présenté comme un fait vérifié.
type Ligne = { critere: string; nous: string; classique: string };
const LIGNES: Ligne[] = [
  {
    critere: "Commission sur la garde",
    nous: "0 % — aucune commission prélevée sur le tarif de garde",
    classique:
      "Une commission, souvent de l'ordre de 15 à 30 %, prélevée sur la garde (montant typique, variable selon la plateforme)",
  },
  {
    critere: "Qui touche le tarif de garde",
    nous: "Le pet sitter perçoit 100 % du tarif qu'il a fixé, en direct",
    classique:
      "Le pet sitter perçoit le tarif de garde diminué de la commission de la plateforme",
  },
  {
    critere: "Quand vous payez",
    nous: "Uniquement quand un pet sitter a accepté votre garde — 0 € avant",
    classique:
      "Souvent au moment de la réservation, avant même la confirmation d'un séjour",
  },
  {
    critere: "Frais affichés à l'avance",
    nous: "Frais de mise en relation forfaitaire, affiché avant tout paiement",
    classique:
      "Des frais de service peuvent s'ajouter au moment de payer, parfois découverts tardivement",
  },
  {
    critere: "Faux avis / score gonflé",
    nous: "Avis adossés à une garde réellement réglée, aucun faux avis ni compteur gonflé",
    classique:
      "Variable selon la plateforme ; les modalités de vérification ne sont pas toujours publiques",
  },
  {
    critere: "Canal de support",
    nous: "100 % en ligne et par écrit, réponse humaine sous 24 h",
    classique: "Variable selon la plateforme (écrit et/ou téléphone)",
  },
];

// FAQ (schema.org FAQPage) — texte neutre, factuel, citable.
const FAQ: { q: string; a: string }[] = [
  {
    q: `${BRAND} prend-il une commission ?`,
    a: `Non. ${BRAND} ne prélève aucune commission sur la garde. Le pet sitter fixe librement son tarif et le touche à 100 %. La plateforme se rémunère uniquement par un frais de mise en relation forfaitaire, affiché à l'avance et prélevé au propriétaire seulement lorsqu'un pet sitter a accepté la garde.`,
  },
  {
    q: "Qu'est-ce qu'un modèle à commission classique ?",
    a: "Dans un modèle à commission courant, la plateforme prélève un pourcentage sur le tarif de garde — souvent de l'ordre de 15 à 30 % selon la plateforme. Le pet sitter perçoit alors le tarif diminué de cette commission. Ce pourcentage varie d'une plateforme à l'autre et n'est pas toujours affiché clairement.",
  },
  {
    q: `Combien coûte ${BRAND} au propriétaire ?`,
    a: `${BRAND} facture uniquement la mise en relation : ${PRICING.passCourt.label} à ${PRICING.passCourt.price} (${PRICING.passCourt.detail.toLowerCase()}), ${PRICING.passSejour.label} à ${PRICING.passSejour.price} (${PRICING.passSejour.detail.toLowerCase()}), ou l'${PRICING.abonnement.label.toLowerCase()} à ${PRICING.abonnement.price} (${PRICING.abonnement.unit}). Le tarif de la garde, lui, revient en entier au pet sitter.`,
  },
  {
    q: "Quand suis-je débité ?",
    a: `Jamais au dépôt de votre demande : votre carte est simplement enregistrée. Le débit n'intervient qu'au moment où un pet sitter accepte votre garde. Tant que personne n'a accepté, vous n'êtes pas débité.`,
  },
];

const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Commission ou frais fixe : comparer les modèles de pet sitting",
  description: REPONSE_COURTE,
  datePublished: "2026-07-13",
  dateModified: "2026-07-13",
  image: `${BASE_URL}/opengraph-image`,
  inLanguage: "fr-FR",
  author: { "@type": "Organization", name: BRAND },
  publisher: {
    "@type": "Organization",
    name: BRAND,
    logo: { "@type": "ImageObject", url: `${BASE_URL}/icon.svg` },
  },
  mainEntityOfPage: `${BASE_URL}/comparatif`,
};

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "fr-FR",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Comparatif() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <JsonLd data={ARTICLE_LD} />
      <JsonLd data={FAQ_LD} />

      {/* En-tête + réponse courte citable */}
      <header className="max-w-2xl">
        <p className="kicker">Comparatif · les modèles</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-ink sm:text-5xl">
          0 % de commission ou frais fixe : comparer les modèles
        </h1>
        <p className="mt-5 rounded-[16px] border border-forest-border bg-forest-tint p-5 text-lg font-semibold leading-relaxed text-forest-text">
          {REPONSE_COURTE}
        </p>
        <p className="mt-4 text-body">
          Il existe deux grandes façons de faire payer une plateforme de pet
          sitting. Nous comparons ici les <strong>modèles</strong>, sans citer de
          concurrent ni avancer de chiffre invérifiable. L&apos;objectif est que
          vous compreniez où va votre argent, pas de dénigrer qui que ce soit.
        </p>
      </header>

      {/* Tableau comparatif — donnée extractible */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          {BRAND} face au modèle à commission classique
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Comparaison entre le modèle sans commission d&apos;{BRAND} et un
              modèle à commission classique du pet sitting
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th
                  scope="col"
                  className="p-4 align-bottom font-display text-base font-bold text-ink"
                >
                  Critère
                </th>
                <th
                  scope="col"
                  className="rounded-t-[12px] bg-forest-tint p-4 align-bottom font-display text-base font-bold text-forest-text"
                >
                  {BRAND}
                </th>
                <th
                  scope="col"
                  className="p-4 align-bottom font-display text-base font-bold text-body"
                >
                  Modèle à commission classique
                </th>
              </tr>
            </thead>
            <tbody>
              {LIGNES.map((l) => (
                <tr key={l.critere} className="border-b border-line align-top">
                  <th
                    scope="row"
                    className="p-4 font-semibold text-ink"
                  >
                    {l.critere}
                  </th>
                  <td className="bg-forest-tint/50 p-4 leading-relaxed text-forest-text">
                    {l.nous}
                  </td>
                  <td className="p-4 leading-relaxed text-body">{l.classique}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          La colonne « modèle à commission classique » décrit une pratique{" "}
          <em>typique et courante</em> du secteur, à titre pédagogique : elle ne
          vise aucune plateforme nommée et ne présente aucun taux comme un fait
          vérifié. Les taux réels varient d&apos;une plateforme à l&apos;autre.
        </p>
      </section>

      {/* Ce que ça change concrètement */}
      <section className="mt-14">
        <p className="kicker">Ce que ça change pour vous</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Où va votre argent, ligne par ligne
        </h2>
        <p className="mt-4 max-w-2xl text-body">
          Avec un frais de mise en relation forfaitaire, ce que vous payez à{" "}
          {BRAND} ne dépend pas du montant de la garde : le pet sitter touche
          l&apos;intégralité de son tarif, et vous savez à l&apos;avance ce que
          coûte la plateforme. Le détail est public sur{" "}
          <Link
            href="/notre-modele"
            className="font-semibold text-primary underline"
          >
            notre modèle, expliqué ligne par ligne
          </Link>
          .
        </p>
      </section>

      {/* FAQ visible (miroir du FAQPage) */}
      <section className="mt-14">
        <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Questions fréquentes
        </h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group rounded-[16px] border border-line bg-surface px-5 open:border-primary"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <span
                  aria-hidden
                  className="shrink-0 font-mono text-lg text-primary transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="pb-5 text-[15px] leading-relaxed text-body">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-muted">
        Une comparaison n&apos;est honnête que si ses limites sont écrites à
        côté.{" "}
        <Link href="/nos-limites" className="font-semibold text-primary underline">
          Voir ce que {BRAND} ne fait pas
        </Link>
        .
      </p>
    </article>
  );
}
