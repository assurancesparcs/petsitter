-- CreateTable
CREATE TABLE "PassPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "stripePaymentIntentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "immediateExecutionRequestedAt" TIMESTAMP(3),
    "withdrawalWaiverAt" TIMESTAMP(3),

    CONSTRAINT "PassPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PassPurchase_stripePaymentIntentId_key" ON "PassPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "PassPurchase_userId_status_expiresAt_idx" ON "PassPurchase"("userId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "PassPurchase" ADD CONSTRAINT "PassPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

