const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRelationship() {
  try {
    console.log('\n=== Factory与User的关系检查 ===\n');

    // 查询所有Factory及其owner
    const factories = await prisma.factory.findMany({
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            factoryId: true
          }
        }
      }
    });

    console.log('📦 Factory详情:\n');
    factories.forEach(f => {
      console.log(`Factory: ${f.name}`);
      console.log(`  ID: ${f.id}`);
      console.log(`  ownerId: ${f.ownerId}`);
      console.log(`  Owner信息:`);
      console.log(`    - Email: ${f.owner.email}`);
      console.log(`    - Role: ${f.owner.role}`);
      console.log(`    - factoryId: ${f.owner.factoryId || 'NULL'}`);
      console.log(`  ⚠️ 问题: Owner的factoryId (${f.owner.factoryId}) ${f.owner.factoryId === f.id ? '✅ 匹配' : '❌ 不匹配'} Factory的ID (${f.id})`);
      console.log('');
    });

    // 查询所有BRAND用户
    const brandUsers = await prisma.user.findMany({
      where: { role: 'BRAND' },
      select: {
        id: true,
        email: true,
        name: true,
        factoryId: true,
        ownedFactory: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log('🏢 BRAND用户详情:\n');
    brandUsers.forEach(u => {
      console.log(`User: ${u.email}`);
      console.log(`  ID: ${u.id}`);
      console.log(`  factoryId: ${u.factoryId || 'NULL'}`);
      console.log(`  ownedFactory: ${u.ownedFactory ? u.ownedFactory.name : 'NULL'}`);
      
      if (u.ownedFactory) {
        console.log(`  ✅ 拥有Factory: ${u.ownedFactory.name} (${u.ownedFactory.id})`);
        if (u.factoryId === u.ownedFactory.id) {
          console.log(`  ✅ factoryId匹配`);
        } else {
          console.log(`  ⚠️ factoryId不匹配！应该是 ${u.ownedFactory.id}`);
        }
      } else {
        console.log(`  ❌ 没有拥有的Factory`);
      }
      console.log('');
    });

    console.log('\n💡 理解:');
    console.log('   - Factory.ownerId → User.id (Factory的拥有者)');
    console.log('   - User.factoryId → Factory.id (User所属的Factory)');
    console.log('   - 对于BRAND用户，这两个应该形成循环引用');
    console.log('   - BRAND用户应该: User.factoryId === User.ownedFactory.id');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationship();
