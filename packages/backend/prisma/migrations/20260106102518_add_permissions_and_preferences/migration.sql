-- AlterTable
ALTER TABLE "User" ADD COLUMN     "permissions" JSONB DEFAULT '{}',
ADD COLUMN     "preferences" JSONB DEFAULT '{}';
