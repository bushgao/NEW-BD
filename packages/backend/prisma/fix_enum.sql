-- Fix database enum type issue - step 2
ALTER TABLE "GlobalInfluencer" ALTER COLUMN "sourceType" DROP DEFAULT;
DROP TYPE IF EXISTS "InfluencerSourceType_old" CASCADE;
