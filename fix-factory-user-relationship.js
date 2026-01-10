const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRelationships() {
  try {
    console.log('\n=== 修复Factory与User的关系 ===\n');

    // 1. 查询所有Factory及其owner
    const factories = await prisma.factory.findMany({
      include: {
        owner: true
      }
    });

    console.log(`找到 ${factories.length} 个Factory\n`);

    // 2. 修复每个Factory owner的factoryId
    for (const factory of factories) {
      const owner = factory.owner;
      
      console.log(`处理 Factory: ${factory.name}`);
      console.log(`  Owner: ${owner.email}`);
      console.log(`  当前 factoryId: ${owner.factoryId || 'NULL'}`);
      console.log(`  应该是: ${factory.id}`);

      if (owner.factoryId !== factory.id) {
        // 更新owner的factoryId
        await prisma.user.update({
          where: { id: owner.id },
          data: { factoryId: factory.id }
        });
        
        console.log(`  ✅ 已修复: ${owner.email} 的 factoryId 更新为 ${factory.id}`);
      } else {
        console.log(`  ✅ 已正确`);
      }
      console.log('');
    }

    // 3. 验证修复结果
    console.log('\n=== 验证修复结果 ===\n');
    
    const updatedFactories = await prisma.factory.findMany({
      include: {
        owner: {
          select: {
            email: true,
            factoryId: true
          }
        }
      }
    });

    let allCorrect = true;
    updatedFactories.forEach(f => {
      const isCorrect = f.owner.factoryId === f.id;
      console.log(`${isCorrect ? '✅' : '❌'} ${f.name}: Owner ${f.owner.email}`);
      console.log(`   factoryId: ${f.owner.factoryId}`);
      console.log(`   Factory ID: ${f.id}`);
      console.log(`   ${isCorrect ? '匹配' : '不匹配'}`);
      console.log('');
      
      if (!isCorrect) allCorrect = false;
    });

    if (allCorrect) {
      console.log('🎉 所有关系已正确修复！\n');
      console.log('📝 下一步：');
      console.log('1. 刷新浏览器页面');
      console.log('2. Dashboard应该可以正常显示数据了');
    } else {
      console.log('⚠️ 仍有问题需要手动检查');
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRelationships();
