/**
 * Constante de marque unique — SEULE source autorisée pour le nom de la marque.
 * Graphie officielle : « AlloPetsitter » (un mot, A et P majuscules), identique
 * partout (site, e-mails, schema.org, réseaux). Ne jamais écrire le nom en dur
 * dans une page.
 */
export const BRAND = "AlloPetsitter" as const;
export const DOMAIN = "allo-pet-sitter.fr" as const;
export const BASE_URL = `https://www.${DOMAIN}` as const;

/** Baseline provisoire — sera arbitrée avec l'identité (Claude Design, Mission 1). */
export const BASELINE =
  "Le pet sitter touche 100 % de ce que vous lui versez. Nous ne prenons rien sur la garde." as const;
