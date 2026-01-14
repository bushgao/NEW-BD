/*
  Warnings:

  - The values [WEIBO,OTHER] on the enum `Platform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "InfluencerSourceType" ADD VALUE 'SELF_REGISTER';

-- AlterEnum
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('DOUYIN', 'KUAISHOU', 'SHIPINHAO', 'XIAOHONGSHU');
ALTER TABLE "Influencer" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "Platform_old";
COMMIT;

-- AlterTable
ALTER TABLE "Collaboration" ADD COLUMN     "brandInfluencerId" TEXT;

-- CreateTable
CREATE TABLE "GlobalInfluencer" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "phone" TEXT,
    "wechat" TEXT,
    "platformAccounts" JSONB NOT NULL DEFAULT '[]',
    "sourceType" "InfluencerSourceType" NOT NULL DEFAULT 'STAFF',
    "createdBy" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNote" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalInfluencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandInfluencer" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "globalInfluencerId" TEXT NOT NULL,
    "tags" TEXT[],
    "notes" TEXT,
    "categories" TEXT[],
    "groupId" TEXT,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandInfluencer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalInfluencer_phone_key" ON "GlobalInfluencer"("phone");

-- CreateIndex
CREATE INDEX "GlobalInfluencer_nickname_idx" ON "GlobalInfluencer"("nickname");

-- CreateIndex
CREATE INDEX "GlobalInfluencer_phone_idx" ON "GlobalInfluencer"("phone");

-- CreateIndex
CREATE INDEX "GlobalInfluencer_verificationStatus_idx" ON "GlobalInfluencer"("verificationStatus");

-- CreateIndex
CREATE INDEX "GlobalInfluencer_accountId_idx" ON "GlobalInfluencer"("accountId");

-- CreateIndex
CREATE INDEX "BrandInfluencer_factoryId_idx" ON "BrandInfluencer"("factoryId");

-- CreateIndex
CREATE INDEX "BrandInfluencer_globalInfluencerId_idx" ON "BrandInfluencer"("globalInfluencerId");

-- CreateIndex
CREATE INDEX "BrandInfluencer_groupId_idx" ON "BrandInfluencer"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandInfluencer_factoryId_globalInfluencerId_key" ON "BrandInfluencer"("factoryId", "globalInfluencerId");

-- CreateIndex
CREATE INDEX "Collaboration_brandInfluencerId_idx" ON "Collaboration"("brandInfluencerId");

-- AddForeignKey
ALTER TABLE "GlobalInfluencer" ADD CONSTRAINT "GlobalInfluencer_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalInfluencer" ADD CONSTRAINT "GlobalInfluencer_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlobalInfluencer" ADD CONSTRAINT "GlobalInfluencer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InfluencerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfluencer" ADD CONSTRAINT "BrandInfluencer_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfluencer" ADD CONSTRAINT "BrandInfluencer_globalInfluencerId_fkey" FOREIGN KEY ("globalInfluencerId") REFERENCES "GlobalInfluencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfluencer" ADD CONSTRAINT "BrandInfluencer_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandInfluencer" ADD CONSTRAINT "BrandInfluencer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "InfluencerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_brandInfluencerId_fkey" FOREIGN KEY ("brandInfluencerId") REFERENCES "BrandInfluencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
