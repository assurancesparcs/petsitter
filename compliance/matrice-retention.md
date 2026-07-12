# Matrice des durées de conservation — AlloPetsitter

> Complète l'affirmation du schéma (« durée par table »). Chaque table alimentée
> doit avoir une ligne AVANT sa mise en service (P2). La purge est assurée par un
> cron RGPD (à implémenter en P2 — aujourd'hui aucune table sensible n'est
> alimentée hors waitlist).

| Donnée / table | Durée de conservation | Sort final | Base |
|---|---|---|---|
| `SitterWaitlist` | 12 mois après ouverture de la zone (ou 24 mois sans conversion) | Suppression | Consentement |
| `User` (compte actif) | Durée de la relation + 3 ans après dernière activité | Anonymisation puis suppression | Contrat / intérêt légitime |
| `User.lastName`, adresses | Idem compte ; adresse exacte purgée dès mission expirée/annulée | Suppression | Contrat |
| `Mission.addressEncrypted` + dates | Durée de la mission + délai de litige court | Suppression | Contrat |
| `IdentityVerification` (métadonnées) | Durée du compte sitter | Suppression | Obligation / intérêt légitime |
| `Payment` (données transactionnelles) | 10 ans (obligation comptable) | Archivage intermédiaire | Obligation légale |
| `Review`, `ReliabilityScore` | Durée du compte | Suppression/anonymisation | Intérêt légitime |
| `StructuredMessage`, `ContentFilterHit` | 13 mois (preuve anti-fraude) | Suppression | Intérêt légitime |
| `DdaJourney`, `InsuranceSubscription`, `AuditLog`, `Complaint` | **5 ans après fin de la relation** (piste d'audit opposable ACPR) | Archivage puis suppression | Obligation légale (exception art. 17.3.b) — cf. DECISIONS.md n°10 |
| `AnalyticsEvent` | 25 mois (recommandation CNIL mesure d'audience) puis agrégation | Anonymisation | Intérêt légitime |
| Données vendeur DAC7 (`siret`, `birthDate`, `taxAddress`) | Durée légale de reporting fiscal | Archivage | Obligation légale |
