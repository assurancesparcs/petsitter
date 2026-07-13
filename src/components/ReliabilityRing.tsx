import { BRAND } from "@/lib/brand";

/**
 * Score de Fiabilité — composant signature de la charte Claude Design.
 *
 * Anneau conique (vert forêt « rempli » sur forest-tint « vide ») avec un disque
 * blanc central portant la note en Space Mono. Sous le seuil d'affichage (aucun
 * score éligible), l'anneau est REMPLACÉ par une pastille « ✦ Nouveau ».
 *
 * Honnêteté (garde-fou produit) : la note chiffrée n'apparaît QUE si
 * `eligible && score != null && reviewCount >= 1`. Aucune valeur fabriquée :
 * dans le doute, on retombe sur « Nouveau ». Ce composant est purement
 * présentationnel — la logique de seuil vit en amont (domaine marketplace).
 */

// Note à une décimale à la française (4.7 → « 4,7 »).
function fmtRating(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function ReliabilityRing({
  score,
  reviewCount,
  eligible,
  size = 132,
}: {
  score: number | null;
  reviewCount: number;
  eligible: boolean;
  size?: number;
}) {
  const showRing = eligible && score != null && reviewCount >= 1;

  if (!showRing) {
    // Repli honnête : pastille « Nouveau » (jamais un vide déguisé en chiffre).
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary-tint px-4 py-1.5 text-sm font-bold text-primary-dark">
        <span aria-hidden>✦</span>
        Nouveau sur {BRAND}
      </span>
    );
  }

  // Bornage défensif de la fraction de tour (0 → 1). score est 0–5.
  const turn = Math.max(0, Math.min(1, score / 5));
  // Disque central ~71 % du diamètre de l'anneau.
  const discSize = Math.round(size * 0.71);
  // Tailles typographiques dérivées du diamètre pour rester net à toute échelle.
  const numberSize = Math.round(size * 0.3);
  const overFive = reviewCount > 1;

  return (
    <span
      role="img"
      aria-label={`Note de fiabilité : ${fmtRating(score)} sur 5, ${reviewCount} avis vérifié${overFive ? "s" : ""}`}
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(var(--color-success) 0turn ${turn}turn, var(--color-forest-tint) ${turn}turn 1turn)`,
      }}
    >
      <span
        aria-hidden
        className="inline-flex flex-col items-center justify-center rounded-full bg-surface"
        style={{ width: discSize, height: discSize }}
      >
        <span
          className="font-mono font-bold leading-none text-forest-text"
          style={{ fontSize: numberSize }}
        >
          {fmtRating(score)}
        </span>
        <span className="mt-0.5 font-mono text-xs font-semibold leading-none text-faint">
          / 5
        </span>
      </span>
    </span>
  );
}
