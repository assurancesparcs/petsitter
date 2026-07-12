# BRIEF CLAUDE DESIGN — AlloPetsitter — Mise en relation Propriétaires d'animaux ↔ Pet sitters (France)
### À coller INTÉGRALEMENT dans Claude Design.
**Version 3.0 — Juillet 2026** *(remplace intégralement la v2)*

---

## CE QUI A CHANGÉ DEPUIS LA v2 (traçabilité)

1. **La marque est arbitrée : AlloPetsitter.** La Mission 1 d'origine (proposer 8 noms) est obsolète — elle devient la création de l'identité complète d'AlloPetsitter (§3).
2. **Contrainte assurance absolue** : l'immatriculation ORIAS de l'entité et le contrat groupe RC Pro ne sont **pas encore effectifs** (flag `insurance_live` éteint). Tout le volet assurance passe dans un **lot séparé, non publiable** (Règle 2). Aucun livrable destiné à publication immédiate ne mentionne l'assurance ni la RC Pro.
3. **Mécanisme de paiement confirmé (Q14)** : empreinte carte au dépôt, **aucun débit tant qu'un pet sitter n'a pas accepté** — les réservations peuvent être déposées des mois à l'avance. L'écran de dépôt martèle « Aucun débit aujourd'hui ».
4. **La transparence devient un produit** : nouveaux objets à designer (Reçu de transparence, `/nos-chiffres`, « Ce qui n'est pas couvert », changelog public des CGU, rappel J-3, pause d'abonnement, remboursement proactif) + **charte anti-dark-patterns opposable au design** (§5).
5. **Grille tarifaire décidée** : Pass Séjour **39 €**, Pass Court **14,90 €**, Abonnement **19 €/mois sans engagement**. **L'abonnement annuel est supprimé de la V1.**
6. **Score de Fiabilité avec seuil** : sous un seuil de gardes déclarées, badge « **Nouveau sur AlloPetsitter** ». La preuve sociale au lancement est **structurelle**, jamais chiffrée.
7. Tout le reste de la v2 (Règle de langage, chat à égalité, ton, mobile-first, WCAG AA, Bloc Transparence, livrables exploitables) est **conservé**.

---

## ⛔ RÈGLE 0 — ISOLATION
Ce projet n'a **aucun lien** avec mes autres projets. N'importe, ne réutilise et ne t'inspire d'**aucun** autre univers de marque, palette, typo ou asset existant. Tout part de zéro.

---

## ⛔ RÈGLE 1 — LA RÈGLE DE LANGAGE (juridique, non négociable)

**AlloPetsitter intervient EN AMONT. Nous mettons en relation. Nous ne gardons pas les animaux.** C'est le pet sitter qui propose et exécute la prestation, en toute indépendance.

Dans **tous** les textes que tu produis — maquettes, posts, scripts vidéo, pitch deck, PDF, accroches publicitaires :

| ❌ Jamais | ✅ Toujours |
|---|---|
| « Nous gardons votre animal » | « Trouvez un pet sitter pour votre animal » |
| « Nos pet sitters » | « Les pet sitters inscrits sur AlloPetsitter » |
| « Notre service de garde » | « Le service proposé par le pet sitter » |
| « Notre équipe de promeneurs » | « Les promeneurs disponibles près de chez vous » |
| « Nous vous trouvons un remplaçant » (subordination) | « Le Plan B : une alerte prioritaire est envoyée aux pet sitters compatibles » |

Ce n'est pas une préférence de style : le vocabulaire de possession expose la plateforme à une **requalification juridique**. **Aucune exception.**

---

## ⛔ RÈGLE 2 — LE VERROU ASSURANCE (flag `insurance_live` ÉTEINT)

L'immatriculation ORIAS de la nouvelle entité et le contrat groupe RC Pro **ne sont pas encore effectifs**. Présenter publiquement un produit d'assurance avant immatriculation serait un acte de distribution illégal. Conséquences pour TOUT ton travail :

- **Tu peux CONCEVOIR** les écrans et documents du volet assurance (§7) : Pack Sérénité, landing « RC Pro incluse » côté sitter, parcours de souscription santé animale.
- **Mais tu les livres dans un LOT SÉPARÉ**, chaque fichier et chaque page marqués : **« NE PAS PUBLIER avant activation du flag `insurance_live` »**.
- **AUCUN visuel ni texte destiné à publication immédiate** — home, landing sitter (waitlist), posts réseaux sociaux, e-mails — ne mentionne l'assurance, la RC Pro, l'ORIAS ni le Pack Sérénité. Pas même « bientôt disponible » : ce serait déjà de la communication d'assurance.
- La landing sitter **publiable** dit exactement : **« 0 % de commission. Vous gardez 100 % de vos revenus. »** — rien de plus sur ce terrain.

