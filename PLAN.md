# PLAN.md — PROJET_PATTE — marque arbitrée : **AlloPetsitter**
### Version 1.5 — Juillet 2026.
**Statut : P0 VALIDÉ par le fondateur (marque AlloPetsitter, paiement Stripe, commission assurance 20 %, « continue le reste ») → PHASE P1 (FONDATIONS) EN COURS.** Q3 (RC Pro groupe) et Q4 (entité juridique) en suspens : le flag `insurance_live` reste éteint et les pages légales en gabarit tant que l'entité n'est pas fournie — aucun encaissement n'intervient avant P3 de toute façon.

> **v1.5** : **Q1 tranchée — commission assurance : 20 %.** Validation P0 et lancement de P1.
> **v1.1** : ce plan a été soumis à une revue croisée par 4 agents experts indépendants (CEO marketplace · juriste assurance/consommation/plateformes · CTO · CMO growth/SEO). Leurs amendements sont intégrés ci-dessous ; les 3 corrections les plus importantes sont résumées au §8.
> **v1.2** : ajout du §9 « La transparence comme produit » (validé par le fondateur) — les preuves de transparence anti-arnaque et la 3ᵉ ligne de revenus « Boîte à outils Sitter Pro ». Écartés à ce stade, sur décision du fondateur : l'assistant crédit d'impôt et l'affiliation étiquetée.
> **v1.4** : **Q14 tranchée par le fondateur** — les réservations anticipées (déposées longtemps avant la garde) sont indispensables à l'organisation des deux parties → le mode SetupIntent + débit off-session à l'acceptation est confirmé comme **mode principal** de l'architecture de paiement (§3.1). **Q2 partiellement renseignée** : n° ORIAS du cabinet mandant fourni : **12066667** (à vérifier au registre : https://www.orias.fr — « Consulter le registre »), autorité de contrôle : ACPR.
> **v1.3** : **Q5 tranchée par le fondateur — marque : AlloPetsitter** (après analyse croisée SEO Google + référencement IA, disponibilité RDAP vérifiée le 12/07/2026). Graphie officielle unique : « AlloPetsitter » (un mot, A et P majuscules), partout — site, GBP, réseaux, presse, CGU, schema.org `Organization`. Domaine principal : **allopetsitter.fr** ; allopetsitter.com en redirection 301. Dans le code, la marque reste une constante unique (`lib/brand.ts`), désormais valorisée « AlloPetsitter ». Le placeholder `[MARQUE]` dans le reste de ce document se lit désormais « AlloPetsitter ».

---

## 0. ⛔ Signalement obligatoire (Règle 0 — Isolation)

Conformément à la Règle 0 (« si un contexte d'un autre projet apparaît, tu l'ignores et tu me le signales ») :

- ✅ **Résolu** : le projet vit désormais dans son **dépôt Git neuf et dédié** → https://github.com/assurancesparcs/petsitter (la version initiale du plan avait transité par le monorepo `assurances-parcs` comme simple véhicule de validation ; cette copie temporaire a été supprimée).
- Restent à créer, propres à la nouvelle entité : **base de données neuve, projet Vercel neuf, compte Stripe dédié** (phase P1, après validation).
- J'ignore intégralement le contenu, les chartes et les conventions des autres projets. Seules les exigences transverses de vos consignes générales (RGPD/CNIL strict, pas de secrets dans le code, pas de faux avis ni de statistiques inventées) sont conservées car elles convergent avec le brief.

---

## 1. Reformulation — preuve de compréhension

### 1.1 Ce que nous construisons
Une plateforme web française de **mise en relation** entre propriétaires d'animaux et pet sitters indépendants. Nous intervenons **en amont** de la prestation : le pet sitter propose, contracte et exécute la garde en toute indépendance, à son tarif, payé **directement** par le propriétaire. **L'argent de la garde ne transite jamais par nous.** Notre produit s'arrête à l'instant où les deux parties peuvent contracter entre elles. Tout vocabulaire de possession ou de subordination (« nos pet sitters », « notre service de garde ») est un **bug bloquant** — risque de requalification.

### 1.2 Les deux lignes de revenus
1. **La mise en relation** (le canal) : Pass ponctuel (~39 € séjour / ~14,90 € prestation courte) ou abonnement (~19 €/mois sans engagement), débité **uniquement à l'acceptation ferme d'un sitter** (empreinte carte au dépôt, capture à l'acceptation, annulation automatique sous 72 h sans candidat — **on ne rembourse pas, on n'encaisse pas**). Inscription sitter gratuite à vie, 0 % de commission, le sitter touche 100 %.
2. **La distribution d'assurance** (la marge et le moat) : la nouvelle entité, **immatriculée MIA sous le mandat du cabinet de courtage du fondateur (ORIAS)**, distribue (a) l'**assurance santé animale** aux propriétaires — captés au pic exact de leur anxiété, sur un marché pénétré à ~5-11 % —, (b) le **Pack Sérénité** en option de garde (assistance véto 24/7 + couverture prestation, jamais pré-coché), et (c) offre à **tout sitter actif une RC Pro groupe gratuite**, valable uniquement sur les gardes déclarées : arme d'acquisition, verrou anti-fuite et barrière à l'entrée en un seul objet. La LTV assurance (commission récurrente sur ~300 €/an de prime, pluriannuelle) est d'un ordre de grandeur supérieur à la LTV mise en relation (~40-80 €/an, saisonnière). **La marketplace est le canal d'acquisition ; l'assurance est le business.**

