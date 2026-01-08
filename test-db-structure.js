// 测试数据库结构
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseStructure() {
  console.log('🔍 测试数据库结构...\n');

  try {
    // 1. 测试查询达人（验证新字段存在）
    console.log('1️⃣ 查询达人数据（验证新字段）...');
    const influencers = await prisma.influencer.findMany({
      take: 3,
      select: {
        id: true,
        nickname: true,
        sourceType: true,
        verificationStatus: true,
        createdBy: true,
        verifiedBy: true,
        verificationNote: true,
        verificationHistory: true,
      },
    });
    
    console.log(`✅ 找到 ${influencers.length} 个达人`);
    if (influencers.length > 0) {
      console.log('示例数据:', JSON.stringify(influencers[0], null, 2));
    }

    // 2. 测试来源类型统计
    console.log('\n2️⃣ 测试来源类型统计...');
    const sourceStats = await prisma.influencer.groupBy({
      by: ['sourceType'],
      _count: true,
    });
    console.log('✅ 来源分布:', sourceStats);

    // 3. 测试认证状态统计
    console.log('\n3️⃣ 测试认证状态统计...');
    const verificationStats = await prisma.influencer.groupBy({
      by: ['verificationStatus'],
      _count: true,
    });
    console.log('✅ 认证状态分布:', verificationStats);

    // 4. 测试关联查询（creator 和 verifier）
    console.log('\n4️⃣ 测试关联查询...');
    const influencerWithCreator = await prisma.influencer.findFirst({
      where: {
        createdBy: { not: null },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
    
    if (influencerWithCreator) {
      console.log('✅ 找到有创建人的达人:', {
        nickname: influencerWithCreator.nickname,
        creator: influencerWithCreator.creator,
      });
    } else {
      console.log('⚠️  暂无有创建人的达人（正常，因为是新字段）');
    }

    console.log('\n✅ 数据库结构测试完成！所有新字段都可用。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseStructure()
  .then(() => {
    console.log('\n🎉 测试成功完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 测试失败:', error);
    process.exit(1);
  });
