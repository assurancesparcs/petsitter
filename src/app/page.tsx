import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BRAND, BASELINE, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { BlocTransparence } from "@/components/BlocTransparence";
import { FaitsVerifiables } from "@/components/FaitsVerifiables";

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

const PREUVES = [
  "Identité vérifiée",
  "0 € tant qu'aucun pet sitter n'accepte",
  "Aucune reconduction tacite",
];

const STEPS = [
  {
    t: "Décrivez votre besoin",
    d: "Dates, animal, service. Votre carte est simplement enregistrée : aucun débit aujourd'hui — même pour une garde dans plusieurs mois.",
  },
  {
    t: "Un pet sitter accepte",
    d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous choisissez. C'est seulement là que le paiement a lieu.",
  },
  {
    t: "Vous vous organisez en direct",
    d: "Coordonnées complètes, messagerie, contrat de garde type et rencontre préalable gratuite. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
  },
];

const SERVICES = [
  {
    t: "Visite à domicile",
    d: "L'idéal pour les chats : votre animal reste chez lui, un pet sitter passe le voir, le nourrit et joue avec lui.",
    badge: "Idéal pour les chats",
  },
  {
    t: "Garde au domicile du propriétaire",
    d: "Un pet sitter s'installe chez vous pendant votre absence.",
  },
  {
    t: "Garde chez le pet sitter",
    d: "Votre animal est accueilli au domicile d'un pet sitter.",
  },
  {
    t: "Promenade",
    d: "Des sorties régulières pour votre chien, près de chez vous.",
  },
];

const ENGAGEMENTS = [
  "0 € débité tant qu'aucun pet sitter n'a accepté",
  "Identité vérifiée pour chaque pet sitter qui candidate",
  "Contrat de garde type fourni, entre vous et le pet sitter",
  "Aucune reconduction tacite : chaque Pass se paie une fois",
  "Aucun avis inventé, aucun compteur gonflé",
];

