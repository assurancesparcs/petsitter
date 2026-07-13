"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { demanderExecutionImmediate } from "@/app/demande/paiement/actions";

/**
 * Formulaire d'empreinte carte (SetupIntent, mode setup) — les données de
 * carte ne touchent JAMAIS nos serveurs : elles vont directement à Stripe via
 * le PaymentElement (iframe). Case de rétractation OBLIGATOIRE, jamais
 * pré-cochée (L221-18) : le submit est bloqué sans elle, et l'horodatage est
 * enregistré CÔTÉ SERVEUR avant la confirmation Stripe.
 */

type Props = {
  requestId: string;
  clientSecret: string;
  publishableKey: string;
  amountLabel: string;
  testMode: boolean;
};

// Valeurs reprises des tokens (DESIGN_TOKENS.md) : le PaymentElement vit dans
// une iframe Stripe, seules des variables d'apparence peuvent lui être passées.
const APPEARANCE = {
  variables: {
    colorPrimary: "#dd5a3f",
    colorText: "#22201c",
    colorTextSecondary: "#6b6459",
    colorBackground: "#ffffff",
    colorDanger: "#7a1e10",
    borderRadius: "12px",
    fontFamily:
      "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  },
} as const;

function FormulaireInterne({
  requestId,
  amountLabel,
  testMode,
}: Pick<Props, "requestId" | "amountLabel" | "testMode">) {
  const stripe = useStripe();
  const elements = useElements();
  const [accepte, setAccepte] = useState(false); // JAMAIS pré-cochée
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements || !accepte || envoi) return;
    setEnvoi(true);
    setErreur(null);

    // 1. Horodatage serveur du consentement AVANT toute confirmation Stripe.
    const consentement = await demanderExecutionImmediate(requestId);
    if (!consentement.ok) {
      setErreur(consentement.erreur ?? "Une erreur est survenue, réessayez.");
      setEnvoi(false);
      return;
    }

    // 2. Confirmation de l'empreinte (SCA on-session si la banque l'exige).
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/compte/mes-demandes?ok=carte`,
      },
    });
    // Sans redirection, c'est qu'il y a une erreur à afficher.
    if (error) {
      setErreur(
        error.message ??
          "L'enregistrement de la carte n'a pas abouti. Vérifiez les informations saisies.",
      );
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[20px] border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="kicker">Empreinte carte</p>
        <span className="rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-bold text-forest-text">
          pas de débit
        </span>
      </div>

      {testMode && (
        <p className="mt-3 rounded-[12px] border border-line bg-surface-2 px-4 py-2.5 text-xs text-muted">
          Mode test — carte de test :{" "}
          <span className="font-mono font-bold text-ink">4242 4242 4242 4242</span>{" "}
          (date future et CVC au choix).
        </p>
      )}

      <div className="mt-4">
        <PaymentElement options={{ terms: { card: "never" } }} />
      </div>

      {/* Case OBLIGATOIRE, jamais pré-cochée — rétractation L221-18 */}
      <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-body">
        <input
          type="checkbox"
          checked={accepte}
          onChange={(e) => setAccepte(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
        />
        <span>
          Je demande l&apos;exécution immédiate de la mise en relation et je
          reconnais perdre mon droit de rétractation une fois celle-ci
          réalisée.
        </span>
      </label>

      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || !accepte || envoi}
        className="mt-5 w-full rounded-[14px] bg-primary px-6 py-3.5 font-bold text-surface hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {envoi ? "Enregistrement…" : "Enregistrer ma carte — 0 € aujourd'hui"}
      </button>
      <p className="mt-3 text-center text-xs text-faint">
        0 € débité aujourd&apos;hui · {amountLabel} réglés uniquement quand vous
        choisirez votre pet sitter · aucun frais caché
      </p>
    </form>
  );
}

export function SetupCarteForm({
  requestId,
  clientSecret,
  publishableKey,
  amountLabel,
  testMode,
}: Props) {
  // loadStripe une seule fois par montage (la clé ne change pas en cours de vie).
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey]);

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: APPEARANCE, locale: "fr" }}
    >
      <FormulaireInterne
        requestId={requestId}
        amountLabel={amountLabel}
        testMode={testMode}
      />
    </Elements>
  );
}
