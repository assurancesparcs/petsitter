# Handoff : AlloPetsitter — Identité, produit & contenus (France)

## Overview
AlloPetsitter est une plateforme de **mise en relation** entre propriétaires d'animaux (chats, chiens, NAC) et **pet sitters** vérifiés, en France. Modèle : **0 % de commission sur la garde** — le pet sitter touche 100 % ; le revenu de la plateforme vient de la **mise en relation** (Pass / abonnement). Le positionnement est **honnête, adulte, direct sur l'argent, anti-dark-patterns**, et traite **le chat à égalité stricte avec le chien** (+ les NAC).

Ce package couvre l'identité de marque, les écrans produit (mobile + desktop), les objets de transparence, les documents, les contenus social, un pitch deck investisseur, et un volet assurance **non publiable en l'état**.

## About the Design Files
Les fichiers `.dc.html` de ce bundle sont des **références de design réalisées en HTML** — des prototypes qui montrent l'intention visuelle et le comportement, **pas du code de production à copier tel quel**. La tâche est de **recréer ces designs dans l'environnement du codebase cible** (React/Next, Vue, SwiftUI, natif…) avec ses patterns et librairies établis. Si aucun environnement n'existe encore, choisir le framework le plus adapté (recommandation : **React + TypeScript + Tailwind**, cf. tokens ci-dessous) et y implémenter les designs.

Chaque fichier est un « Design Component » autonome : il s'ouvre dans un navigateur mais s'appuie sur trois runtimes présents dans ce dossier (`support.js`, `image-slot.js`, `deck-stage.js`). **Ne pas porter ces runtimes en production** — ce sont des outils de prototypage. Extraire des fichiers uniquement le **markup, les valeurs et le comportement**.

## Fidelity
**Haute fidélité (hifi).** Couleurs, typographie, espacements, rayons et copies sont définitifs. Recréer l'UI au pixel près avec les librairies du codebase. Les photos d'animaux sont des placeholders remplaçables (voir Assets).

---

## ⚠️ Règles métier NON NÉGOCIABLES (à respecter dans l'implémentation)

