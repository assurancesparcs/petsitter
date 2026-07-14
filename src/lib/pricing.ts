/**
 * Grille tarifaire de lancement (PLAN.md §1.2) — valeurs du brief fondateur,
 * révisées par les décisions n° 13 et n° 14 (DECISIONS.md) : trois Pass
 * prépayés, payés UNE FOIS chacun — aucun produit récurrent, aucune
 * reconduction. Grille v2 (décision n° 14) : le Pass ponctuel est déduit du
 * TYPE DE SERVICE — Pass Court pour visite/promenade, Pass Séjour pour toute
 * garde dès une nuit — et le deuxième Pass Séjour d'un même propriétaire est
 * automatiquement à −30 %.
 * ⚠️ Dès P3 cette grille migre en base (`pricing`) : jamais de montant en dur
 * dans les pages, toujours importer d'ici en attendant.
 * Le débit n'intervient QUE lorsqu'un pet sitter a accepté la mission (Q14 :
 * empreinte carte au dépôt, débit off-session à l'acceptation).
 */
import type { ServiceType } from "@prisma/client";

export const PRICING = {
  passSejour: { label: "Pass Séjour", price: "39 €", unit: "une fois", detail: "Garde dès une nuit (chez vous ou chez le pet sitter)" },
  passCourt: { label: "Pass Court", price: "14,90 €", unit: "une fois", detail: "Visite à domicile ou promenade" },
  passTrimestre: { label: "Pass 3 mois", price: "59 €", unit: "une fois", detail: "Mises en relation illimitées pendant 3 mois — aucune reconduction" },
} as const;

// Montants facturés (centimes) — source unique côté serveur, JAMAIS en dur
// dans une page ni recalculés côté client.
export const PASS_SEJOUR_CENTS = 3900;
export const PASS_COURT_CENTS = 1490;
export const PASS_TRIMESTRE_CENTS = 5900;

// −30 % automatique sur le DEUXIÈME Pass Séjour d'un même propriétaire
// (décision n° 14, anti-désintermédiation : le 2e contact revient sur la
// plateforme au lieu de partir en direct). 3900 − 30 % = 2730. Exactement le
// 2e : éligible quand le propriétaire compte UN SEUL Pass Séjour antérieur
// réellement facturé (CAPTURED, ou REFUNDED — remboursé après un vrai débit).
export const PASS_SEJOUR_DEUXIEME_REDUCTION_PCT = 30;
export const PASS_SEJOUR_DEUXIEME_CENTS = 2730;

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
 * Le Pass PONCTUEL est DÉDUIT du type de service, jamais choisi
 * (anti-arbitrage, DECISIONS n° 9 et n° 14) : garde dès une nuit
 * (HOUSE_SITTING, BOARDING) ⇒ Pass Séjour ; visite ou promenade
 * (HOME_VISIT, WALK) ⇒ Pass Court. Toujours calculé CÔTÉ SERVEUR au dépôt —
 * le montant est figé dans Payment. Le Pass 3 mois, lui, est un achat unique
 * et explicite : il ne passe jamais par cette déduction.
 */
export function passFromService(service: ServiceType): Pass {
  return service === "HOUSE_SITTING" || service === "BOARDING"
    ? { key: "pass_sejour", cents: PASS_SEJOUR_CENTS, label: PRICING.passSejour.label }
    : { key: "pass_court", cents: PASS_COURT_CENTS, label: PRICING.passCourt.label };
}

/**
 * Montant d'un Pass Séjour selon l'historique FACTURÉ du propriétaire
 * (nombre de Pass Séjour antérieurs au statut CAPTURED ou REFUNDED, compté
 * côté serveur sur l'ownerId de session). Exactement le 2e Pass Séjour
 * (un seul antérieur facturé) ⇒ −30 % automatique. Déterministe et
 * idempotent : même historique ⇒ même montant.
 */
export function sejourAmountFor(ownerPriorChargedSejours: number): {
  cents: number;
  discounted: boolean;
} {
  return ownerPriorChargedSejours === 1
    ? { cents: PASS_SEJOUR_DEUXIEME_CENTS, discounted: true }
    : { cents: PASS_SEJOUR_CENTS, discounted: false };
}

/** Libellé d'un Pass depuis sa clé stockée en base (Payment.packLabel). */
export function passLabelFromKey(key: string): string {
  return key === "pass_sejour" ? PRICING.passSejour.label : PRICING.passCourt.label;
}
