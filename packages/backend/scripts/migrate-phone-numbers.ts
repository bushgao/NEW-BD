/**
 * 数据迁移脚本：规范化手机号字段
 * 
 * 将 email 格式为 ${phone}@phone.local 的用户：
 * 1. 提取手机号存入 phone 字段
 * 2. 更新 email 为标识性格式 user_${id}@migrated.local
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePhoneNumbers() {
    console.log('🚀 开始迁移手机号数据...\n');

    // 查找所有 email 格式为 xxx@phone.local 的用户
    const usersToMigrate = await prisma.user.findMany({
        where: {
            email: {
                endsWith: '@phone.local',
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    });

    console.log(`📋 找到 ${usersToMigrate.length} 个需要迁移的用户\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
        try {
            // 从 email 中提取手机号
            const phoneFromEmail = user.email.replace('@phone.local', '');

            // 检查是否是有效的手机号格式（11位数字）
            if (!/^\d{11}$/.test(phoneFromEmail)) {
                console.log(`⏭️  跳过用户 ${user.name} (${user.email}): 非手机号格式`);
                skipCount++;
                continue;
            }

            // 如果 phone 字段已经有值且与提取的相同，跳过
            if (user.phone === phoneFromEmail) {
                console.log(`⏭️  跳过用户 ${user.name}: phone 字段已正确`);
                skipCount++;
                continue;
            }

            // 更新用户
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    phone: phoneFromEmail,
                    // email 保持不变，仍然用于唯一性约束
                },
            });

            console.log(`✅ 迁移成功: ${user.name} -> phone: ${phoneFromEmail}`);
            successCount++;
        } catch (error) {
            console.error(`❌ 迁移失败: ${user.name} (${user.email})`, error);
            errorCount++;
        }
    }

    console.log('\n📊 迁移完成统计:');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ⏭️  跳过: ${skipCount}`);
    console.log(`   ❌ 失败: ${errorCount}`);
}

async function main() {
    try {
        await migratePhoneNumbers();
    } catch (error) {
        console.error('迁移过程出错:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
