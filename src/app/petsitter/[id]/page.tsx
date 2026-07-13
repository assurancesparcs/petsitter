import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSitterPublic, priceLabel } from "@/domains/marketplace/sitters";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { dateFrShort } from "@/domains/marketplace/availability";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

// Libellé court d'une date ISO pour la bande de disponibilité (ex. « lun. 14 »).
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
function dayChipLabel(iso: string): { dow: string; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { dow: JOURS[dow], day: d };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const s = await getSitterPublic((await params).id);
  if (!s) return {};
  return {
    title: `${s.displayName} — pet sitter à ${s.communeName ?? "proximité"}`,
    description: `Profil de ${s.displayName}, pet sitter${s.communeName ? ` autour de ${s.communeName}` : ""}. Tarifs libres, payés en direct — 0 % de commission.`,
  };
}

export default async function FicheSitter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await getSitterPublic((await params).id);
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* En-tête anonymisé : prénom + initiale, commune + rayon — jamais plus */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="kicker">Fiche pet sitter</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
            {s.displayName}
          </h1>
          <p className="mt-2 text-muted">
            {s.communeName ? `Autour de ${s.communeName}` : "France"} · rayon{" "}
            {s.radiusKm} km
          </p>
        </div>
        <span className="rounded-full border border-primary-border bg-primary-tint px-4 py-1.5 text-sm font-bold text-primary-deep">
          Nouveau sur {BRAND}
        </span>
      </div>
      <p className="mt-2 text-sm text-faint">
        Pas encore assez de gardes déclarées pour afficher un score — nous
        n&apos;affichons jamais un vide déguisé en chiffre. L&apos;identité
        complète et les coordonnées sont partagées après la mise en relation.
      </p>

      {/* Bio */}
      {s.bio && (
        <section className="mt-8 rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Présentation
          </h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-body">
            {s.bio}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {s.housingType && (
              <span className="rounded-full border border-line px-3 py-1 text-muted">
                {s.housingType}
              </span>
            )}
            {s.hasGarden && (
              <span className="rounded-full border border-line px-3 py-1 text-muted">
                Extérieur clôturé
              </span>
            )}
            {s.ownAnimals && (
              <span className="rounded-full border border-line px-3 py-1 text-muted">
                Ses animaux : {s.ownAnimals}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Bloc Transparence — le héros de la marque, sur chaque fiche */}
      <section className="mt-6 rounded-[20px] border border-forest-border bg-forest-tint p-6">
        <p className="kicker">Transparence</p>
        <div className="mt-3 grid gap-px overflow-hidden rounded-[14px] border border-forest-border bg-forest-border sm:grid-cols-3">
          <div className="bg-surface p-4 text-center">
            <p className="kicker">Vous versez</p>
            <p className="mt-1 font-mono text-xl font-bold text-forest-text">
              son tarif
            </p>
          </div>
          <div className="bg-surface p-4 text-center">
            <p className="kicker">{s.displayName} reçoit</p>
            <p className="mt-1 font-mono text-xl font-bold text-success">
              100 %
            </p>
          </div>
          <div className="bg-surface p-4 text-center">
            <p className="kicker">Commission {BRAND}</p>
            <p className="mt-1 font-mono text-xl font-bold text-forest-text">
              0 €
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-forest-text">
          Le tarif ci-dessous est fixé librement par {s.displayName}, payé
          directement — nous n&apos;y touchons pas.
        </p>
      </section>

      {/* Services & tarifs */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-bold text-ink">
          Services et tarifs
        </h2>
        <ul className="mt-4 divide-y divide-line-2">
          {s.services.map((sv) => (
            <li
              key={`${sv.service}_${sv.species}`}
              className="flex items-baseline justify-between gap-3 py-3"
            >
              <span className="text-body">
                {serviceLabel(sv.service)}{" "}
                <span className="text-faint">· {speciesLabel(sv.species)}</span>
              </span>
              <span className="font-mono font-bold text-ink">
                {priceLabel(sv.priceCents, sv.priceUnit)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Disponibilités — lecture seule, règle des 14 jours pour la fraîcheur */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-ink">
            Disponibilités
          </h2>
          {s.availability.stale ? (
            <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold text-muted">
              à confirmer
            </span>
          ) : (
            <span className="rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-semibold text-forest-text">
              à jour
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {s.availability.stale
            ? "Ce calendrier n'a pas été confirmé récemment : les jours ci-dessous sont indicatifs, à confirmer lors de la mise en relation."
            : `Sur les 14 prochains jours, ${s.displayName} indique ${s.availability.availableCount14} jour${
                s.availability.availableCount14 > 1 ? "s" : ""
              } disponible${s.availability.availableCount14 > 1 ? "s" : ""}.`}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {s.availability.next14.map((d) => {
            const { dow, day } = dayChipLabel(d.iso);
            return (
              <div
                key={d.iso}
                title={`${dow} ${day} — ${d.available ? "disponible" : "indisponible"}`}
                className={
                  "flex w-11 flex-col items-center rounded-[10px] border px-1 py-1.5 text-center " +
                  (d.available
                    ? "border-forest-border bg-forest-tint text-forest-text"
                    : "border-line-2 bg-surface-2 text-faint")
                }
              >
                <span className="text-[10px] font-medium">{dow}</span>
                <span className="text-sm font-bold">{day}</span>
              </div>
            );
          })}
        </div>

        {s.availability.calendarUpdated && (
          <p className="mt-3 text-xs text-faint">
            Calendrier mis à jour le {dateFrShort(s.availability.calendarUpdated)}.
          </p>
        )}
      </section>

      {/* Avis vérifiés — conformité Code conso. L111-7-2 / D111-16 */}
      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">
            Avis vérifiés
          </h2>
          <span className="kicker">
            {s.reviewCount} avis vérifié{s.reviewCount > 1 ? "s" : ""}
          </span>
        </div>

        {s.reviews.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Pas encore d&apos;avis. Les avis n&apos;apparaissent qu&apos;après
            une garde réellement réglée via {BRAND} — nous n&apos;en inventons
            aucun.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Affichés du plus récent au plus ancien.
            </p>
            <ul className="mt-4 space-y-4">
              {s.reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-[16px] border border-line-2 bg-cream p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="text-primary"
                      aria-label={`Note : ${r.rating} sur 5`}
                      title={`${r.rating} / 5`}
                    >
                      <span aria-hidden className="font-bold tracking-[0.1em]">
                        {/* Bornage défensif : la note est déjà validée 1–5 à
                            l'écriture, mais on ne laisse jamais repeat() lever. */}
                        {"★".repeat(Math.max(0, Math.min(5, r.rating)))}
                        <span className="text-faint">
                          {"★".repeat(Math.max(0, Math.min(5, 5 - r.rating)))}
                        </span>
                      </span>
                    </span>
                    <span className="rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-bold text-forest-text">
                      ✓ Avis vérifié
                    </span>
                  </div>
                  {r.body && (
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-body">
                      {r.body}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-faint">
                    {r.authorName} · Expérience du{" "}
                    {dateFrShort(r.experienceDate)} · Publié le{" "}
                    {dateFrShort(r.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-4 border-t border-line-2 pt-4 text-xs leading-relaxed text-faint">
          Chaque avis est adossé à une garde réellement réglée via {BRAND} (avis
          vérifié). Les avis sont affichés du plus récent au plus ancien. Un avis
          négatif n&apos;est jamais retiré : seule une modération motivée est
          possible. Le pet sitter peut signaler un avis qui lui paraît douteux —
          il est alors revu par un humain, jamais supprimé automatiquement.
        </p>
      </section>

      {/* Dépôt de demande — diffusée aux sitters compatibles de la zone */}
      <section className="mt-6 rounded-[20px] bg-forest p-7">
        <h2 className="text-xl font-bold text-surface">
          Intéressé par ce profil ?
        </h2>
        <p className="mt-2 max-w-xl text-on-forest">
          Déposez votre demande de garde : {s.displayName} et les pet sitters
          compatibles de la zone pourront l&apos;accepter à leur tarif — et
          vous ne serez débité qu&apos;au moment où vous choisirez. 0 €
          aujourd&apos;hui.
        </p>
        <Link
          href="/demande"
          className="mt-5 inline-flex rounded-[14px] bg-primary px-6 py-3 font-bold text-surface transition-colors hover:bg-primary-dark"
        >
          Déposer ma demande — 0 € aujourd&apos;hui
        </Link>
      </section>
    </div>
  );
}
