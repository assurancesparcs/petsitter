import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
};

// P1 : périmètre réel actuel = liste d'attente + mesure d'audience cookieless.
// À enrichir à CHAQUE nouveau traitement (P2 : comptes, vérification d'identité,
// filtre anti-fuite des messages — information explicite obligatoire).
export default function Confidentialite() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="kicker">Informations légales</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em]">
        Confidentialité
      </h1>
      <p className="mt-4 text-body">
        Version en vigueur pendant la phase de pré-ouverture. Chaque évolution
        de cette politique sera datée, archivée et notifiée.
      </p>

      <section className="mt-8 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        <h2 className="text-xl font-bold">Responsable du traitement</h2>
        <p className="mt-3 text-body">
          Le responsable du traitement est l&apos;éditeur de {BRAND} (société en
          cours de constitution ; dans l&apos;intervalle, son fondateur en nom
          propre). Contact dédié aux données personnelles :{" "}
          <a
            href="mailto:rgpd@allopetsitter.fr"
            className="underline hover:text-primary"
          >
            rgpd@allopetsitter.fr
          </a>
          . L&apos;identité sociale complète sera publiée avec les mentions
          légales dès l&apos;immatriculation de la société.
        </p>
      </section>

      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        <h2 className="text-xl font-bold">
          Ce que nous collectons aujourd&apos;hui
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-body">
          <li>
            <strong className="text-ink">Liste d&apos;attente pet sitter</strong>{" "}
            : e-mail et code postal. Finalité unique : vous prévenir de
            l&apos;ouverture des inscriptions dans votre zone.{" "}
            <strong className="text-ink">
              Base légale : votre consentement
            </strong>{" "}
            (soumission volontaire du formulaire), retirable à tout moment par
            simple demande. Ces données ne sont ni vendues ni transmises.{" "}
            <strong className="text-ink">
              Durée de conservation : jusqu&apos;à 12 mois après
              l&apos;ouverture du service dans votre zone, puis suppression si
              vous n&apos;avez pas créé de compte.
            </strong>
          </li>
          <li>
            <strong className="text-ink">Mesure d&apos;audience</strong> :
            statistiques anonymes sans cookie ni traceur publicitaire — aucun
            bandeau n&apos;est nécessaire car aucune donnée personnelle
            n&apos;est déposée sur votre appareil. Si cela changeait un jour, un
            bandeau de consentement conforme (refus aussi simple que
            l&apos;acceptation) apparaîtrait AVANT tout dépôt de traceur.
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-[20px] border border-line bg-surface p-6 shadow-panel sm:p-8">
        <h2 className="text-xl font-bold">Vos droits</h2>
        <p className="mt-3 text-body">
          Accès, rectification, effacement : écrivez à{" "}
          <a
            href="mailto:rgpd@allopetsitter.fr"
            className="underline hover:text-primary"
          >
            rgpd@allopetsitter.fr
          </a>
          . À l&apos;ouverture du service, l&apos;export et la suppression de vos
          données se feront en un clic depuis votre compte. Vous pouvez saisir
          la CNIL à tout moment :{" "}
          <a
            href="https://www.cnil.fr/fr/plaintes"
            className="underline hover:text-primary"
          >
            cnil.fr/fr/plaintes
          </a>
          .
        </p>
      </section>

      <p className="mt-8 text-sm text-muted">
        Responsable de traitement : éditeur de {BRAND} (informations complètes
        publiées avec les mentions légales avant l&apos;ouverture).
      </p>
    </article>
  );
}
