import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "./SearchForm";
import {
  originFromPostalCode,
  communesWithinRadius,
} from "@/domains/geo/communes";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";

export const metadata: Metadata = {
  title: "Rechercher un pet sitter",
  description:
    "Trouvez un pet sitter près de chez vous : visite à domicile, promenade, garde. Pour votre chat comme pour votre chien.",
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Recherche({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const cp = one(sp.cp)?.trim() ?? "";
  const service = one(sp.service) ?? "HOME_VISIT";
  const species = one(sp.species) ?? "CAT";
  const rayon = Math.min(Math.max(parseInt(one(sp.rayon) ?? "15", 10) || 15, 1), 100);

  const hasQuery = /^\d{5}$/.test(cp);
  const origin = hasQuery ? originFromPostalCode(cp) : null;
  const zone = origin
    ? communesWithinRadius(origin.lat, origin.lng, rayon)
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Trouver un pet sitter</h1>
      <p className="mt-2 text-ink/70">
        Indiquez votre code postal : nous cherchons les pet sitters disponibles
        autour de vous. Vous ne payez que si l&apos;un d&apos;eux accepte votre
        garde.
      </p>

      <div className="mt-6">
        <SearchForm
          defaults={{ cp, service, species, rayon: String(rayon) }}
        />
      </div>

      {hasQuery && !origin && (
        <p className="mt-8 rounded-2xl border border-line bg-white p-6 text-ink/80">
          Code postal <strong>{cp}</strong> introuvable. Vérifiez la saisie.
        </p>
      )}

      {origin && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">
            {serviceLabel(service)} · {speciesLabel(species)} — autour de{" "}
            {origin.commune.nom} ({cp})
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Zone de recherche : {zone.length} commune
            {zone.length > 1 ? "s" : ""} dans un rayon de {rayon} km.
          </p>

          {/* Aucun pet sitter inscrit tant que les inscriptions ne sont pas
              ouvertes (P2) → état « zone en ouverture » : on propose l'alerte
              plutôt qu'un résultat vide (garde-fou anti-liquidité, PLAN §5). */}
          <div className="mt-6 rounded-2xl border border-line bg-accent-soft p-6">
            <h3 className="font-semibold">
              Les inscriptions de pet sitters ouvrent bientôt près de chez vous
            </h3>
            <p className="mt-2 text-sm text-ink/80">
              Aucun pet sitter n&apos;est encore inscrit dans cette zone. Laissez
              votre e-mail : vous serez prévenu dès qu&apos;un pet sitter est
              disponible autour de {origin.commune.nom}.
            </p>
            <Link
              href="/devenir-pet-sitter"
              className="mt-4 inline-block text-sm font-semibold text-primary underline"
            >
              Vous êtes pet sitter ? Rejoignez la liste d&apos;attente →
            </Link>
          </div>

          {zone.length > 0 && (
            <details className="mt-6 text-sm text-ink/70">
              <summary className="cursor-pointer font-medium">
                Communes couvertes par cette recherche
              </summary>
              <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                {zone.slice(0, 60).map((c) => (
                  <li key={c.code}>
                    {c.nom} — {c.distanceKm} km
                  </li>
                ))}
              </ul>
              {zone.length > 60 && (
                <p className="mt-2 text-ink/50">
                  … et {zone.length - 60} autres.
                </p>
              )}
            </details>
          )}
        </section>
      )}
    </div>
  );
}
