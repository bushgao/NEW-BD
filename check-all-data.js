const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllData() {
  try {
    console.log('\n=== 检查数据库中的所有数据 ===\n');

    // 检查所有表的数据
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        factoryId: true,
        createdAt: true
      }
    });

    const factories = await prisma.factory.findMany({
      select: {
        name: true,
        ownerId: true,
        createdAt: true
      }
    });

    const influencers = await prisma.influencer.findMany({
      select: {
        nickname: true,
        platform: true,
        factoryId: true,
        createdAt: true
      }
    });

    const collaborations = await prisma.collaboration.findMany({
      select: {
        id: true,
        stage: true,
        factoryId: true,
        createdAt: true
      }
    });

    const samples = await prisma.sample.findMany({
      select: {
        name: true,
        sku: true,
        factoryId: true,
        createdAt: true
      }
    });

    console.log('📊 数据统计:');
    console.log(`   用户: ${users.length}`);
    console.log(`   Factory: ${factories.length}`);
    console.log(`   达人: ${influencers.length}`);
    console.log(`   合作: ${collaborations.length}`);
    console.log(`   样品: ${samples.length}`);
    console.log('');

    if (users.length > 0) {
      console.log('👥 用户列表:');
      users.forEach(u => {
        console.log(`   - ${u.email} (${u.role}) - factoryId: ${u.factoryId || 'NULL'}`);
      });
      console.log('');
    }

    if (factories.length > 0) {
      console.log('🏢 Factory列表:');
      factories.forEach(f => {
        console.log(`   - ${f.name} (Owner: ${f.ownerId})`);
      });
      console.log('');
    }

    if (influencers.length > 0) {
      console.log('🎭 达人列表:');
      influencers.forEach(i => {
        console.log(`   - ${i.nickname} (${i.platform}) - Factory: ${i.factoryId}`);
      });
      console.log('');
    }

    if (collaborations.length > 0) {
      console.log('🤝 合作列表:');
      collaborations.forEach(c => {
        console.log(`   - ${c.id} (${c.stage}) - Factory: ${c.factoryId}`);
      });
      console.log('');
    }

    if (samples.length > 0) {
      console.log('📦 样品列表:');
      samples.forEach(s => {
        console.log(`   - ${s.name} (SKU: ${s.sku}) - Factory: ${s.factoryId}`);
      });
      console.log('');
    }

    // 检查是否有数据被删除的迹象
    console.log('🔍 数据完整性检查:');
    
    // 检查是否有孤立的数据（factoryId不存在）
    const factoryIds = factories.map(f => f.id);
    
    const orphanedInfluencers = influencers.filter(i => !factoryIds.includes(i.factoryId));
    const orphanedCollaborations = collaborations.filter(c => !factoryIds.includes(c.factoryId));
    const orphanedSamples = samples.filter(s => !factoryIds.includes(s.factoryId));

    if (orphanedInfluencers.length > 0) {
      console.log(`   ⚠️ 发现 ${orphanedInfluencers.length} 个孤立的达人（factoryId不存在）`);
    }
    if (orphanedCollaborations.length > 0) {
      console.log(`   ⚠️ 发现 ${orphanedCollaborations.length} 个孤立的合作（factoryId不存在）`);
    }
    if (orphanedSamples.length > 0) {
      console.log(`   ⚠️ 发现 ${orphanedSamples.length} 个孤立的样品（factoryId不存在）`);
    }

    if (orphanedInfluencers.length === 0 && orphanedCollaborations.length === 0 && orphanedSamples.length === 0) {
      console.log('   ✅ 没有孤立的数据');
    }

    console.log('');
    console.log('💡 结论:');
    if (influencers.length === 0 && collaborations.length === 0 && samples.length === 0) {
      console.log('   ⚠️ 数据库是空的（除了用户和Factory）');
      console.log('   ⚠️ 可能的原因：');
      console.log('      1. 这是一个新系统，还没有添加数据');
      console.log('      2. 数据被外部软件删除了');
      console.log('      3. 数据库被重置了');
      console.log('');
      console.log('   ✅ 建议：创建一些测试数据');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllData();
