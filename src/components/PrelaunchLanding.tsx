import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { OwnerWaitlistForm } from "@/components/OwnerWaitlistForm";

/**
 * Landing de pré-lancement (flag `prelaunch_live`, voir src/lib/flags.ts) —
 * mix validé par le fondateur : structure de la variante A (bandeau date,
 * héros sitter-first, « Pourquoi fondateur », « Comment ça se passera »,
 * transparence, bloc propriétaires, FAQ) + frise « Cinq mois pour bien faire
 * les choses » et citation de clôture de la variante B.
 *
 * Règles de copie (lint lexical) : la date est une information, jamais un
 * compte à rebours ; aucun compteur, aucun chiffre inventé ; les pet sitters
 * sont indépendants (jamais « nos » pet sitters).
 */

const HERO_PROOFS = [
  "Vous fixez vos prix",
  "Identité vérifiée avant le jour J",
  "Chat · chien · NAC",
];

const TIMELINE = [
  {
    emoji: "📣",
    when: "Août — Septembre",
    title: "Recrutement",
    desc: "Appel aux pet sitters fondateurs, secteur par secteur, partout en France.",
    now: true,
    goal: false,
  },
  {
    emoji: "🔍",
    when: "Octobre — Novembre",
    title: "Vérifications",
    desc: "Identité vérifiée, photo réelle, profil complet pour chaque pet sitter.",
    now: false,
    goal: false,
  },
  {
    emoji: "🤝",
    when: "Décembre",
    title: "Préparation",
    desc: "Derniers réglages : tarifs, disponibilités, rencontre préalable rodée.",
    now: false,
    goal: false,
  },
  {
    emoji: "★",
    when: "Janvier 2027",
    title: "Ouverture",
    desc: "Les propriétaires accèdent aux profils. Les gardes commencent.",
    now: false,
    goal: true,
  },
];

const ETAPES = [
  {
    t: "Vous vous inscrivez, gratuitement",
    d: "Quelques minutes suffisent : vos coordonnées, votre secteur, les animaux que vous accueillez. Aucun paiement, aucun engagement.",
  },
  {
    t: "On vérifie et on prépare votre profil",
    d: "Vérification d'identité, photo, description, tarifs : on avance à votre rythme d'ici l'ouverture. Vous restez indépendant — nous vous aidons à présenter votre offre, rien de plus.",
  },
  {
    t: "Janvier 2027 : vous êtes en ligne",
    d: "À l'ouverture, votre profil fondateur est visible des propriétaires de votre secteur. Vous recevez des demandes, vous acceptez celles qui vous conviennent, vous touchez 100 % de votre tarif.",
  },
];

const FAQ = [
  {
    q: "Combien coûte l'inscription en tant que pet sitter ?",
    a: "Rien. L'inscription est gratuite aujourd'hui et le restera après l'ouverture. La commission sur vos gardes est de 0 % — à vie. C'est le propriétaire qui règle la mise en relation, jamais vous.",
  },
  {
    q: "À quoi je m'engage en m'inscrivant maintenant ?",
    a: "À rien. Vous préparez votre profil à votre rythme, vous pouvez le modifier ou le retirer à tout moment. À l'ouverture, vous acceptez uniquement les demandes qui vous conviennent — vous restez un prestataire indépendant.",
  },
  {
    q: "Pourquoi ouvrir seulement en janvier 2027 ?",
    a: "Parce qu'un site de garde sans pet sitters ne sert à personne. On prend ces mois pour réunir et vérifier des profils partout en France, secteur par secteur, plutôt que d'ouvrir vide. L'ouverture se fera de façon progressive, zone par zone, dès que des pet sitters vérifiés sont prêts — objectif janvier 2027. La date est une information, pas un compte à rebours.",
  },
];

