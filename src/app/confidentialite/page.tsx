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
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Confidentialité</h1>
      <p className="mt-4 text-ink/80">
        Version en vigueur pendant la phase de pré-ouverture. Chaque évolution
        de cette politique sera datée, archivée et notifiée.
      </p>

      <h2 className="mt-8 text-xl font-bold">Ce que nous collectons aujourd&apos;hui</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-ink/80">
        <li>
          <strong>Liste d&apos;attente pet sitter</strong> : e-mail et code
          postal. Finalité unique : vous prévenir de l&apos;ouverture des
          inscriptions dans votre zone. Ces données ne sont ni vendues ni
          transmises, et sont supprimées si vous ne créez pas de compte dans
          les mois suivant l&apos;ouverture.
        </li>
        <li>
          <strong>Mesure d&apos;audience</strong> : statistiques anonymes sans
          cookie ni traceur publicitaire — aucun bandeau n&apos;est nécessaire
          car aucune donnée personnelle n&apos;est déposée sur votre appareil.
          Si cela changeait un jour, un bandeau de consentement conforme (refus
          aussi simple que l&apos;acceptation) apparaîtrait AVANT tout dépôt de
          traceur.
        </li>
      </ul>

      <h2 className="mt-8 text-xl font-bold">Vos droits</h2>
      <p className="mt-3 text-ink/80">
        Accès, rectification, effacement : écrivez à{" "}
        <a href="mailto:rgpd@allopetsitter.fr" className="underline">
          rgpd@allopetsitter.fr
        </a>
        . À l&apos;ouverture du service, l&apos;export et la suppression de vos
        données se feront en un clic depuis votre compte. Vous pouvez saisir la
        CNIL à tout moment :{" "}
        <a href="https://www.cnil.fr/fr/plaintes" className="underline">
          cnil.fr/fr/plaintes
        </a>
        .
      </p>

      <p className="mt-8 text-sm text-ink/60">
        Responsable de traitement : éditeur de {BRAND} (informations complètes
        publiées avec les mentions légales avant l&apos;ouverture).
      </p>
    </article>
  );
}
