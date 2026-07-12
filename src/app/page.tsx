import Link from "next/link";
import { BRAND, BASELINE } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Bandeau pré-ouverture — retiré au lancement (P6) */}
      <p className="mt-4 rounded-full bg-accent-soft px-4 py-2 text-center text-sm">
        Ouverture prochaine — pet sitters, {""}
        <Link href="/devenir-pet-sitter" className="font-semibold underline">
          rejoignez la liste d&apos;attente
        </Link>
      </p>

      {/* Héros */}
      <section className="py-14 text-center sm:py-20">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Trouvez un pet sitter de confiance pour votre chat ou votre chien
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink/80">{BASELINE}</p>
        <p className="mx-auto mt-3 max-w-2xl text-lg font-semibold text-primary">
          Vous ne payez que si un pet sitter accepte votre garde. Aucun débit
          avant.
        </p>

        {/* Recherche par code postal → /recherche */}
        <form
          method="GET"
          action="/recherche"
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            name="cp"
            required
            pattern="[0-9]{5}"
            placeholder="Votre code postal"
            aria-label="Votre code postal"
            className="flex-1 rounded-full border border-line bg-white px-5 py-3"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark"
          >
            Chercher un pet sitter
          </button>
        </form>
      </section>

      {/* Comment ça marche */}
      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            t: "1. Décrivez votre besoin",
            d: "Dates, animal, service. Votre carte est simplement enregistrée : aucun débit aujourd'hui — même pour une garde dans plusieurs mois.",
          },
          {
            t: "2. Un pet sitter accepte",
            d: "Les pet sitters disponibles près de chez vous candidatent avec leur tarif. Vous choisissez. C'est seulement là que le paiement a lieu.",
          },
          {
            t: "3. Vous vous organisez en direct",
            d: "Coordonnées complètes, messagerie, contrat de garde type et rencontre préalable gratuite. Le pet sitter est payé directement par vous, à son tarif, sans commission.",
          },
        ].map((s) => (
          <div
            key={s.t}
            className="rounded-2xl border border-line bg-white p-6"
          >
            <h2 className="font-semibold text-primary">{s.t}</h2>
            <p className="mt-2 text-sm text-ink/80">{s.d}</p>
          </div>
        ))}
      </section>

      {/* Services — le chat à stricte égalité, la visite à domicile en avant */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">
          Quatre services, pour les chats comme pour les chiens
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              t: "Visite à domicile",
              d: "L'idéal pour les chats : votre animal reste chez lui, un pet sitter passe le voir, le nourrit et joue avec lui.",
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
          ].map((s) => (
            <div
              key={s.t}
              className="rounded-2xl border border-line bg-white p-6"
            >
              <h3 className="font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-ink/80">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prix affichés dès la home — règle absolue (aucun coût caché) */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold">
          Des prix affichés avant toute recherche
        </h2>
        <p className="mt-2 text-ink/80">
          Ce que vous payez à {BRAND}, c&apos;est la mise en relation — jamais
          une commission sur la garde. Le tarif de la garde est fixé librement
          par le pet sitter, qui le perçoit à 100 %, en direct.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Object.values(PRICING).map((p) => (
            <div
              key={p.label}
              className="rounded-2xl border border-line bg-white p-6 text-center"
            >
              <h3 className="font-semibold">{p.label}</h3>
              <p className="mt-2 text-3xl font-bold text-primary">{p.price}</p>
              <p className="text-sm text-ink/60">{p.unit}</p>
              <p className="mt-3 text-sm text-ink/80">{p.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-ink/70">
          Débité uniquement à l&apos;acceptation d&apos;un pet sitter. Sans
          engagement, résiliation en 3 clics —{" "}
          <Link href="/notre-modele" className="underline hover:text-primary">
            notre modèle expliqué ligne par ligne
          </Link>
          .
        </p>
      </section>

      {/* Engagements structurels — preuve avant les avis */}
      <section className="mt-16 rounded-2xl bg-primary p-8 text-white">
        <h2 className="text-2xl font-bold">Nos engagements, vérifiables</h2>
        <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <li>• 0 € débité tant qu&apos;aucun pet sitter n&apos;a accepté</li>
          <li>• Identité vérifiée pour chaque pet sitter qui candidate</li>
          <li>• Contrat de garde type fourni, entre vous et le pet sitter</li>
          <li>• Résiliation en 3 clics, rappel avant chaque prélèvement</li>
          <li>• Aucun avis inventé, aucun compteur gonflé</li>
          <li>
            •{" "}
            <Link href="/nos-limites" className="underline">
              Nos limites, affichées aussi clairement que nos promesses
            </Link>
          </li>
        </ul>
      </section>

      {/* CTA sitter */}
      <section className="my-16 text-center">
        <h2 className="text-2xl font-bold">Vous gardez des animaux ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-ink/80">
          Inscription gratuite, 0 % de commission : vous fixez votre tarif et
          vous gardez 100 % de vos revenus.
        </p>
        <Link
          href="/devenir-pet-sitter"
          className="mt-5 inline-block rounded-full bg-accent px-6 py-3 font-semibold text-ink hover:opacity-90"
        >
          Rejoindre la liste d&apos;attente
        </Link>
      </section>
    </div>
  );
}
