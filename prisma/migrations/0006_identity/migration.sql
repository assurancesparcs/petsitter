-- AlterTable
ALTER TABLE "IdentityVerification" ADD COLUMN     "docStoragePath" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "selfieStoragePath" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ALTER COLUMN "provider" SET DEFAULT 'manual',
ALTER COLUMN "status" SET DEFAULT 'pending';

