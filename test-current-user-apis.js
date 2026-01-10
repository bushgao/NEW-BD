const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAPIs() {
  try {
    console.log('\n=== 测试当前用户的API数据 ===\n');

    // 1. 获取pinpai001用户信息
    const user = await prisma.user.findUnique({
      where: { email: 'pinpai001@gmail.com' },
      include: {
        factory: true,
        ownedFactory: true
      }
    });

    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }

    console.log('👤 用户信息:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   factoryId: ${user.factoryId}`);
    console.log(`   拥有的Factory: ${user.ownedFactory?.name || 'NULL'}`);
    console.log('');

    const factoryId = user.factoryId;
    if (!factoryId) {
      console.log('❌ 用户没有factoryId，无法查询数据');
      return;
    }

    // 2. 检查Factory数据
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
      include: {
        _count: {
          select: {
            influencers: true,
            collaborations: true,
            samples: true
          }
        }
      }
    });

    console.log('🏢 Factory信息:');
    console.log(`   名称: ${factory?.name || 'NULL'}`);
    console.log(`   ID: ${factoryId}`);
    console.log(`   达人数: ${factory?._count.influencers || 0}`);
    console.log(`   合作数: ${factory?._count.collaborations || 0}`);
    console.log(`   样品数: ${factory?._count.samples || 0}`);
    console.log('');

    // 3. 检查Collaboration数据
    const collaborations = await prisma.collaboration.findMany({
      where: { factoryId },
      take: 5,
      include: {
        influencer: {
          select: {
            nickname: true
          }
        }
      }
    });

    console.log('🤝 Collaboration数据:');
    console.log(`   总数: ${collaborations.length}`);
    if (collaborations.length > 0) {
      collaborations.forEach(c => {
        console.log(`   - ${c.influencer.nickname} (${c.stage})`);
      });
    } else {
      console.log('   ⚠️ 没有合作记录');
    }
    console.log('');

    // 4. 检查Influencer数据
    const influencers = await prisma.influencer.findMany({
      where: { factoryId },
      take: 5
    });

    console.log('🎭 Influencer数据:');
    console.log(`   总数: ${influencers.length}`);
    if (influencers.length > 0) {
      influencers.forEach(i => {
        console.log(`   - ${i.nickname} (${i.platform})`);
      });
    } else {
      console.log('   ⚠️ 没有达人记录');
    }
    console.log('');

    // 5. 检查Sample数据
    const samples = await prisma.sample.findMany({
      where: { factoryId },
      take: 5
    });

    console.log('📦 Sample数据:');
    console.log(`   总数: ${samples.length}`);
    if (samples.length > 0) {
      samples.forEach(s => {
        console.log(`   - ${s.name} (SKU: ${s.sku})`);
      });
    } else {
      console.log('   ⚠️ 没有样品记录');
    }
    console.log('');

    // 6. 模拟Dashboard API查询
    console.log('📊 模拟Dashboard API查询:');
    
    // 获取最近30天的数据
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCollaborations = await prisma.collaboration.count({
      where: {
        factoryId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const recentResults = await prisma.collaborationResult.count({
      where: {
        collaboration: {
          factoryId
        },
        publishedAt: { gte: thirtyDaysAgo }
      }
    });

    console.log(`   最近30天新增合作: ${recentCollaborations}`);
    console.log(`   最近30天发布结果: ${recentResults}`);
    console.log('');

    // 7. 总结
    console.log('💡 诊断结果:');
    if (factory?._count.collaborations === 0 && factory?._count.influencers === 0) {
      console.log('   ⚠️ 这个Factory没有任何数据');
      console.log('   ⚠️ Dashboard会显示空白，这是正常的');
      console.log('   ✅ 建议：添加一些测试数据');
    } else {
      console.log('   ✅ Factory有数据，Dashboard应该可以显示');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIs();
