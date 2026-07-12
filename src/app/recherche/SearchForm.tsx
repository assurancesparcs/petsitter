"use client";

import { SERVICES, SPECIES } from "@/domains/marketplace/catalog";

export function SearchForm({
  defaults,
}: {
  defaults?: { cp?: string; service?: string; species?: string; rayon?: string };
}) {
  return (
    <form
      method="GET"
      action="/recherche"
      className="grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Code postal</span>
        <input
          name="cp"
          required
          pattern="[0-9]{5}"
          defaultValue={defaults?.cp}
          placeholder="14400"
          className="rounded-lg border border-line px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Rayon</span>
        <select
          name="rayon"
          defaultValue={defaults?.rayon ?? "15"}
          className="rounded-lg border border-line px-3 py-2"
        >
          {["5", "10", "15", "25", "40"].map((r) => (
            <option key={r} value={r}>
              {r} km
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Service</span>
        <select
          name="service"
          defaultValue={defaults?.service ?? SERVICES[0].key}
          className="rounded-lg border border-line px-3 py-2"
        >
          {SERVICES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Animal</span>
        <select
          name="species"
          defaultValue={defaults?.species ?? SPECIES[0].key}
          className="rounded-lg border border-line px-3 py-2"
        >
          {SPECIES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-dark sm:col-span-2"
      >
        Rechercher un pet sitter
      </button>
    </form>
  );
}
