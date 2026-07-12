# DECISIONS.md — AlloPetsitter

Chaque choix structurant, avec sa raison. (Règle §12 du brief.)

| # | Date | Décision | Raison |
|---|---|---|---|
| 1 | 2026-07-12 | Marque **AlloPetsitter**, domaine allopetsitter.fr (Q5) | Décision fondateur après double expertise SEO + référencement IA ; composé « préfixe + petsitter » = entité unique tout en gardant le mot-clé. Disponibilité RDAP vérifiée. |
| 2 | 2026-07-12 | Paiement : **SetupIntent + débit off-session à l'acceptation** comme mode principal (Q14) | Les réservations anticipées (plusieurs mois) sont indispensables ; une pré-autorisation carte expire en 7 jours max. `manual capture` réduit à une optimisation optionnelle (arbitrage P3). |
| 3 | 2026-07-12 | Commission assurance : **20 %** (Q1) | Donnée fondateur. Confirme LTV assurance >> LTV mise en relation. Assiette exacte à préciser. |
| 4 | 2026-07-12 | **Next.js 16** (au lieu du 15 du plan) + Tailwind 4 + Prisma 6 | Versions courantes à la création du projet ; App Router identique, aucune raison de figer une version antérieure. |
| 5 | 2026-07-12 | Squelette P1 **sans base de données obligatoire** | Le site doit builder et se déployer avant que Neon soit provisionné ; l'API waitlist répond 503 proprement sans DATABASE_URL. |
| 6 | 2026-07-12 | **Lint lexical en CI** : possession/subordination + verrou assurance + claims non sourcés/dark patterns | La Règle de vocabulaire et le flag `insurance_live` deviennent exécutables — toute violation casse le build. |
| 7 | 2026-07-12 | Pages légales en **gabarit assumé** (mentions, CGU) | Q4 (entité) en suspens ; afficher un statut incomplet vaut mieux qu'inventer. AUCUNE mention ORIAS tant que `insurance_live=false` (l'afficher serait une infraction). |
| 8 | 2026-07-12 | Tarifs dans `lib/pricing.ts` (constantes commentées) | Grille du brief (39 / 14,90 / 19 €) affichée dès la home comme l'exige le pilier transparence ; migration en base dès P3. |
| 9 | 2026-07-12 | **Pass Court maintenu à 14,90 € avec garde 1 nuit incluse** (décision fondateur, après examen d'une hausse à 30 €) | Le risque « déclarer une promenade pour payer moins qu'une garde » est traité STRUCTURELLEMENT, pas par le prix : (a) le formulaire déduit le Pass des dates — ≥ 2 nuits ⇒ Pass Séjour automatique, une « promenade » sur 10 jours est impossible à saisir ; (b) règle `fraud_signals` : tarif de candidature incohérent avec le type de service ⇒ signalement ; (c) l'avis post-garde décrit le service réel. Hausser à 30 € aurait tué la visite (service signature chat) et la promenade sans éliminer l'arbitrage résiduel. |
