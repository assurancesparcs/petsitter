import type { Metadata } from "next";
import { BRAND, BASE_URL } from "@/lib/brand";
import { WaitlistForm } from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Devenir pet sitter — 0 % de commission",
  description:
    "Inscription gratuite, 0 % de commission : vous fixez votre tarif et vous gardez 100 % de vos revenus. Rejoignez la liste d'attente.",
  alternates: { canonical: `${BASE_URL}/devenir-pet-sitter` },
};

// ⛔ Tant que flags.insurance_live est false, cette page ne mentionne AUCUN
// produit du domaine insurance/ (PLAN.md Q2/Q3 — le lint lexical le vérifie).
export default function DevenirPetSitter() {
  return (
    <div className="bg-cream">
      {/* HERO ------------------------------------------------------------ */}
      <section className="bg-ink">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface/15 bg-surface/10 px-4 py-1.5">
              <span className="font-mono text-sm font-bold text-primary">
                0 %
              </span>
              <span className="text-[13px] font-semibold text-on-forest">
                de commission · à vie
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-surface sm:text-5xl lg:text-[68px] lg:leading-[0.98]">
              Gardez 100 % de vos revenus.
            </h1>
            <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-line-faint">
              Vous fixez vos tarifs, vous touchez tout. C&apos;est le client qui
              règle la mise en relation —{" "}
              <strong className="text-surface">jamais vous</strong>. Inscription
              gratuite.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-faint">
              <span className="flex items-center gap-2">
                <span className="font-bold text-on-forest">✓</span> Vous fixez
                vos prix
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-on-forest">✓</span> Paiement à
                l&apos;acceptation
              </span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-on-forest">✓</span> Chat · chien
                · NAC
              </span>
            </div>
          </div>

          {/* Carte waitlist */}
          <div
            id="waitlist"
            className="scroll-mt-24 rounded-[24px] bg-surface p-7 shadow-card sm:p-8"
          >
            <h2 className="font-display text-[22px] font-bold text-ink">
              Rejoindre la liste d&apos;attente
            </h2>
            <p className="mt-1 text-sm text-faint">
              On vous prévient dès l&apos;ouverture dans votre secteur.
            </p>
            <WaitlistForm />
          </div>
        </div>
      </section>

      {/* COMPARATIF ------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="kicker">Ce que vous touchez, pour de vrai</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
          Sur 10 nuits à 30 €.
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-surface p-8">
            <p className="text-base text-muted">
              Plateforme à commission (~15 %)
            </p>
            <p className="mt-3 font-mono text-5xl font-bold leading-none text-faint sm:text-6xl">
              255 €
            </p>
            <p className="mt-4 text-[15px] text-faint">
              45 € partent en commission.
            </p>
          </div>
          <div className="rounded-[22px] bg-forest p-8 text-surface">
            <p className="text-base text-on-forest">Sur {BRAND}</p>
            <p className="mt-3 font-mono text-5xl font-bold leading-none text-surface sm:text-6xl">
              300 €
            </p>
            <p className="mt-4 text-[15px] text-on-forest">
              <strong className="text-surface">+ 45 €</strong> dans votre poche,
              pour la même garde.
            </p>
          </div>
        </div>
      </section>

      {/* POURQUOI -------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-[22px] border border-line bg-surface p-8">
            <h3 className="font-display text-2xl font-extrabold text-primary">
              Vous fixez vos tarifs
            </h3>
            <p className="mt-3 text-base leading-relaxed text-body">
              Le prix que vous affichez est le prix que vous touchez.
              Intégralement.
            </p>
          </article>
          <article className="rounded-[22px] border border-line bg-surface p-8">
            <h3 className="font-display text-2xl font-extrabold text-primary">
              Des clients sérieux
            </h3>
            <p className="mt-3 text-base leading-relaxed text-body">
              Empreinte carte au dépôt : le client s&apos;engage. Vous êtes payé
              dès que vous acceptez.
            </p>
          </article>
          <article className="rounded-[22px] border border-line bg-surface p-8">
            <h3 className="font-display text-2xl font-extrabold text-primary">
              Votre indépendance
            </h3>
            <p className="mt-3 text-base leading-relaxed text-body">
              Vous restez le prestataire. Nous aidons à faire la mise en
              relation, sans nous interposer dans la garde.
            </p>
          </article>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE ---------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <p className="kicker">Comment ça marche</p>
        <div className="mt-6 flex flex-col gap-6">
          <Etape
            n="1"
            titre="Créez votre profil gratuitement"
            texte="Photo réelle, animaux accueillis (chat, chien, NAC), votre cadre de vie."
          />
          <Etape
            n="2"
            titre="Recevez des demandes près de chez vous"
            texte="Rencontre préalable systématique avant d'accepter."
          />
          <Etape
            n="3"
            titre="Gardez, et touchez 100 %"
            texte="Le tarif que vous avez fixé vous revient intégralement."
          />
        </div>
      </section>

      {/* CTA FINAL ------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col gap-6 rounded-[24px] bg-primary p-10 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-surface sm:text-4xl">
              Prêt à garder 100 % ?
            </h2>
            <p className="mt-2 text-[17px] text-primary-tint">
              Rejoignez la liste d&apos;attente — on ouvre secteur par secteur.
            </p>
          </div>
          <a
            href="#waitlist"
            className="inline-flex shrink-0 items-center justify-center rounded-[14px] bg-ink px-8 py-4 font-bold text-surface transition-colors hover:bg-forest"
          >
            Rejoindre la liste
          </a>
        </div>
      </section>
    </div>
  );
}

function Etape({ n, titre, texte }: { n: string; titre: string; texte: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-primary font-mono text-lg font-bold text-surface">
        {n}
      </span>
      <div>
        <p className="text-lg font-bold text-ink">{titre}</p>
        <p className="mt-1 text-base leading-relaxed text-muted">{texte}</p>
      </div>
    </div>
  );
}
