/**
 * Composant serveur réutilisable pour injecter des données structurées
 * schema.org (JSON-LD). C'est le motif standard et sûr pour du balisage de
 * confiance : le JSON est sérialisé côté serveur, jamais alimenté par une
 * saisie utilisateur. Voir aussi le motif inline de src/app/faq/page.tsx.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