À la livraison, chaque asset appartient explicitement à l'un des deux lots : **LOT A — PUBLIABLE IMMÉDIATEMENT** ou **LOT B — CONDITIONNÉ À `insurance_live`**. Aucun asset ambigu.

---

## §1 — LE PROJET EN 60 SECONDES

**AlloPetsitter** (allopetsitter.fr) — plateforme web française de mise en relation **propriétaires d'animaux ↔ pet sitters**.

**La promesse, gravée dans le marbre :**
> **« Votre pet sitter touche 100 % de ce que vous lui versez. Nous ne prenons aucune commission sur la garde. »**

**Le modèle de revenus :**
1. **La mise en relation** — Pass Séjour **39 €**, Pass Court **14,90 €**, ou Abonnement **19 €/mois sans engagement** (pas d'abonnement annuel en V1). **Empreinte carte au dépôt de la demande, débit uniquement quand un pet sitter accepte** — même si la demande est déposée des mois à l'avance. Inscription sitter 100 % gratuite, 0 % de commission.
2. **La distribution d'assurance** — c'est la vraie marge et la barrière à l'entrée, **mais elle n'est pas encore activée** (Règle 2). Elle se conçoit maintenant, elle se publiera plus tard.

**Les 2 piliers de la marque :**
1. **Transparence radicale** — pas un slogan : un **produit**, fait d'objets concrets et vérifiables (§5).
2. **Fiabilité** — on tue le désistement de dernière minute, la plaie du secteur.

**L'accroche de conversion, partout :**
> **« Vous ne payez que si un pet sitter accepte votre garde. »**

---

## §2 — LE TERRAIN CONCURRENTIEL (à regarder, puis à contredire)

- **Rover** : dominant, corporate, très américain, un peu froid. Prélève ~20 % aux sitters.
- **Animaute** : très français, un peu daté, rassurant/vétérinaire.
- **Holidog** : coloré, fun, mais réputation abîmée par son abonnement contraignant.
- **Zoolo** : conciergerie, humain, artisanal.

**Ce que tous font et qu'on ne fera PAS :**
- **Le tout-chien.** Il y a **16,6 M de chats en France contre 9,9 M de chiens.** Le chat doit avoir un traitement visuel **strictement égal**. C'est notre angle mort concurrentiel.
- Le stock photo « golden retriever dans un champ au coucher du soleil ».
- Le ton mièvre et infantilisant.

**Notre territoire** : chaleureux mais **adulte**. Honnête. Français. Direct. **On parle d'argent sans gêne, parce que c'est notre force.** Rassurant sans être sirupeux.

---

## §3 — MISSION 1 : L'IDENTITÉ D'ALLOPETSITTER *(commence par ici)*

**Le nom est arbitré, ne le rediscute pas : AlloPetsitter.** Graphie officielle unique : **un seul mot, A et P majuscules** — « AlloPetsitter », partout, sans exception (site, réseaux, presse, documents). Domaine principal : **allopetsitter.fr**.

**Le rationnel du nom, à exploiter dans l'identité** : le préfixe « Allo » évoque le contact et la mise en relation à la française (AlloCiné, AlloVoisins) — on décroche, on appelle, quelqu'un répond. Chaleureux, direct, sans tech-froideur. L'identité visuelle doit incarner cette idée : **la mise en relation, pas la garde**.

À produire :

1. **Une baseline** qui porte la promesse 0 % commission.
2. **3 pistes de logo** (concept + exécution vectorielle) — lisible en **favicon 16 px** comme en enseigne. Déclinaisons : horizontal, vertical, monogramme, monochrome, fonds clair/sombre.
3. **Design system complet** : palette (contrastes **AA/AAA vérifiés**), typographies (titres + texte, **libres de droits**), échelle typographique, radius, ombres, iconographie, composants (boutons, cartes sitter, badges, formulaires). **Tokens exportables — un développeur les intégrera dans Tailwind.**
4. **Le composant signature : le « Bloc Transparence »** — présent sur chaque fiche sitter et chaque devis :
   `Vous versez 30 € · Le pet sitter reçoit 30 € (100 %) · Commission AlloPetsitter : 0 €`
   **C'est l'objet le plus important de toute l'identité.** Il doit être beau, clair, irréfutable. Traite-le comme le héros de la marque.
5. **Le badge « Score de Fiabilité »** — visuel, instantanément lisible, non gadget. **Avec sa variante de seuil obligatoire** : sous un seuil de gardes déclarées, le score ne s'affiche pas — à la place, le badge « **Nouveau sur AlloPetsitter** », assumé et valorisant (pas un état honteux). **Jamais de score gonflé, jamais de faux avis, jamais de vide déguisé en chiffre.**
6. Le badge « RC Pro incluse » se conçoit aussi — **mais il part au LOT B** (Règle 2).

**Preuve sociale au lancement — règle de design** : nous n'avons ni volume ni avis au jour 1, et on n'en simulera aucun. La réassurance est **structurelle**, portée par des faits vérifiables : identité vérifiée, **0 € débité tant qu'aucun sitter n'a accepté**, contrat de garde type fourni, **résiliation en 3 clics**. Conçois des composants de réassurance autour de ces faits — pas de compteurs, pas de témoignages inventés, pas de logos presse fictifs.

---

## §4 — MISSION 2 : ÉCRANS & MAQUETTES (LOT A — publiable)

**Mobile-first** (70 %+ du trafic), puis desktop.

1. **Home** — promesse, recherche géolocalisée (code postal + dates + espèce + service), réassurance structurelle (cf. §3), **prix affichés dès la home** (39 € / 14,90 € / 19 €/mois — aucun paywall surprise, règle absolue), et l'accroche : **« Vous ne payez que si un pet sitter accepte votre garde. »**
2. **Résultats de recherche** — cartes sitter : tarif, Score de Fiabilité **ou** badge « Nouveau sur AlloPetsitter », distance, avis réels quand ils existent.
3. **Fiche pet sitter** — Bloc Transparence en évidence, calendrier, avis, prénom + initiale (l'identité complète n'apparaît qu'après déblocage).
4. **Landing acquisition sitters (waitlist)** — l'argument publiable : **« 0 % de commission. Vous gardez 100 % de vos revenus. »** + le comparatif chiffré face aux plateformes à commission (300 € vs 255 € sur 10 nuits). Formulaire waitlist : e-mail + code postal + services. **Aucune mention RC Pro ni assurance** (Règle 2).
5. **Page `/notre-modele`** — comment nous gagnons notre argent, ligne par ligne. Page de marque, pas page légale. *(La ligne assurance de cette page part au LOT B ; la version publiable présente la mise en relation seule.)*
6. **L'écran de dépôt de demande — le moment de l'empreinte carte.** Mécanisme décidé : empreinte carte au dépôt, **aucun débit tant qu'un pet sitter n'a pas accepté** ; les demandes peuvent être déposées des mois à l'avance. Cet écran doit **marteler « Aucun débit aujourd'hui »** — visuellement, pas en petites lignes : c'est LE point d'abandon à désamorcer. Conçois aussi l'état d'échec du débit à l'acceptation (3DS requis, carte expirée → « mise à jour de votre carte nécessaire ») : c'est un parcours de premier plan, pas un cas d'erreur honteux.
7. **L'écran de déblocage** — le moment où le client paie. Il ne doit **surtout pas** avoir l'impression d'acheter un numéro de téléphone : il achète une **mise en relation avec un sitter qui a déjà accepté**, un **contrat de garde type**, le **Plan B** et le **support**. Écran décisif pour la conversion : autant de soin que la home.
8. **Tunnel de choix d'offre** — **Pass Séjour 39 € · Pass Court 14,90 € · Abonnement 19 €/mois sans engagement** (c'est tout : pas d'offre annuelle). **La résiliation en 3 clics est mise en avant comme un argument de vente** — nos concurrents la cachent, nous, on l'affiche. Maquette aussi la page `/resilier` : le parcours de résiliation ne doit jamais être plus long que l'achat.

---

## §5 — MISSION 3 : LA TRANSPARENCE COMME PRODUIT (LOT A)

Chez les concurrents, la transparence est un argument marketing ; chez nous c'est un **produit** — des objets concrets que l'utilisateur peut toucher et vérifier. Chacun mérite un vrai travail de design :

1. **Le Reçu de transparence** (e-mail + page, post-paiement) : « Vous avez versé X € au pet sitter (100 %) · Vous avez payé Y € à AlloPetsitter pour la mise en relation · Voici ce que ça finance. » Généré depuis la base, jamais rédigé à la main — conçois le gabarit, pas des chiffres.
2. **La page publique `/nos-chiffres`** : gardes réalisées, cumul reversé aux sitters, délai médian de réponse, taux d'annulation, litiges et résolution — **statistiques réelles calculées depuis la base, affichées uniquement au-delà de seuils de crédibilité**. Conçois le gabarit avec des valeurs de remplacement clairement factices (« —— ») et l'état « pas encore assez de données pour publier ce chiffre » : cet état d'honnêteté fait partie du design.
3. **La page « Ce qui n'est PAS couvert / ce que nous ne faisons pas »** : les limites aussi visibles que les promesses. *(Version publiable limitée à la mise en relation — Plan B en obligation de moyens, cas de remboursement unique, ce que la plateforme ne fait pas ; les lignes RC Pro et Pack Sérénité de cette page partent au LOT B, comme pour `/notre-modele` — Règle 2.)*
4. **Le changelog public des CGU et des prix** : chaque modification datée, archivée, notifiée.
5. **L'e-mail de rappel J-3 avant prélèvement** : « Vous serez prélevé de 19 € le … — résilier en 1 clic. » Au-delà de l'obligation légale, et fièrement.
6. **La pause d'abonnement** (1 à 3 mois sans résilier — usage saisonnier) : écran + e-mail de confirmation.
7. **L'écran de remboursement proactif** : annulation du sitter confirmé sans remplaçant → remboursement déclenché **sans demande du client**, notification immédiate. Le seul cas de remboursement du modèle devient un moment de confiance — designe-le comme tel.

**⛔ Charte anti-dark-patterns — opposable à tout ton travail.** Interdits absolus, dans chaque maquette, chaque e-mail, chaque post : compte à rebours artificiel · fausse urgence ou rareté simulée (« N personnes regardent ce profil ») · prix barrés fictifs · **case pré-cochée** (aucune, jamais) · parcours de résiliation plus long que l'achat · frais découverts au checkout · conversion silencieuse d'un Pass en abonnement. Si une maquette « convertirait mieux » en violant l'un de ces points, elle est fausse.

---

## §6 — MISSION 4 : DOCUMENTS

**LOT A — publiables :**
1. **One-pager partenariats** (vétérinaires, toiletteurs, refuges, animaleries) — sans mention assurance.
2. **Kit de bienvenue pet sitter** (PDF) : réussir son profil, fixer ses tarifs, ACACED, statut auto-entrepreneur, bonnes pratiques. **Version publiable sans la section RC Pro** ; la section « Votre RC Pro incluse » se conçoit en encart séparé, versé au LOT B.
3. **Guide propriétaire** (PDF) : préparer sa garde, la rencontre préalable, checklist de départ.
4. **Charte de qualité** — nos engagements, publics et opposables (y compris la charte anti-dark-patterns du §5).

**Statut particulier — pitch deck investisseur (12–15 slides)** : marché, douleurs, solution, les lignes de revenus, différenciation, concurrence, go-to-market, roadmap, équipe (le cabinet de courtage est un actif — mets-le en avant), ask. Document **privé** (non publié) : il peut présenter la ligne assurance comme cœur du modèle, **à condition d'indiquer explicitement que son activation est conditionnée à l'immatriculation ORIAS de l'entité et à la signature du contrat groupe** (en cours). Aucune slide ne doit laisser croire que la distribution est déjà active.

---

## §7 — MISSION 5 : LE VOLET ASSURANCE (LOT B — intégralement conditionné)

**Tout ce paragraphe se conçoit maintenant et se livre dans le LOT B, marqué « NE PAS PUBLIER avant activation `insurance_live` » — Règle 2.**

Le contexte (pour concevoir juste) : le marché français de l'assurance santé animale est massivement sous-pénétré (~5 % des animaux assurés, contre 25 % au Royaume-Uni et 91 % en Suède), et notre plateforme capte le propriétaire au pic exact de son anxiété — quand il confie son animal à un inconnu.

1. **L'option « Pack Sérénité »** (assistance vétérinaire + couverture pendant la garde) — case à cocher claire, **jamais pré-cochée**, valeur évidente en un regard.
2. **Le parcours de souscription assurance santé animale** — la confiance d'un assureur, la simplicité d'une app. Ni jargon, ni petits caractères. Le recueil des besoins doit ressembler à un **conseil**, pas à un formulaire.
3. **La landing « RC Pro incluse » côté sitter** (version enrichie de la landing du §4.4) + le badge « RC Pro incluse » — avec l'encart de périmètre permanent : « Votre RC Pro ne couvre que les gardes réservées via AlloPetsitter. » Sans lui, le marketing devient trompeur.
4. **Contenu pédagogique** : « combien coûte vraiment une chirurgie sur un chien ? » Le vrai frein à l'assurance animale en France, c'est l'ignorance du coût réel du risque. Rends-le tangible — **sans jamais verser dans la peur ni le pathos**. Honnêteté, chiffres sourcés, factualité.
5. **La commission d'assurance affichée en euros** à la souscription — au-delà du minimum réglementaire, cohérent avec `/notre-modele`.

⚠️ **Contrainte réglementaire (DDA)** : aucune option pré-cochée, transparence sur le statut d'intermédiaire et la rémunération, information précontractuelle claire, mentions ORIAS visibles (dans les maquettes : placeholder `[N° ORIAS — à compléter à l'activation]`, jamais un numéro inventé). **Le design doit servir la conformité, pas la contourner.**

---

## §8 — MISSION 6 : CONTENU SOCIAL & VIDÉO

**Plateformes** : Instagram + TikTok (prioritaires), Facebook (les groupes de pet sitters sont un vivier d'acquisition), LinkedIn (partenariats).

**LOT A — publiable immédiatement :**
1. **Un système de templates** (feed + stories), déclinables — pas des one-shots.
2. **10 concepts de posts fondateurs** (9 au LOT A + 1 au LOT B, cf. ci-dessous), dont obligatoirement :
   - Le comparatif chiffré **« 300 € chez nous vs 255 € ailleurs sur 10 nuits »**. Frontal, assumé.
   - Une série **chat** (les concurrents ne parlent qu'au chien — on prend le terrain vide).
   - Le **désistement de dernière minute**, raconté du point de vue du propriétaire en panique.
   - **« Vous ne payez que si un pet sitter accepte »** — la mécanique de l'empreinte carte expliquée en un visuel.
   - **« 0 % de commission »** — ciblage sitters, sans RC Pro.
3. **5 scripts vidéo courts (20–40 s)**, verticaux, sous-titrés, hook dans les 2 premières secondes :
   - « Combien touche VRAIMENT ton pet sitter ? » (démonstration à l'écran)
   - Portrait de sitter (authentique, pas pub)
   - « Ce qui se passe si ton sitter annule la veille » (le Plan B)
   - « Choisir son pet sitter en 3 questions »
   - « Ton chat ne veut pas de pension. Voici l'alternative. »

**LOT B — conditionné à `insurance_live` :**
   - Le concept **« Votre RC Pro est incluse »** (ciblage sitters) et toute déclinaison mentionnant l'assurance, la RC Pro ou le Pack Sérénité.

**Ligne éditoriale (transverse aux deux lots)** : tonalité, ce qu'on dit / ce qu'on ne dit jamais (cf. Règles 1 et 2), usage des visuels d'animaux (photos réelles d'utilisateurs > stock). Aucune statistique inventée, aucun avis fictif, aucun chiffre non sourcé.

---

## §9 — CONTRAINTES TRANSVERSES

- **100 % français** : langue, ton, références, villes, cadre légal.
- **Accessibilité** : WCAG AA minimum. Le public inclut des seniors propriétaires de chats.
- **Cohérence** : chaque livrable dérive du design system. Pas de one-shot orphelin.
- **Livrables exploitables** : SVG pour les logos, tokens exportables (Tailwind), textes en français relu.
- **Deux lots étanches à la livraison** : LOT A (publiable) / LOT B (« NE PAS PUBLIER avant activation `insurance_live` »). Chaque fichier porte son lot dans son nom.
- **Prix : uniquement 39 € / 14,90 € / 19 €/mois.** Aucun autre tarif, aucune promotion inventée, aucun prix barré.
- **Vocabulaire strict de mise en relation** (Règle 1) et **zéro mention assurance en LOT A** (Règle 2) : ces deux règles priment sur toute considération esthétique ou de conversion.

**Commence par la Mission 1 (identité AlloPetsitter). Je valide la charte avant que tu ne produises quoi que ce soit d'autre.**
