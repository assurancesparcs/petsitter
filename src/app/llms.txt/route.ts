import { BRAND, BASE_URL } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";

// Route Handler /llms.txt — description factuelle, lisible par les moteurs de
// réponse IA (Claude, ChatGPT, Perplexity). Markdown en text/plain. Marque,
// URL et prix tirés des libs (aucune valeur en dur). Support 100 % écrit :
// aucun vocabulaire téléphone. Statique.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${BRAND}

${BRAND} est une plateforme française de mise en relation entre propriétaires d'animaux et pet sitters indépendants, partout en France. Son modèle est à 0 % de commission : le pet sitter fixe librement son tarif et le touche à 100 %, sans prélèvement sur la garde. Le seul revenu de la plateforme est un frais de mise en relation forfaitaire, payé par le propriétaire uniquement lorsqu'un pet sitter a accepté la garde. Aucun débit n'a lieu tant qu'aucun pet sitter n'a accepté : la carte est simplement enregistrée. L'identité de chaque pet sitter est vérifiée avant qu'il devienne visible, et les avis sont vérifiés (adossés à une garde réellement réglée via la plateforme) — aucun faux avis. Le support est 100 % en ligne et par écrit, sans ligne vocale.

## Services

- Visite à domicile (idéale pour les chats : l'animal reste chez lui)
- Garde au domicile du propriétaire
- Garde chez le pet sitter
- Promenade

Chat, chien et NAC (nouveaux animaux de compagnie) sont traités à stricte égalité.

## Tarifs de mise en relation

- ${PRICING.passCourt.label} : ${PRICING.passCourt.price} (${PRICING.passCourt.detail.toLowerCase()})
- ${PRICING.passSejour.label} : ${PRICING.passSejour.price} (${PRICING.passSejour.detail.toLowerCase()})
- ${PRICING.passTrimestre.label} : ${PRICING.passTrimestre.price} (${PRICING.passTrimestre.detail.toLowerCase()})

Chaque Pass se paie une fois : aucune reconduction, ni tacite ni automatique, aucun prélèvement récurrent. Le Pass ponctuel est déduit automatiquement de la durée de la garde, il ne se choisit pas. Le tarif de la garde revient en entier au pet sitter.

## Pages services

- [Visite à domicile (idéale pour les chats)](${BASE_URL}/services/visite-a-domicile)
- [Garde à votre domicile](${BASE_URL}/services/garde-a-domicile)
- [Garde chez le pet sitter](${BASE_URL}/services/garde-chez-le-pet-sitter)
- [Promenade de chien](${BASE_URL}/services/promenade-chien)

## Pages clés

- [Notre modèle](${BASE_URL}/notre-modele)
- [Questions fréquentes](${BASE_URL}/faq)
- [Rechercher un pet sitter](${BASE_URL}/recherche)
- [Guides](${BASE_URL}/guides)
- [Le Journal](${BASE_URL}/blog)
- [À propos](${BASE_URL}/a-propos)
- [Charte de qualité](${BASE_URL}/charte-qualite)
- [Devenir pet sitter](${BASE_URL}/devenir-pet-sitter)
- [Comparatif](${BASE_URL}/comparatif)
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
