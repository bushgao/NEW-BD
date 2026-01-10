import { PrismaClient, UserRole, PlanType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 重置数据库脚本
 * 清空所有业务数据，只保留：
 * - 套餐配置
 * - 平台管理员账号
 */
async function main() {
    console.log('🔄 Starting database reset...');
    console.log('⚠️  This will DELETE all business data!\n');

    // Step 1: 删除所有业务数据（按依赖顺序）
    console.log('📦 Deleting collaboration results...');
    await prisma.collaborationResult.deleteMany({});

    console.log('📦 Deleting follow-up records...');
    await prisma.followUpRecord.deleteMany({});

    console.log('📦 Deleting stage history...');
    await prisma.stageHistory.deleteMany({});

    console.log('📦 Deleting sample dispatches...');
    await prisma.sampleDispatch.deleteMany({});

    console.log('📦 Deleting collaborations...');
    await prisma.collaboration.deleteMany({});

    console.log('📦 Deleting notifications...');
    await prisma.notification.deleteMany({});

    console.log('👤 Deleting influencer login logs...');
    await prisma.influencerLoginLog.deleteMany({});

    console.log('👤 Deleting influencer contacts...');
    await prisma.influencerContact.deleteMany({});

    console.log('👤 Deleting influencer accounts...');
    await prisma.influencerAccount.deleteMany({});

    console.log('👤 Deleting influencers...');
    await prisma.influencer.deleteMany({});

    console.log('👤 Deleting influencer groups...');
    await prisma.influencerGroup.deleteMany({});

    console.log('🎁 Deleting samples...');
    await prisma.sample.deleteMany({});

    console.log('🏭 Deleting factories...');
    await prisma.factory.deleteMany({});

    console.log('👥 Deleting non-admin users...');
    await prisma.user.deleteMany({
        where: {
            role: {
                not: UserRole.PLATFORM_ADMIN,
            },
        },
    });

    console.log('✅ All business data deleted!\n');

    // Step 2: 确保套餐配置存在
    console.log('📋 Ensuring plan configurations exist...');
    const plans = [
        {
            planType: PlanType.FREE,
            name: '免费版',
            staffLimit: 3,
            influencerLimit: 100,
            dataRetentionDays: 90,
            price: 0,
            features: ['基础达人管理', '基础样品管理', '基础合作流程'],
        },
        {
            planType: PlanType.PROFESSIONAL,
            name: '专业版',
            staffLimit: 10,
            influencerLimit: 500,
            dataRetentionDays: 365,
            price: 29900,
            features: ['全部基础功能', '高级报表', '数据导出', '优先支持'],
        },
        {
            planType: PlanType.ENTERPRISE,
            name: '企业版',
            staffLimit: 50,
            influencerLimit: 5000,
            dataRetentionDays: 730,
            price: 99900,
            features: ['全部专业版功能', '无限数据保留', 'API接入', '专属客服'],
        },
    ];

    for (const plan of plans) {
        await prisma.planConfig.upsert({
            where: { planType: plan.planType },
            update: plan,
            create: plan,
        });
    }
    console.log('✅ Plan configurations ready!\n');

    // Step 3: 确保平台管理员存在
    console.log('👑 Ensuring platform admin exists...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
            passwordHash: adminPassword,
            name: '平台管理员',
            role: UserRole.PLATFORM_ADMIN,
        },
        create: {
            email: 'admin@example.com',
            passwordHash: adminPassword,
            name: '平台管理员',
            role: UserRole.PLATFORM_ADMIN,
        },
    });
    console.log('✅ Platform admin ready:', admin.email);

    // Step 4: 显示最终状态
    console.log('\n📊 Database Status:');
    const userCount = await prisma.user.count();
    const factoryCount = await prisma.factory.count();
    const influencerCount = await prisma.influencer.count();
    const sampleCount = await prisma.sample.count();
    const collaborationCount = await prisma.collaboration.count();

    console.log(`   Users: ${userCount}`);
    console.log(`   Factories: ${factoryCount}`);
    console.log(`   Influencers: ${influencerCount}`);
    console.log(`   Samples: ${sampleCount}`);
    console.log(`   Collaborations: ${collaborationCount}`);

    console.log('\n🎉 Database reset completed!');
    console.log('\n📝 Admin Login Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Login URL: http://localhost:5173/admin/login');
}

main()
    .catch((e) => {
        console.error('❌ Reset failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
