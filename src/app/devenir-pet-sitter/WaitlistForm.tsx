"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          postalCode: form.get("postalCode"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inattendue");
      setState("ok");
      setMessage("C'est noté ! Vous serez prévenu dès l'ouverture.");
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
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-[14px] bg-primary px-6 py-3.5 text-[17px] font-bold text-surface transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {state === "loading" ? "Envoi…" : "Rejoindre la liste"}
      </button>
      <p className="text-center text-xs text-faint">
        Gratuit · sans engagement · aucune case pré-cochée
      </p>
      {state === "error" && (
        <p className="text-center text-sm font-semibold text-primary-dark">
          {message}
        </p>
      )}
    </form>
  );
}
