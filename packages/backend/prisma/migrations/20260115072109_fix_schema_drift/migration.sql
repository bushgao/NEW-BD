/*
  Warnings:

  - The values [SELF_REGISTER] on the enum `InfluencerSourceType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SHIPINHAO] on the enum `Platform` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `brandInfluencerId` on the `Collaboration` table. All the data in the column will be lost.
  - You are about to drop the column `factoryId` on the `Collaboration` table. All the data in the column will be lost.
  - You are about to drop the column `factoryId` on the `Influencer` table. All the data in the column will be lost.
  - You are about to drop the column `factoryId` on the `InfluencerGroup` table. All the data in the column will be lost.
  - You are about to drop the column `factoryId` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `quotedPrice` on the `StageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `sampleIds` on the `StageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `sampleNames` on the `StageHistory` table. All the data in the column will be lost.
  - You are about to drop the column `factoryId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BrandInfluencer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CollaborationSample` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Factory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GlobalInfluencer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeChatAddLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WeChatScript` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[brandId,platform,platformId]` on the table `Influencer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wechatId]` on the table `InfluencerAccount` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[brandId,sku]` on the table `Sample` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `brandId` to the `Collaboration` table without a default value. This is not possible if the table is not empty.
  - Made the column `influencerId` on table `Collaboration` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `brandId` to the `Influencer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brandId` to the `InfluencerGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brandId` to the `Sample` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterEnum
BEGIN;
CREATE TYPE "InfluencerSourceType_new" AS ENUM ('PLATFORM', 'FACTORY', 'STAFF');
ALTER TABLE "GlobalInfluencer" ALTER COLUMN "sourceType" DROP DEFAULT;
ALTER TABLE "Influencer" ALTER COLUMN "sourceType" DROP DEFAULT;
ALTER TABLE "Influencer" ALTER COLUMN "sourceType" TYPE "InfluencerSourceType_new" USING ("sourceType"::text::"InfluencerSourceType_new");
ALTER TYPE "InfluencerSourceType" RENAME TO "InfluencerSourceType_old";
ALTER TYPE "InfluencerSourceType_new" RENAME TO "InfluencerSourceType";
DROP TYPE "InfluencerSourceType_old";
ALTER TABLE "Influencer" ALTER COLUMN "sourceType" SET DEFAULT 'STAFF';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Platform_new" AS ENUM ('DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER');
ALTER TABLE "Influencer" ALTER COLUMN "platform" TYPE "Platform_new" USING ("platform"::text::"Platform_new");
ALTER TYPE "Platform" RENAME TO "Platform_old";
ALTER TYPE "Platform_new" RENAME TO "Platform";
DROP TYPE "Platform_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'INFLUENCER';

-- DropForeignKey
ALTER TABLE "BrandInfluencer" DROP CONSTRAINT "BrandInfluencer_addedBy_fkey";

-- DropForeignKey
ALTER TABLE "BrandInfluencer" DROP CONSTRAINT "BrandInfluencer_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "BrandInfluencer" DROP CONSTRAINT "BrandInfluencer_globalInfluencerId_fkey";

-- DropForeignKey
ALTER TABLE "BrandInfluencer" DROP CONSTRAINT "BrandInfluencer_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Collaboration" DROP CONSTRAINT "Collaboration_brandInfluencerId_fkey";

-- DropForeignKey
ALTER TABLE "Collaboration" DROP CONSTRAINT "Collaboration_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "Collaboration" DROP CONSTRAINT "Collaboration_influencerId_fkey";

-- DropForeignKey
ALTER TABLE "CollaborationSample" DROP CONSTRAINT "CollaborationSample_collaborationId_fkey";

-- DropForeignKey
ALTER TABLE "CollaborationSample" DROP CONSTRAINT "CollaborationSample_sampleId_fkey";

-- DropForeignKey
ALTER TABLE "Factory" DROP CONSTRAINT "Factory_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "GlobalInfluencer" DROP CONSTRAINT "GlobalInfluencer_accountId_fkey";

-- DropForeignKey
ALTER TABLE "GlobalInfluencer" DROP CONSTRAINT "GlobalInfluencer_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "GlobalInfluencer" DROP CONSTRAINT "GlobalInfluencer_verifiedBy_fkey";

-- DropForeignKey
ALTER TABLE "Influencer" DROP CONSTRAINT "Influencer_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "InfluencerGroup" DROP CONSTRAINT "InfluencerGroup_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "Sample" DROP CONSTRAINT "Sample_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "WeChatAddLog" DROP CONSTRAINT "WeChatAddLog_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "WeChatAddLog" DROP CONSTRAINT "WeChatAddLog_influencerId_fkey";

-- DropForeignKey
ALTER TABLE "WeChatAddLog" DROP CONSTRAINT "WeChatAddLog_scriptId_fkey";

-- DropForeignKey
ALTER TABLE "WeChatAddLog" DROP CONSTRAINT "WeChatAddLog_staffId_fkey";

-- DropForeignKey
ALTER TABLE "WeChatScript" DROP CONSTRAINT "WeChatScript_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "WeChatScript" DROP CONSTRAINT "WeChatScript_factoryId_fkey";

-- DropForeignKey
ALTER TABLE "WeChatScript" DROP CONSTRAINT "WeChatScript_sampleId_fkey";

-- DropIndex
DROP INDEX "Collaboration_brandInfluencerId_idx";

-- DropIndex
DROP INDEX "Collaboration_factoryId_idx";

-- DropIndex
DROP INDEX "Influencer_factoryId_idx";

-- DropIndex
DROP INDEX "Influencer_factoryId_platform_platformId_key";

-- DropIndex
DROP INDEX "InfluencerGroup_factoryId_idx";

-- DropIndex
DROP INDEX "Sample_factoryId_idx";

-- DropIndex
DROP INDEX "Sample_factoryId_sku_key";

-- DropIndex
DROP INDEX "User_factoryId_idx";

-- AlterTable
ALTER TABLE "Collaboration" DROP COLUMN "brandInfluencerId",
DROP COLUMN "factoryId",
ADD COLUMN     "brandId" TEXT NOT NULL,
ADD COLUMN     "sampleId" TEXT,
ALTER COLUMN "influencerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Influencer" DROP COLUMN "factoryId",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "brandId" TEXT NOT NULL,
ADD COLUMN     "claimedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "InfluencerAccount" ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "wechatId" TEXT;

-- AlterTable
ALTER TABLE "InfluencerGroup" DROP COLUMN "factoryId",
ADD COLUMN     "brandId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "factoryId",
ADD COLUMN     "brandId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StageHistory" DROP COLUMN "quotedPrice",
DROP COLUMN "sampleIds",
DROP COLUMN "sampleNames";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "factoryId",
ADD COLUMN     "brandId" TEXT;

-- DropTable
DROP TABLE "BrandInfluencer";

-- DropTable
DROP TABLE "CollaborationSample";

-- DropTable
DROP TABLE "Factory";

-- DropTable
DROP TABLE "GlobalInfluencer";

-- DropTable
DROP TABLE "WeChatAddLog";

-- DropTable
DROP TABLE "WeChatScript";

-- DropEnum
DROP TYPE "FactoryStatus";

-- DropEnum
DROP TYPE "WeChatAddStatus";

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "BrandStatus" NOT NULL DEFAULT 'PENDING',
    "planType" "PlanType" NOT NULL DEFAULT 'FREE',
    "staffLimit" INTEGER NOT NULL DEFAULT 3,
    "influencerLimit" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_ownerId_key" ON "Brand"("ownerId");

-- CreateIndex
CREATE INDEX "Brand_ownerId_idx" ON "Brand"("ownerId");

-- CreateIndex
CREATE INDEX "Brand_status_idx" ON "Brand"("status");

-- CreateIndex
CREATE INDEX "Collaboration_brandId_idx" ON "Collaboration"("brandId");

-- CreateIndex
CREATE INDEX "Collaboration_sampleId_idx" ON "Collaboration"("sampleId");

-- CreateIndex
CREATE INDEX "Influencer_brandId_idx" ON "Influencer"("brandId");

-- CreateIndex
CREATE INDEX "Influencer_accountId_idx" ON "Influencer"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_brandId_platform_platformId_key" ON "Influencer"("brandId", "platform", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerAccount_wechatId_key" ON "InfluencerAccount"("wechatId");

-- CreateIndex
CREATE INDEX "InfluencerAccount_wechatId_idx" ON "InfluencerAccount"("wechatId");

-- CreateIndex
CREATE INDEX "InfluencerGroup_brandId_idx" ON "InfluencerGroup"("brandId");

-- CreateIndex
CREATE INDEX "Sample_brandId_idx" ON "Sample"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_brandId_sku_key" ON "Sample"("brandId", "sku");

-- CreateIndex
CREATE INDEX "User_brandId_idx" ON "User"("brandId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InfluencerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerGroup" ADD CONSTRAINT "InfluencerGroup_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;
