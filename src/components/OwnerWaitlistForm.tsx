"use client";

import { useState } from "react";
import { SPECIES, type SpeciesKey } from "@/domains/marketplace/catalog";

/**
 * Formulaire liste d'attente PROPRIÉTAIRES (pré-lancement) — miroir de
 * devenir-pet-sitter/WaitlistForm : e-mail + code postal + espèces (chips
 * facultatives), POST vers /api/waitlist-proprietaire. Finalité unique,
 * aucune case pré-cochée, message de confirmation honnête.
 */
export function OwnerWaitlistForm() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [species, setSpecies] = useState<SpeciesKey[]>([]);

  function toggleSpecies(key: SpeciesKey) {
    setSpecies((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/waitlist-proprietaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          postalCode: form.get("postalCode"),
          species,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inattendue");
      setState("ok");
      setMessage(
        "C'est noté — on vous écrit dès l'ouverture dans votre zone. Votre e-mail ne sert qu'à ça.",
      );
    } catch (err) {
      setState("error");
      setMessage(
        err instanceof Error ? err.message : "Erreur inattendue, réessayez.",
      );
    }
  }

  if (state === "ok") {
    return (
      <div className="mt-5 rounded-[12px] border border-forest-border bg-forest-tint p-4">
        <p className="font-semibold text-forest-text">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
      <input
        type="email"
        name="email"
        required
        placeholder="Votre e-mail"
        className="w-full rounded-[12px] border-[1.5px] border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
        aria-label="Votre e-mail"
      />
      <input
        type="text"
        name="postalCode"
        required
        inputMode="numeric"
        pattern="[0-9]{5}"
        placeholder="Code postal"
        className="w-full rounded-[12px] border-[1.5px] border-line bg-cream px-4 py-3 text-ink placeholder:text-faint focus:border-primary focus:outline-none"
        aria-label="Votre code postal"
      />
      <fieldset>
        <legend className="kicker mb-2">Pour quel animal ? (facultatif)</legend>
        <div className="flex flex-wrap gap-2">
          {SPECIES.map((s) => {
            const selected = species.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleSpecies(s.key)}
                className={`rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-forest bg-forest-tint text-forest-text"
                    : "border-line bg-cream text-body hover:border-line-faint"
                }`}
              >
                {selected ? "✓ " : ""}
                {s.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-[14px] bg-primary px-6 py-3.5 text-[17px] font-bold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {state === "loading" ? "Envoi…" : "Être prévenu à l'ouverture"}
      </button>
      <p className="text-center text-xs text-faint">
        Votre e-mail sert à ça, et à rien d&apos;autre. Aucune case pré-cochée.
      </p>
      {state === "error" && (
        <p className="text-center text-sm font-semibold text-primary-dark">
          {message}
        </p>
      )}
    </form>
  );
}
