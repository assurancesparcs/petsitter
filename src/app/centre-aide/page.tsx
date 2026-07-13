import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Centre d'aide — pet sitters",
  description:
    "Devenir pet sitter, profil et vérification d'identité, tarifs à 100 %, disponibilités, avis : le centre d'aide pour les pet sitters d'AlloPetsitter. Support écrit, réponse humaine sous 24 h.",
  alternates: { canonical: `${BASE_URL}/centre-aide` },
};

type Bloc = { q: string; a: React.ReactNode };
type Rubrique = { kicker: string; titre: string; intro: string; items: Bloc[] };

const RUBRIQUES: Rubrique[] = [
  {
    kicker: "01",
    titre: "Devenir pet sitter",
    intro:
      "L'inscription est gratuite et le restera. Vous fixez vos tarifs et vous gardez 100 % de vos revenus.",
    items: [
      {
        q: "Comment commencer ?",
        a: (
          <>
            Rejoignez la liste d&apos;attente depuis la page{" "}
            <Link
              href="/devenir-pet-sitter"
              className="font-semibold text-primary underline"
            >
              Devenir pet sitter
            </Link>
            . Nous ouvrons secteur par secteur et vous prévenons dès
            l&apos;ouverture près de chez vous.
          </>
        ),
      },
      {
        q: "L'inscription est-elle payante ?",
        a: (
          <>
            Non. L&apos;inscription et la présence sur la plateforme sont
            gratuites, à vie. Côté pet sitter, {BRAND} ne prélève aucune
            commission et ne facture aucun abonnement.
          </>
        ),
      },
    ],
  },
  {
    kicker: "02",
    titre: "Profil & vérification d'identité",
    intro:
      "Un profil vérifié inspire confiance. La vérification protège aussi bien les propriétaires que vous.",
    items: [
      {
        q: "Que dois-je fournir pour être vérifié ?",
        a: (
          <>
            Une pièce d&apos;identité et un selfie, déposés volontairement. Ils
            sont examinés avant que votre profil ne devienne visible et reçoive
            des demandes. Au lancement, cet examen est réalisé en interne par une
            personne ; un prestataire de vérification d&apos;identité européen
            prendra le relais ensuite.
          </>
        ),
      },
      {
        q: "Mes documents sont-ils conservés ?",
        a: (
          <>
            Non. Vos fichiers sont stockés en accès strictement privé et
            supprimés dès la décision (validé ou refusé) : seuls le statut et la
            date sont conservés, jamais les images.
          </>
        ),
      },
      {
        q: "Que dois-je mettre sur mon profil ?",
        a: (
          <>
            Une photo réelle, les animaux que vous accueillez (chat, chien, NAC),
            votre cadre de vie et les services proposés. Un profil sincère et
            complet est le premier facteur de confiance.
          </>
        ),
      },
    ],
  },
  {
    kicker: "03",
    titre: "Tarifs & revenus à 100 %",
    intro:
      "Le prix que vous affichez est le prix que vous touchez, intégralement.",
    items: [
      {
        q: "Combien vais-je toucher ?",
        a: (
          <>
            100 % du tarif que vous fixez. {BRAND} ne prend aucune commission sur
            la garde. Le propriétaire règle séparément la mise en relation (
            {PRICING.passCourt.price}, {PRICING.passSejour.price} ou{" "}
            {PRICING.abonnement.price} {PRICING.abonnement.unit}), ce qui ne
            réduit jamais votre rémunération.
          </>
        ),
      },
      {
        q: "Quand suis-je payé ?",
        a: (
          <>
            Le client dépose une empreinte carte à la demande, débitée seulement
            lorsque vous acceptez la garde. Vous savez donc que le client
            s&apos;est engagé avant de vous positionner.
          </>
        ),
      },
    ],
  },
  {
    kicker: "04",
    titre: "Disponibilités & avis",
    intro:
      "Un calendrier à jour et des avis vérifiés font la différence dans les résultats.",
    items: [
      {
        q: "Comment gérer mes disponibilités ?",
        a: (
          <>
            Tenez votre calendrier à jour : une disponibilité fiable évite les
            mauvaises surprises et vous fait recevoir des demandes réellement
            pertinentes. N&apos;acceptez que les dates que vous pouvez couvrir en
            entier.
          </>
        ),
      },
      {
        q: "Comment fonctionnent les avis et le score ?",
        a: (
          <>
            Vos avis sont adossés à de vraies gardes réglées via la plateforme.
            Votre score de fiabilité se calcule automatiquement ; tant que vous
            débutez, vous portez le badge « Nouveau », assumé, plutôt qu&apos;un
            score qui ne voudrait rien dire. Vous pouvez demander un réexamen
            humain de tout calcul vous concernant (RGPD art. 22). Détail sur{" "}
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
];

export default function CentreAide() {
  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <header className="max-w-2xl">
          <p className="kicker">Centre d&apos;aide · pet sitters</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.02em] text-ink sm:text-4xl">
            Tout pour bien démarrer comme pet sitter.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            Inscription, profil, vérification d&apos;identité, tarifs à 100 %,
            disponibilités et avis : l&apos;essentiel pour être visible et
            recevoir des demandes en confiance.
          </p>
        </header>

        {/* Note support écrit */}
        <div className="mt-8 rounded-[16px] border border-forest-border bg-forest-tint p-5">
          <p className="font-semibold text-forest-text">
            Un support écrit, une réponse humaine sous 24 h.
          </p>
          <p className="mt-1 text-[15px] leading-relaxed text-forest-text">
            Notre assistance est 100 % en ligne : posez votre question à
            l&apos;assistant écrit ou à{" "}
            <a
              href="mailto:contact@allopetsitter.fr"
              className="font-semibold underline"
            >
              contact@allopetsitter.fr
            </a>
            , une personne vous répond sous 24 h. Tout se traite à l&apos;écrit,
            pour garder une trace claire de chaque échange.
          </p>
        </div>

        {/* Rubriques */}
        <div className="mt-10 space-y-10">
          {RUBRIQUES.map((r) => (
            <section key={r.titre}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-bold text-success">
                  {r.kicker}
                </span>
                <h2 className="font-display text-xl font-bold tracking-[-0.02em] text-ink">
                  {r.titre}
                </h2>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {r.intro}
              </p>
              <div className="mt-4 space-y-3">
                {r.items.map((it) => (
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

        {/* Renvois */}
        <div className="mt-12 flex flex-col gap-4 rounded-[20px] bg-forest p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl font-bold text-surface">
              Prêt à garder 100 % de vos revenus ?
            </p>
            <p className="mt-1 text-sm text-on-forest">
              Rejoignez la liste d&apos;attente — on ouvre secteur par secteur.
            </p>
          </div>
          <Link
            href="/devenir-pet-sitter"
            className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-surface px-6 py-3 font-bold text-primary-dark transition-colors hover:bg-cream"
          >
            Devenir pet sitter
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted">
          Vous êtes propriétaire d&apos;un animal ? Vos réponses sont dans la{" "}
          <Link href="/faq" className="font-semibold text-primary underline">
            FAQ
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
