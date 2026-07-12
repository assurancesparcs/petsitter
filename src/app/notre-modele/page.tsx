import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Notre modèle — comment nous gagnons notre argent",
  description:
    "0 % de commission sur la garde : le pet sitter touche 100 % de ce que vous lui versez. Voici, ligne par ligne, comment la plateforme se rémunère.",
};

export default function NotreModele() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">
        Comment {BRAND} gagne son argent
      </h1>
      <p className="mt-4 text-lg text-ink/80">
        La transparence n&apos;est pas un slogan ici, c&apos;est une page
        publique. Voici toutes nos sources de revenus — il n&apos;y en a pas
        d&apos;autres.
      </p>

      <h2 className="mt-10 text-xl font-bold">
        1. Ce que nous ne prenons jamais : une commission sur la garde
      </h2>
      <p className="mt-3 text-ink/80">
        Le pet sitter fixe librement son tarif et il est payé directement par
        vous. {BRAND} ne touche pas un centime sur ce montant, ne le majore
        pas, n&apos;y ajoute aucun « frais de service ». Sur chaque fiche de
        pet sitter, un bloc l&apos;affichera noir sur blanc : vous versez X €,
        le pet sitter reçoit X € (100 %), commission {BRAND} : 0 €.
      </p>

      <h2 className="mt-10 text-xl font-bold">
        2. Ce que vous nous payez : la mise en relation
      </h2>
      <p className="mt-3 text-ink/80">
        Vous ne payez que lorsqu&apos;un pet sitter a accepté votre garde —
        jamais avant. Ce que ce paiement couvre : la mise en relation avec un
        pet sitter qui a déjà dit oui, les avis vérifiés, un contrat de garde
        type entre vous et lui, une recherche prioritaire de remplaçant en cas
        d&apos;annulation, et le support.
      </p>
      <ul className="mt-4 space-y-2 rounded-2xl border border-line bg-white p-6 text-sm">
        {Object.values(PRICING).map((p) => (
          <li key={p.label}>
            <span className="font-semibold">{p.label}</span> — {p.price} (
            {p.unit}) : {p.detail}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink/70">
        Sans engagement. Pas de reconduction piégeuse : rappel avant chaque
        prélèvement, pause possible, résiliation en 3 clics depuis la page{" "}
        <a href="/resilier" className="underline">
          Résilier
        </a>
        .
      </p>

      <h2 className="mt-10 text-xl font-bold">3. Et c&apos;est tout — pour l&apos;instant</h2>
      <p className="mt-3 text-ink/80">
        D&apos;autres services optionnels pourront exister demain. Le jour où
        ils existeront, ils seront expliqués ici, sur cette page, avec leur
        prix et ce que {BRAND} y gagne — avant leur lancement, pas après.
        Cette page est datée et son historique de modifications sera public.
      </p>

      <h2 className="mt-10 text-xl font-bold">
        Ce que nous nous interdisons
      </h2>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-ink/80">
        <li>Débiter quoi que ce soit avant l&apos;acceptation d&apos;un pet sitter</li>
        <li>Un engagement minimum ou une reconduction tacite cachée</li>
        <li>Des frais découverts au moment de payer</li>
        <li>De faux avis, de faux compteurs, une fausse urgence</li>
        <li>Vendre ou transmettre vos coordonnées sans votre consentement explicite</li>
      </ul>
    </article>
  );
}
