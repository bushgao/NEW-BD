/**
 * 数据迁移脚本：清理假邮箱数据
 * 
 * 将 email 格式为 ${phone}@phone.local 的用户：
 * 1. 提取手机号到 phone 字段
 * 2. 将 email 设为 null
 * 
 * 运行: npx ts-node prisma/migrations/cleanup-fake-emails.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 开始清理假邮箱数据...\n');

    // 1. 查找所有 @phone.local 邮箱用户
    const phoneLocalUsers = await prisma.user.findMany({
        where: {
            email: {
                endsWith: '@phone.local',
            },
        },
    });
    console.log(`📋 找到 ${phoneLocalUsers.length} 个 @phone.local 邮箱用户`);

    // 2. 查找所有 @temp.local 邮箱用户
    const tempLocalUsers = await prisma.user.findMany({
        where: {
            email: {
                endsWith: '@temp.local',
            },
        },
    });
    console.log(`📋 找到 ${tempLocalUsers.length} 个 @temp.local 邮箱用户`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // 处理 @phone.local 用户
    for (const user of phoneLocalUsers) {
        try {
            const phoneFromEmail = user.email!.replace('@phone.local', '');

            // 检查是否是有效的手机号格式
            if (/^1\d{10}$/.test(phoneFromEmail)) {
                // 检查这个手机号是否已经被其他用户使用
                const existingPhone = await prisma.user.findFirst({
                    where: {
                        phone: phoneFromEmail,
                        id: { not: user.id }
                    }
                });

                if (existingPhone) {
                    console.log(`  ⚠️ ${user.name}: 手机号 ${phoneFromEmail} 已被其他用户使用，跳过`);
                    skipped++;
                    continue;
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        phone: phoneFromEmail,
                        email: null,
                    },
                });
                console.log(`  ✅ ${user.name}: ${user.email} → phone: ${phoneFromEmail}, email: null`);
                updated++;
            } else {
                console.log(`  ⚠️ ${user.name}: ${phoneFromEmail} 不是有效手机号，跳过`);
                skipped++;
            }
        } catch (error) {
            console.error(`  ❌ ${user.name}: 更新失败`, error);
            errors++;
        }
    }

    // 处理 @temp.local 用户 - 只清空 email
    for (const user of tempLocalUsers) {
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    email: null,
                },
            });
            console.log(`  ✅ ${user.name}: ${user.email} → email: null`);
            updated++;
        } catch (error) {
            console.error(`  ❌ ${user.name}: 更新失败`, error);
            errors++;
        }
    }

    console.log('\n📊 迁移结果:');
    console.log(`  ✅ 成功更新: ${updated}`);
    console.log(`  ⚠️ 跳过: ${skipped}`);
    console.log(`  ❌ 失败: ${errors}`);
    console.log('\n🎉 迁移完成!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
