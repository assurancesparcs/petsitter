import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";
import { deposerDemande } from "./actions";
import { CONSTRAINT_KEYS } from "@/domains/marketplace/constraints";

export const metadata: Metadata = {
  title: "Déposer une demande de garde",
  robots: { index: false },
};

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ERREURS: Record<string, string> = {
  champs: "Vérifiez le service et l'animal sélectionnés.",
  dates: "Vérifiez vos dates : le début ne peut pas être passé, la fin doit suivre le début.",
  cp: "Code postal introuvable.",
  recurrence: "Récurrence cochée : sélectionnez au moins un jour de la semaine.",
  indisponible: "Service momentanément indisponible, réessayez.",
};

// Jours de la semaine — valeurs 0-6 (0 = dimanche), affichés du lundi au dimanche.
const WEEKDAYS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
  { value: 0, label: "Dim" },
];

export default async function Demande({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");
  if (session.user.role === "SITTER") redirect("/compte/demandes");
  if (!session.user.role) redirect("/compte");

  const sp = await searchParams;
  const erreur = one(sp.erreur);
  const service = one(sp.service) ?? SERVICES[0].key;
  const species = one(sp.species) ?? SPECIES[0].key;
  const cp = one(sp.cp) ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="kicker">Nouvelle demande</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">
        Décrivez votre besoin de garde
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Les pet sitters disponibles autour de vous pourront candidater avec leur
        tarif. Vous choisirez ensuite —{" "}
        <strong className="text-ink">aucun débit avant qu&apos;un pet sitter accepte</strong>.
      </p>

      {/* Bandeau 0 € — martelé comme le veut la maquette Écran Dépôt */}
      <div className="mt-5 flex items-center gap-4 rounded-[16px] bg-ink px-5 py-4">
        <span className="font-mono text-2xl font-bold text-surface">0 €</span>
        <span className="text-sm text-surface/80">
          {getStripe() ? (
            <>
              débité aujourd&apos;hui : une simple empreinte carte à l&apos;étape
              suivante. Vous ne serez prélevé que lorsque vous choisirez votre
              pet sitter — même des mois plus tard.
            </>
          ) : (
            <>
              débité aujourd&apos;hui. Le paiement de la mise en relation ouvre
              très prochainement — déposez déjà votre demande, elle sera prête.
            </>
          )}
        </span>
      </div>

      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {ERREURS[erreur] ?? "Une erreur est survenue."}
        </p>
      )}

      <form action={deposerDemande} className="mt-8 space-y-8">
        {/* Service & animal */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Quel service, pour quel animal ?
          </h2>
          <fieldset className="mt-4">
            <legend className="kicker mb-2">Service</legend>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <label key={s.key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="service"
                    value={s.key}
                    defaultChecked={s.key === service}
                    className="peer sr-only"
                  />
                  <span className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-body peer-checked:border-primary peer-checked:bg-primary-tint peer-checked:text-primary-dark">
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-5">
            <legend className="kicker mb-2">Animal</legend>
            <div className="flex flex-wrap items-center gap-2">
              {SPECIES.map((s) => (
                <label key={s.key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="species"
                    value={s.key}
                    defaultChecked={s.key === species}
                    className="peer sr-only"
                  />
                  <span className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-body peer-checked:border-primary peer-checked:bg-primary-tint peer-checked:text-primary-dark">
                    {s.label}
                  </span>
                </label>
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm text-body">
                <span className="kicker">Nombre</span>
                <input
                  name="animalCount"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={1}
                  className="w-16 rounded-[12px] border border-line bg-cream px-3 py-2 font-mono text-ink focus:border-primary focus:outline-none"
                />
              </label>
            </div>
          </fieldset>
        </section>

        {/* Dates */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">Vos dates</h2>
          <p className="mt-1 text-sm text-muted">
            Deux nuits ou plus : votre demande relève du Pass Séjour (39 €).
            Visite, promenade ou une seule nuit : Pass Court (14,90 €). C&apos;est
            calculé automatiquement à partir de vos dates — et débité uniquement
            à l&apos;acceptation.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Début</span>
              <input
                type="date"
                name="startDate"
                required
                className="rounded-[12px] border border-line bg-cream px-4 py-3 font-mono text-ink focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Fin</span>
              <input
                type="date"
                name="endDate"
                required
                className="rounded-[12px] border border-line bg-cream px-4 py-3 font-mono text-ink focus:border-primary focus:outline-none"
              />
            </label>
          </div>
        </section>

        {/* Lieu */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">Où ?</h2>
          <p className="mt-1 text-sm text-muted">
            Commune + rayon suffisent : votre adresse exacte ne sera partagée
            qu&apos;avec le pet sitter confirmé, jamais avant.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Code postal</span>
              <input
                name="cp"
                required
                inputMode="numeric"
                pattern="[0-9]{5}"
                defaultValue={cp}
                placeholder="14400"
                className="rounded-[12px] border border-line bg-cream px-4 py-3 font-mono text-ink placeholder:text-faint focus:border-primary focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="kicker">Rayon de recherche</span>
              <select
                name="rayon"
                defaultValue="15"
                className="rounded-[12px] border border-line bg-cream px-4 py-3 text-body focus:border-primary focus:outline-none"
              >
                {["5", "10", "15", "25", "40"].map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Contraintes structurées — puces pré-définies, aucun texte libre */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="font-display text-lg font-bold text-ink">
            Précisions utiles
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cochez ce qui s&apos;applique — le détail s&apos;échangera après la
            mise en relation.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONSTRAINT_KEYS.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-3 rounded-[12px] border border-line bg-cream px-4 py-3 text-sm text-body"
              >
                <input
                  type="checkbox"
                  name={`c_${c.key}`}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                {c.label}
              </label>
            ))}
          </div>
        </section>

        {/* Récurrence — OPTIONNELLE, décochée par défaut (jamais de case pré-cochée) */}
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="recurring"
              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span>
              <span className="font-display text-lg font-bold text-ink">
                Cette garde se répète
              </span>
              <span className="mt-1 block text-sm text-muted">
                Optionnel. Cochez seulement si votre besoin est régulier
                (promenade quotidienne, visites…). La récurrence organise vos
                demandes ; elle ne déclenche aucun prélèvement. Pour un besoin
                régulier, le Pass 3 mois (payé une fois, mises en relation
                illimitées pendant 3 mois, aucune reconduction) reste
                facultatif.
              </span>
            </span>
          </label>

          <fieldset className="mt-4">
            <legend className="kicker mb-2">Jours concernés</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <label key={d.value} className="cursor-pointer">
                  <input
                    type="checkbox"
                    name="weekday"
                    value={d.value}
                    className="peer sr-only"
                  />
                  <span className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-body peer-checked:border-primary peer-checked:bg-primary-tint peer-checked:text-primary-dark">
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="kicker">Créneau souhaité (optionnel)</span>
            <input
              name="timeSlot"
              maxLength={60}
              placeholder="Ex. le matin, vers 8 h"
              className="rounded-[12px] border border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
            />
          </label>
        </section>

        <button
          type="submit"
          className="w-full rounded-[14px] bg-primary px-6 py-3.5 font-bold text-surface hover:bg-primary-dark sm:w-auto sm:px-10"
        >
          Déposer ma demande — 0 € aujourd&apos;hui
        </button>
      </form>
    </div>
  );
}
