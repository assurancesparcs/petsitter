# Consignes pour Claude — AlloPetsitter (petsitter)

Mémo interne du projet. Rien de ce fichier n'est publié sur le site.

## Décisions validées par le fondateur (Johann)

### Partenariat SPA — décidé le 19/07/2026, à activer BEAUCOUP PLUS TARD
- **Décision** : don sous forme de **montant fixe par Pass** (et non « 10 % de la recette ») :
  1 € par Pass Court (14,90 €) · 2 € par Pass Séjour (39 €) · 3 € par Pass 3 mois (59 €).
- **Partenaire** : la **SPA nationale** (Société Protectrice des Animaux, Paris — détentrice de la
  marque), avec clause demandant le fléchage des dons vers les refuges SPA des zones ouvertes.
- **INTERDIT tant que la convention n'est pas signée** : aucun affichage public — ni le nom « SPA »,
  ni logo, ni montant, ni « en partenariat avec… » (marque protégée + art. L.121-2 code conso).
  Ne RIEN publier sur le site ni communiquer tant que Johann ne le demande pas explicitement.
- Qualification juridique probable : **parrainage** (pas mécénat 60 %) car affichage commercial —
  à valider par l'expert-comptable. Signer après immatriculation de la société.
- Séquence prévue : contact SPA (formulaire partenariat entreprise) → immatriculation → convention
  (1 an renouvelable, plancher annuel, versements trimestriels, clause de sortie, droit de publier
  les montants) → affichage sobre à l'ouverture → rapport de transparence annuel (Pass vendus ×
  don unitaire, attestation SPA). Si la signature tarde : ouvrir sans le volet don, l'ajouter après.
- Maquettes de référence : scratchpad `spa/maquette-1-site.html` et `spa/maquette-2-transparence.html`
  (session du 19/07/2026).

## Rappels permanents
- Positionnement : anti-bullshit — pas de faux avis, pas de compteurs gonflés, pas de fausse urgence,
  aucune statistique inventée, montants vérifiables uniquement.
- Interdit lexical (CI `npm run lint:lexique`) : jamais « assurance/assureur/RC Pro/ORIAS », jamais
  de vocabulaire de possession (« nos pet sitters »), pas de dark patterns.
- Prod = branche `main` (petsitter-iota.vercel.app, domaine réservé : allo-pet-sitter.fr).
- Flag `prelaunch_live` (src/lib/flags.ts) : landing pré-lancement active ; repasser à `false`
  en janvier 2027 pour restaurer la marketplace.
- Avant tout commit : `npm run lint:lexique` && `npm run lint` && `npm run build`.
