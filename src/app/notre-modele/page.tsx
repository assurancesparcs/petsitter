import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Notre modèle — comment nous gagnons notre argent",
  description:
    "0 % de commission sur la garde : le pet sitter touche 100 % de ce que vous lui versez. Voici, ligne par ligne, comment la plateforme se rémunère.",
  alternates: { canonical: `${BASE_URL}/notre-modele` },
};

// Convertit un libellé de prix FR (« 14,90 € », « 39 € ») en décimale schema.org
// (« 14.90 », « 39 »). Source unique = PRICING, aucun montant en dur.
function priceToDecimal(label: string): string {
  return label.replace(/[^\d,]/g, "").replace(",", ".");
}

// Offres (schema.org) — les 3 formules de MISE EN RELATION, regroupées sous le
// service. Prix réels tirés de PRICING. Ne décrit jamais la garde elle-même
// (fixée et perçue à 100 % par le pet sitter, hors périmètre de facturation).
const OFFERS_LD = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Mise en relation avec un pet sitter",
  serviceType: "Mise en relation",
  provider: { "@type": "Organization", name: BRAND, url: BASE_URL },
  areaServed: "FR",
  offers: Object.values(PRICING).map((p) => ({
    "@type": "Offer",
    name: p.label,
    description: p.detail,
    price: priceToDecimal(p.price),
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    url: `${BASE_URL}/notre-modele`,
  })),
};

