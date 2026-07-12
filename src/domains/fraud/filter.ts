/**
 * Filtre anti-fuite de coordonnées (PLAN §5-A) — passe regex synchrone.
 * Bloque les tentatives de partage de contact dans les champs libres
 * (bio, présentation) AVANT enregistrement. La passe LLM hold-and-release
 * s'ajoutera pour la messagerie (P2 messagerie / P3).
 */

const PATTERNS: Array<{ re: RegExp; label: string }> = [
  // Numéros de téléphone : 06 12 34 56 78, 06.12.34.56.78, +33612345678…
  { re: /(?:\+33|0033|0)\s*[1-9](?:[\s.\-]?\d{2}){4}/, label: "téléphone" },
  // Suites de chiffres déguisées (9+ chiffres avec séparateurs)
  { re: /(?:\d[\s.\-_/]?){9,}/, label: "téléphone" },
  // Chiffres écrits en lettres (zéro six…)
  {
    re: /z[ée]ro\s*(?:six|sept)|(?:zero|zéro)[\s\-.]*[67]/i,
    label: "téléphone en lettres",
  },
  // E-mails, y compris déguisés (arobase, [at])
  {
    re: /[\w.+-]+\s*(?:@|\[at\]|\(at\)|arobase)\s*[\w-]+\s*(?:\.|\[dot\]|point)\s*[a-z]{2,}/i,
    label: "e-mail",
  },
  // Réseaux sociaux / messageries
  {
    re: /\b(?:insta(?:gram)?|snap(?:chat)?|whats?app|\bwa\b|telegram|tiktok|facebook|messenger|discord)\b/i,
    label: "réseau social",
  },
  // Handles type @pseudo
  { re: /(?:^|\s)@[a-z0-9_.]{3,}/i, label: "pseudo" },
  // URLs
  { re: /https?:\/\/|www\.[a-z0-9-]+\.[a-z]{2,}/i, label: "lien" },
];

export type FilterResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Vérifie un champ libre. Renvoie ok:false avec un motif lisible si fuite. */
export function checkFreeText(text: string): FilterResult {
  for (const { re, label } of PATTERNS) {
    if (re.test(text)) {
      return {
        ok: false,
        reason: `Votre texte semble contenir un moyen de contact (${label}). Les coordonnées s'échangent après la mise en relation — retirez-le pour continuer.`,
      };
    }
  }
  return { ok: true };
}
