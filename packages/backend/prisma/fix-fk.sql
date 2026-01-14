-- 修改 Collaboration 表的 influencerId 列使其可为 NULL
-- 1. 删除现有外键约束
ALTER TABLE "Collaboration" DROP CONSTRAINT IF EXISTS "Collaboration_influencerId_fkey";

-- 2. 修改列为可空
ALTER TABLE "Collaboration" ALTER COLUMN "influencerId" DROP NOT NULL;

-- 3. 重新添加外键约束（允许NULL）
ALTER TABLE "Collaboration" ADD CONSTRAINT "Collaboration_influencerId_fkey" 
  FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