export default function NotreModele() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <JsonLd data={OFFERS_LD} />
      {/* En-tête — page de marque, pas page légale */}
      <header className="max-w-2xl">
        <p className="kicker">Notre modèle · ligne par ligne</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-ink sm:text-5xl">
          Comment {BRAND} gagne son argent
        </h1>
        <p className="mt-4 text-lg text-body">
          La transparence n&apos;est pas un slogan ici, c&apos;est une page
          publique. Si vous ne comprenez pas comment nous gagnons notre vie,
          vous avez raison de vous méfier — alors voici toutes nos sources de
          revenus, sans détour. Il n&apos;y en a pas d&apos;autres.
        </p>
      </header>

      {/* Résumé chiffré — les trois lignes qui disent tout */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-forest-border bg-forest-tint p-6">
          <p className="font-mono text-4xl font-bold text-success">100 %</p>
          <p className="mt-4 font-semibold text-ink">
            La garde revient au pet sitter
          </p>
          <p className="mt-2 text-sm text-forest-text">
            Nous ne prélevons aucune commission dessus. Jamais.
          </p>
        </div>
        <div className="rounded-[20px] border border-primary bg-surface p-6">
          <p className="font-mono text-4xl font-bold text-primary-dark">39 €</p>
          <p className="mt-4 font-semibold text-ink">La mise en relation</p>
          <p className="mt-2 text-sm text-body">
            Notre seul revenu : un Pass ou l&apos;abonnement, prélevé au client,
            uniquement si un pet sitter accepte.
          </p>
        </div>
        <div className="rounded-[20px] border border-line bg-surface p-6">
          <p className="font-mono text-4xl font-bold text-faint">0 €</p>
          <p className="mt-4 font-semibold text-ink">Côté pet sitter</p>
          <p className="mt-2 text-sm text-body">
            Inscription et présence sur la plateforme gratuites, à vie.
          </p>
        </div>
      </section>

      {/* 1. Aucune commission sur la garde */}
      <section className="mt-14">
        <p className="kicker">01 · Ce que nous ne prenons jamais</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Une commission sur la garde
        </h2>
        <div className="mt-4 rounded-[20px] border border-line bg-surface p-6">
          <p className="text-body">
            Le pet sitter fixe librement son tarif et il est payé directement
            par vous. {BRAND} ne touche pas un centime sur ce montant, ne le
            majore pas, n&apos;y ajoute aucun « frais de service ». Sur chaque
            fiche de pet sitter, un bloc l&apos;affichera noir sur blanc :
          </p>
          {/* Bloc de transparence — l'objet le plus important de l'identité */}
          <div className="mt-5 grid gap-px overflow-hidden rounded-[14px] border border-forest-border bg-forest-border sm:grid-cols-3">
            <div className="bg-surface p-4 text-center">
              <p className="kicker">Vous versez</p>
              <p className="mt-1 font-mono text-2xl font-bold text-forest-text">
                X €
              </p>
            </div>
            <div className="bg-surface p-4 text-center">
              <p className="kicker">Le pet sitter reçoit</p>
              <p className="mt-1 font-mono text-2xl font-bold text-success">
                X €
              </p>
              <p className="font-mono text-xs font-bold text-success">100 %</p>
            </div>
            <div className="bg-surface p-4 text-center">
              <p className="kicker">Commission {BRAND}</p>
              <p className="mt-1 font-mono text-2xl font-bold text-forest-text">
                0 €
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Ce que couvre la mise en relation + grille PRICING */}
      <section className="mt-14">
        <p className="kicker">02 · Ce que vous nous payez</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          La mise en relation
        </h2>
        <p className="mt-4 max-w-2xl text-body">
          Vous ne payez que lorsqu&apos;un pet sitter a accepté votre garde —
          jamais avant. Ce que ce paiement couvre : la mise en relation avec un
          pet sitter qui a déjà dit oui, les avis vérifiés, un contrat de garde
          type entre vous et lui, une recherche prioritaire de remplaçant en cas
          d&apos;annulation, et le support.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.values(PRICING).map((p) => (
            <div
              key={p.label}
              className="rounded-[20px] border border-line bg-surface p-6"
            >
              <h3 className="font-semibold text-ink">{p.label}</h3>
              <p className="mt-2 font-mono text-3xl font-bold text-primary-dark">
                {p.price}
              </p>
              <p className="text-sm text-faint">{p.unit}</p>
              <p className="mt-3 text-sm text-body">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Sans engagement. Pas de reconduction piégeuse : rappel avant chaque
          prélèvement, pause possible, résiliation en 3 clics depuis la page{" "}
          <Link href="/resilier" className="font-semibold text-primary underline">
            Résilier
          </Link>
          .
        </p>
      </section>

      {/* 3. Et c'est tout — pour l'instant */}
      <section className="mt-14">
        <p className="kicker">03 · Et c&apos;est tout</p>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
          Pour l&apos;instant
        </h2>
        <div className="mt-4 rounded-[14px] border border-dashed border-line-faint bg-surface-2 p-6">
          <p className="text-body">
            D&apos;autres services optionnels pourront exister demain. Le jour où
            ils existeront, ils seront expliqués ici, sur cette page, avec leur
            prix et ce que {BRAND} y gagne — avant leur lancement, pas après.
            Cette page est datée et son historique de modifications sera public.
          </p>
        </div>
      </section>

      {/* Ce que nous nous interdisons — section sombre = bg-forest */}
      <section className="mt-14 rounded-[20px] bg-forest p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
          Nos engagements, aussi visibles que nos prix
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] text-surface">
          Ce que nous nous interdisons
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Débiter quoi que ce soit avant l'acceptation d'un pet sitter",
            "Un engagement minimum ou une reconduction tacite cachée",
            "Des frais découverts au moment de payer",
            "De faux avis, de faux compteurs, une fausse urgence",
            "Vendre ou transmettre vos coordonnées sans votre consentement explicite",
          ].map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-[14px] bg-surface/5 p-4 text-on-forest"
            >
              <span aria-hidden className="font-bold text-surface">
                ✕
              </span>
              <span className="text-sm leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-muted">
        Une promesse n&apos;est honnête que si ses limites sont écrites à côté.{" "}
        <Link href="/nos-limites" className="font-semibold text-primary underline">
          Voir ce que {BRAND} ne fait pas
        </Link>
        .
      </p>
    </article>
  );
}