export function PrelaunchLanding() {
  return (
    <div>
      {/* ===== Bandeau date — calme, factuel ===== */}
      <div className="bg-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3.5 gap-y-1 px-4 py-3 text-center sm:px-8">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-on-forest">
            Ouverture commerciale
          </span>
          <strong className="text-[15px] font-bold text-surface">
            Janvier 2027 — d&apos;ici là, on réunit les pet sitters fondateurs.
          </strong>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        {/* ===== Héros — sitter-first ===== */}
        <section className="grid items-center gap-10 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-forest-border bg-forest-tint px-4 py-1.5">
                <span className="font-mono text-sm font-bold text-forest-text">
                  0 %
                </span>
                <span className="text-sm font-semibold text-forest-text">
                  de commission — à vie
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-primary-border bg-primary-tint px-4 py-1.5 text-sm font-semibold text-primary-deep">
                Inscription gratuite
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

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:mx-0 xl:text-6xl">
              On ouvre en janvier&nbsp;2027.{" "}
              <span className="text-primary">
                Le pet sitter qu&apos;on attend, c&apos;est peut-être vous.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg text-body sm:text-xl lg:mx-0">
              {BRAND} est une plateforme française de garde d&apos;animaux sans
              commission&nbsp;: vous fixez votre tarif, le propriétaire vous
              règle en direct, et vous gardez{" "}
              <strong className="text-ink">100&nbsp;% de vos revenus</strong>.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold text-ink lg:mx-0">
              D&apos;ici l&apos;ouverture, nous constituons le réseau des pet
              sitters fondateurs. Inscription gratuite, aujourd&apos;hui comme
              après.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5 lg:justify-start">
              <Link
                href="/devenir-pet-sitter"
                className="inline-flex items-center justify-center rounded-[14px] bg-primary px-7 py-3.5 font-bold text-surface transition-colors hover:bg-primary-dark"
              >
                Devenir pet sitter fondateur
              </Link>
              <a
                href="#proprietaires"
                className="inline-flex items-center justify-center rounded-[14px] border-[1.5px] border-line-faint px-7 py-3.5 font-bold text-ink transition-colors hover:border-ink"
              >
                Propriétaire&nbsp;? Être prévenu à l&apos;ouverture
              </a>
            </div>
            <p className="mt-3 text-[13px] text-muted">
              Sans engagement — vous pouvez retirer votre profil à tout moment,
              avant comme après l&apos;ouverture.
            </p>

            <ul className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted lg:mx-0 lg:justify-start">
              {HERO_PROOFS.map((r) => (
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

        {/* ===== Frise — le plan, affiché (variante B) ===== */}
        <section className="mt-16">
          <div className="text-center">
            <p className="kicker">Le plan, affiché</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Cinq mois pour bien faire les choses
            </h2>
          </div>
          <div className="relative mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {/* Ligne de liaison (desktop) */}
            <div
              aria-hidden
              className="absolute left-[6%] right-[6%] top-[23px] hidden h-[3px] rounded-full bg-line-faint lg:block"
            />
            {TIMELINE.map((t) => (
              <div key={t.title} className="relative px-2 text-center">
                <div
                  aria-hidden
                  className={`relative z-[1] mx-auto flex size-[46px] items-center justify-center rounded-full text-xl ${
                    t.goal
                      ? "border-[3px] border-primary bg-primary text-surface"
                      : t.now
                        ? "border-[3px] border-forest bg-forest-tint"
                        : "border-[3px] border-line-faint bg-surface"
                  }`}
                >
                  {t.emoji}
                </div>
                <p
                  className={`mt-3.5 font-mono text-[11.5px] font-bold uppercase tracking-[0.1em] ${
                    t.goal ? "text-primary" : "text-faint"
                  }`}
                >
                  {t.when}
                </p>
                <p className="mt-1.5 font-display text-[17px] font-extrabold tracking-[-0.01em] text-ink">
                  {t.title}
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {t.desc}
                </p>
                {t.now && (
                  <span className="mt-2 inline-block rounded-full border border-forest-border bg-forest-tint px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-forest-text">
                    Vous êtes ici
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ===== Pourquoi devenir pet sitter fondateur ===== */}
        <section className="mt-16 scroll-mt-24" id="fondateur">
          <p className="kicker">Pourquoi maintenant</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Pourquoi devenir pet sitter fondateur
          </h2>
          <p className="mt-3 max-w-3xl text-body">
            «&nbsp;Fondateur&nbsp;», c&apos;est un fait, pas un gadget&nbsp;:
            vous faites partie des tout premiers profils du réseau, prêts avant
            l&apos;ouverture. Voilà ce que ça change, concrètement.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="relative rounded-[20px] border-2 border-primary bg-surface p-7">
              <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-surface">
                Fondateur
              </span>
              <div
                aria-hidden
                className="flex size-[46px] items-center justify-center rounded-[12px] bg-primary-tint text-[22px]"
              >
                🏅
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">
                Un badge fondateur, mis en avant au lancement
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Votre profil porte le badge «&nbsp;Pet sitter fondateur&nbsp;»
                et fait partie des premiers présentés aux propriétaires de votre
                secteur à l&apos;ouverture. Premiers arrivés, premiers visibles
                — c&apos;est aussi simple que ça.
              </p>
            </div>
            <div className="rounded-[20px] border border-line bg-surface p-7">
              <div
                aria-hidden
                className="flex size-[46px] items-center justify-center rounded-[12px] bg-primary-tint text-[22px]"
              >
                💶
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">
                Votre tarif, vos 100&nbsp;%
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Vous fixez librement votre prix. Le propriétaire vous règle en
                direct, intégralement&nbsp;: {BRAND} ne prélève aucune
                commission sur la garde — 0&nbsp;%, à vie. C&apos;est le client
                qui règle la mise en relation, jamais vous.
              </p>
            </div>
            <div className="rounded-[20px] border border-line bg-surface p-7">
              <div
                aria-hidden
                className="flex size-[46px] items-center justify-center rounded-[12px] bg-primary-tint text-[22px]"
              >
                🗂️
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">
                Un profil vérifié, prêt pour le jour&nbsp;J
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Identité vérifiée, photo réelle, services et animaux acceptés
                (chat, chien, NAC)&nbsp;: on prépare tout ensemble d&apos;ici
                janvier, tranquillement. Le jour de l&apos;ouverture, vous êtes
                prêt à recevoir des demandes.
              </p>
            </div>
          </div>
        </section>

        {/* ===== Comment ça se passera ===== */}
        <section className="mt-16">
          <p className="kicker">D&apos;ici janvier 2027</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Comment ça se passera
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {ETAPES.map((s, i) => (
              <div
                key={s.t}
                className="rounded-[20px] border border-line bg-surface p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-[12px] bg-primary font-mono text-lg font-bold text-surface">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Bloc transparence ===== */}
        <section className="mt-16">
          <p className="kicker">Transparence</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-bold sm:text-3xl">
            Où va l&apos;argent d&apos;une garde&nbsp;? Réponse&nbsp;: au pet
            sitter.
          </h2>
          <div className="mt-7 rounded-[20px] bg-forest p-8 sm:p-11">
            <h3 className="font-display text-xl font-bold text-surface sm:text-2xl">
              Exemple&nbsp;: une garde réglée 30&nbsp;€ au pet sitter
            </h3>
            <p className="mt-2 text-[15px] text-on-forest">
              Le tarif est fixé par le pet sitter. Voici exactement la
              répartition.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[16px] border border-on-forest/25 bg-surface/[0.07] p-6">
                <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-on-forest">
                  Le propriétaire verse
                </p>
                <p className="mt-2.5 font-mono text-4xl font-bold leading-none text-surface">
                  30&nbsp;<small className="text-base font-bold">€</small>
                </p>
              </div>
              <div className="rounded-[16px] border border-primary/55 bg-primary-tint/[0.12] p-6">
                <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-on-forest">
                  Le pet sitter reçoit
                </p>
                <p className="mt-2.5 font-mono text-4xl font-bold leading-none text-primary-tint">
                  30&nbsp;<small className="text-base font-bold">€</small>
                </p>
              </div>
              <div className="rounded-[16px] border border-on-forest/25 bg-surface/[0.07] p-6">
                <p className="font-mono text-[13px] uppercase tracking-[0.1em] text-on-forest">
                  Commission {BRAND}
                </p>
                <p className="mt-2.5 font-mono text-4xl font-bold leading-none text-surface">
                  0&nbsp;<small className="text-base font-bold">€</small>
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-[70ch] text-[13.5px] leading-relaxed text-on-forest">
              {BRAND} se rémunère uniquement sur la mise en relation, réglée par
              le propriétaire — un montant fixe, affiché avant tout paiement,
              jamais un pourcentage de la garde.
            </p>
          </div>
        </section>

        {/* ===== Porte 2 : propriétaires (liste d'attente) ===== */}
        <section className="mt-16 scroll-mt-24" id="proprietaires">
          <div className="grid gap-8 rounded-[20px] border border-line bg-surface p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
            <div>
              <p className="kicker">Vous avez un animal&nbsp;?</p>
              <h2 className="mt-2 text-2xl font-bold sm:text-[26px]">
                Propriétaires&nbsp;: on vous prévient à l&apos;ouverture.
              </h2>
              <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                Pas de fausse promesse&nbsp;: le service ouvre en janvier 2027.
                Laissez votre e-mail et votre code postal — on vous écrit quand
                des pet sitters indépendants, vérifiés, sont disponibles près de
                chez vous. Rien d&apos;autre d&apos;ici là.
              </p>
              <ul className="mt-5 grid gap-2.5 text-sm text-body">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-success">✓</span> Un e-mail à
                  l&apos;ouverture de votre secteur, c&apos;est tout
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-success">✓</span> Aucun
                  paiement, aucune carte demandée aujourd&apos;hui
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-success">✓</span> Nous vous
                  aidons à trouver la bonne personne — vous choisissez
                </li>
              </ul>
              <div className="mt-6 flex gap-2.5">
                {[
                  {
                    src: "/photos/chat.jpg",
                    alt: "Portrait d'un chat tigré aux yeux verts",
                  },
                  {
                    src: "/photos/chien.jpg",
                    alt: "Chien joueur allongé dans l'herbe, la truffe en l'air",
                  },
                  {
                    src: "/photos/nac.jpg",
                    alt: "Lapin bélier au pelage fauve",
                  },
                ].map((p) => (
                  <Image
                    key={p.src}
                    src={p.src}
                    alt={p.alt}
                    width={300}
                    height={300}
                    className="h-[86px] w-full rounded-[14px] object-cover"
                  />
                ))}
              </div>
            </div>
            <div className="rounded-[20px] border border-line bg-cream p-6 sm:p-7">
              <h3 className="font-display text-lg font-bold text-ink">
                Être prévenu à l&apos;ouverture
              </h3>
              <p className="mt-1 text-sm text-faint">
                Un e-mail quand votre zone ouvre — finalité unique.
              </p>
              <OwnerWaitlistForm />
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="mt-16">
          <p className="kicker">Questions directes, réponses directes</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">FAQ</h2>
          <div className="mt-6 grid gap-3.5">
            {FAQ.map((f) => (
              <div
                key={f.q}
                className="rounded-[16px] border border-line bg-surface px-6 py-5 sm:px-7"
              >
                <h3 className="text-[17px] font-bold text-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== Citation de clôture (variante B) ===== */}
        <section className="my-16 text-center">
          <p className="kicker">Notre parti pris</p>
          <blockquote className="mx-auto mt-3 max-w-[34ch] font-display text-2xl font-extrabold leading-[1.3] tracking-[-0.02em] text-ink">
            «&nbsp;Pas de compteur gonflé, pas de faux avis, pas de fausse
            urgence. Une date, un plan, et des profils vérifiés.&nbsp;»
          </blockquote>
          <p className="mx-auto mt-5 max-w-[40ch] text-[15px] font-semibold text-ink">
            On ne veut pas être les plus gros. On veut être les plus fiables.
          </p>
          <p className="mt-2 text-[13.5px] text-muted">
            — L&apos;équipe {BRAND}, entreprise française
          </p>
        </section>
      </div>
    </div>
  );
}
