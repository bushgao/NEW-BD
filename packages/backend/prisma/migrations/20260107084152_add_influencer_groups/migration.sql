-- AlterTable
ALTER TABLE "Influencer" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "InfluencerGroup" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1890ff',
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InfluencerGroup_factoryId_idx" ON "InfluencerGroup"("factoryId");

-- CreateIndex
CREATE INDEX "InfluencerGroup_createdBy_idx" ON "InfluencerGroup"("createdBy");

-- CreateIndex
CREATE INDEX "Influencer_groupId_idx" ON "Influencer"("groupId");

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "InfluencerGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerGroup" ADD CONSTRAINT "InfluencerGroup_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
