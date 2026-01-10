const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllFactories() {
  try {
    console.log('\n=== 检查所有Factory的数据 ===\n');

    const factories = await prisma.factory.findMany({
      include: {
        owner: {
          select: {
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            influencers: true,
            collaborations: true,
            samples: true,
            staff: true
          }
        }
      }
    });

    factories.forEach((factory, index) => {
      console.log(`\n${index + 1}. Factory: ${factory.name}`);
      console.log(`   ID: ${factory.id}`);
      console.log(`   Owner: ${factory.owner.email}`);
      console.log(`   数据统计:`);
      console.log(`     - 达人: ${factory._count.influencers}`);
      console.log(`     - 合作: ${factory._count.collaborations}`);
      console.log(`     - 样品: ${factory._count.samples}`);
      console.log(`     - 员工: ${factory._count.staff}`);
      
      const hasData = factory._count.influencers > 0 || 
                      factory._count.collaborations > 0 || 
                      factory._count.samples > 0;
      
      console.log(`   状态: ${hasData ? '✅ 有数据' : '⚠️ 空Factory'}`);
    });

    console.log('\n\n💡 分析:');
    const factoriesWithData = factories.filter(f => 
      f._count.influencers > 0 || f._count.collaborations > 0 || f._count.samples > 0
    );
    
    if (factoriesWithData.length === 0) {
      console.log('   ⚠️ 所有Factory都没有数据');
      console.log('   ⚠️ Dashboard显示空白是正常的');
      console.log('   ✅ 需要添加测试数据才能看到Dashboard内容');
    } else {
      console.log(`   ✅ ${factoriesWithData.length} 个Factory有数据:`);
      factoriesWithData.forEach(f => {
        console.log(`      - ${f.name} (Owner: ${f.owner.email})`);
      });
    }

    // 检查是否有孤立的数据（不属于任何Factory）
    console.log('\n\n🔍 检查数据完整性:');
    
    const allInfluencers = await prisma.influencer.count();
    const allCollaborations = await prisma.collaboration.count();
    const allSamples = await prisma.sample.count();
    
    console.log(`   系统总数据:`);
    console.log(`     - 总达人数: ${allInfluencers}`);
    console.log(`     - 总合作数: ${allCollaborations}`);
    console.log(`     - 总样品数: ${allSamples}`);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFactories();