export default function Home() {
  const prix = Object.values(PRICING);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8">
      {/* Bandeau pré-ouverture — retiré au lancement (P6) */}
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 rounded-full border border-primary-border bg-primary-tint px-4 py-2 text-center text-sm text-body">
        Ouverture prochaine — pet sitters,{" "}
        <Link
          href="/devenir-pet-sitter"
          className="font-semibold text-primary underline underline-offset-2"
        >
          rejoignez la liste d&apos;attente
        </Link>
      </p>

      {/* ===== Héros — texte + photo (slot "home-hero" de la maquette) ===== */}
      <section className="grid items-center gap-10 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-forest-border bg-forest-tint px-4 py-1.5">
              <span className="font-mono text-sm font-bold text-forest-text">
                0 %
              </span>
              <span className="text-sm font-semibold text-forest-text">
                de commission sur la garde
              </span>
            </span>
            {/* Repère de confiance : société française (face aux plateformes
                multinationales) — factuel, sans dénigrement. */}
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5">
              <svg
                width="18"
                height="12"
                viewBox="0 0 18 12"
                aria-hidden
                className="rounded-[2px] ring-1 ring-black/10"
              >
                <rect width="6" height="12" fill="#0055A4" />
                <rect x="6" width="6" height="12" fill="#FFFFFF" />
                <rect x="12" width="6" height="12" fill="#EF4135" />
              </svg>
              <span className="text-sm font-semibold text-ink">
                Entreprise française
              </span>
            </span>
          </div>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.03] tracking-[-0.03em] sm:text-5xl lg:mx-0 xl:text-6xl">
            Trouvez un pet sitter de confiance pour votre chat ou votre chien
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-body sm:text-xl lg:mx-0">
            {BASELINE}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold text-ink lg:mx-0">
            Vous ne payez que si un pet sitter accepte votre garde. Aucun débit
            avant.
          </p>

          <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted lg:mx-0 lg:justify-start">
            {PREUVES.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <span className="font-bold text-success">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <Image
            src="/photos/hero.jpg"
            alt="Un chat au soleil sur le rebord d'une fenêtre fleurie, chez lui"
            width={1100}
            height={1650}
            priority
            className="h-[320px] w-full rounded-[24px] object-cover shadow-[var(--shadow-card)] sm:h-[420px] lg:h-[520px]"
          />
          <p className="absolute bottom-4 left-4 rounded-full bg-ink/70 px-4 py-1.5 text-xs font-semibold text-surface backdrop-blur">
            Chez lui, avec ses habitudes — c&apos;est toute l&apos;idée.
          </p>
        </div>
      </section>

      {/* ===== Recherche par code postal → /recherche ===== */}
      <form method="GET" action="/recherche" className="mx-auto mt-8 max-w-3xl">
        <div className="rounded-[20px] border border-line bg-surface p-4 shadow-[var(--shadow-search)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="cp" className="kicker mb-1.5 block text-left">
                Où ?
              </label>
              <input
                id="cp"
                name="cp"
                required
                pattern="[0-9]{5}"
                inputMode="numeric"
                placeholder="Votre code postal"
                aria-label="Votre code postal"
                className="w-full rounded-[12px] border border-line bg-cream px-4 py-3 text-base text-ink placeholder:text-faint focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-[14px] bg-primary px-6 py-3 font-bold text-surface hover:bg-primary-dark"
            >
              Voir les pet sitters
            </button>
          </div>
          <p className="mt-3 text-left text-xs text-muted">
            Nous vous aidons à trouver la bonne personne près de chez vous — vous
            choisissez, vous réglez en direct.
          </p>
        </div>
      </form>

      {/* ===== Bandeau 0 € (preuve débit) ===== */}
      <section className="mt-8">
        <div className="flex flex-col items-start gap-4 rounded-[20px] bg-ink p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
          <span className="font-mono text-4xl font-bold leading-none text-surface sm:text-5xl">
            0 €
          </span>
          <span className="text-base text-surface/75 sm:text-lg">
            débité aujourd&apos;hui. Empreinte carte seulement —{" "}
            <strong className="font-semibold text-surface">
              débit uniquement quand un pet sitter accepte.
            </strong>
          </span>
        </div>
      </section>

      {/* ===== En bref / Faits vérifiables (GEO/AEO) ===== */}
      <section className="mt-8">
        <FaitsVerifiables />
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="mt-16">
        <p className="kicker">Comment ça marche</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Trois étapes, aucun débit avant l&apos;acceptation
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
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

      {/* ===== Trio photos — slots "home-sitter-chat/chien/nac" de la maquette ===== */}
      <section className="mt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              src: "/photos/chat.jpg",
              alt: "Portrait d'un chat tigré aux yeux verts",
              label: "Chats",
              note: "Visites à domicile, sans stress",
            },
            {
              src: "/photos/chien.jpg",
              alt: "Chien joueur allongé dans l'herbe, la truffe en l'air",
              label: "Chiens",
              note: "Promenades et gardes",
            },
            {
              src: "/photos/nac.jpg",
              alt: "Lapin bélier au pelage fauve",
              label: "NAC",
              note: "Lapins, rongeurs, oiseaux…",
            },
          ].map((p) => (
            <figure
              key={p.label}
              className="group relative overflow-hidden rounded-[20px] border border-line bg-surface"
            >
              <Image
                src={p.src}
                alt={p.alt}
                width={900}
                height={1350}
                className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-64"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-2 bg-gradient-to-t from-ink/80 to-transparent px-5 pb-4 pt-10">
                <span className="font-display text-lg font-bold text-surface">
                  {p.label}
                </span>
                <span className="text-xs font-medium text-surface/85">
                  {p.note}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-3 text-center text-sm text-muted">
          Chats, chiens et NAC — à stricte égalité, c&apos;est notre parti pris.
        </p>
      </section>

      {/* ===== Services — visite à domicile en avant, chat à égalité ===== */}
      <section className="mt-16">
        <p className="kicker">Pour les chats comme pour les chiens</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Quatre services, à stricte égalité
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SERVICES.map((s) => (
            <div
              key={s.t}
              className={`rounded-[20px] border bg-surface p-6 ${
                s.badge ? "border-primary" : "border-line"
              }`}
            >
              {s.badge && (
                <span className="mb-3 inline-block rounded-full bg-primary-tint px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  {s.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-ink">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Prix affichés dès la home ===== */}
      <section className="mt-16">
        <p className="kicker">Tarifs de mise en relation — affichés, sans surprise</p>
        <h2 className="mt-2 max-w-3xl text-2xl font-bold sm:text-3xl">
          La garde revient à 100 % au pet sitter. Vous ne réglez que la mise en
          relation.
        </h2>
        <p className="mt-3 max-w-2xl text-body">
          Ce que vous payez à {BRAND}, c&apos;est la mise en relation — jamais
          une commission sur la garde. Le tarif de la garde est fixé librement
          par le pet sitter, qui le perçoit à 100 %, en direct.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {prix.map((p, i) => (
            <div
              key={p.label}
              className={`relative rounded-[20px] bg-surface p-6 ${
                i === 0 ? "border-2 border-primary" : "border border-line"
              }`}
            >
              {i === 0 && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary-tint px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary">
                  Pour une garde
                </span>
              )}
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-xl font-bold text-ink">{p.label}</h3>
                <span className="font-mono text-2xl font-bold text-ink">
                  {p.price}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs uppercase tracking-wider text-faint">
                {p.unit}
              </p>
              <p className="mt-3 text-sm text-muted">{p.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-muted">
          Débité uniquement à l&apos;acceptation d&apos;un pet sitter. Chaque
          Pass se paie une fois, aucune reconduction tacite —{" "}
          <Link
            href="/notre-modele"
            className="text-primary underline underline-offset-2 hover:text-primary-dark"
          >
            notre modèle expliqué ligne par ligne
          </Link>
          .
        </p>

        {/* Bloc Transparence — exemple concret de répartition */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-ink">Un exemple concret</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Pour une garde réglée 30 € au pet sitter, voici exactement où va
            votre argent.
          </p>
          <div className="mt-4">
            <BlocTransparence montant="30 €" />
          </div>
        </div>
      </section>

      {/* ===== Engagements vérifiables — fond forêt (confiance) ===== */}
      <section className="mt-16">
        <div className="rounded-[20px] bg-forest p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-surface sm:text-3xl">
            Nos engagements, vérifiables
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {ENGAGEMENTS.map((e) => (
              <li key={e} className="flex items-start gap-2.5 text-on-forest">
                <span className="mt-0.5 font-bold text-forest-tint">✓</span>
                <span>{e}</span>
              </li>
            ))}
            <li className="flex items-start gap-2.5 text-on-forest">
              <span className="mt-0.5 font-bold text-forest-tint">✓</span>
              <Link
                href="/nos-limites"
                className="text-surface underline underline-offset-2"
              >
                Nos limites, affichées aussi clairement que nos promesses
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* ===== CTA devenir pet sitter ===== */}
      <section className="my-16">
        <div className="rounded-[20px] border border-line bg-surface p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Vous gardez des animaux ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body">
            Inscription gratuite, 0 % de commission : vous fixez votre tarif et
            vous gardez 100 % de vos revenus.
          </p>
          <Link
            href="/devenir-pet-sitter"
            className="mt-6 inline-block rounded-[14px] bg-primary px-6 py-3 font-bold text-surface hover:bg-primary-dark"
          >
            Rejoindre la liste d&apos;attente
          </Link>
        </div>
      </section>
    </div>
  );
}
