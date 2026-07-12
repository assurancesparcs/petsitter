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
    return <p className="mt-4 font-semibold">{message}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        name="email"
        required
        placeholder="Votre e-mail"
        className="flex-1 rounded-full px-4 py-2 text-ink"
        aria-label="Votre e-mail"
      />
      <input
        type="text"
        name="postalCode"
        required
        pattern="[0-9]{5}"
        placeholder="Code postal"
        className="w-full rounded-full px-4 py-2 text-ink sm:w-36"
        aria-label="Votre code postal"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="rounded-full bg-accent px-6 py-2 font-semibold text-ink disabled:opacity-60"
      >
        {state === "loading" ? "Envoi…" : "Être prévenu"}
      </button>
      {state === "error" && (
        <p className="text-sm text-red-200 sm:w-full">{message}</p>
      )}
    </form>
  );
}