1. **100 % en ligne, aucun téléphone.** Malgré le nom « AlloPetsitter », le service ne passe **jamais** d'appel et ne propose aucun numéro. Le support est **chatbot / écrit**. Ne jamais écrire de copie du type « on décroche », « appelez-nous », « ligne téléphonique ». Le combiné du logo est un **clin d'œil de marque uniquement**.
2. **Langage strict « mise en relation ».** La plateforme **ne garde pas** les animaux : le service est *proposé et exécuté par le pet sitter, en toute indépendance*. Ne jamais laisser entendre qu'AlloPetsitter est le prestataire de garde.
3. **LOT A vs LOT B.** Tout ce qui est marqué **LOT A** est publiable. Le fichier **`LOT B - Assurance (NE PAS PUBLIER)`** ne doit **pas** être mis en ligne tant que le flag `insurance_live` n'est pas activé (immatriculation ORIAS effective **et** contrat groupe signé). N° ORIAS renseigné : **12066667**. Le pitch deck est **privé/confidentiel**.
4. **On aide, on ne se substitue pas.** Formulation validée : « **Nous vous aidons à trouver la bonne personne** » (jamais « nous vous trouvons… »).
5. **Anti-dark-patterns (charte opposable).** Interdits : fausse urgence, case pré-cochée, prix barré fictif, frais cachés au checkout, conversion silencieuse. Résiliation **en 3 clics**, jamais plus longue que l'abonnement. Rappel **J-3** avant tout prélèvement. **Zéro faux avis / score gonflé** : sous le seuil, badge « Nouveau » assumé.
6. **Paiement.** Empreinte carte au dépôt = **0 € débité** ; débit **uniquement** quand un pet sitter accepte. Un seul cas de remboursement : sitter confirmé qui annule sans remplaçant Plan B → remboursement **proactif** de la mise en relation.
7. **Chat = Chien = NAC.** Égalité stricte dans la copie, les filtres, l'imagerie.
8. **Masquage des coordonnées avant paiement (anti-désintermédiation).** Dans la messagerie, tant que le paiement n'est pas effectué, **bloquer/masquer automatiquement tout échange de numéro de téléphone, adresse postale et e-mail** (détection + caviardage côté serveur, jamais seulement côté client). Les coordonnées ne se débloquent qu'**après paiement** (empreinte débitée à l'acceptation). Afficher un message clair quand un contenu est masqué (« Les coordonnées sont visibles après confirmation de la garde »). Objectif : empêcher la sortie de plateforme avant la mise en relation payante.

---

## Design Tokens

### Couleurs (hex exacts)
**Fonds & surfaces**
- Page (canvas clair) : `#EDE6DA`
- Surface / carte : `#FBF8F3`
- Surface secondaire / footer : `#F3EDE3`
- Encre profonde (fonds sombres) : `#22201C` — variante deck `#1A1815`

**Texte**
- Titre / corps foncé : `#22201C`
- Corps : `#423E37`
- Secondaire : `#6B6459`
- Tertiaire / légende : `#8A8175`
- Légende sur photo : `#A79274`

**Primaire — Vermillon (CTA, accents)**
- Base : `#DD5A3F` · Hover/plus foncé : `#C24A31`
- Foncé (texte sur tint) : `#7A2E1C` / `#9C4B36` · sur vermillon : `#3A1710`
- Tint clair : `#FBEEE9` · tint chaud : `#FBF3EE` · bordure tint : `#F0D3C9` / `#E8D3C6`

**Vert forêt (confiance, transparence, succès)**
- Forêt : `#1F4A3D`
- Succès / « 100 % » : `#2F7D57`
- Texte vert : `#1E6B45` · secondaire : `#42604E`
- Tint : `#E7F1E9` · bordure : `#BEDDC8`
- Sur fond forêt : `#C6DECF` / `#A8CBB6` / `#7FA592`

**Neutres / bordures**
- `#E4DCCF` (bordure carte) · `#EFE7DA` (séparateur) · `#E9E1D4` · `#C9C1B4` (bordure discrète, placeholder)

**Alerte (LOT B « NE PAS PUBLIER »)** : fond `#7A1E10`, texte blanc.

### Typographie
- **Display / titres** : `Bricolage Grotesque` — poids 600/700/800, `letter-spacing:-0.02em` à `-0.03em` sur les gros titres.
- **Corps / UI** : `Hanken Grotesk` — 400/500/600/700, `line-height` 1.4–1.6.
- **Chiffres / mono** (prix, scores, kickers, mentions) : `Space Mono` — 400/700, souvent `letter-spacing:0.08–0.12em; text-transform:uppercase` pour les kickers.
- Échelle titres desktop : hero 66px, section 42px, sous-section 34–36px. Mobile : titres 24–30px. Deck : 72–104px. Corps 13–16px (jamais < 12px).

### Rayons
- Boutons : 12–14px · champs : 12px · pills / badges : `999px`
- Cartes : 16–24px · modales / feuilles mobiles : 28–34px
- **Logo (marque)** : carré arrondi asymétrique avec « queue » de bulle → `border-radius: 16px 16px 16px 5px` (grande taille) ; réduire proportionnellement (`9px 9px 9px 3px` en nav, `8px 8px 8px 2px` en favicon).

### Ombres
- Carte élevée : `0 20px 60px rgba(60,40,20,0.16)` à `0.18`
- Carte réservation / panneau : `0 12px 36px rgba(60,40,20,0.08)`
- Barre de recherche : `0 16px 44px rgba(60,40,20,0.10)`

### Espacement
Base 4px. Paddings usuels : cartes 12–28px, sections desktop 44–110px, gouttières grille 12–28px. Utiliser **flex/grid + `gap`** (pas de marges inline).

---

## Le logo
Bulle de conversation (carré arrondi vermillon `#DD5A3F` avec queue en bas-gauche) contenant un **combiné de téléphone blanc** (SVG). Piste retenue : **« La Bulle »**. Le combiné évoque « Allo » (marque) sans impliquer d'appel réel. Wordmark « AlloPetsitter » en Bricolage Grotesque 800. Décliné en : nav, favicon 16/40px, monochrome, sur fond sombre, vertical, footer. SVG du combiné : voir n'importe quel fichier (path `M6.62 10.79c1.44 2.83…`).

---

## Écrans / Vues

### Marque
- **Charte AlloPetsitter — LOT A** : cover + positionnement, 3 pistes logo (A retenue), palette AA, typo, radius/ombres, composants (boutons/champs/badges), **Bloc Transparence** (héros, 3 variantes), **Score de Fiabilité** (anneau conique + badge « Nouveau » sous seuil), réassurance, cartes sitter, tokens CSS/Tailwind, charte anti-dark-patterns.

### Produit — mobile (LOT A)
- **Home** : hero, recherche (lieu/dates/**espèce chat·chien·NAC**/service), bande « 0 € aujourd'hui », 3 tarifs, comment ça marche, Bloc Transparence, 3 sitters, footer.
- **Ecran Depot** : dépôt de demande, « 0 € aujourd'hui / empreinte carte », + état **échec débit 3DS**.
- **Ecran Deblocage** : déblocage du contact après acceptation (prénom+initiale → identité complète).
- **Tunnel Offre & Resiliation** : 3 offres (Pass Séjour 39 € / Pass Court 14,90 € / Abonnement 19 €/mois), page `/resilier` en **3 clics**.
- **Resultats & Fiche Sitter** : liste (score ou « Nouveau », « reçoit 100 % ») + fiche (Bloc Transparence en évidence, calendrier, avis réels).

### Produit — desktop (LOT A) — parcours complet de bout en bout
- **Home Desktop** (1440px) : header+nav, hero 2 colonnes, barre de recherche horizontale, bande 0 €, tarifs, how-it-works + Bloc Transparence, sitters, footer.
- **Recherche Desktop** : **résultats** (rail de filtres 270px + grille 3 col.) et **fiche sitter** (2 colonnes, carte de réservation **sticky** avec Bloc Transparence).
- **Depot & Deblocage Desktop** : dépôt de demande (form + récap « 0 € »), **échec débit 3DS** (modale), **déblocage** (contact révélé + reçu).
- **Tunnel & Resiliation Desktop** : tunnel d'offre (3 offres + récap 0 €) et page `/resilier` (3 clics + pause proposée).
- **Transparence & Recu Desktop** : `/nos-chiffres` (dashboard, états « seuil non atteint »), reçu détaillé, remboursement proactif.
- **Landing Sitter Desktop** : acquisition sitters (hero 0 %, waitlist, comparatif 300/255 €, 3 raisons, how-it-works, CTA).
- **Notre Modele & Limites Desktop** : `/notre-modele` (revenus ligne par ligne) + « Ce qui n'est PAS couvert » (limites assumées).
- **Kit Sitter Desktop** : onboarding pet sitter (profil, tarifs, ACACED/statut, bonnes pratiques — sans RC Pro).
- **Guide Proprietaire Desktop** : rencontre préalable, checklist de départ, « 0 € tant que personne n'a dit oui ».
- **One-pager Partenariats Desktop** : vétos/toiletteurs/refuges/animaleries — partenariat en 3 points.
- **Social Desktop** : board large du kit de contenu (système + 9 posts + 5 scripts).
- **Charte Qualite Desktop** : 6 engagements opposables + 5 interdits anti-dark-patterns.

### Espace pet sitter (LOT A) — parcours sitter complet
- **Onboarding Sitter Desktop** : création de profil en 4 étapes (identité/vérif · animaux & services · tarifs · photo & bio), rappel « 0 % à vie ».
- **Profil Sitter Desktop** : bio, animaux (chat/NAC/chien), tarifs « 100 % pour vous », galerie, score de fiabilité, revenus du mois, complétude profil.
- **Demandes Recues Sitter Desktop** : onglets À traiter/Acceptées/Passées, demandes avec montant « 100 % pour vous » et badge Plan B, accepter/refuser.
- **Revenus Sitter Desktop** : KPI (encaissé, 0 € commission, gardes, tarif moyen), graphe mensuel, tableau des versements, export CSV.
- **Deblocage Sitter Desktop** : miroir sitter du déblocage — contact client révélé après acceptation, revenu 100 %, prochaines étapes.
- **Espace Sitter AlloPetsitter** (mobile) : profil · demandes · revenus, barre d'onglets.

### Messagerie & activité (LOT A)
- **Messagerie Desktop** : 3 colonnes (liste, fil, détail garde) + **état avant paiement** avec coordonnées masquées (Règle 8).
- **Messagerie AlloPetsitter** (mobile) : liste, fil confirmé, état avant paiement (bandeau + caviardage).
- **Notifications Desktop** : acceptation, rappel J-3, message, remboursement proactif, Plan B, nouveau sitter NAC.
- **Confirmation Demande Desktop** : étape 3/3 du tunnel propriétaire, « 0 € débité », suite en 3 temps.
- **Avis Client Desktop** : laisser un avis vérifié (garde réelle), bloc « zéro faux avis / zéro score gonflé », impact score.
- **Historique Gardes Desktop** : « Mes gardes » propriétaire — à venir + passées (reçus, avis).

### Interne / back-office (LOT A)
- **Panneau Admin Desktop** : tableau de bord modération — vérifications d'identité, **modération chat / masquage PII avant paiement (Règle 8)**, litiges & Plan B, remboursements, signalements (dont photo stock). Outil interne, non public.

### Navigation
- **AlloPetsitter — Index** : page d'accueil reliant tous les écrans (liens relatifs `.dc.html`), groupés par section avec badges LOT A / PRIVÉ / NE PAS PUBLIER. **Point d'entrée recommandé** — ouvrir ce fichier en premier.

### Transparence (LOT A)
- **Recu & Nos Chiffres** : reçu de mise en relation ; page `/nos-chiffres` avec état honnête « —— seuil non atteint ».
- **Rappel, Pause, Remboursement** : e-mail rappel **J-3**, écran **pause d'abonnement**, notification **remboursement proactif**.
- **Landing Sitter, Notre Modele & Limites** : landing sitter waitlist (comparatif **300 € vs 255 €** sur 10 nuits), page `/notre-modele` (revenus ligne par ligne), page **« Ce qui n'est PAS couvert »**.

### Documents (LOT A, imprimables)
- **One-pager & Charte Qualite** : one-pager partenariats (vétos/toiletteurs/refuges/animaleries) + charte de qualité (engagements + interdits).
- **Kit Sitter & Guide Proprietaire** : kit de bienvenue sitter (profil, tarifs, ACACED/statut, bonnes pratiques — **sans section RC Pro**) + guide propriétaire (rencontre préalable, checklist de départ).

### Contenus
- **Social — Templates, 9 Posts & 5 Scripts** : système de templates (feed 1080² / story 1080×1920), 9 posts (comparatif chiffré, série chat, désistement/Plan B, « vous ne payez que si… », 0 % commission, 100 % au sitter, NAC, résiliation 3 clics, zéro faux avis), 5 scripts vidéo (20–40 s, hook 2 s, sous-titré).

### Investisseurs — PRIVÉ
- **Pitch Deck Investisseur — PRIVÉ** (13 slides, 1920×1080, `deck-stage`) : marché, douleurs, solution, produit, **lignes de revenus** (mise en relation active + assurance conditionnée), différenciation, concurrence, GTM, roadmap, atout assurance (5 % FR / 25 % UK / 91 % SE), équipe, ask. Ligne assurance **conditionnée ORIAS + contrat**.

### Assurance — NE PAS PUBLIER (LOT B)
- **LOT B - Assurance** : option **Pack Sérénité** (jamais pré-cochée, commission affichée en €, mentions ORIAS/DDA), parcours de souscription (conseil), landing **RC Pro incluse** côté sitter + **encart de périmètre**, contenu pédagogique (coût chirurgie, factuel). Bandeau rouge permanent. À publier seulement sous `insurance_live`.

---

## Interactions & Behavior
- **Recherche** : sélection espèce (chip active vermillon `#FBEEE9`/`#C24A31`, inactive bordure `#E4DCCF`), filtres, tri.
- **Score de Fiabilité** : anneau `conic-gradient(#2F7D57 0turn Xturn, #E7F1E9 …)` avec disque blanc central portant le chiffre (Space Mono). Sous le seuil d'avis → **remplacer l'anneau par le badge « ✦ Nouveau »** (bordure `#DD5A3F`, texte `#C24A31`).
- **Boutons** : hover primaire `#C24A31 → #DD5A3F` ; secondaire outline `#22201C` → fond plein au hover.
- **Champs** : focus `border-color:#DD5A3F; outline:none`.
- **Paiement** : dépôt = 0 € (empreinte) → à l'acceptation, débit + reçu ; échec 3DS = écran d'erreur dédié.
- **Résiliation** : parcours 3 étapes max ; proposer la **pause** comme alternative non-piégeuse (reprise auto datée).
- **Deck** : navigation clavier, rail de miniatures, notes orateur (`data-speaker-notes`), impression PDF (via `deck-stage`).
- **Responsive** : deux jeux fournis (mobile ~402px de large / desktop 1440px). Adapter aux breakpoints du codebase.

## State Management
- Recherche : `{ location, dates, species: 'chat'|'chien'|'nac', service, filters }`
- Demande de garde : `{ status: 'draft'|'submitted'|'accepted'|'declined'|'paid', cardHold: bool }` — débit déclenché à `accepted`.
- Abonnement : `{ plan, status: 'active'|'paused'|'cancelled', nextChargeDate, pauseUntil }` — rappel J-3, pause, résiliation.
- Sitter : `{ reliabilityScore|null, isNew: bool, verified: bool, species[], services[] }` — `isNew` quand nombre d'avis < seuil.
- Assurance (LOT B, gated) : `{ insuranceLive: bool }` — masque tout le volet tant que `false`.

## Assets
- **Photos d'animaux** : placeholders remplissables (`<image-slot>`) **pré-remplis** avec des photos **Pexels** (licence gratuite, **sans attribution obligatoire**). IDs utilisés : chat `16400873`, `20324851`, `14721008` ; chien `13074581` ; NAC/lapin `19943347`, `4588071`, `15068230`. URL type : `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg`. En production, **remplacer par de vraies photos d'utilisateurs** (le brief interdit le stock « carte postale »).
- **Polices** : Google Fonts — Bricolage Grotesque, Hanken Grotesk, Space Mono.
- **Icônes** : SVG inline minimal (combiné du logo, coches). Utiliser la librairie d'icônes du codebase pour le reste.
- **Aucun asset de marque tierce** (Règle 0 du brief : tout part de zéro).

## Files (dans ce dossier)
Tous les `.dc.html` listés ci-dessus sont inclus. Runtimes de prototypage (ne pas porter en prod) : `support.js`, `image-slot.js`, `deck-stage.js`. Pour lire un design : ouvrir le `.dc.html` dans un navigateur, ou lire le markup directement (styles inline = valeurs exactes à reprendre).
