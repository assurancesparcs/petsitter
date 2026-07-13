/**
 * Grille tarifaire de lancement (PLAN.md §1.2) — valeurs du brief fondateur.
 * ⚠️ Dès P3 cette grille migre en base (`pricing`) : jamais de montant en dur
 * dans les pages, toujours importer d'ici en attendant.
 * Le débit n'intervient QUE lorsqu'un pet sitter a accepté la mission (Q14 :
 * empreinte carte au dépôt, débit off-session à l'acceptation).
 */
export const PRICING = {
  passSejour: { label: "Pass Séjour", price: "39 €", unit: "une fois", detail: "Garde de 2 nuits et plus" },
  passCourt: { label: "Pass Court", price: "14,90 €", unit: "une fois", detail: "Visite, promenade ou garde d'une nuit" },
  abonnement: { label: "Abonnement", price: "19 €", unit: "par mois, sans engagement", detail: "Mises en relation illimitées — résiliation en 3 clics" },
} as const;

// Montants facturés (centimes) — source unique côté serveur, JAMAIS en dur
// dans une page ni recalculés côté client.
export const PASS_SEJOUR_CENTS = 3900;
export const PASS_COURT_CENTS = 1490;

export type PassKey = "pass_sejour" | "pass_court";

export type Pass = {
  key: PassKey;
  cents: number;
  label: string;
};

/** Formatage euros FR d'un montant en centimes (39 € / 14,90 €). */
export function centsLabel(cents: number): string {
  const euros = (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
  return `${euros} €`;
}

/**
 * Le Pass est DÉDUIT des dates, jamais choisi (anti-arbitrage, DECISIONS n°9) :
 * 2 nuits et plus ⇒ Pass Séjour, sinon (visite, promenade, 1 nuit) Pass Court.
 * Toujours calculé CÔTÉ SERVEUR au dépôt — le montant est figé dans Payment.
 */
export function passFromDates(start: Date, end: Date): Pass {
  const MS_PER_DAY = 24 * 3600 * 1000;
  const nights = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  return nights >= 2
    ? { key: "pass_sejour", cents: PASS_SEJOUR_CENTS, label: PRICING.passSejour.label }
    : { key: "pass_court", cents: PASS_COURT_CENTS, label: PRICING.passCourt.label };
}

/** Libellé d'un Pass depuis sa clé stockée en base (Payment.packLabel). */
export function passLabelFromKey(key: string): string {
  return key === "pass_sejour" ? PRICING.passSejour.label : PRICING.passCourt.label;
}
