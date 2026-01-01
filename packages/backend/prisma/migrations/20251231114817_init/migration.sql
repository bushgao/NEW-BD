-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF');

-- CreateEnum
CREATE TYPE "FactoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED');

-- CreateEnum
CREATE TYPE "BlockReason" AS ENUM ('PRICE_HIGH', 'DELAYED', 'UNCOOPERATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReceivedStatus" AS ENUM ('PENDING', 'RECEIVED', 'LOST');

-- CreateEnum
CREATE TYPE "OnboardStatus" AS ENUM ('UNKNOWN', 'ONBOARD', 'NOT_ONBOARD');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('SHORT_VIDEO', 'LIVE_STREAM');

-- CreateEnum
CREATE TYPE "ProfitStatus" AS ENUM ('LOSS', 'BREAK_EVEN', 'PROFIT', 'HIGH_PROFIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "factoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "FactoryStatus" NOT NULL DEFAULT 'PENDING',
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "staffLimit" INTEGER NOT NULL DEFAULT 3,
    "influencerLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platformId" TEXT NOT NULL,
    "phone" TEXT,
    "categories" TEXT[],
    "tags" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitCost" INTEGER NOT NULL,
    "retailPrice" INTEGER NOT NULL,
    "canResend" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collaboration" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "businessStaffId" TEXT NOT NULL,
    "stage" "PipelineStage" NOT NULL DEFAULT 'LEAD',
    "deadline" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" "BlockReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collaboration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SampleDispatch" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "businessStaffId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCostSnapshot" INTEGER NOT NULL,
    "totalSampleCost" INTEGER NOT NULL,
    "shippingCost" INTEGER NOT NULL,
    "totalCost" INTEGER NOT NULL,
    "trackingNumber" TEXT,
    "receivedStatus" "ReceivedStatus" NOT NULL DEFAULT 'PENDING',
    "receivedAt" TIMESTAMP(3),
    "onboardStatus" "OnboardStatus" NOT NULL DEFAULT 'UNKNOWN',
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborationResult" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "salesQuantity" INTEGER NOT NULL,
    "salesGmv" INTEGER NOT NULL,
    "commissionRate" DOUBLE PRECISION,
    "pitFee" INTEGER NOT NULL DEFAULT 0,
    "actualCommission" INTEGER NOT NULL,
    "totalSampleCost" INTEGER NOT NULL,
    "totalCollaborationCost" INTEGER NOT NULL,
    "roi" DOUBLE PRECISION NOT NULL,
    "profitStatus" "ProfitStatus" NOT NULL,
    "willRepeat" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpRecord" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageHistory" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "fromStage" "PipelineStage",
    "toStage" "PipelineStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "StageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanConfig" (
    "id" TEXT NOT NULL,
    "planType" "PlanType" NOT NULL,
    "name" TEXT NOT NULL,
    "staffLimit" INTEGER NOT NULL,
    "influencerLimit" INTEGER NOT NULL,
    "dataRetentionDays" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "features" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_factoryId_idx" ON "User"("factoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Factory_ownerId_key" ON "Factory"("ownerId");

-- CreateIndex
CREATE INDEX "Factory_ownerId_idx" ON "Factory"("ownerId");

-- CreateIndex
CREATE INDEX "Factory_status_idx" ON "Factory"("status");

-- CreateIndex
CREATE INDEX "Influencer_factoryId_idx" ON "Influencer"("factoryId");

-- CreateIndex
CREATE INDEX "Influencer_nickname_idx" ON "Influencer"("nickname");

-- CreateIndex
CREATE INDEX "Influencer_phone_idx" ON "Influencer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_factoryId_platform_platformId_key" ON "Influencer"("factoryId", "platform", "platformId");

-- CreateIndex
CREATE INDEX "Sample_factoryId_idx" ON "Sample"("factoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_factoryId_sku_key" ON "Sample"("factoryId", "sku");

-- CreateIndex
CREATE INDEX "Collaboration_factoryId_idx" ON "Collaboration"("factoryId");

-- CreateIndex
CREATE INDEX "Collaboration_businessStaffId_idx" ON "Collaboration"("businessStaffId");

-- CreateIndex
CREATE INDEX "Collaboration_stage_idx" ON "Collaboration"("stage");

-- CreateIndex
CREATE INDEX "Collaboration_isOverdue_idx" ON "Collaboration"("isOverdue");

-- CreateIndex
CREATE INDEX "SampleDispatch_sampleId_idx" ON "SampleDispatch"("sampleId");

-- CreateIndex
CREATE INDEX "SampleDispatch_collaborationId_idx" ON "SampleDispatch"("collaborationId");

-- CreateIndex
CREATE INDEX "SampleDispatch_businessStaffId_idx" ON "SampleDispatch"("businessStaffId");

-- CreateIndex
CREATE INDEX "SampleDispatch_receivedStatus_idx" ON "SampleDispatch"("receivedStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationResult_collaborationId_key" ON "CollaborationResult"("collaborationId");

-- CreateIndex
CREATE INDEX "CollaborationResult_collaborationId_idx" ON "CollaborationResult"("collaborationId");

-- CreateIndex
CREATE INDEX "CollaborationResult_profitStatus_idx" ON "CollaborationResult"("profitStatus");

-- CreateIndex
CREATE INDEX "CollaborationResult_publishedAt_idx" ON "CollaborationResult"("publishedAt");

-- CreateIndex
CREATE INDEX "FollowUpRecord_collaborationId_idx" ON "FollowUpRecord"("collaborationId");

-- CreateIndex
CREATE INDEX "StageHistory_collaborationId_idx" ON "StageHistory"("collaborationId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlanConfig_planType_key" ON "PlanConfig"("planType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factory" ADD CONSTRAINT "Factory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_businessStaffId_fkey" FOREIGN KEY ("businessStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleDispatch" ADD CONSTRAINT "SampleDispatch_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleDispatch" ADD CONSTRAINT "SampleDispatch_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SampleDispatch" ADD CONSTRAINT "SampleDispatch_businessStaffId_fkey" FOREIGN KEY ("businessStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationResult" ADD CONSTRAINT "CollaborationResult_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpRecord" ADD CONSTRAINT "FollowUpRecord_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpRecord" ADD CONSTRAINT "FollowUpRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageHistory" ADD CONSTRAINT "StageHistory_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
