"use client";

import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";

export function SearchForm({
  defaults,
}: {
  defaults?: { cp?: string; service?: string; species?: string; rayon?: string };
}) {
  const species = defaults?.species ?? SPECIES[0].key;
  const service = defaults?.service ?? SERVICES[0].key;

  return (
    <form
      method="GET"
      action="/recherche"
      className="rounded-[20px] border border-line bg-surface p-5 shadow-search sm:p-6"
    >
      {/* Ligne 1 — où chercher */}
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="flex flex-col gap-1.5">
          <span className="kicker">Code postal</span>
          <input
            name="cp"
            required
            inputMode="numeric"
            pattern="[0-9]{5}"
            defaultValue={defaults?.cp}
            placeholder="14400"
            className="rounded-[12px] border border-line bg-cream px-4 py-3 font-mono text-base text-ink placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="kicker">Rayon</span>
          <select
            name="rayon"
            defaultValue={defaults?.rayon ?? "15"}
            className="rounded-[12px] border border-line bg-cream px-4 py-3 text-base text-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border"
          >
            {["5", "10", "15", "25", "40"].map((r) => (
              <option key={r} value={r}>
                {r} km autour
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Ligne 2 — quel animal */}
      <fieldset className="mt-5">
        <legend className="kicker mb-2">Animal</legend>
        <div className="flex flex-wrap gap-2">
          {SPECIES.map((s) => (
            <label key={s.key} className="cursor-pointer">
              <input
                type="radio"
                name="species"
                value={s.key}
                defaultChecked={s.key === species}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-body transition-colors hover:border-line-faint peer-checked:border-primary peer-checked:bg-primary-tint peer-checked:text-primary-dark peer-focus-visible:ring-2 peer-focus-visible:ring-primary-border">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Ligne 3 — quel service */}
      <fieldset className="mt-5">
        <legend className="kicker mb-2">Type de garde</legend>
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
              <span className="inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-body transition-colors hover:border-line-faint peer-checked:border-primary peer-checked:bg-primary-tint peer-checked:text-primary-dark peer-focus-visible:ring-2 peer-focus-visible:ring-primary-border">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="mt-6 w-full rounded-[14px] bg-primary px-6 py-3.5 text-base font-bold text-surface transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-border sm:w-auto sm:px-10"
      >
        Trouver un pet sitter
      </button>
    </form>
  );
}
