const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n=== 检查数据库结构 ===\n');

    // 1. 检查Factory表
    const factories = await prisma.factory.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('📦 Factory表:');
    console.log(`   总数: ${factories.length}`);
    if (factories.length > 0) {
      factories.forEach(f => {
        console.log(`   - ${f.name} (ID: ${f.id.substring(0, 8)}..., Owner: ${f.ownerId.substring(0, 8)}...)`);
      });
    } else {
      console.log('   ⚠️ 没有Factory记录');
    }

    // 2. 检查User表
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        factoryId: true,
        isIndependent: true,
        status: true
      }
    });

    console.log('\n👤 User表:');
    console.log(`   总数: ${users.length}`);
    users.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
      console.log(`     factoryId: ${u.factoryId || 'NULL'}`);
      console.log(`     isIndependent: ${u.isIndependent}`);
      console.log(`     status: ${u.status}`);
    });

    // 3. 检查BRAND用户
    const brandUsers = users.filter(u => u.role === 'BRAND');
    console.log('\n🏢 BRAND用户:');
    console.log(`   总数: ${brandUsers.length}`);
    brandUsers.forEach(u => {
      const hasFactory = u.factoryId !== null;
      console.log(`   - ${u.email}: ${hasFactory ? '✅ 有factoryId' : '❌ 无factoryId'}`);
    });

    // 4. 检查BUSINESS用户
    const businessUsers = users.filter(u => u.role === 'BUSINESS');
    console.log('\n💼 BUSINESS用户:');
    console.log(`   总数: ${businessUsers.length}`);
    businessUsers.forEach(u => {
      const hasFactory = u.factoryId !== null;
      const independent = u.isIndependent;
      console.log(`   - ${u.email}: ${hasFactory ? '✅ 有factoryId' : '❌ 无factoryId'}, 独立: ${independent}`);
    });

    // 5. 检查数据一致性
    console.log('\n🔍 数据一致性检查:');
    
    const usersWithFactoryId = users.filter(u => u.factoryId !== null);
    console.log(`   - 有factoryId的用户: ${usersWithFactoryId.length}`);
    
    const usersWithoutFactoryId = users.filter(u => u.factoryId === null);
    console.log(`   - 无factoryId的用户: ${usersWithoutFactoryId.length}`);
    
    if (usersWithoutFactoryId.length > 0) {
      console.log('\n   ⚠️ 以下用户没有factoryId:');
      usersWithoutFactoryId.forEach(u => {
        console.log(`      - ${u.email} (${u.role})`);
      });
    }

    // 6. 检查Influencer表
    const influencers = await prisma.influencer.findMany({
      select: {
        id: true,
        nickname: true,
        factoryId: true
      },
      take: 5
    });
    
    console.log(`\n🎭 Influencer表: 总数 ${influencers.length} (显示前5个)`);
    influencers.forEach(i => {
      console.log(`   - ${i.nickname} (factoryId: ${i.factoryId.substring(0, 8)}...)`);
    });

    // 7. 检查Collaboration表
    const collaborations = await prisma.collaboration.findMany({
      select: {
        id: true,
        factoryId: true,
        businessStaffId: true
      },
      take: 5
    });
    
    console.log(`\n🤝 Collaboration表: 总数 ${collaborations.length} (显示前5个)`);

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
