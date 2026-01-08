/**
 * 数据迁移脚本：为现有商务人员初始化默认权限
 * 
 * 运行方式：
 * cd packages/backend
 * npx ts-node scripts/init-permissions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 默认权限配置（基础商务）
const DEFAULT_PERMISSIONS = {
  dataVisibility: {
    viewOthersInfluencers: false,      // 不能查看其他商务的达人
    viewOthersCollaborations: false,   // 不能查看其他商务的合作
    viewOthersPerformance: false,      // 不能查看其他商务的业绩
    viewTeamData: true,                // 可以查看团队整体数据
    viewRanking: true,                 // 可以查看排行榜
  },
  operations: {
    manageInfluencers: true,           // 可以管理达人
    manageSamples: false,              // 不能管理样品
    manageCollaborations: true,        // 可以管理合作
    deleteCollaborations: false,       // 不能删除合作
    exportData: true,                  // 可以导出数据
    batchOperations: true,             // 可以批量操作
  },
  advanced: {
    viewCostData: false,               // 不能查看成本数据
    viewROIData: true,                 // 可以查看ROI数据
    modifyOthersData: false,           // 不能修改他人数据
  },
};

async function initializePermissions() {
  console.log('开始初始化商务人员权限...\n');

  try {
    // 查找所有商务人员
    const businessStaff = await prisma.user.findMany({
      where: {
        role: 'BUSINESS_STAFF',
      },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
      },
    });

    console.log(`找到 ${businessStaff.length} 个商务账号\n`);

    if (businessStaff.length === 0) {
      console.log('没有需要初始化的商务账号');
      return;
    }

    // 统计需要更新的账号
    const needsUpdate = businessStaff.filter(
      (staff) => !staff.permissions || Object.keys(staff.permissions as object).length === 0
    );

    console.log(`其中 ${needsUpdate.length} 个账号需要初始化权限\n`);

    if (needsUpdate.length === 0) {
      console.log('所有商务账号已有权限配置');
      return;
    }

    // 批量更新权限
    let successCount = 0;
    let errorCount = 0;

    for (const staff of needsUpdate) {
      try {
        await prisma.user.update({
          where: { id: staff.id },
          data: {
            permissions: DEFAULT_PERMISSIONS,
          },
        });

        console.log(`✓ ${staff.name} (${staff.email}) - 权限初始化成功`);
        successCount++;
      } catch (error) {
        console.error(`✗ ${staff.name} (${staff.email}) - 权限初始化失败:`, error);
        errorCount++;
      }
    }

    console.log('\n=== 初始化完成 ===');
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${errorCount} 个`);
    console.log(`总计: ${needsUpdate.length} 个`);

    // 验证迁移
    console.log('\n验证迁移结果...');
    const allStaff = await prisma.user.findMany({
      where: {
        role: 'BUSINESS_STAFF',
      },
      select: {
        permissions: true,
      },
    });
    
    const staffWithoutPermissions = allStaff.filter(
      (staff) => !staff.permissions || Object.keys(staff.permissions as object).length === 0
    ).length;

    if (staffWithoutPermissions > 0) {
      console.warn(`⚠ 警告: 仍有 ${staffWithoutPermissions} 个商务账号没有权限配置`);
    } else {
      console.log('✓ 验证通过: 所有商务账号都已配置权限');
    }
  } catch (error) {
    console.error('初始化失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 运行脚本
initializePermissions()
  .then(() => {
    console.log('\n脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n脚本执行失败:', error);
    process.exit(1);
  });
