-- CreateTable
CREATE TABLE "OwnerWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "species" "Species"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "OwnerWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerWaitlist_email_key" ON "OwnerWaitlist"("email");

-- CreateIndex
CREATE INDEX "OwnerWaitlist_postalCode_idx" ON "OwnerWaitlist"("postalCode");

