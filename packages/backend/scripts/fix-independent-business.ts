/**
 * 为现有独立商务用户创建个人品牌
 * 运行方式: npx ts-node scripts/fix-independent-business.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixIndependentBusinessUsers() {
    console.log('🔍 查找没有 brandId 的独立商务用户...\n');

    // 查找所有没有 brandId 的 BUSINESS 用户
    const independentUsers = await prisma.user.findMany({
        where: {
            role: 'BUSINESS',
            brandId: null,
        },
        select: {
            id: true,
            name: true,
            email: true,
            isIndependent: true,
        },
    });

    if (independentUsers.length === 0) {
        console.log('✅ 没有找到需要修复的独立商务用户');
        return;
    }

    console.log(`📋 找到 ${independentUsers.length} 个独立商务用户需要修复:\n`);
    independentUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email})`);
    });
    console.log('');

    // 为每个用户创建个人品牌
    for (const user of independentUsers) {
        console.log(`🔧 为用户 "${user.name}" 创建个人品牌...`);

        try {
            // 先检查该用户是否已经是某个品牌的 owner
            const existingBrand = await prisma.brand.findFirst({
                where: { ownerId: user.id },
            });

            if (existingBrand) {
                // 已有品牌，只需要更新 brandId
                await prisma.user.update({
                    where: { id: user.id },
                    data: { brandId: existingBrand.id },
                });
                console.log(`  ✅ 已关联到现有品牌: ${existingBrand.name}`);
            } else {
                // 创建新的个人品牌
                const personalBrand = await prisma.brand.create({
                    data: {
                        name: `个人工作区 - ${user.name}`,
                        ownerId: user.id,
                        status: 'APPROVED',
                        planType: 'FREE',
                        staffLimit: 1,
                        influencerLimit: 50,
                    },
                });

                // 更新用户的 brandId
                await prisma.user.update({
                    where: { id: user.id },
                    data: { brandId: personalBrand.id },
                });

                console.log(`  ✅ 创建成功: ${personalBrand.name} (${personalBrand.id})`);
            }
        } catch (error) {
            console.error(`  ❌ 失败:`, error);
        }
    }

    console.log('\n🎉 修复完成！');
}

fixIndependentBusinessUsers()
    .catch((error) => {
        console.error('脚本执行失败:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
