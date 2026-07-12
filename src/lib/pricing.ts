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