### 1.3 Les deux piliers de différenciation
1. **Transparence radicale des prix** : Bloc Transparence sur chaque fiche et devis (`Vous versez X € · Le sitter reçoit X € (100 %) · Commission [MARQUE] : 0 €`), prix affichés dès la home, page publique `/notre-modele` expliquant notre rémunération ligne par ligne, assurance comprise. Anti-Rover (opacité des frais), anti-Holidog (engagement caché → nos 4 interdits absolus : jamais d'engagement minimum, jamais de reconduction piégeuse, jamais de coût caché, jamais de débit sans acceptation).
2. **Fiabilité garantie (anti-désistement)** : Score de Fiabilité public et non manipulable, double confirmation + rappels J-7/J-2/J-1, calendrier tenu à jour comme condition d'accès au flux de demandes, **Plan B** (alerte prioritaire aux sitters compatibles en cas d'annulation — obligation de moyens, objectif < 12 h), rencontre préalable gratuite proposée comme standard. Le désistement de dernière minute est la douleur n°1 du marché : c'est notre vrai produit.
   ⚠️ *Formulation volontairement prudente : chaque standard est une condition d'accès au service de mise en relation, jamais une directive d'exécution de la garde (faisceau d'indices de requalification — cf. §5, risque 1).*

Positionnement transversal : **le chat à stricte égalité avec le chien** (16,6 M de chats vs 9,9 M de chiens — angle mort de toute la concurrence), la **visite à domicile** mise en avant comme service signature chat.

---

## 2. Les questions bloquantes (classées par impact décroissant)

### 2.1 Les 10 questions du brief, enrichies

| # | Question | Pourquoi ça bloque | Bloque quoi |
|---|---|---|---|
| **1** | ✅ **TRANCHÉE (v1.5) : taux de commission d'assurance = 20 %.** Sur une prime santé animale de l'ordre de 20-44 €/mois (chien) / 9-35 €/mois (chat) — fourchettes du brief —, la commission récurrente annuelle par animal assuré se modélise donc à ~20 % de la prime, sur la durée de vie du contrat : la LTV assurance domine bien la LTV mise en relation, le modèle est confirmé. *(À préciser plus tard : assiette exacte — santé animale seule ou aussi Pack Sérénité/upsells — et récurrence sur renouvellements.)* | Le business plan peut être modélisé ; grille des Pass arbitrable. | ✅ débloqué |
| **2** | 🟡 **Partiellement renseignée (v1.4)** — Cabinet mandant : **n° ORIAS 12066667**, contrôle ACPR *(vérification au registre : https://www.orias.fr → « Consulter le registre », et catégories exactes du cabinet : COA ? MIA ? branches ?)*. **Restent à confirmer** : immatriculation ORIAS de la nouvelle entité (catégorie MIA + association agréée) lancée ? Le mandat couvre-t-il la **branche santé animale** et l'**assistance** ? Produit Allianz/SantéVet confirmé ? **Le mandat écrit stipule-t-il la couverture par la RC Pro du mandant, l'étendue exacte des actes autorisés (présentation seule vs conclusion), et la capacité professionnelle IAS / formation continue DDA (15 h/an) du dirigeant est-elle en règle ?** | À trancher par vous avec votre association professionnelle agréée ACPR (je le remonte, je ne tranche pas). Conditionne la légalité de toute la ligne de revenus n°2. | P4 entier + toute communication assurance |
| **3** | **RC Pro groupe sitters** : assureur identifié ? Coût par affilié ou par garde déclarée ? Régime de l'assurance de groupe (art. L141-1 C. assur.), contenu de la **notice d'information L141-4**, et caractère obligatoire ou non de la RC Pro pour l'activité — vus avec un juriste ? | Arme d'acquisition n°1 côté offre et verrou anti-fuite. **Tant que le contrat n'est pas signé ET l'entité immatriculée, aucune communication publique ne peut mentionner la RC Pro** (cf. flag `insurance_live`, §3.1). | Landing sitter, seeding, P4 |
| **4** | **La nouvelle entité juridique** existe-t-elle (forme, dénomination, SIREN, compte bancaire) ? | Bloque l'ouverture du compte Stripe (au nom de l'entité), les CGU/CGV, les mentions légales, le DPA hébergeur. → Création : https://formalites.entreprises.gouv.fr | Stripe, pages légales, P1 |
| **5** | ✅ **TRANCHÉE (v1.3) — Marque : AlloPetsitter · domaine : allopetsitter.fr** (allopetsitter.com en 301). Vérifié au 12/07/2026 : .fr et .com libres (RDAP AFNIC/Verisign), aucun homonyme détecté sur le web. **Actions fondateur restantes, urgentes** : (1) vérification INPI classes 35/45 → https://data.inpi.fr/search?type=brands (+ UE : https://euipo.europa.eu/eSearch/) ; (2) réservation immédiate allopetsitter.fr + .com + variantes défensives (allo-petsitter.fr, allopetsitter avec fautes courantes) → https://www.ovhcloud.com/fr/domains/ ou https://www.gandi.net/fr/domain ; (3) dépôt de marque → https://www.inpi.fr/proteger-vos-creations/proteger-votre-marque | Les mots-valises libres aujourd'hui peuvent être pris demain (bonjourpetsitter.fr/.com déjà occupés — le pattern est convoité). L'horloge d'indexation SEO démarre au domaine posé. | P1 débloqué sur ce volet dès la réservation effectuée |
| **6** | **Pack Sérénité** : le produit affinitaire (assistance véto 24/7 + couverture pendant la garde) existe-t-il sur étagère chez un assureur/assisteur accessible via votre mandat, ou faut-il le construire ? | S'il faut le construire, il sort du périmètre V1 et le checkout de garde change. Régime affinitaire spécifique : renonciation 30 jours (L112-10 C. assur.). | Checkout P3, P4 |
| **7** | **Vérification d'identité des sitters** : quel prestataire (Stripe Identity, Ubble, autre — sous-traitant UE de préférence) et quel budget unitaire ? | Coût sec par sitter activé. v1.1 : vérification déclenchée **à la première candidature** (pas à l'inscription) — moins cher et plus conforme (minimisation RGPD). | Tunnel sitter P2, coûts |
| **8** | **Le Plan B et le support** : qui opère humainement (vous ? une recrue ?) et sur quelles plages horaires ? | Un engagement public non tenu détruit le pilier Fiabilité. Présenté en obligation de moyens, dimensionné sur la réalité opérationnelle. | Promesse publique, back-office P3 |
| **9** | **Stratégie de seeding** : budget et objectif de sitters inscrits au jour 1 ? Zones de concentration initiale (je recommande 3-5 métropoles + votre réseau) ? | La liquidité est le seul indicateur vital. v1.1 : le seeding devient un **flux continu dès P1** (waitlist), pas une phase. | P1→P6, go/no-go lancement |
| **10** | **DAC7** : à valider avec un juriste — mais ⚠️ la revue juridique estime le périmètre **probablement applicable** : le critère n'est pas le transit des fonds mais la **connaissance de la contrepartie**, or le tarif accepté est connu au centime dans notre base (`applications` + `missions`). Faut-il collecter dès l'inscription les données vendeur (nom, adresse, date de naissance, NIF/SIRET) ? | Impacte le modèle de données sitter dès P2 et impose un agrégat annuel des contreparties par sitter. Collecter tôt coûte moins cher que migrer. | Schéma de données P1-P2, reporting annuel |

