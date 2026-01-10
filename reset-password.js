const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('=== 重置密码 ===\n');
    
    const email = 'pinpai001@gmail.com';
    const newPassword = 'password123';
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      include: { ownedFactory: true }
    });
    
    if (!user) {
      console.log('❌ 用户不存在:', email);
      return;
    }
    
    console.log('找到用户:', user.name, '(' + user.email + ')');
    console.log('角色:', user.role);
    console.log('工厂ID:', user.factoryId);
    if (user.ownedFactory) {
      console.log('拥有的工厂:', user.ownedFactory.name);
    }
    
    // 生成新密码哈希
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // 更新密码
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });
    
    console.log('\n✅ 密码已重置为:', newPassword);
    console.log('\n请使用以下信息登录:');
    console.log('邮箱:', email);
    console.log('密码:', newPassword);
    
  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
