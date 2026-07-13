import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Questions fréquentes (FAQ)",
  description:
    "Comment ça marche, paiement, sécurité, avis, annulation et remboursement, résiliation, support écrit : les réponses claires aux questions les plus courantes sur AlloPetsitter.",
  alternates: { canonical: `${BASE_URL}/faq` },
};

type QA = { q: string; a: React.ReactNode };
type Categorie = { titre: string; kicker: string; items: QA[] };

const CATEGORIES: Categorie[] = [
  {
    kicker: "01",
    titre: "Comment ça marche",
    items: [
      {
        q: "Que fait exactement AlloPetsitter ?",
        a: (
          <>
            {BRAND} est une plateforme de mise en relation entre propriétaires
            d&apos;animaux et pet sitters indépendants. Nous ne gardons pas les
            animaux : la garde est proposée et exécutée par le pet sitter, en
            toute indépendance. Nous vous aidons à trouver la bonne personne.
          </>
        ),
      },
      {
        q: "Quelles sont les étapes pour faire garder mon animal ?",
        a: (
          <>
            Vous décrivez votre besoin (dates, animal, service) ; les pet
            sitters disponibles près de chez vous candidatent avec leur tarif ;
            vous choisissez. Une rencontre préalable gratuite est prévue avant la
            garde, puis vous vous organisez en direct avec un contrat de garde
            type entre vous et le pet sitter.
          </>
        ),
      },
      {
        q: "Puis-je faire garder un chat, un chien ou un NAC ?",
        a: (
          <>
            Oui, à égalité. Chat, chien et NAC (nouveaux animaux de compagnie)
            bénéficient de la même vérification d&apos;identité, des mêmes avis
            vérifiés et de la même rencontre préalable. Chaque pet sitter indique
            les animaux qu&apos;il accueille.
          </>
        ),
      },
    ],
  },
  {
    kicker: "02",
    titre: "Paiement",
    items: [
      {
        q: "Quand suis-je débité ?",
        a: (
          <>
            Jamais au dépôt de votre demande. Votre carte est simplement
            enregistrée : <strong>0 € tant qu&apos;aucun pet sitter n&apos;a
            accepté</strong>, même pour une garde prévue dans plusieurs mois. Le
            débit n&apos;intervient qu&apos;au moment où un pet sitter accepte
            votre garde.
          </>
        ),
      },
      {
        q: "Combien coûte la mise en relation ?",
        a: (
          <>
            {PRICING.passCourt.label} à {PRICING.passCourt.price} (
            {PRICING.passCourt.detail.toLowerCase()}),{" "}
            {PRICING.passSejour.label} à {PRICING.passSejour.price} (
            {PRICING.passSejour.detail.toLowerCase()}), ou l&apos;
            {PRICING.abonnement.label.toLowerCase()} à{" "}
            {PRICING.abonnement.price} {PRICING.abonnement.unit}. Le Pass est
            déduit automatiquement de la durée de la garde, il ne se choisit pas.
          </>
        ),
      },
      {
        q: "Le pet sitter touche-t-il une part de ce que je paie ?",
        a: (
          <>
            Le tarif de garde fixé par le pet sitter lui revient à 100 %, sans
            aucune commission. Le prix de la mise en relation (Pass ou
            abonnement) est notre seul revenu et ne réduit pas ce que touche le
            pet sitter. Voir{" "}
            <Link
              href="/notre-modele"
              className="font-semibold text-primary underline"
            >
              comment nous gagnons notre argent
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    kicker: "03",
    titre: "Sécurité & vérification d'identité",
    items: [
      {
        q: "L'identité des pet sitters est-elle vérifiée ?",
        a: (
          <>
            Oui. Chaque pet sitter dépose une pièce d&apos;identité et un selfie,
            examinés avant qu&apos;il ne devienne visible et reçoive des
            demandes. Au lancement, ce contrôle est réalisé en interne par une
            personne ; un prestataire de vérification d&apos;identité européen
            prendra le relais ensuite.
          </>
        ),
      },
      {
        q: "Que deviennent les documents d'identité déposés ?",
        a: (
          <>
            Ils sont conservés en accès strictement privé et{" "}
            <strong>supprimés dès la fin de l&apos;examen</strong> (validé ou
            refusé) : seuls le statut « identité vérifiée » et la date de
            décision sont conservés, jamais les images. C&apos;est le principe de
            minimisation des données.
          </>
        ),
      },
      {
        q: "La rencontre préalable est-elle obligatoire ?",
        a: (
          <>
            Elle est gratuite et vivement recommandée : elle permet à votre
            animal et au pet sitter de faire connaissance et de lever les
            derniers doutes avant la garde. C&apos;est souvent le meilleur
            réducteur d&apos;anxiété, pour vous comme pour votre animal.
          </>
        ),
      },
    ],
  },
  {
    kicker: "04",
    titre: "Avis & score de fiabilité",
    items: [
      {
        q: "Les avis sont-ils authentiques ?",
        a: (
          <>
            Un avis ne compte que s&apos;il est adossé à une garde réellement
            réglée via la plateforme. Pas de faux avis, pas de compteur gonflé.
            Un avis négatif compte toujours ; seuls les avis retirés par une
            modération motivée sont exclus.
          </>
        ),
      },
      {
        q: "Comment le score de fiabilité est-il calculé ?",
        a: (
          <>
            Automatiquement, à partir de gardes réellement réalisées et
            d&apos;avis vérifiés — rien n&apos;est saisi à la main ni gonflé.
            Tant qu&apos;un pet sitter n&apos;a pas assez de gardes déclarées, il
            porte le badge « Nouveau » plutôt qu&apos;un score qui ne voudrait
            rien dire. Détail complet sur{" "}
            <Link
              href="/transparence-score"
              className="font-semibold text-primary underline"
            >
              la page du score
            </Link>
            .
          </>
        ),
      },
    ],
  },
  {
    kicker: "05",
    titre: "Annulation & remboursement",
    items: [
      {
        q: "Que se passe-t-il si aucun pet sitter n'accepte ?",
        a: (
          <>
            Votre demande expire au terme du délai indiqué et vous n&apos;êtes
            tout simplement jamais débité. Comme rien n&apos;a été prélevé, il
            n&apos;y a rien à rembourser.
          </>
        ),
      },
      {
        q: "Et si un pet sitter confirmé annule ?",
        a: (
          <>
            Une recherche prioritaire de remplaçant est lancée — c&apos;est une
            obligation de moyens, pas une garantie de résultat. Si personne ne
            prend le relais, vous êtes remboursé automatiquement, sans avoir à le
            demander.
          </>
        ),
      },
    ],
  },
  {
    kicker: "06",
    titre: "Résiliation & support",
    items: [
      {
        q: "Comment résilier mon abonnement ?",
        a: (
          <>
            En 3 clics, depuis la page{" "}
            <Link
              href="/resilier"
              className="font-semibold text-primary underline"
            >
              Résilier
            </Link>
            . L&apos;abonnement est sans engagement, avec un rappel avant chaque
            prélèvement : la résiliation n&apos;est jamais plus longue que
            l&apos;inscription.
          </>
        ),
      },
      {
        q: "Comment vous contacter ?",
        a: (
          <>
            Le support est <strong>100 % en ligne, par écrit</strong> :
            assistant en ligne et réponse humaine sous 24 h, à{" "}
            <a
              href="mailto:contact@allopetsitter.fr"
              className="font-semibold text-primary underline"
            >
              contact@allopetsitter.fr
            </a>
            . Nous n&apos;avons pas de ligne de contact vocale — tout se traite à
            l&apos;écrit, pour garder une trace claire de chaque échange.
          </>
        ),
      },
    ],
  },
];

export default function FAQ() {
  // Données structurées FAQPage (schema.org) — texte volontairement neutre pour
  // le référencement, sans reprendre le JSX.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "fr-FR",
    mainEntity: CATEGORIES.flatMap((c) =>
      c.items.map((it) => ({
        "@type": "Question",
        name: it.q,
      })),
    ),
  };

  return (
    <div className="bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <header className="max-w-2xl">
          <p className="kicker">Questions fréquentes</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">
            Vos questions, nos réponses claires.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            Le fonctionnement, le paiement, la sécurité, les avis, la résiliation
            et le support — sans détour. Si une réponse manque, écrivez-nous : on
            corrige ou on s&apos;explique.
          </p>
        </header>

        <div className="mt-10 space-y-10">
          {CATEGORIES.map((cat) => (
            <section key={cat.titre}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-bold text-success">
                  {cat.kicker}
                </span>
                <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-ink">
                  {cat.titre}
                </h2>
              </div>
              <div className="mt-4 space-y-3">
                {cat.items.map((it) => (
                  <details
                    key={it.q}
                    className="group rounded-[16px] border border-line bg-surface px-5 open:border-primary"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      <span>{it.q}</span>
                      <span
                        aria-hidden
                        className="shrink-0 font-mono text-lg text-primary transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="pb-5 text-[15px] leading-relaxed text-body">
                      {it.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Rappel transparence */}
        <div className="mt-12 rounded-[16px] border border-forest-border bg-forest-tint p-5 text-[15px] leading-relaxed text-forest-text">
          Rappel : vous ne payez que si un pet sitter accepte votre garde. 0 €
          tant que personne n&apos;a dit oui.
        </div>

        <p className="mt-8 text-sm text-muted">
          Vous êtes pet sitter ? Retrouvez les réponses qui vous concernent dans
          le{" "}
          <Link
            href="/centre-aide"
            className="font-semibold text-primary underline"
          >
            centre d&apos;aide
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