### 2.2 Questions ajoutées par la revue d'experts (11-16)

| # | Question | Origine | Bloque quoi |
|---|---|---|---|
| **11** | **Statut légal des sitters** : pour la garde à titre onéreux **chez le sitter** (pension), l'ACACED/certificat de capacité + déclaration (art. L214-6-1 code rural) sont-ils exigibles dès la première garde ? Quelle responsabilité pour la plateforme qui met en relation en connaissance de cause ? *(À faire valider par le juriste.)* | Juridique | Tunnel d'inscription P2, validité de la RC Pro groupe, discours « inscription libre » — ⚠️ pourrait imposer un bloquant **par service** (garde chez le sitter uniquement), en tension avec le « jamais bloquant » du brief |
| **12** | **Qualification de l'affiliation RC Pro automatique et gratuite** : simple contrat groupe à adhésion automatique (souscripteur, hors DDA) ou acte de distribution imposant un parcours DDA par sitter ? L'affiliation « sans action du sitter » est-elle même possible ? *(À faire trancher par l'association agréée ACPR.)* | Juridique | Tunnel sitter P2, tout le montage §4.3-B du brief |
| **13** | **Re-réservation du même binôme propriétaire↔sitter : incluse ou repayante ?** Faire repayer un Pass à un binôme qui a déjà les coordonnées garantit la désintermédiation au réachat — là où se jouent la LTV, les avis et la donnée assurance. Recommandation experte : **incluse** (déclarer la garde devient gratuit et conserve au sitter RC Pro + avis) — décision de pricing qui vous appartient. | Business | Pricing, P3, KPI de rétention |
| **14** | ✅ **TRANCHÉE (v1.4)** : oui, les réservations anticipées (déposées longtemps à l'avance) sont indispensables à l'organisation des deux parties. **Conséquence architecturale** : le mode **SetupIntent (empreinte carte au dépôt) + débit off-session à l'acceptation** devient le **mode principal et universel** du checkout ; la pré-autorisation `manual capture` n'est conservée qu'en optimisation optionnelle pour les demandes à échéance ≤ 6 jours (garantie de fonds renforcée) — elle pourra même être abandonnée en V1 si elle complexifie inutilement (décision technique en P3, tracée dans `DECISIONS.md`). Le chemin d'échec du débit off-session (3DS, carte expirée → `payment_required`, relance, timeout) est donc un parcours de premier plan, testé Playwright. UX : « Aucun débit aujourd'hui — vous ne payez que si un pet sitter accepte », affiché au dépôt. | CTO | P3 (architecture confirmée) |
| **15** | **Canal de demande au lancement : quel budget d'acquisition payante (Google Ads ?) pour les 6 premiers mois ?** Le SEO d'un domaine neuf ne produit rien avant 6-9 mois ; sans réponse, le plan n'a aucun canal de demande au jour 1. ⚠️ Google Ads = traceur non essentiel = bandeau consentement CNIL + Consent Mode à architecturer **dès P1** (aujourd'hui le plan suppose un site 100 % cookieless). | Growth | Go-to-market + architecture consentement P1 |
| **16** | **Quel coût d'activation maximal par sitter** (vérification d'identité + RC Pro + acquisition) acceptez-vous, et quel taux d'activation minimal (inscrit → 1ʳᵉ candidature) conditionne la poursuite du seeding massif ? | Business | Budget, garde-fou du « gratuit définitivement » |

---

## 3. Architecture technique

### 3.1 Stack — proposition du brief challengée point par point (v1.1)

