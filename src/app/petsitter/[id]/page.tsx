import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSitterPublic, priceLabel } from "@/domains/marketplace/sitters";
import { serviceLabel, speciesLabel } from "@/domains/marketplace/catalog";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

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

      {/* Prochaine étape (P3 : dépôt de demande) */}
      <section className="mt-6 rounded-[20px] bg-forest p-7">
        <h2 className="text-xl font-bold text-surface">
          Intéressé par ce profil ?
        </h2>
        <p className="mt-2 max-w-xl text-on-forest">
          Le dépôt de demande ouvre très prochainement : vous décrirez votre
          besoin, {s.displayName} pourra accepter, et vous ne serez débité
          qu&apos;à ce moment-là. En attendant, préparez votre garde avec nos{" "}
          <Link href="/guides" className="font-semibold text-surface underline">
            guides
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
