/**
 * Contraintes structurées d'une demande : puces pré-définies UNIQUEMENT
 * (aucun texte libre avant paiement — PLAN §5-A).
 */
export const CONSTRAINT_KEYS = [
  { key: "fearful", label: "Animal craintif ou peu sociable" },
  { key: "medication", label: "Traitement médical à donner" },
  { key: "garden_required", label: "Extérieur clôturé indispensable" },
  { key: "senior", label: "Animal âgé (soins doux)" },
  { key: "multiple", label: "Plusieurs animaux à garder ensemble" },
] as const;

export const CONSTRAINT_LABELS: Record<string, string> = Object.fromEntries(
  CONSTRAINT_KEYS.map((c) => [c.key, c.label]),
);
