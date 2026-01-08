/**
 * 验证权限迁移脚本
 * 检查所有商务人员是否都已配置权限
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('=== 验证权限迁移 ===\n');

  try {
    // 查询所有商务人员
    const businessStaff = await prisma.user.findMany({
      where: {
        role: 'BUSINESS_STAFF',
      },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        status: true,
      },
    });

    console.log(`总共找到 ${businessStaff.length} 个商务账号\n`);

    if (businessStaff.length === 0) {
      console.log('✓ 没有商务账号');
      return;
    }

    // 检查每个账号的权限配置
    let allConfigured = true;
    let configuredCount = 0;
    let missingCount = 0;

    console.log('商务账号权限配置详情：\n');
    
    for (const staff of businessStaff) {
      const hasPermissions = staff.permissions && 
                            typeof staff.permissions === 'object' &&
                            Object.keys(staff.permissions).length > 0;
      
      if (hasPermissions) {
        console.log(`✓ ${staff.name} (${staff.email})`);
        console.log(`  状态: ${staff.status}`);
        console.log(`  权限配置: 已配置`);
        
        // 显示权限详情
        const perms = staff.permissions;
        if (perms.dataVisibility) {
          console.log(`  - 查看其他商务达人: ${perms.dataVisibility.viewOthersInfluencers ? '是' : '否'}`);
          console.log(`  - 查看其他商务合作: ${perms.dataVisibility.viewOthersCollaborations ? '是' : '否'}`);
        }
        if (perms.operations) {
          console.log(`  - 管理样品: ${perms.operations.manageSamples ? '是' : '否'}`);
          console.log(`  - 管理达人: ${perms.operations.manageInfluencers ? '是' : '否'}`);
        }
        console.log('');
        configuredCount++;
      } else {
        console.log(`✗ ${staff.name} (${staff.email})`);
        console.log(`  状态: ${staff.status}`);
        console.log(`  权限配置: 未配置 ⚠️`);
        console.log('');
        allConfigured = false;
        missingCount++;
      }
    }

    console.log('=== 验证结果 ===');
    console.log(`已配置权限: ${configuredCount} 个`);
    console.log(`未配置权限: ${missingCount} 个`);
    console.log(`总计: ${businessStaff.length} 个\n`);

    if (allConfigured) {
      console.log('✓ 验证通过: 所有商务账号都已配置权限');
      console.log('✓ 迁移成功完成！');
    } else {
      console.log('✗ 验证失败: 仍有商务账号未配置权限');
      console.log('请重新运行迁移脚本');
    }

  } catch (error) {
    console.error('验证失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行验证
verifyMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('验证脚本执行失败:', error);
    process.exit(1);
  });
