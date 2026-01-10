/*
  Warnings:

  - The values [FACTORY_OWNER,BUSINESS_STAFF] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('PLATFORM_ADMIN', 'BRAND', 'BUSINESS');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isIndependent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joinedAt" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "wechat" TEXT;

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");
