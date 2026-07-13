# Registre des activités de traitement (art. 30 RGPD) — AlloPetsitter

> Document vivant. Une fiche par traitement. Créé en P1 car la collecte est
> active (waitlist). À compléter à chaque nouveau traitement (comptes, missions,
> assurance…). Responsable du traitement : éditeur d'AlloPetsitter (fondateur en
> nom propre tant que la société n'est pas immatriculée) — contact
> rgpd@allo-pet-sitter.fr.

---

## Fiche T-01 — Liste d'attente pet sitter (ACTIF)

| Rubrique | Contenu |
|---|---|
| **Finalité** | Prévenir une personne intéressée de l'ouverture des inscriptions pet sitter dans sa zone géographique. |
| **Base légale** | Consentement (art. 6.1.a) — soumission volontaire du formulaire, finalité unique affichée au-dessus du champ. Retirable à tout moment. |
| **Catégories de personnes** | Pet sitters potentiels (prospects côté offre). |
| **Données** | Adresse e-mail ; code postal. (Minimisation : aucune autre donnée collectée.) |
| **Destinataires** | Éditeur uniquement. Aucune cession, aucune transmission à un tiers. |
| **Sous-traitants** | Hébergeur Vercel (UE) ; base de données Neon (UE, Francfort). DPA à archiver. |
| **Transferts hors UE** | Aucun. |
| **Durée de conservation** | Jusqu'à 12 mois après l'ouverture du service dans la zone, puis suppression si absence de création de compte. Purge automatisée (cron) — à implémenter (cf. matrice-retention.md). |
| **Mesures de sécurité** | HTTPS/HSTS, en-têtes de sécurité (CSP…), validation et bornage des entrées, rate-limiting, accès base restreint, secrets hors dépôt. |
| **Information des personnes** | Page /confidentialite + finalité affichée au point de collecte. |
| **Exercice des droits** | rgpd@allo-pet-sitter.fr (accès, rectification, effacement, retrait du consentement, réclamation CNIL). Réponse sous 1 mois. |

---

## Fiches à créer avant P2 (rappel)
- T-02 Comptes utilisateurs (owners/sitters) · T-03 Vérification d'identité (sous-traitant) · T-04 Profils & recherche géo · T-05 Échange structuré + filtre anti-fuite (analyse de messages — base : intérêt légitime, DPA LLM) · T-06 Avis & Score de Fiabilité (profilage, art. 22) · T-07 Paiements (Stripe) · T-08 Assurance & DDA (rétention légale ACPR) · T-09 Anti-fraude.
