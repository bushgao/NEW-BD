/**
 * 检查测试账号
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccounts() {
  console.log('=== 检查测试账号 ===\n');

  try {
    // 查询所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        permissions: true,
      },
      orderBy: {
        role: 'asc',
      },
    });

    console.log(`总共找到 ${users.length} 个用户\n`);

    // 按角色分组显示
    const byRole = {
      PLATFORM_ADMIN: [],
      FACTORY_OWNER: [],
      BUSINESS_STAFF: [],
    };

    users.forEach(user => {
      byRole[user.role].push(user);
    });

    // 显示平台管理员
    if (byRole.PLATFORM_ADMIN.length > 0) {
      console.log('平台管理员:');
      byRole.PLATFORM_ADMIN.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
        console.log(`    状态: ${user.status}`);
      });
      console.log('');
    }

    // 显示工厂老板
    if (byRole.FACTORY_OWNER.length > 0) {
      console.log('工厂老板:');
      byRole.FACTORY_OWNER.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
        console.log(`    状态: ${user.status}`);
      });
      console.log('');
    }

    // 显示商务人员
    if (byRole.BUSINESS_STAFF.length > 0) {
      console.log('商务人员:');
      byRole.BUSINESS_STAFF.forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
        console.log(`    状态: ${user.status}`);
        
        const hasPermissions = user.permissions && 
                              typeof user.permissions === 'object' &&
                              Object.keys(user.permissions).length > 0;
        
        if (hasPermissions) {
          const perms = user.permissions;
          console.log(`    权限: 已配置`);
          if (perms.operations) {
            console.log(`      - 管理样品: ${perms.operations.manageSamples ? '是' : '否'}`);
          }
          if (perms.dataVisibility) {
            console.log(`      - 查看其他商务数据: ${perms.dataVisibility.viewOthersInfluencers ? '是' : '否'}`);
          }
        } else {
          console.log(`    权限: 未配置 ⚠️`);
        }
      });
      console.log('');
    }

    console.log('提示: 默认密码通常是 "password123"');

  } catch (error) {
    console.error('查询失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行检查
checkAccounts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
