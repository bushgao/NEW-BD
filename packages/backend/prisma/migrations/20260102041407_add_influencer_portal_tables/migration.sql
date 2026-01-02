-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('SELF', 'ASSISTANT', 'AGENT', 'OTHER');

-- CreateTable
CREATE TABLE "InfluencerAccount" (
    "id" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerContact" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "contactType" "ContactType" NOT NULL DEFAULT 'SELF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "InfluencerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerLoginLog" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "platform" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerLoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerAccount_primaryPhone_key" ON "InfluencerAccount"("primaryPhone");

-- CreateIndex
CREATE INDEX "InfluencerAccount_primaryPhone_idx" ON "InfluencerAccount"("primaryPhone");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerContact_phone_key" ON "InfluencerContact"("phone");

-- CreateIndex
CREATE INDEX "InfluencerContact_accountId_idx" ON "InfluencerContact"("accountId");

-- CreateIndex
CREATE INDEX "InfluencerContact_phone_idx" ON "InfluencerContact"("phone");

-- CreateIndex
CREATE INDEX "InfluencerLoginLog_contactId_idx" ON "InfluencerLoginLog"("contactId");

-- CreateIndex
CREATE INDEX "InfluencerLoginLog_loginAt_idx" ON "InfluencerLoginLog"("loginAt");

-- AddForeignKey
ALTER TABLE "InfluencerContact" ADD CONSTRAINT "InfluencerContact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InfluencerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerLoginLog" ADD CONSTRAINT "InfluencerLoginLog_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "InfluencerContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
