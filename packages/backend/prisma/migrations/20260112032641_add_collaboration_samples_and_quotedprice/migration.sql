-- DropForeignKey
ALTER TABLE "Collaboration" DROP CONSTRAINT "Collaboration_influencerId_fkey";

-- AlterTable
ALTER TABLE "Collaboration" ADD COLUMN     "quotedPrice" INTEGER,
ALTER COLUMN "influencerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GlobalInfluencer" ADD COLUMN     "verificationHistory" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "StageHistory" ADD COLUMN     "quotedPrice" INTEGER,
ADD COLUMN     "sampleIds" TEXT[],
ADD COLUMN     "sampleNames" TEXT[];

-- CreateTable
CREATE TABLE "CollaborationSample" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollaborationSample_collaborationId_idx" ON "CollaborationSample"("collaborationId");

-- CreateIndex
CREATE INDEX "CollaborationSample_sampleId_idx" ON "CollaborationSample"("sampleId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationSample_collaborationId_sampleId_key" ON "CollaborationSample"("collaborationId", "sampleId");

-- AddForeignKey
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationSample" ADD CONSTRAINT "CollaborationSample_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationSample" ADD CONSTRAINT "CollaborationSample_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
