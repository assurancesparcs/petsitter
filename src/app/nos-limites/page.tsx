import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, BASE_URL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Ce que nous ne faisons pas",
  description:
    "Les limites de la plateforme, affichées aussi clairement que ses promesses.",
  alternates: { canonical: `${BASE_URL}/nos-limites` },
};

const LIMITES = [
  {
    titre: "Nous ne gardons pas les animaux.",
    detail: (
      <>
        {BRAND} est une plateforme de mise en relation. La garde est proposée,
        contractée et exécutée par le pet sitter, en toute indépendance, à son
        tarif, payé directement par vous. Le contrat de garde est conclu entre
        vous et lui — nous n&apos;y sommes pas partie.
      </>
    ),
  },
  {
    titre: "Nous ne garantissons pas qu'un pet sitter sera disponible.",
    detail: (
      <>
        Si aucun pet sitter n&apos;accepte votre demande dans le délai indiqué,
        elle expire et vous n&apos;êtes tout simplement jamais débité. En cas
        d&apos;annulation d&apos;un pet sitter confirmé, nous lançons une
        recherche prioritaire de remplaçant — c&apos;est une obligation de
        moyens, pas une garantie de résultat.
      </>
    ),
  },
  {
    titre: "Nous ne remboursons pas sur simple déclaration.",
    detail: (
      <>
        Comme vous n&apos;êtes débité qu&apos;à l&apos;acceptation d&apos;un pet
        sitter, il n&apos;y a rien à rembourser si vous ne trouvez personne. Le
        seul remboursement prévu — l&apos;annulation par le pet sitter confirmé
        sans remplaçant — est déclenché automatiquement par nos soins, sans que
        vous ayez à le demander.
      </>
    ),
  },
  {
    titre: "Nous n'affichons pas de statistiques que nous n'avons pas.",
    detail: (
      <>
        Pas de faux avis, pas de compteurs gonflés, pas de « score » pour un pet
        sitter qui débute : il porte un badge « Nouveau sur {BRAND} » tant
        qu&apos;il n&apos;a pas assez de gardes déclarées pour qu&apos;un score
        veuille dire quelque chose.
      </>
    ),
  },
  {
    titre: "Nous ne vendons pas vos données, ni la visibilité.",
    detail: (
      <>
        Vos coordonnées ne sont jamais transmises à des tiers sans votre
        consentement explicite, et aucun pet sitter ne peut payer pour
        apparaître plus haut dans les résultats : le classement reste
        méritocratique.
      </>
    ),
  },
];

export default function NosLimites() {
  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      {/* En-tête sombre = bg-forest : les limites aussi visibles que les promesses */}
      <header className="rounded-[20px] bg-forest p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-on-forest">
          Nos limites, aussi visibles que nos promesses
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] text-surface sm:text-5xl">
          Ce que {BRAND} ne fait pas
        </h1>
        <p className="mt-4 max-w-2xl text-on-forest">
          Une promesse n&apos;est honnête que si ses limites sont écrites à côté,
          en caractères de la même taille. Dire ce qu&apos;on ne fait pas,
          c&apos;est encore de la transparence. Les voici, noir sur blanc.
        </p>
      </header>

      {/* Les limites, une par carte */}
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {LIMITES.map((l) => (
          <div
            key={l.titre}
            className="flex gap-4 rounded-[20px] border border-line bg-surface p-6"
          >
            <span
              aria-hidden
              className="flex-shrink-0 text-xl font-bold leading-none text-primary"
            >
              ✕
            </span>
            <div>
              <dt className="font-display text-lg font-bold tracking-[-0.01em] text-ink">
                {l.titre}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-body">
                {l.detail}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <p className="mt-8 text-sm text-muted">
        Ces limites sont un choix assumé, pas un oubli. Cette page évoluera avec
        le service ; chaque modification sera datée et archivée publiquement.{" "}
        <Link
          href="/notre-modele"
          className="font-semibold text-primary underline"
        >
          Voir comment nous gagnons notre argent
        </Link>
        .
      </p>
    </article>
  );
}
