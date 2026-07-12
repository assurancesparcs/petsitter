# Référence tokens AlloPetsitter (pour l'intégration des maquettes)

Classes Tailwind disponibles (définies dans `src/app/globals.css` @theme).
**N'utiliser QUE ces classes — jamais de couleur en dur.**

## Couleurs → classes
| Rôle | Classe fond / texte / bordure | Hex |
|---|---|---|
| Page (canvas) | `bg-cream` | #EDE6DA |
| Carte / surface | `bg-surface` | #FBF8F3 |
| Surface 2 / footer | `bg-surface-2` | #F3EDE3 |
| Encre (titres, fond sombre) | `bg-ink` / `text-ink` | #22201C |
| Corps | `text-body` | #423E37 |
| Secondaire | `text-muted` | #6B6459 |
| Légende | `text-faint` | #8A8175 |
| **Primaire vermillon (CTA)** | `bg-primary` `text-primary` `border-primary` | #DD5A3F |
| Primaire hover | `bg-primary-dark` | #C24A31 |
| Primaire tint (fond doux) | `bg-primary-tint` | #FBEEE9 |
| Primaire bordure tint | `border-primary-border` | #F0D3C9 |
| **Vert forêt (confiance, sections sombres)** | `bg-forest` `text-forest` | #1F4A3D |
| Succès / « 100 % » | `text-success` | #2F7D57 |
| Texte vert | `text-forest-text` | #1E6B45 |
| Vert tint (fond doux) | `bg-forest-tint` | #E7F1E9 |
| Vert bordure | `border-forest-border` | #BEDDC8 |
| Texte sur fond forêt | `text-on-forest` | #C6DECF |
| Bordure carte | `border-line` | #E4DCCF |
| Séparateur | `border-line-2` | #EFE7DA |

## Règles de mapping (IMPORTANT)
- **CTA / boutons d'action** = `bg-primary` (vermillon), texte `text-surface`, hover `bg-primary-dark`.
- **Sections sombres « confiance / engagements / transparence »** = `bg-forest` (vert), texte `text-surface` ou `text-on-forest`. (⚠️ PAS `bg-primary` : le vermillon est réservé aux actions.)
- **Chiffres, prix, scores, kickers** = police mono → classe `font-mono` (ou classe `.kicker` pour les sur-titres en capitales espacées).
- Fond de page : `bg-cream`. Cartes : `bg-surface` + `border border-line` + `rounded-[20px]`.

## Typographies → classes
- Titres : `font-display` (Bricolage Grotesque, déjà appliqué par défaut sur h1/h2/h3). Poids `font-bold`/`font-extrabold`, `tracking-[-0.02em]`.
- Corps / UI : `font-sans` (Hanken Grotesk, défaut du body).
- Chiffres / mono : `font-mono` (Space Mono).

## Rayons
Boutons `rounded-[14px]` · champs `rounded-[12px]` · pills/badges `rounded-full` · cartes `rounded-[20px]` · feuilles `rounded-[30px]`.

## Composants partagés déjà créés (réutiliser, ne pas dupliquer)
- `@/components/Logo` — logo de marque.
- `@/components/BlocTransparence` — bloc « Vous versez / reçoit 100 % / commission 0 € ».
- `@/components/Header`, `@/components/Footer` — déjà restylés.

## Règles métier NON négociables (README design)
- Vocabulaire de **mise en relation** : jamais « nos pet sitters », « nous gardons », « nous vous trouvons » → dire « **Nous vous aidons à trouver la bonne personne** ». (Lint CI bloquant.)
- **Aucune copie téléphonique** (« on décroche », « appelez-nous »…) : le combiné du logo est un clin d'œil, le service est 100 % en ligne.
- **LOT A seulement** : zéro mention assurance / RC Pro / ORIAS (lint CI bloquant).
- Anti-dark-patterns : pas de fausse urgence, pas de case pré-cochée, résiliation en 3 clics, badge « Nouveau » assumé (jamais de score gonflé).
- Prix : Pass Séjour 39 € · Pass Court 14,90 € · Abonnement 19 €/mois sans engagement.
