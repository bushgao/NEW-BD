-- CreateEnum
CREATE TYPE "InfluencerSourceType" AS ENUM ('PLATFORM', 'FACTORY', 'STAFF');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "Influencer" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "sourceType" "InfluencerSourceType" NOT NULL DEFAULT 'STAFF',
ADD COLUMN     "verificationHistory" JSONB,
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateIndex
CREATE INDEX "Influencer_createdBy_idx" ON "Influencer"("createdBy");

-- CreateIndex
CREATE INDEX "Influencer_sourceType_idx" ON "Influencer"("sourceType");

-- CreateIndex
CREATE INDEX "Influencer_verificationStatus_idx" ON "Influencer"("verificationStatus");

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
