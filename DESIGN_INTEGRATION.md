# Intégration de la charte Claude Design — AlloPetsitter

> Claude Design travaille **en parallèle** sur l'identité (logo, palette, typos,
> composants). Ce document décrit où sa livraison s'intègre, pour que le
> remplacement des visuels provisoires soit **un swap, pas une réécriture**.

## Le principe : tout passe par des tokens

Aucune couleur, police ou dimension n'est écrite en dur dans les composants.
Un seul fichier définit les tokens : **`src/app/globals.css`** (bloc `@theme`).
Les composants n'utilisent que des classes sémantiques (`bg-primary`,
`text-ink`, `border-line`, `rounded-card`…). Changer les tokens = changer tout
le site.

## Ce que Claude Design livre → où ça se branche

| Livraison Claude Design | Point d'intégration |
|---|---|
| Palette (couleurs AA/AAA) | Valeurs `--color-*` dans `globals.css` (@theme) |
| Typographies (titres + texte, libres de droits) | `next/font` dans `layout.tsx` + `--font-*` |
| Rayons, ombres, échelle | `--radius-*` et utilitaires dans `globals.css` |
| Logo (SVG + favicon 16px + déclinaisons) | `src/app/icon.svg` / `apple-icon` + composant `Header` |
| Bloc Transparence (composant héros) | à créer `src/components/BlocTransparence.tsx` |
| Badge Score de Fiabilité (+ variante « Nouveau ») | à créer `src/components/ScoreFiabilite.tsx` |
| Cartes sitter, boutons, badges, formulaires | remplacent les styles provisoires des composants existants |

## Statut des composants actuels

- **Structurels, à garder** : `Header`, `Footer`, layout, pages (le contenu et
  la logique restent ; seul l'habillage change avec les tokens).
- **Visuels provisoires, à restyler** : palette actuelle (vert/ambre/crème) =
  placeholder, à remplacer par la charte. Aucune décision de marque n'y est
  figée.

## Rappels pour la livraison (cf. briefs/BRIEF_CLAUDE_DESIGN_v3.md)

- **LOT A publiable** vs **LOT B conditionné à `insurance_live`** : ne jamais
  intégrer d'asset LOT B (assurance/RC Pro) tant que le flag est éteint — le
  lint lexical CI le bloquerait de toute façon.
- Vocabulaire de mise en relation strict (jamais « nos pet sitters »).
- Tokens exportables Tailwind attendus : fournir les valeurs, pas des captures.
