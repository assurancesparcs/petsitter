-- DropIndex
DROP INDEX "StructuredMessage_careRequestId_idx";

-- AlterTable
ALTER TABLE "StructuredMessage" ADD COLUMN     "hadMaskedContent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maskedBody" TEXT;

-- CreateIndex
CREATE INDEX "StructuredMessage_careRequestId_createdAt_idx" ON "StructuredMessage"("careRequestId", "createdAt");

