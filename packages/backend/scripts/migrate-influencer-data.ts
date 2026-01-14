/**
 * 达人数据迁移脚本
 * 
 * 将旧版 Influencer 表数据迁移到新版 GlobalInfluencer + BrandInfluencer 结构
 * 
 * 迁移逻辑：
 * 1. 遍历所有旧版 Influencer 记录
 * 2. 对于每条记录，按 phone 或 platform+platformId 查找是否已存在 GlobalInfluencer
 * 3. 如果不存在，创建 GlobalInfluencer
 * 4. 创建 BrandInfluencer 关联该品牌和全局达人
 * 5. 更新 Collaboration 关联到 BrandInfluencer
 * 
 * 使用方法：
 * npx tsx scripts/migrate-influencer-data.ts
 */

import { PrismaClient, Platform, InfluencerSourceType, VerificationStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
    totalInfluencers: number;
    globalInfluencersCreated: number;
    brandInfluencersCreated: number;
    collaborationsUpdated: number;
    errors: string[];
}

interface PlatformAccount {
    platform: Platform;
    platformId: string;
    followers?: string;
}

async function findExistingGlobalInfluencer(
    phone: string | null,
    platform: Platform,
    platformId: string
): Promise<string | null> {
    // 首先按手机号查找
    if (phone) {
        const byPhone = await prisma.globalInfluencer.findFirst({
            where: { phone },
            select: { id: true }
        });
        if (byPhone) return byPhone.id;
    }

    // 按平台账号查找（需要遍历JSON数组）
    const allGlobal = await prisma.globalInfluencer.findMany({
        select: {
            id: true,
            platformAccounts: true,
        }
    });

    for (const gi of allGlobal) {
        const accounts = gi.platformAccounts as PlatformAccount[];
        const found = accounts.find(
            acc => acc.platform === platform && acc.platformId === platformId
        );
        if (found) return gi.id;
    }

    return null;
}

async function migrateInfluencerData(): Promise<MigrationStats> {
    const stats: MigrationStats = {
        totalInfluencers: 0,
        globalInfluencersCreated: 0,
        brandInfluencersCreated: 0,
        collaborationsUpdated: 0,
        errors: [],
    };

    console.log('🚀 开始达人数据迁移...\n');

    // 获取所有旧版达人
    const allInfluencers = await prisma.influencer.findMany({
        include: {
            collaborations: true,
        }
    });

    stats.totalInfluencers = allInfluencers.length;
    console.log(`📊 共发现 ${stats.totalInfluencers} 条达人记录\n`);

    for (let i = 0; i < allInfluencers.length; i++) {
        const influencer = allInfluencers[i];

        try {
            console.log(`[${i + 1}/${stats.totalInfluencers}] 处理: ${influencer.nickname} (${influencer.platform})`);

            // 1. 查找或创建 GlobalInfluencer
            let globalInfluencerId = await findExistingGlobalInfluencer(
                influencer.phone,
                influencer.platform,
                influencer.platformId
            );

            if (!globalInfluencerId) {
                // 创建新的 GlobalInfluencer
                const platformAccounts: PlatformAccount[] = [{
                    platform: influencer.platform,
                    platformId: influencer.platformId,
                    followers: influencer.followers || undefined,
                }];

                const newGlobal = await prisma.globalInfluencer.create({
                    data: {
                        nickname: influencer.nickname,
                        phone: influencer.phone,
                        wechat: influencer.wechat,
                        platformAccounts: platformAccounts,
                        sourceType: influencer.sourceType,
                        createdBy: influencer.createdBy,
                        verificationStatus: influencer.verificationStatus,
                        verifiedAt: influencer.verifiedAt,
                        verifiedBy: influencer.verifiedBy,
                        verificationNote: influencer.verificationNote,
                    }
                });

                globalInfluencerId = newGlobal.id;
                stats.globalInfluencersCreated++;
                console.log(`  ✅ 创建 GlobalInfluencer: ${newGlobal.id}`);
            } else {
                console.log(`  📌 复用已有 GlobalInfluencer: ${globalInfluencerId}`);
            }

            // 2. 检查是否已存在 BrandInfluencer 关联
            const existingBrand = await prisma.brandInfluencer.findUnique({
                where: {
                    factoryId_globalInfluencerId: {
                        factoryId: influencer.factoryId,
                        globalInfluencerId,
                    }
                }
            });

            let brandInfluencerId: string;

            if (existingBrand) {
                brandInfluencerId = existingBrand.id;
                console.log(`  📌 复用已有 BrandInfluencer: ${existingBrand.id}`);
            } else {
                // 创建 BrandInfluencer
                const newBrand = await prisma.brandInfluencer.create({
                    data: {
                        factoryId: influencer.factoryId,
                        globalInfluencerId,
                        tags: influencer.tags,
                        notes: influencer.notes,
                        categories: influencer.categories,
                        groupId: influencer.groupId,
                        addedBy: influencer.createdBy || 'system',
                    }
                });

                brandInfluencerId = newBrand.id;
                stats.brandInfluencersCreated++;
                console.log(`  ✅ 创建 BrandInfluencer: ${newBrand.id}`);
            }

            // 3. 更新 Collaboration 关联
            if (influencer.collaborations.length > 0) {
                await prisma.collaboration.updateMany({
                    where: { influencerId: influencer.id },
                    data: { brandInfluencerId }
                });
                stats.collaborationsUpdated += influencer.collaborations.length;
                console.log(`  ✅ 更新 ${influencer.collaborations.length} 条合作记录`);
            }

        } catch (error: any) {
            const errorMsg = `${influencer.nickname}: ${error.message}`;
            stats.errors.push(errorMsg);
            console.log(`  ❌ 错误: ${error.message}`);
        }
    }

    return stats;
}

async function main() {
    console.log('========================================');
    console.log('  达人数据迁移工具 v1.0');
    console.log('  Influencer -> GlobalInfluencer + BrandInfluencer');
    console.log('========================================\n');

    try {
        const stats = await migrateInfluencerData();

        console.log('\n========================================');
        console.log('  迁移完成！统计信息：');
        console.log('========================================');
        console.log(`  📊 总达人数: ${stats.totalInfluencers}`);
        console.log(`  ✅ 创建 GlobalInfluencer: ${stats.globalInfluencersCreated}`);
        console.log(`  ✅ 创建 BrandInfluencer: ${stats.brandInfluencersCreated}`);
        console.log(`  ✅ 更新 Collaboration: ${stats.collaborationsUpdated}`);
        console.log(`  ❌ 错误数: ${stats.errors.length}`);

        if (stats.errors.length > 0) {
            console.log('\n  错误详情:');
            stats.errors.forEach((err, i) => {
                console.log(`    ${i + 1}. ${err}`);
            });
        }

        console.log('\n========================================\n');

    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
