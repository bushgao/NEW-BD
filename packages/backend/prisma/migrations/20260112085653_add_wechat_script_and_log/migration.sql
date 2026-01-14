-- CreateEnum
CREATE TYPE "WeChatAddStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "WeChatScript" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "sampleId" TEXT,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeChatScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeChatAddLog" (
    "id" TEXT NOT NULL,
    "factoryId" TEXT NOT NULL,
    "influencerId" TEXT,
    "staffId" TEXT NOT NULL,
    "scriptId" TEXT,
    "targetWechatId" TEXT NOT NULL,
    "targetNickname" TEXT NOT NULL,
    "targetPlatform" TEXT,
    "noteSet" TEXT,
    "status" "WeChatAddStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "isRetryable" BOOLEAN NOT NULL DEFAULT true,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeChatAddLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeChatScript_factoryId_idx" ON "WeChatScript"("factoryId");

-- CreateIndex
CREATE INDEX "WeChatScript_sampleId_idx" ON "WeChatScript"("sampleId");

-- CreateIndex
CREATE INDEX "WeChatScript_createdBy_idx" ON "WeChatScript"("createdBy");

-- CreateIndex
CREATE INDEX "WeChatAddLog_factoryId_idx" ON "WeChatAddLog"("factoryId");

-- CreateIndex
CREATE INDEX "WeChatAddLog_influencerId_idx" ON "WeChatAddLog"("influencerId");

-- CreateIndex
CREATE INDEX "WeChatAddLog_staffId_idx" ON "WeChatAddLog"("staffId");

-- CreateIndex
CREATE INDEX "WeChatAddLog_status_idx" ON "WeChatAddLog"("status");

-- CreateIndex
CREATE INDEX "WeChatAddLog_createdAt_idx" ON "WeChatAddLog"("createdAt");

-- AddForeignKey
ALTER TABLE "WeChatScript" ADD CONSTRAINT "WeChatScript_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeChatScript" ADD CONSTRAINT "WeChatScript_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeChatScript" ADD CONSTRAINT "WeChatScript_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeChatAddLog" ADD CONSTRAINT "WeChatAddLog_factoryId_fkey" FOREIGN KEY ("factoryId") REFERENCES "Factory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeChatAddLog" ADD CONSTRAINT "WeChatAddLog_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeChatAddLog" ADD CONSTRAINT "WeChatAddLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeChatAddLog" ADD CONSTRAINT "WeChatAddLog_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "WeChatScript"("id") ON DELETE SET NULL ON UPDATE CASCADE;
