import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { WaitlistForm } from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Devenir pet sitter — 0 % de commission",
  description:
    "Inscription gratuite, 0 % de commission : vous fixez votre tarif et vous gardez 100 % de vos revenus. Rejoignez la liste d'attente.",
};

// ⛔ Tant que flags.insurance_live est false, cette page ne mentionne AUCUN
// produit du domaine insurance/ (PLAN.md Q2/Q3 — le lint lexical le vérifie).
export default function DevenirPetSitter() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">
        Pet sitters : gardez 100 % de vos revenus
      </h1>
      <p className="mt-4 text-lg text-ink/80">
        Sur {BRAND}, l&apos;inscription est gratuite — définitivement — et la
        commission est de 0 %. Vous fixez votre tarif librement, le
        propriétaire vous paie directement, et chaque euro affiché est un euro
        pour vous.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold">Comparez ce que vous touchez vraiment</h2>
        <p className="mt-2 text-sm text-ink/80">
          Sur 10 nuits à 30 € la nuit : vous percevez <strong>300 €</strong>{" "}
          via {BRAND}, contre <strong>255 €</strong> sur une plateforme qui
          prélève 15 % de commission. C&apos;est mathématique, et c&apos;est
          écrit sur chaque fiche.
        </p>
      </div>

      <ul className="mt-8 space-y-3 text-ink/80">
        <li>
          <strong>Votre tarif, vos règles</strong> — vous choisissez vos
          services (visite, promenade, garde), vos espèces, vos prix et votre
          calendrier.
        </li>
        <li>
          <strong>Des demandes sérieuses</strong> — le propriétaire a déjà
          enregistré sa carte quand vous candidatez : s&apos;il vous choisit,
          la mission est ferme.
        </li>
        <li>
          <strong>Vos avis vous appartiennent</strong> — chaque garde déclarée
          construit votre réputation vérifiée et votre classement.
        </li>
      </ul>

      <section className="mt-10 rounded-2xl bg-primary p-6 text-white">
        <h2 className="text-xl font-bold">
          Ouverture prochaine — soyez parmi les premiers
        </h2>
        <p className="mt-2 text-sm">
          Laissez votre e-mail et votre code postal : vous serez prévenu dès
          l&apos;ouverture des inscriptions dans votre zone. C&apos;est tout ce
          que nous ferons de ces données —{" "}
          <a href="/confidentialite" className="underline">
            promis, et écrit ici
          </a>
          .
        </p>
        <WaitlistForm />
      </section>
    </div>
  );
}
