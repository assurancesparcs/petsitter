import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Qu'est-ce qu'un pet sitter ? Définition, services et prix",
  description:
    "Un pet sitter est une personne qui garde un animal de compagnie à la demande de son propriétaire. Définition claire, les 4 services (visite, garde, promenade), comment ça marche et combien ça coûte.",
  alternates: { canonical: `${BASE_URL}/qu-est-ce-qu-un-pet-sitter` },
};

// Définition auto-suffisante et citable (AEO) — reprise à l'identique en JSON-LD.
const DEFINITION = `Un pet sitter (ou « pet-sitter ») est une personne qui garde un animal de compagnie — chat, chien ou NAC (nouvel animal de compagnie) — à la demande de son propriétaire, pendant une absence courte ou longue. Selon le service choisi, il se rend au domicile du propriétaire pour des visites, s'installe chez lui, accueille l'animal chez lui, ou promène le chien. Le pet sitter est indépendant : il fixe librement son tarif et prend soin de l'animal en respectant ses habitudes.`;

// Les 4 services — chat = chien = NAC.
const SERVICES: { t: string; d: string }[] = [
  {
    t: "Visite à domicile",
    d: "Le pet sitter passe une ou plusieurs fois par jour chez le propriétaire : nourriture, eau, litière, jeu et surveillance. Idéal pour les chats, qui gardent leurs repères. Convient aussi aux NAC.",
  },
  {
    t: "Garde au domicile du propriétaire",
    d: "Le pet sitter s'installe chez le propriétaire pendant son absence. L'animal — chat, chien ou NAC — reste dans son environnement habituel, avec une présence continue.",
  },
  {
    t: "Garde chez le pet sitter",
    d: "L'animal est accueilli au domicile du pet sitter. Une rencontre préalable permet de vérifier que l'environnement convient à l'animal.",
  },
  {
    t: "Promenade",
    d: "Des sorties régulières pour le chien, près de chez lui, quand le propriétaire manque de temps ou est absent dans la journée.",
  },
];

// Comment ça marche — 3 étapes.
const ETAPES: { t: string; d: string }[] = [
  {
    t: "Vous décrivez votre besoin",
    d: "Dates, animal, service. Votre carte est simplement enregistrée : aucun débit tant qu'un pet sitter n'a pas accepté, même pour une garde prévue dans plusieurs mois.",
  },
  {
    t: "Un pet sitter accepte",
    d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous choisissez. C'est seulement à ce moment que le paiement de la mise en relation a lieu.",
  },
  {
    t: "Vous vous organisez en direct",
    d: "Coordonnées, messagerie, contrat de garde type et rencontre préalable gratuite. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Qu'est-ce qu'un pet sitter ?",
    a: DEFINITION,
  },
  {
    q: "Combien coûte un pet sitter ?",
    a: `Le tarif de la garde est fixé librement par chaque pet sitter, qui le perçoit à 100 % : il n'y a pas de prix imposé. Sur ${BRAND}, la plateforme facture uniquement la mise en relation — ${PRICING.passCourt.label} à ${PRICING.passCourt.price} (${PRICING.passCourt.detail.toLowerCase()}), ${PRICING.passSejour.label} à ${PRICING.passSejour.price} (${PRICING.passSejour.detail.toLowerCase()}), ou ${PRICING.passTrimestre.label} à ${PRICING.passTrimestre.price} payé ${PRICING.passTrimestre.unit} (${PRICING.passTrimestre.detail.toLowerCase()}) — sans jamais prélever de commission sur la garde.`,
  },
  {
    q: "Quelle différence entre un pet sitter et une pension ?",
    a: "Une pension est un établissement qui accueille plusieurs animaux dans un lieu dédié. Un pet sitter est une personne qui garde l'animal de façon individualisée, souvent au domicile du propriétaire (visite ou garde à domicile) ou chez lui. Pour de nombreux chats, animaux territoriaux, la visite à domicile est une alternative plus douce que la pension, car l'animal garde ses repères.",
  },
];

const ARTICLE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Qu'est-ce qu'un pet sitter ? Définition, services et prix",
  description: DEFINITION,
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
  mainEntityOfPage: `${BASE_URL}/qu-est-ce-qu-un-pet-sitter`,
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

export default function QuEstCeQuUnPetSitter() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <JsonLd data={ARTICLE_LD} />
      <JsonLd data={FAQ_LD} />

      {/* En-tête + définition citable */}
      <header className="max-w-2xl">
        <p className="kicker">Définition</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-ink sm:text-5xl">
          Qu&apos;est-ce qu&apos;un pet sitter ?
        </h1>
        <p className="mt-5 rounded-[16px] border border-forest-border bg-forest-tint p-5 text-lg leading-relaxed text-forest-text">
          {DEFINITION}
        </p>
      </header>

      {/* Les 4 services */}
      <section className="mt-14">
        <p className="kicker">Les services d&apos;un pet sitter</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Quatre services, à stricte égalité
        </h2>
        <p className="mt-3 max-w-2xl text-body">
          Chat, chien et NAC bénéficient des mêmes services et de la même
          attention. Chaque pet sitter indique les animaux qu&apos;il accueille
          et les services qu&apos;il propose.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <div
              key={s.t}
              className="rounded-[20px] border border-line bg-surface p-6"
            >
              <h3 className="text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mt-14">
        <p className="kicker">Comment ça marche</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Faire garder son animal en trois étapes
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {ETAPES.map((s, i) => (
            <div
              key={s.t}
              className="rounded-[20px] border border-line bg-surface p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary-tint font-mono text-lg font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ce qui distingue AlloPetsitter */}
      <section className="mt-14">
        <p className="kicker">Ce qui distingue {BRAND}</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          0 % de commission sur la garde
        </h2>
        <p className="mt-4 max-w-2xl text-body">
          Sur {BRAND}, le pet sitter touche 100 % du tarif qu&apos;il a fixé : la
          plateforme ne prélève aucune commission sur la garde. Elle se rémunère
          uniquement par un frais de mise en relation forfaitaire, affiché à
          l&apos;avance et prélevé seulement lorsqu&apos;un pet sitter a accepté.
          Le détail est public sur{" "}
          <Link
            href="/notre-modele"
            className="font-semibold text-primary underline"
          >
            notre modèle, expliqué ligne par ligne
          </Link>
          , et une comparaison des modèles figure sur la page{" "}
          <Link
            href="/comparatif"
            className="font-semibold text-primary underline"
          >
            comparatif
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
        Prêt à trouver un pet sitter près de chez vous ?{" "}
        <Link href="/recherche" className="font-semibold text-primary underline">
          Lancer une recherche
        </Link>
        .
      </p>
    </article>
  );
}
