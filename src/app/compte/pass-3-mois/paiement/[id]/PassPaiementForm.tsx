"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

/**
 * Formulaire de paiement du Pass 3 mois (PaymentIntent, débit IMMÉDIAT et
 * on-session — miroir de SetupCarteForm, avec confirmPayment au lieu de
 * confirmSetup). Les données de carte ne touchent JAMAIS nos serveurs : elles
 * vont directement à Stripe via le PaymentElement (iframe).
 *
 * La renonciation L221-18 n'est PAS redemandée ici : elle a été recueillie,
 * validée et horodatée CÔTÉ SERVEUR par l'action d'achat (acheterPass3Mois),
 * AVANT la création de ce PaymentIntent.
 */

type Props = {
  purchaseId: string;
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
  purchaseId,
  amountLabel,
  testMode,
}: Pick<Props, "purchaseId" | "amountLabel" | "testMode">) {
  const stripe = useStripe();
  const elements = useElements();
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements || envoi) return;
    setEnvoi(true);
    setErreur(null);

    // Confirmation du débit (SCA on-session si la banque l'exige). Le statut
    // qui fait foi est vérifié CÔTÉ SERVEUR au retour (?retour=1).
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/compte/pass-3-mois?retour=1&achat=${purchaseId}`,
      },
    });
    // Sans redirection, c'est qu'il y a une erreur à afficher.
    if (error) {
      setErreur(
        error.message ??
          "Le paiement n'a pas abouti. Vérifiez les informations saisies.",
      );
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[20px] border border-line bg-surface p-6">
      <div className="flex items-center justify-between">
        <p className="kicker">Règlement du Pass 3 mois</p>
        <span className="rounded-full border border-forest-border bg-forest-tint px-3 py-1 text-xs font-bold text-forest-text">
          {amountLabel} — une fois
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

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Votre demande d&apos;exécution immédiate et votre renonciation au droit
        de rétractation ont été enregistrées à l&apos;étape précédente. Le
        montant est débité maintenant, une seule fois — aucune reconduction,
        aucun prélèvement ultérieur.
      </p>

      {erreur && (
        <p className="mt-4 rounded-[12px] border border-primary-border bg-primary-tint px-4 py-3 text-sm font-semibold text-primary-deep">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || envoi}
        className="mt-5 w-full rounded-[14px] bg-primary px-6 py-3.5 font-bold text-surface hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {envoi ? "Paiement en cours…" : `Régler ${amountLabel} — une fois, aucune reconduction`}
      </button>
      <p className="mt-3 text-center text-xs text-faint">
        {amountLabel} réglés une seule fois · couverture de 3 mois · aucun
        frais caché
      </p>
    </form>
  );
}

export function PassPaiementForm({
  purchaseId,
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
        purchaseId={purchaseId}
        amountLabel={amountLabel}
        testMode={testMode}
      />
    </Elements>
  );
}