| Brique | Décision proposée | Notes v1.1 (revue d'experts) |
|---|---|---|
| Framework | **Next.js 15 App Router + TS + Tailwind + shadcn/ui** | SSG/ISR indispensable au SEO programmatique. |
| Hébergement | **Vercel, région UE** — ⚠️ **plan Pro requis dès P3** (~20 $/mois) | Le plan Hobby **interdit l'usage commercial** et limite les crons à 1/jour à horaire non garanti — incompatible avec l'expiration 72 h, les rappels J-7/J-2/J-1 et le Plan B. Ordonnancement fin externalisé (Inngest/QStash) avec handlers **idempotents** + vérification paresseuse des échéances à la lecture (si `now > deadline` → expiré, même si un cron a raté). |
| BDD | **Neon UE (Francfort) + Prisma** | |
| Géo | **`earthdistance`/`cube` en V1** (rayon sur centroïdes des ~35 000 communes, index GiST sur `ll_to_earth`, pré-filtre bounding-box indexé sur la **localisation des sitters**) | Correction v1.1 : Neon supporte aussi PostGIS nativement — le choix earthdistance est un choix de simplicité (suffisant pour du rayon sur centroïdes), pas de disponibilité. Migration PostGIS possible sans changer l'API `geo/`. Base communes : https://geo.api.gouv.fr |
| Auth | **Auth.js**, vérif e-mail à l'inscription ; **OTP téléphone ET vérification d'identité différés au premier acte engageant** (dépôt de demande / première candidature) | Minimisation RGPD + économie : on ne paie pas la vérification des profils dormants. |
| Paiement | **Stripe — mode principal confirmé (Q14, v1.4)** : **`SetupIntent`** au dépôt (empreinte carte + SCA on-session, aucun débit) puis **PaymentIntent off-session à l'acceptation**, avec chemin d'échec de premier plan (3DS requis, carte expirée → statut `payment_required`, relance, timeout). La pré-autorisation `manual capture` (échéance ≤ 6 j) n'est plus qu'une optimisation optionnelle, à arbitrer en P3.<br>+ **Billing** (abonnement mensuel) + page **`/resilier` native**. **Pas de Stripe Connect.** | Une pré-autorisation carte expire en **7 jours max** (plafond réseau ; lire `capture_before` plutôt que coder 7 j en dur ; les extended authorizations sont réservées à d'autres secteurs). Stripe auto-annule à J+7 : webhook `payment_intent.canceled` traité de façon idempotente, la logique 72 h ne dépend jamais de l'auto-cancel. La « résiliation 3 clics » ne peut pas être déléguée au seul Customer Portal : le décret n° 2023-182 impose un bouton « résilier » directement accessible sur **notre** interface → page `/resilier` qui orchestre l'API Stripe, testée Playwright. |
| E-mails | **Resend** + React Email | |
| Fichiers | **Scaleway Object Storage (Paris)**, chiffré | UE, pas de dépendance US pour les justificatifs. |
| Analytics | **Plausible UE (cookieless) branché dès P1** + funnel events + Search Console | v1.1 : remonté de P5 à P1 — la conversion n°1 (pré-autorisation → acceptation) et l'abandon au mur « empreinte carte » doivent être mesurés dès les premiers tests. Si Google Ads est retenu (Q15) : bandeau CNIL + Consent Mode dès P1. |
| Tests | **Vitest + Playwright** (paiement, rétractation, DDA, résiliation) + **lint lexical CI étendu** | Le lint fait échouer le build sur : vocabulaire de possession (« nos pet sitters »…), formulations de subordination (« nous vous trouvons un remplaçant »…), **claims chiffrés non sourcés en base** (« des milliers de propriétaires… »), et **toute chaîne assurance si `insurance_live=false`**. |
| Filtre anti-fuite | **Hold-and-release** : regex synchrone bloquante + verdict LLM (Haiku) **avant remise du message** (`pending` → délivré/masqué, p95 < 2 s, blocage si timeout). Étendu aux **bios et photos de profil sitter** (canal de fuite le plus évident). | Un masquage a posteriori est inutile (message déjà lu). RGPD : information explicite des utilisateurs (« vos messages sont analysés automatiquement pour prévenir l'échange de coordonnées »), DPA/CCT vérifiés, seul le texte du champ est transmis au LLM, jamais l'identité des parties. |
| Feature flag | **`insurance_live`** (en base) : tant que l'immatriculation ORIAS MIA n'est pas effective ET le contrat groupe signé, **aucune chaîne publique ne mentionne RC Pro ou assurance** (landing, SEO, e-mails, mentions légales). | Présenter un produit d'assurance est un acte de distribution (L511-1 C. assur.) : le faire avant immatriculation = exercice illégal. Afficher des mentions ORIAS « en attente » serait une infraction, pas de la prudence. |

### 3.2 Arborescence (dépôt neuf)

```
projet-patte/
├── PLAN.md · DECISIONS.md · README.md
├── prisma/schema.prisma · migrations/ · seed.ts        # durées de conservation par table + cron de purge
├── src/
│   ├── app/
│   │   ├── (marketing)/            # home, /notre-modele, /devenir-pet-sitter (waitlist dès P1), blog,
│   │   │   │                       # pages légales, /resilier, « Comment fonctionnent les avis »,
│   │   │   │                       # « Comment sont classés les résultats »
│   │   │   └── [service]/[espece]/[ville]/   # SEO programmatique (indexation conditionnelle, cf. P5)
│   │   ├── (auth)/                 # inscription, connexion, vérifications différées
│   │   ├── (owner)/                # recherche, demande, candidatures, déblocage, mes gardes, mes animaux
│   │   ├── (sitter)/               # profil, calendrier, demandes, candidatures, mes gardes, RC Pro (encart périmètre)
│   │   ├── (insurance)/            # parcours santé animale, Pack Sérénité, espace assuré  [flag insurance_live]
│   │   ├── (admin)/                # modération, vérifs identité, litiges, Plan B, fraud_signals, KPIs,
│   │   │                           # assurance, complaints (réclamations à SLA)
│   │   └── api/                    # webhooks Stripe (idempotents), jobs (expiration, rappels, purge RGPD)
│   ├── domains/                    # logique métier pure, découplée du framework
│   │   ├── marketplace/            # profils, recherche, demandes (+ récurrentes), candidatures,
│   │   │                           # échange structuré, avis (conformité D111-16+), fiabilité
│   │   ├── payments/               # 2 modes (manual capture / SetupIntent+off-session), machine à états
│   │   │                           # dédiée, rétractation L221-18, abonnements, résiliation
│   │   ├── insurance/              # ⭐ citoyen de première classe dès P1 (cf. §3.3)
│   │   ├── fraud/                  # hold-and-release, fraud_signals, règles de détection
│   │   ├── geo/                    # communes, géocodage, recherche par rayon
│   │   └── notifications/          # e-mails, rappels J-7/J-2/J-1, alertes Plan B, avis d'échéance
│   ├── components/                 # design system (tokens Claude Design), BlocTransparence, ScoreFiabilite…
│   └── lib/                        # brand.ts (constante [MARQUE] unique), flags, config, clients externes
└── tests/                          # Vitest (domaines) + Playwright (paiement ×2 modes, rétractation,
                                    # résiliation, DDA, case jamais pré-cochée) + lint lexical
```

### 3.3 Schéma de données (entités principales, v1.1)

**Identité & profils** — `users` (rôle, e-mail vérifié, tél vérifié — différé) · `sitter_profiles` (bio et photos **passées au filtre anti-fuite**, expériences, espèces, logement, statut de vérification, ACACED/déclaration L214-6-1 **par service** (cf. Q11), SIRET + données vendeur DAC7 collectées au premier seuil d'activité) · `identity_verifications` (prestataire, statut, horodatage — déclenchée à la 1ʳᵉ candidature, pas de stockage des pièces chez nous) · `pets` (espèce, race, âge, contraintes — déclencheur de proposition assurance).

**Offre & disponibilité** — `sitter_services` (service × espèce × **tarif libre**) · `availability_slots` (calendrier, `updated_at` → règle des 14 jours) · **`recurring_requests`** (v1.1 : service récurrent — jours/créneaux, reconduction du sitter accepté, gardes déclarées automatiquement à chaque occurrence ; c'est le produit que consomme réellement l'abonnement mensuel, seul segment non saisonnier).

**Cœur transactionnel — deux machines à états séparées, jointes, avec événements append-only** (v1.1) :
- `care_requests` : `open → accepted → unlocked → confirmed → completed`, **plus** `expired`, `cancelled_by_owner`, `cancelled_by_sitter_pre_confirmation`, `cancelled_by_sitter_post_confirmation` (→ le seul cas de remboursement, déclencheur du Plan B), `replacement_in_progress`, `payment_required` (échec de capture/débit off-session : 3DS, fonds insuffisants — la capture n'est jamais garantie).
- `payments` : `requires_capture → captured / capture_failed / canceled / expired` (+ le chemin SetupIntent off-session). Un abonné mensuel n'a pas de PaymentIntent par demande : son chemin `accepted → unlocked` est direct, dans la machine `care_requests`.
- **`request_events`** (append-only) : source de vérité de toutes les transitions — c'est ce qui rend opposable la règle « remboursement uniquement sur événement constaté en base ».

`applications` (candidature cadrée : acceptation ferme, tarif, réponses à choix, un champ court en hold-and-release) · `structured_messages` (puces pré-définies avant capture ; libre après, filtré) · `missions` (1 déblocage = 1 mission : sitter confirmé + remplaçant Plan B éventuel, contrat de garde **modèle librement modifiable par les parties** en PDF pré-rempli, rencontre préalable, double confirmation, rappels) · `reviews` (uniquement post-garde déclarée ; sollicité au réachat plutôt que verrou immédiat, cf. §7.4 ; **conformité avis en ligne** : date de l'avis + date de l'expérience, critères de tri publiés, signalement et modération motivée — D111-16 à D111-19 C. conso) · `reliability_scores` (matérialisé ; **affiché uniquement au-delà d'un seuil de gardes déclarées, paramétrable — en dessous : badge « Nouveau sur [MARQUE] »** + faits vérifiables seulement ; critères publiés, tout déclassement notifié avec recours humain — art. 22 RGPD + règlement P2B).

**Paiements & souscriptions** — `payment_intents` (miroir Stripe, montant du Pass, option Pack, **`immediate_execution_requested_at` / `withdrawal_waiver_at`** : recueil au checkout de la demande d'exécution immédiate et de la renonciation au droit de rétractation L221-18/L221-28 — sans quoi tout client peut se faire rembourser 14 jours après déblocage) · `subscription_plans` + `subscriptions` (mensuel sans engagement, résiliation 3 clics native tracée ; **pas d'abonnement annuel en V1**, cf. §6) · `pricing` et fenêtres (72 h…) **en base, jamais en dur**.

**Assurance (`insurance/`) — modélisé dès P1, exposé publiquement seulement si `insurance_live`** — `insurance_products` · `insurance_interests` (moments d'exposition instrumentés) · `dda_journeys` (recueil des exigences et besoins horodaté, recommandation + justification archivées — **portées par le cabinet mandant tant que la souscription est finalisée par lui**, la plateforme trace le recueil et la remise du document d'information —, transparence statut/rémunération, **renonciation affinitaire 30 j (L112-10) : `renunciation_deadline` + workflow de remboursement de prime**, piste d'audit opposable ACPR) · `insurance_subscriptions` · `commission_entries` · `rcp_group_affiliations` (**v1.1 : affiliation effective à la première garde déclarée** — pas à l'inscription : la couverture ne joue que sur les gardes déclarées, affilier avant n'apporte qu'un coût ; **`notice_version` + `notice_accepted_at`** : remise et acceptation horodatées de la notice L141-4 ; encart permanent côté sitter : « Votre RC Pro ne couvre QUE les gardes réservées via [MARQUE] » — sans quoi le marketing « RC Pro incluse » devient trompeur, L121-2 C. conso) · **`complaints`** (réclamations à deux niveaux : plateforme / cabinet mandant → ACPR-Médiation de l'Assurance, SLA horodatés : AR 10 j, réponse 2 mois).

**Anti-fraude & audit** — `fraud_signals` (les 4 signaux du brief + tentatives de fuite, file de revue admin — décisions motivées et notifiées, procédure contradictoire dans les CGU sitter) · `content_filter_hits` (récidive → malus) · `audit_log` (append-only : consentements, rétractations, résiliations, DDA, notices, remboursements).

**RGPD by design** — adresse exacte du domicile + dates d'absence = donnée à risque physique : révélée au seul sitter confirmé, **chiffrée au repos**, purgée des missions expirées/annulées ; durées de conservation par table (commentaires `schema.prisma` + cron de purge) ; arbitrage rétention DDA vs droit à l'effacement documenté dans `DECISIONS.md` ; **AIPD livrable de P1** (cumul vérification d'identité + profilage à effets + analyse de correspondances → AIPD requise avant tout traitement réel : https://www.cnil.fr/fr/RGPD-analyse-impact-protection-des-donnees-aipd) ; pas de DPO à désigner en V1 (registre + AIPD + référent interne suffisent).

**KPIs** — `analytics_events` dès P1 : liquidité (≥ 3 candidatures < 24 h), pré-auto → acceptation, **abandon au pas « empreinte carte »**, désistements, proxys de fuite, **taux de re-réservation déclarée du même binôme**, **taux d'activation sitter (inscrit → 1ʳᵉ candidature)**, attachement assurance — plus la liste du §11 du brief.

---

## 4. Phasage (v1.1 — growth et conformité remontés en amont)

| Phase | Périmètre | Critères de « done » | Estimation* |
|---|---|---|---|
| **P0 — Plan** | Ce document. | **Votre validation écrite** + réponses aux questions 1-5 et 14 a minima | — |
| **P1 — Fondations & rampe SEO** | Dépôt neuf, stack, `schema.prisma` complet (**marketplace + assurance + états v1.1**), Auth.js, design system, layout, constante `[MARQUE]`, flag `insurance_live`, lint lexical CI étendu ; **domaine posé + Search Console + Plausible + funnel events** ; **home, `/notre-modele`, landing sitter avec waitlist (e-mail + CP + services) indexables** — sans mention RC Pro tant que Q3 non signée ; pages légales (médiateur en cours d'adhésion, zéro mention ORIAS) ; **AIPD + registre art. 30** | Squelette **indexable** déployé ; CI verte avec lint bloquant ; waitlist sitter ouverte ; AIPD rédigée | ~2-3 sem |
| **P2 — Cœur marketplace & contenu** | Profils sitter (filtre bios/photos), tarifs libres, calendrier + règle 14 j, recherche géo, demandes (+ **`recurring_requests`** au schéma), candidatures cadrées, échange structuré hold-and-release, anonymisation stricte, avis conformes D111-16+, collecte DAC7 au premier seuil ; **conversion de la waitlist en inscriptions réelles** ; **8-12 articles piliers du hub de contenu** (chiffres sourcés uniquement ; passerelle assurance activée plus tard par le flag) | Parcours de bout en bout sans paiement réel, zéro fuite de coordonnées ; premiers contenus indexés | ~4-5 sem |
| **P3 — Monétisation & confiance** | **Stripe 2 modes** (manual capture borné ≤ 6 j + SetupIntent/off-session selon Q14), machine à états paiements + `request_events`, **checkout avec recueil rétractation L221-18** (case non pré-cochée d'exécution immédiate + renonciation), Pass ×2 + abonnement mensuel **livré avec le parcours récurrent**, page `/resilier` native (décret 2023-182, testée Playwright), Score de Fiabilité avec seuil d'affichage, rappels, Plan B outillé (obligation de moyens), `fraud_signals`, back-office, **adhésion effective à un médiateur de la consommation** (https://www.economie.gouv.fr/mediation-conso) — prérequis au premier client payant ; **Vercel Pro + ordonnanceur** ; **produits de transparence T1-T3 + charte T8 publiée (§9)** | Les 4 interdits anti-Holidog testés ; zéro débit sans acceptation constatée ; remboursement impossible hors événement en base ; rétractation conforme testée | ~4-5 sem |
| **P4 — Assurance** *(conditionnée aux Q1-Q3, Q6, Q12)* | Activation du flag `insurance_live` : mentions ORIAS complètes (n°, catégorie MIA, mandant, https://www.orias.fr, réclamations, ACPR), parcours DDA tracé (recueil + remise document — le conseil formalisé reste porté par le cabinet tant que la souscription est assistée), Pack Sérénité si produit signé (jamais pré-coché — testé ; renonciation 30 j), RC Pro groupe (notice L141-4 acceptée, affiliation à la 1ʳᵉ garde déclarée, encart périmètre), `complaints` à SLA, tracking de commission ; **landing sitter enrichie « RC Pro incluse » seulement maintenant** | Piste d'audit DDA rejouable ; aucune chaîne assurance visible flag éteint ; attestation visible côté sitter | ~3-4 sem |
| **P5 — Amplification growth** | **Ouverture progressive** des pages programmatiques `/[service]/[espece]/[ville]-[cp]` : `generateStaticParams` sur ~200-500 communes prioritaires + ISR à la demande pour la longue traîne, **page indexable seulement si ≥ 1 sitter réel dans le rayon ou module éditorial unique** (sinon `noindex` + hors sitemap ; en zone vide : alerte « Soyez prévenu dès qu'un pet sitter est disponible » qui alimente le ciblage du seeding), sitemaps segmentés générés depuis la BDD, schema.org (**`AggregateRating` uniquement quand des avis réels existent**), dashboard KPIs complet | Indexation pilotée par la densité ; zéro page « 0 sitter » indexée | ~2 sem |
| **P6 — Lancement** | Seeding concentré sur les zones cibles (Q9) — onboarding concierge/CSV manuel aux volumes initiaux —, monitoring/alerting + plan de scalabilité documenté, runbook support & Plan B | Objectif de sitters J-1 atteint sur zones cibles ; astreinte Plan B définie | ~2 sem |

\* Semaines-développeur, ±30 % ; chaque fin de phase = **arrêt et validation par vous**.

---

## 5. Les 3 risques majeurs et leur mitigation (v1.1)

1. **Risque juridique/réglementaire — le risque existentiel.**
   Trois trous identifiés par la revue juridique, corrigés dans ce plan : (a) la **rétractation L221-18** — sans recueil de la renonciation au checkout, « aucun remboursement sur déclaration » est juridiquement faux : tout client pourrait exiger remboursement 14 jours après déblocage ; (b) la **communication assurance avant immatriculation** — la landing « RC Pro incluse » utilisée pour le seeding avant P4 serait un acte de distribution illégal → flag `insurance_live` ; (c) le **statut des sitters** (ACACED/pension, L214-6-1) — absent du brief, potentiellement bloquant par service.
   *Mitigation* : les trois amendements ci-dessus + lint lexical étendu (possession, subordination, claims non sourcés, assurance hors flag) ; standards formulés en conditions d'accès, Plan B en obligation de moyens, contrat type librement modifiable ; matrice complète des indices de requalification relue par un juriste avant P3 ; questions 2, 3, 10, 11, 12 tranchées par vous avec l'association agréée et un juriste avant les phases concernées. La V1 marketplace (P1-P3) peut vivre pendant que le montage assurantiel se finalise.

2. **Risque marketplace — cold start / liquidité.**
   France entière + zéro sitter = demandes expirées, clients brûlés — et un client qui a saisi sa carte pour rien est un client perdu + un avis négatif public, pas une simple « déception ».
   *Mitigation* : seeding en **flux continu dès P1** (waitlist sitter sur la landing) ; **ouverture du tunnel gouvernée par la densité** : sous un seuil de sitters compatibles actifs dans le rayon, pas de dépôt avec empreinte carte mais une inscription d'alerte, qui cible le seeding ; concentration marketing sur 3-5 zones ; KPI de liquidité comme go/no-go des dépenses d'acquisition ; Score de Fiabilité masqué sous seuil (badge « Nouveau ») pour ne pas afficher du vide.

3. **Risque produit — désintermédiation (fuite avant et après paiement).**
   *Mitigation avant* : aucun canal libre pré-paiement, hold-and-release (le verdict tombe avant remise du message), filtre étendu aux bios/photos, anonymisation stricte, 1 déblocage = 1 mission. *Mitigation après* : le levier est le **sitter** (avis et score sur gardes déclarées uniquement, RC Pro qui ne joue que sur les gardes déclarées, assistance réservée, déclassement encadré contractuellement) **et le propriétaire** : la **re-réservation du même binôme incluse sans nouveau Pass** (Q13, recommandée) supprime son incitation à sortir — le revenu marginal perdu est très inférieur à la valeur des gardes déclarées (avis, données, exposition assurance). `fraud_signals` en détection V1, sanctions automatisées V2, toujours avec revue humaine et décision motivée.

---

## 6. Ce que je recommande de NE PAS faire en V1 — et pourquoi (v1.1)

1. **Pas d'app native.** PWA mobile-first suffit (70 %+ du trafic).
2. **Pas d'ACACED bloquant généralisé** — badge valorisé seulement, **sauf** si la Q11 impose un bloquant sur le seul service « garde chez le sitter » (obligation légale ≠ choix produit ; promenade/visite non concernées, la liquidité est préservée).
3. **Pas d'abonnement annuel (~149 €)** : aucun acheteur rationnel avant preuve de rétention 12 mois, avantages partenaires inexistants, double la surface Stripe/résiliation (dont l'avis d'échéance légal M-3/M-1 de L215-1) pour zéro apprentissage. Mensuel sans engagement + Pass suffisent à valider le mix.
4. **Pas de parrainage bilatéral en V1** : avant liquidité et rétention prouvées, il ne recrute que des chasseurs de prime et ajoute une surface de fraude.
5. **Pas d'outillage d'import de sitters en masse** : aux volumes du seeding initial, un onboarding concierge/CSV manuel produit de meilleurs profils.
6. **Pas de signature électronique intégrée** : contrat type en PDF pré-rempli (modèle librement modifiable entre les parties) ; l'e-signature est une intégration tierce sans impact prouvé sur la conversion.
7. **Pas de messagerie temps réel riche** (websockets, pièces jointes, photos) — vecteur de fuite et gouffre de maintenance. Suivi live et photos horodatées = V2.
8. **Pas d'automatisation des sanctions anti-fraude** : détection + revue humaine motivée en V1 (les faux positifs détruiraient la confiance des sitters — et l'art. 22 RGPD + P2B imposent de toute façon le recours humain).
9. **Pas de moteur de recommandation assurance automatisé** : tant que la souscription est finalisée par le cabinet, c'est lui qui porte le conseil formalisé ; la plateforme trace le recueil et la remise des documents (`dda_journeys`), sans générateur de conseil.
10. **Pas de tests de charge saisonnière à trafic zéro** (théâtre) : monitoring + plan de scalabilité documenté ; le vrai test se fait avant le premier été, avec du trafic réel.
11. **Pas de DPO, pas de rapport de transparence DSA** : non requis à notre taille (AIPD + registre + référent interne ; point de contact + signalement de contenus couverts par la modération des avis).
12. **Pas de NAC, pas d'i18n, pas de Stripe Connect ni aucun flux financier de la garde** — jamais : c'est le modèle.

---

## 7. Points où je challenge le brief (Règle §12)

1. **Le Pass Court à ~14,90 € reste cher rapporté à une promenade unique à 15 €.** La vraie réponse au segment récurrent (le seul non saisonnier) est l'abonnement **accompagné d'un parcours récurrent réel** (`recurring_requests`, livré en P3) — un abonnement « illimité » sur un parcours one-shot serait du churn assuré. Conversion par type de service instrumentée dès la V1 ; prix en base, ajustables sans déploiement. **Je n'invente pas de prix — décision vous appartient.**
2. **« France entière dès le lancement »** : maintenu pour le SEO, mais l'ouverture du tunnel transactionnel est **gouvernée par la densité locale** (alerte au lieu d'empreinte carte en zone vide) et le seeding concentré sur 3-5 zones. Un Plan B « < 12 h » est intenable à Aurillac avec 0 sitter.
3. **Fenêtre de 72 h** : paramétrable en base, mais **bornée en dur à ≤ 6 jours** en mode pré-autorisation (plafond réseau de 7 j) ; au-delà → mode SetupIntent/off-session (Q14).
4. **Avis « obligatoire »** : un avis forcé produit du bruit. Proposé : blocage de la demande *suivante* tant que l'avis de la garde passée n'est pas déposé — le proxy anti-fuite est couvert au réachat, sans polluer la base d'avis.
5. **« Affiliation RC Pro automatique dès l'inscription »** : déplacée à la **première garde déclarée** — même valeur d'argument, coût d'activation borné, anti-sélection évitée (s'inscrire juste pour le badge), et cohérente avec « la couverture ne joue que sur les gardes déclarées ». La qualification juridique de l'affiliation reste à trancher (Q12).
6. **« Plusieurs milliers de pages indexables » comme critère de done** : remplacé par une **indexation conditionnelle pilotée par la densité d'offre** — des milliers de pages « 0 sitter à [ville] » sur un domaine neuf, c'est le pattern exact que Google pénalise (doorway/thin content), et une pénalité précoce hypothéquerait le canal n°1 pour 12-18 mois. Le générateur produit tout ; l'indexation libère au rythme de l'offre.

---

## 8. Synthèse de la revue croisée (4 experts)

Les corrections structurantes intégrées en v1.1 :

| # | Correction | Origine |
|---|---|---|
| 1 | **Rétractation L221-18 recueillie au checkout** (exécution immédiate + renonciation) — sans elle, le dogme « aucun remboursement sur déclaration » ne tenait pas | Juridique |
| 2 | **Flag `insurance_live`** : zéro communication assurance (RC Pro comprise) avant immatriculation ORIAS + contrat groupe signé — la landing de seeding dit « 0 % de commission », pas « RC Pro incluse » | Juridique + Growth |
| 3 | **Architecture de paiement à 2 modes** (pré-autorisation ≤ 6 j / SetupIntent + off-session pour les réservations anticipées — le cœur saisonnier du marché) | CTO |
| 4 | **Growth remonté en P1** : domaine + Search Console + waitlist sitter + analytics/funnel dès les fondations ; hub de contenu en P2 ; P5 devient une phase d'amplification | Growth |
| 5 | **Re-réservation du même binôme incluse** (recommandation, Q13) + **parcours récurrent** comme substance de l'abonnement | CEO |
| 6 | **Indexation SEO conditionnelle à la densité d'offre** + tunnel gouverné par la densité (alerte en zone vide) | Growth + CEO + CTO |
| 7 | **Coûts d'activation séquencés** : vérification d'identité à la 1ʳᵉ candidature, RC Pro à la 1ʳᵉ garde déclarée | CEO + Juridique (convergents) |
| 8 | **Vercel Pro + ordonnanceur idempotent dès P3** (Hobby : usage commercial interdit, crons 1/jour) | CTO |
| 9 | **AIPD en P1**, filtre anti-fuite en hold-and-release étendu aux bios/photos, adresse chiffrée au repos, art. 22/P2B (recours humain, critères publiés) | Juridique + CTO |
| 10 | **Périmètre V1 allégé** : sans abonnement annuel, parrainage, import en masse, e-signature, tests de charge, moteur de conseil auto | CEO + Juridique |

---

## 9. La transparence comme produit (v1.2 — validé par le fondateur)

**Principe** : chez les concurrents, la transparence est un argument marketing ; chez nous, c'est un **produit** — des objets concrets que l'utilisateur peut toucher et vérifier. Objectif : gagner de l'argent sans jamais « sentir l'arnaque ».

### 9.1 Les preuves de transparence (et leur place dans le phasage)

| # | Produit de transparence | Contenu | Phase |
|---|---|---|---|
| T1 | **Reçu de transparence** | Après chaque capture : e-mail + page « Vous avez versé X € au pet sitter (100 %) · Vous avez payé Y € à [MARQUE] pour la mise en relation · Voici ce que ça finance ». Généré depuis `payments`, jamais rédigé à la main. | P3 |
| T2 | **Rappel avant prélèvement + pause d'abonnement** | E-mail J-3 avant chaque prélèvement (« vous serez prélevé de X € le … — résilier en 1 clic ») — au-delà de l'obligation légale ; **pause de 1 à 3 mois sans résilier** (usage saisonnier). Tue le grief n°1 du secteur (Holidog). | P3 |
| T3 | **Remboursement proactif automatique** | Annulation du sitter confirmé sans remplaçant trouvé → remboursement déclenché **sans demande du client**, notification immédiate (+ geste commercial à votre arbitrage). Le seul cas de remboursement du modèle devient un moment de confiance. Déclencheur : événement constaté dans `request_events` — cohérent avec « jamais sur déclaration ». | P3 |
| T4 | **Page « Ce qui n'est PAS couvert / ce que nous ne faisons pas »** | Les limites (RC Pro, Plan B en obligation de moyens, Pack Sérénité) aussi visibles que les promesses. Protège aussi juridiquement (L121-2). | P1 (squelette) → enrichie P3/P4 |
| T5 | **Page publique `/nos-chiffres`** | Gardes réalisées, cumul reversé aux sitters, délai médian de réponse, taux d'annulation, litiges et résolution — **calculés depuis la base**, affichés seulement au-delà de seuils de crédibilité (jamais de chiffres rédigés). Rapport d'incidents trimestriel assumé. | P5 (les seuils imposent du volume) |
| T6 | **Changelog public des CGU et des prix** | Chaque modification datée, archivée, notifiée par e-mail. Table `terms_versions` + page publique. | P1 (dès les premières CGU) |
| T7 | **Commission d'assurance affichée en euros** | À la souscription : le montant exact de notre rémunération, en clair — au-delà du minimum DDA. Cohérent avec `/notre-modele`, inattaquable. | P4 |
| T8 | **Charte anti-dark-patterns exécutable** | Interdits codés dans le lint CI existant : compte à rebours artificiel, « N personnes regardent ce profil », prix barrés fictifs, case pré-cochée, parcours de résiliation plus long que l'achat. Charte publiée publiquement. | P1 (lint) → page P3 |
| T9 | **RGPD en libre-service** | « Télécharger toutes mes données » et « supprimer mon compte » en 1 clic dans le compte. La conformité (déjà due) transformée en argument visible. | P2 |
| T10 | **Politique d'avis publiée et dure avec nous-mêmes** | Aucun avis négatif supprimé (modération motivée et tracée uniquement), collecte automatique après chaque garde déclarée, jamais de tri favorable. Complète la conformité D111-16+ déjà prévue. | P2 |

### 9.2 3ᵉ ligne de revenus : la « Boîte à outils Sitter Pro »

Abonnement **optionnel** côté sitter : facturation auto-entrepreneur, synchronisation de calendrier, mini-page web personnelle, statistiques d'activité.

- **Principe gravé dans le marbre : on monétise le sitter par des OUTILS, jamais par la visibilité.** Le pay-to-rank détruirait la crédibilité du Score de Fiabilité — il est interdit (cf. 9.3). Le classement reste 100 % méritocratique.
- Ligne récurrente et propre, non réplicable par Rover (qui se paie déjà à 20 % sur les sitters) sans se renier.
- **Timing : architecturée en V1 (un produit d'abonnement de plus dans `subscription_plans`), construite en V1.1 après le lancement** — monétiser les sitters avant d'avoir prouvé le flux d'affaires serait prématuré (et contre-productif pour le seeding). Prix : placeholder, décision fondateur.

### 9.3 Les interdits anti-arnaque (complètent les 4 interdits anti-Holidog)

Jamais, même si ça rapporte à court terme : mise en avant payante dans les résultats de recherche · fausse rareté ou urgence · frais de service découverts au checkout · conversion silencieuse d'un Pass en abonnement · prix dynamiques opaques · revente ou transmission de coordonnées à des partenaires sans consentement explicite. Chacun détruirait précisément le positionnement qu'on construit. Ajoutés à la charte T8 et, quand c'est détectable, au lint CI.

### 9.4 Écartés à ce stade (décision fondateur, v1.2)
- **Assistant crédit d'impôt services à la personne** — non retenu pour le moment.
- **Affiliation étiquetée** (ACACED, comptabilité, services véto en ligne) — non retenue pour le moment.
Aucun des deux n'est architecturé ni mentionné dans le produit ; réouvrable plus tard sur votre demande.

---

## Prochaine étape

**Je m'arrête ici (Règle 1).** Pour lancer P1, il me faut :
1. Votre **validation de ce plan** (ou vos corrections) ;
2. ~~Le dépôt Git neuf~~ ✅ fait : https://github.com/assurancesparcs/petsitter ;
3. Des réponses aux **questions 1, 3 et 4** du §2, et le solde de la **Q2** (Q5 : AlloPetsitter ✅ · Q14 : réservations anticipées ✅ · Q2 : n° ORIAS mandant 12066667 fourni, reste le périmètre du mandat et l'immatriculation MIA de la nouvelle entité) (les autres peuvent être tranchées pendant P1-P2) — les questions 2, 3, 11 et 12 sont à porter à votre **association professionnelle agréée ACPR / juriste**, je les signale sans les trancher.
