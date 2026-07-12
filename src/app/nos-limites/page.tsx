import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Ce que nous ne faisons pas",
  description:
    "Les limites de la plateforme, affichées aussi clairement que ses promesses.",
};

export default function NosLimites() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Ce que {BRAND} ne fait pas</h1>
      <p className="mt-4 text-lg text-ink/80">
        Une promesse n&apos;est honnête que si ses limites sont écrites à côté,
        en caractères de la même taille. Les voici.
      </p>

      <dl className="mt-8 space-y-6">
        <div>
          <dt className="font-bold">Nous ne gardons pas les animaux.</dt>
          <dd className="mt-1 text-ink/80">
            {BRAND} est une plateforme de mise en relation. La garde est
            proposée, contractée et exécutée par le pet sitter, en toute
            indépendance, à son tarif, payé directement par vous. Le contrat de
            garde est conclu entre vous et lui — nous n&apos;y sommes pas
            partie.
          </dd>
        </div>
        <div>
          <dt className="font-bold">
            Nous ne garantissons pas qu&apos;un pet sitter sera disponible.
          </dt>
          <dd className="mt-1 text-ink/80">
            Si aucun pet sitter n&apos;accepte votre demande dans le délai
            indiqué, elle expire et vous n&apos;êtes tout simplement jamais
            débité. En cas d&apos;annulation d&apos;un pet sitter confirmé,
            nous lançons une recherche prioritaire de remplaçant — c&apos;est
            une obligation de moyens, pas une garantie de résultat.
          </dd>
        </div>
        <div>
          <dt className="font-bold">
            Nous ne remboursons pas sur simple déclaration.
          </dt>
          <dd className="mt-1 text-ink/80">
            Comme vous n&apos;êtes débité qu&apos;à l&apos;acceptation
            d&apos;un pet sitter, il n&apos;y a rien à rembourser si vous ne
            trouvez personne. Le seul remboursement prévu — l&apos;annulation
            par le pet sitter confirmé sans remplaçant — est déclenché
            automatiquement par nos soins, sans que vous ayez à le demander.
          </dd>
        </div>
        <div>
          <dt className="font-bold">
            Nous n&apos;affichons pas de statistiques que nous n&apos;avons
            pas.
          </dt>
          <dd className="mt-1 text-ink/80">
            Pas de faux avis, pas de compteurs gonflés, pas de « score » pour
            un pet sitter qui débute : il porte un badge « Nouveau sur{" "}
            {BRAND} » tant qu&apos;il n&apos;a pas assez de gardes déclarées
            pour qu&apos;un score veuille dire quelque chose.
          </dd>
        </div>
        <div>
          <dt className="font-bold">
            Nous ne vendons pas vos données, ni la visibilité.
          </dt>
          <dd className="mt-1 text-ink/80">
            Vos coordonnées ne sont jamais transmises à des tiers sans votre
            consentement explicite, et aucun pet sitter ne peut payer pour
            apparaître plus haut dans les résultats : le classement reste
            méritocratique.
          </dd>
        </div>
      </dl>

      <p className="mt-10 text-sm text-ink/60">
        Cette page évoluera avec le service ; chaque modification sera datée et
        archivée publiquement.
      </p>
    </article>
  );
}
