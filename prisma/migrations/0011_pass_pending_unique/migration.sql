-- Un seul achat de Pass 3 mois "pending" par utilisateur (audit F2) : ferme la
-- course du double-clic strictement parallèle — la seconde création échoue
-- (P2002) et l'action réutilise la ligne gagnante. Index PARTIEL (non
-- représentable dans schema.prisma — documenté en commentaire du modèle).
CREATE UNIQUE INDEX "PassPurchase_userId_pending_key"
  ON "PassPurchase"("userId")
  WHERE "status" = 'pending';
