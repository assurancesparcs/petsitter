-- AlterTable
ALTER TABLE "ReliabilityScore" ADD COLUMN     "averageRating" DOUBLE PRECISION,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0;

