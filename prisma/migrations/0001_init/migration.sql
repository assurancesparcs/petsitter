-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'SITTER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('BOARDING', 'HOUSE_SITTING', 'HOME_VISIT', 'WALK');

-- CreateEnum
CREATE TYPE "CareRequestStatus" AS ENUM ('OPEN', 'ACCEPTED', 'UNLOCKED', 'CONFIRMED', 'COMPLETED', 'EXPIRED', 'CANCELLED_BY_OWNER', 'CANCELLED_BY_SITTER_PRE_CONFIRMATION', 'CANCELLED_BY_SITTER_POST_CONFIRMATION', 'REPLACEMENT_IN_PROGRESS', 'PAYMENT_REQUIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SETUP_PENDING', 'SETUP_COMPLETED', 'CHARGE_PENDING', 'CAPTURED', 'CHARGE_FAILED', 'CANCELED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "phone" TEXT,
    "phoneVerifiedAt" TIMESTAMP(3),
    "firstName" TEXT NOT NULL,
    "lastNameInitial" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "experience" TEXT,
    "housingType" TEXT,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "ownAnimals" TEXT,
    "photosFiltered" BOOLEAN NOT NULL DEFAULT false,
    "communeCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "radiusKm" INTEGER NOT NULL DEFAULT 10,
    "acacedNumber" TEXT,
    "ddppDeclaredAt" TIMESTAMP(3),
    "siret" TEXT,
    "birthDate" TIMESTAMP(3),
    "taxAddress" TEXT,
    "dac7Consent" TIMESTAMP(3),
    "calendarUpdated" TIMESTAMP(3),
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,

    CONSTRAINT "SitterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "birthYear" INTEGER,
    "constraints" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitterService" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "service" "ServiceType" NOT NULL,
    "species" "Species" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "priceUnit" TEXT NOT NULL,

    CONSTRAINT "SitterService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "available" BOOLEAN NOT NULL,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareRequest" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "service" "ServiceType" NOT NULL,
    "species" "Species" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "communeCode" TEXT NOT NULL,
    "radiusKm" INTEGER NOT NULL,
    "constraints" JSONB,
    "status" "CareRequestStatus" NOT NULL DEFAULT 'OPEN',
    "responseDeadline" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringRequest" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "weekdays" INTEGER[],
    "timeSlot" TEXT,
    "renewSitter" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RecurringRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "answers" JSONB,
    "shortPitch" TEXT,
    "filterStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StructuredMessage" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "predefinedKey" TEXT,
    "body" TEXT,
    "filterStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StructuredMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "confirmedSitterId" TEXT NOT NULL,
    "backupSitterId" TEXT,
    "addressEncrypted" TEXT,
    "contractGeneratedAt" TIMESTAMP(3),
    "preMeetingAt" TIMESTAMP(3),
    "doubleConfirmedAt" TIMESTAMP(3),
    "remindersSent" JSONB,
    "declaredDone" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "experienceDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderatedAt" TIMESTAMP(3),
    "moderationNote" TEXT,
    "reportedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliabilityScore" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "responseRate" DOUBLE PRECISION,
    "medianResponseH" DOUBLE PRECISION,
    "cancellationRate" DOUBLE PRECISION,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "memberSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayEligible" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReliabilityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestEvent" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSetupIntentId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "packLabel" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SETUP_PENDING',
    "immediateExecutionRequestedAt" TIMESTAMP(3),
    "withdrawalWaiverAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nextChargeReminderAt" TIMESTAMP(3),
    "pausedUntil" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "insurer" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DdaJourney" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "needsAssessment" JSONB NOT NULL,
    "needsAssessedAt" TIMESTAMP(3),
    "adviceRecord" TEXT,
    "ipidDeliveredAt" TIMESTAMP(3),
    "ipidVersion" TEXT,
    "statusDisclosedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DdaJourney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceSubscription" (
    "id" TEXT NOT NULL,
    "ddaJourneyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renunciationDeadline" TIMESTAMP(3),
    "renouncedAt" TIMESTAMP(3),
    "premiumRefundedAt" TIMESTAMP(3),

    CONSTRAINT "InsuranceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionEntry" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "premiumCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RcpGroupAffiliation" (
    "id" TEXT NOT NULL,
    "sitterProfileId" TEXT NOT NULL,
    "affiliatedAt" TIMESTAMP(3),
    "attestationNumber" TEXT,
    "noticeVersion" TEXT,
    "noticeAcceptedAt" TIMESTAMP(3),

    CONSTRAINT "RcpGroupAffiliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,

    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFilterHit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentFilterHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsVersion" (
    "id" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "TermsVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitterWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "services" "ServiceType"[],
    "species" "Species"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "SitterWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commune" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SitterProfile_userId_key" ON "SitterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_sitterProfileId_key" ON "IdentityVerification"("sitterProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SitterService_sitterProfileId_service_species_key" ON "SitterService"("sitterProfileId", "service", "species");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_date_idx" ON "AvailabilitySlot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilitySlot_sitterProfileId_date_key" ON "AvailabilitySlot"("sitterProfileId", "date");

-- CreateIndex
CREATE INDEX "CareRequest_status_responseDeadline_idx" ON "CareRequest"("status", "responseDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringRequest_careRequestId_key" ON "RecurringRequest"("careRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_careRequestId_sitterProfileId_key" ON "Application"("careRequestId", "sitterProfileId");

-- CreateIndex
CREATE INDEX "StructuredMessage_careRequestId_idx" ON "StructuredMessage"("careRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_careRequestId_key" ON "Mission"("careRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_missionId_key" ON "Review"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReliabilityScore_sitterProfileId_key" ON "ReliabilityScore"("sitterProfileId");

-- CreateIndex
CREATE INDEX "RequestEvent_careRequestId_createdAt_idx" ON "RequestEvent"("careRequestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_careRequestId_key" ON "Payment"("careRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_key_key" ON "SubscriptionPlan"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProduct_key_key" ON "InsuranceProduct"("key");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceSubscription_ddaJourneyId_key" ON "InsuranceSubscription"("ddaJourneyId");

-- CreateIndex
CREATE UNIQUE INDEX "RcpGroupAffiliation_sitterProfileId_key" ON "RcpGroupAffiliation"("sitterProfileId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SitterWaitlist_email_key" ON "SitterWaitlist"("email");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_createdAt_idx" ON "AnalyticsEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "Commune_postalCode_idx" ON "Commune"("postalCode");

-- AddForeignKey
ALTER TABLE "SitterProfile" ADD CONSTRAINT "SitterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityVerification" ADD CONSTRAINT "IdentityVerification_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitterService" ADD CONSTRAINT "SitterService_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareRequest" ADD CONSTRAINT "CareRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringRequest" ADD CONSTRAINT "RecurringRequest_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliabilityScore" ADD CONSTRAINT "ReliabilityScore_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestEvent" ADD CONSTRAINT "RequestEvent_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DdaJourney" ADD CONSTRAINT "DdaJourney_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceSubscription" ADD CONSTRAINT "InsuranceSubscription_ddaJourneyId_fkey" FOREIGN KEY ("ddaJourneyId") REFERENCES "DdaJourney"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceSubscription" ADD CONSTRAINT "InsuranceSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "InsuranceSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RcpGroupAffiliation" ADD CONSTRAINT "RcpGroupAffiliation_sitterProfileId_fkey" FOREIGN KEY ("sitterProfileId") REFERENCES "SitterProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

