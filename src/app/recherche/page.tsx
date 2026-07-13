import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "./SearchForm";
import {
  originFromPostalCode,
  communesWithinRadius,
} from "@/domains/geo/communes";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { searchSitters, priceLabel } from "@/domains/marketplace/sitters";
import { BRAND } from "@/lib/brand";
import type { ServiceType, Species } from "@prisma/client";

export const dynamic = "force-dynamic";

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
  // Vrais profils publiés dans la zone (P2) — [] tant qu'aucun sitter.
  const sitters = origin
    ? await searchSitters({
        lat: origin.lat,
        lng: origin.lng,
        radiusKm: rayon,
        service: service as ServiceType,
        species: species as Species,
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* En-tête — vocabulaire de mise en relation, aucun coût caché */}
      <div className="max-w-2xl">
        <p className="kicker">Recherche</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
          Trouvez la bonne personne pour garder votre animal
        </h1>
        <p className="mt-3 text-lg text-muted">
          Indiquez votre code postal : nous vous aidons à trouver un pet sitter
          disponible autour de vous. Vous ne réglez la mise en relation que si
          l&apos;un d&apos;eux accepte votre garde — aucun débit avant.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-forest-border bg-forest-tint px-4 py-1.5 text-sm font-semibold text-forest-text">
          <span aria-hidden>✓</span>
          Chaque pet sitter reçoit 100 % de ce que vous lui versez
        </p>
      </div>

      <div className="mt-7">
        <SearchForm
          defaults={{ cp, service, species, rayon: String(rayon) }}
        />
      </div>

      {hasQuery && !origin && (
        <div className="mt-8 rounded-[20px] border border-primary-border bg-primary-tint p-6">
          <p className="text-body">
            Code postal <strong className="font-mono">{cp}</strong> introuvable.
            Vérifiez la saisie et réessayez.
          </p>
        </div>
      )}

      {origin && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-bold sm:text-2xl">
              {serviceLabel(service)} · {speciesLabel(species)}
            </h2>
            <span className="kicker">
              Autour de {origin.commune.nom} ({cp})
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">
            Zone explorée : {zone.length} commune
            {zone.length > 1 ? "s" : ""} dans un rayon de {rayon} km.
          </p>

          {/* Résultats réels (profils publiés) */}
          {sitters.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {sitters.map((s) => (
                <Link
                  key={s.id}
                  href={`/petsitter/${s.id}`}
                  className="group rounded-[20px] border border-line bg-surface p-6 transition-colors hover:border-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink group-hover:text-primary-dark">
                        {s.displayName}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {s.communeName ?? "À proximité"} ·{" "}
                        <span className="font-mono">{s.distanceKm} km</span>
                      </p>
                    </div>
                    {s.rating !== null ? (
                      <span
                        className="shrink-0 rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-bold text-forest-text"
                        aria-label={`Note moyenne : ${s.rating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} sur 5`}
                      >
                        <span aria-hidden className="text-primary">
                          ★
                        </span>{" "}
                        {s.rating.toLocaleString("fr-FR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-primary-border bg-primary-tint px-3 py-1 text-xs font-bold text-primary-deep">
                        Nouveau sur {BRAND}
                      </span>
                    )}
                  </div>
                  {s.bio && (
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-body">
                      {s.bio}
                    </p>
                  )}
                  <div className="mt-4 flex items-baseline justify-between border-t border-line-2 pt-3">
                    <span className="font-mono text-lg font-bold text-ink">
                      {priceLabel(s.priceCents, s.priceUnit)}
                    </span>
                    <span className="font-mono text-xs font-bold text-success">
                      reçoit 100 %
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Aucun pet sitter publié dans la zone → état « zone en ouverture » :
              liste d'attente plutôt qu'un résultat vide (garde-fou
              anti-liquidité, PLAN §5). Aucun profil, avis ou score inventé. */}
          {sitters.length === 0 && (
          <div className="mt-6 overflow-hidden rounded-[20px] border border-line bg-surface">
            <div className="border-b border-line-2 bg-forest p-6 sm:p-8">
              <p className="kicker text-on-forest">Zone en cours d&apos;ouverture</p>
              <h3 className="mt-2 text-xl font-bold text-surface sm:text-2xl">
                Les inscriptions de pet sitters ouvrent bientôt près de chez vous
              </h3>
              <p className="mt-3 max-w-xl text-on-forest">
                Aucun pet sitter n&apos;est encore inscrit autour de{" "}
                {origin.commune.nom}. Dès qu&apos;un profil est disponible dans
                votre zone, vous pourrez lancer une demande — sans débit tant
                qu&apos;elle n&apos;est pas acceptée.
              </p>
              <Link
                href="/devenir-pet-sitter"
                className="mt-5 inline-flex rounded-[14px] bg-primary px-6 py-3 font-bold text-surface transition-colors hover:bg-primary-dark"
              >
                Vous gardez des animaux ? Rejoindre la liste d&apos;attente
              </Link>
            </div>

            {/* Aperçu de l'expérience à venir — emplacements neutres, sans
                identité ni note fictive (interdiction stricte des faux profils). */}
            <div className="p-6 sm:p-8">
              <p className="kicker mb-4">À quoi ressembleront les résultats</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="overflow-hidden rounded-[16px] border border-dashed border-line bg-cream/60"
                  >
                    <div className="h-28 bg-surface-2" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-2/3 rounded-full bg-surface-2" />
                      <div className="h-3 w-1/2 rounded-full bg-surface-2" />
                      <div className="mt-3 flex items-center justify-between border-t border-line-2 pt-3">
                        <div className="h-4 w-14 rounded-full bg-surface-2" />
                        <span className="font-mono text-xs font-bold text-forest-text">
                          reçoit 100 %
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-faint">
                Profil vérifié, tarif fixé librement par le pet sitter, et une
                rencontre préalable avant toute garde.
              </p>
            </div>
          </div>
          )}

          {zone.length > 0 && (
            <details className="mt-6 rounded-[16px] border border-line bg-surface p-5 text-sm text-muted">
              <summary className="cursor-pointer font-semibold text-body">
                Communes couvertes par cette recherche
              </summary>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {zone.slice(0, 60).map((c) => (
                  <li key={c.code} className="flex justify-between gap-2">
                    <span>{c.nom}</span>
                    <span className="font-mono text-xs text-faint">
                      {c.distanceKm} km
                    </span>
                  </li>
                ))}
              </ul>
              {zone.length > 60 && (
                <p className="mt-3 text-faint">… et {zone.length - 60} autres.</p>
              )}
            </details>
          )}
        </section>
      )}
    </div>
  );
}
