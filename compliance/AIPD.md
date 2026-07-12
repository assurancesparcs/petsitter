# Analyse d'impact relative à la protection des données (AIPD) — AlloPetsitter

> **Statut : ébauche P1, à finaliser AVANT l'ouverture des comptes/profils (P2).**
> Pour le seul traitement actif aujourd'hui (waitlist e-mail + code postal), les
> critères CNIL d'AIPD obligatoire ne sont pas réunis — une AIPD n'est pas
> légalement exigée en l'état. Elle le devient dès P2 (cumul de critères).

## Pourquoi une AIPD sera obligatoire en P2 (critères CNIL réunis)
1. **Profilage avec effet significatif** : Score de Fiabilité → déclassement/exclusion d'un sitter (impact sur son revenu, art. 22).
2. **Vérification d'identité à grande échelle** (sous-traitant).
3. **Surveillance systématique / analyse de correspondances** : filtre anti-fuite (regex + LLM) sur messages, bios, photos.
Le cumul dépasse les 2 critères déclenchant l'AIPD.

## À traiter dans la version finale
- Description des finalités et des flux, minimisation par traitement.
- Nécessité et proportionnalité (notamment analyse de messages : intérêt légitime, test de balance).
- Risques pour les personnes : adresse exacte + dates d'absence (risque physique/cambriolage → chiffrement AES-256-GCM, cf. src/lib/crypto.ts) ; profilage sitter (recours humain garanti) ; sous-traitance LLM (DPA, non-entraînement, minimisation, transfert).
- Mesures : chiffrement au repos, cloisonnement, journalisation, recours humain art. 22, information explicite au point de collecte.
- Consultation du DPO/référent ; réexamen à chaque évolution majeure.

## Sous-traitants à encadrer (DPA à archiver)
Vercel (UE) · Neon (UE) · prestataire de vérification d'identité (UE) · Stripe (paiement) · fournisseur LLM du filtre anti-fuite (DPA + garanties de transfert + non-réutilisation) · Scaleway (fichiers, UE).
