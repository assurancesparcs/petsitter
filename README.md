# AlloPetsitter (nom de code : PROJET_PATTE)

**Marque : AlloPetsitter** (graphie officielle unique — un mot, A et P majuscules) · Domaine réservé : **allo-pet-sitter.fr** (avec tirets). La marque (nom) reste « AlloPetsitter » ; seule l'URL/les e-mails portent les tirets. Source unique : `src/lib/brand.ts` (`DOMAIN`/`BASE_URL`).

Plateforme française de **mise en relation** entre propriétaires d'animaux et pet sitters indépendants — le pet sitter fixe son tarif, est payé en direct et touche 100 % ; l'argent de la garde ne transite jamais par la plateforme. Seconde ligne de revenus : la distribution d'assurance (entité MIA sous mandat du cabinet de courtage du fondateur).

## État du projet

**Phase P0 — Plan avant code.** Voir [`PLAN.md`](./PLAN.md) (v1.3, revu par 4 agents experts ; marque tranchée).
Aucun code ne sera écrit avant validation du plan par le fondateur (Règle 1 du brief).

## Règles du dépôt

- Projet **strictement isolé** : aucun code, charte ou convention importé d'un autre projet (Règle 0).
- Vocabulaire de mise en relation uniquement — jamais « nos pet sitters », « notre service de garde » (risque de requalification ; lint CI bloquant prévu en P1).
- Jamais de secrets dans le code. Pas de faux avis, pas de statistiques inventées, pas de tarifs en dur (pricing en base).
- RGPD/CNIL by design.
