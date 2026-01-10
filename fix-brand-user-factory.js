const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBrandUser() {
  try {
    // 1. 查找所有工厂
    const factories = await prisma.factory.findMany();
    console.log('\n=== 现有工厂 ===');
    factories.forEach(f => {
      console.log(`- ${f.name} (ID: ${f.id})`);
    });

    if (factories.length === 0) {
      console.log('\n⚠️ 没有找到工厂，需要先创建工厂');
      
      // 创建默认工厂
      const factory = await prisma.factory.create({
        data: {
          name: '默认工厂',
          contactPerson: '品牌负责人',
          contactPhone: '13800138000',
          status: 'ACTIVE'
        }
      });
      
      console.log(`\n✅ 已创建默认工厂: ${factory.name} (ID: ${factory.id})`);
      factories.push(factory);
    }

    // 2. 查找品牌用户
    const brandUser = await prisma.user.findUnique({
      where: { email: 'pinpai001@gmail.com' }
    });

    if (!brandUser) {
      console.log('\n❌ 未找到品牌用户 pinpai001@gmail.com');
      return;
    }

    // 3. 如果用户没有factoryId，关联到第一个工厂
    if (!brandUser.factoryId) {
      const factory = factories[0];
      
      await prisma.user.update({
        where: { id: brandUser.id },
        data: { factoryId: factory.id }
      });

      console.log(`\n✅ 已将用户 ${brandUser.email} 关联到工厂 ${factory.name}`);
      console.log(`   User ID: ${brandUser.id}`);
      console.log(`   Factory ID: ${factory.id}`);
    } else {
      console.log(`\n✅ 用户已关联到工厂: ${brandUser.factoryId}`);
    }

    // 4. 验证修复
    const updatedUser = await prisma.user.findUnique({
      where: { id: brandUser.id },
      include: { factory: true }
    });

    console.log('\n=== 修复后的用户信息 ===');
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    console.log('FactoryId:', updatedUser.factoryId);
    console.log('Factory Name:', updatedUser.factory?.name);

    console.log('\n✅ 修复完成！用户现在可以正常访问Dashboard了。');
    console.log('\n📝 下一步：');
    console.log('1. 刷新浏览器页面');
    console.log('2. 或者重新登录获取新token');

  } catch (error) {
    console.error('\n❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBrandUser();
