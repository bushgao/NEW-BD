import { PrismaClient, UserRole, PlanType, Platform, PipelineStage } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create plan configurations
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
      price: 29900, // 299元/月
      features: ['全部基础功能', '高级报表', '数据导出', '优先支持'],
    },
    {
      planType: PlanType.ENTERPRISE,
      name: '企业版',
      staffLimit: 50,
      influencerLimit: 5000,
      dataRetentionDays: 730,
      price: 99900, // 999元/月
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
  console.log('✅ Plan configurations created');

  // Create platform admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: '平台管理员',
      role: UserRole.PLATFORM_ADMIN,
    },
  });
  console.log('✅ Platform admin created:', admin.email);

  // Create a demo factory owner
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo.com' },
    update: {},
    create: {
      email: 'owner@demo.com',
      passwordHash: ownerPassword,
      name: '张老板',
      role: UserRole.FACTORY_OWNER,
    },
  });
  console.log('✅ Factory owner created:', owner.email);


  // Create demo factory
  const factory = await prisma.factory.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      name: '示例工厂',
      ownerId: owner.id,
      status: 'APPROVED',
      planType: PlanType.PROFESSIONAL,
      staffLimit: 10,
      influencerLimit: 500,
    },
  });
  console.log('✅ Demo factory created:', factory.name);

  // Update owner with factory reference
  await prisma.user.update({
    where: { id: owner.id },
    data: { factoryId: factory.id },
  });

  // Create demo business staff
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@demo.com' },
    update: {},
    create: {
      email: 'staff@demo.com',
      passwordHash: staffPassword,
      name: '李商务',
      role: UserRole.BUSINESS_STAFF,
      factoryId: factory.id,
    },
  });
  console.log('✅ Business staff created:', staff.email);

  // Create demo samples
  const samples = [
    { sku: 'SKU001', name: '美白面膜', unitCost: 1500, retailPrice: 9900, canResend: true },
    { sku: 'SKU002', name: '保湿精华', unitCost: 2500, retailPrice: 19900, canResend: true },
    { sku: 'SKU003', name: '防晒霜', unitCost: 1800, retailPrice: 12900, canResend: false },
  ];

  for (const sample of samples) {
    await prisma.sample.upsert({
      where: { factoryId_sku: { factoryId: factory.id, sku: sample.sku } },
      update: sample,
      create: { ...sample, factoryId: factory.id },
    });
  }
  console.log('✅ Demo samples created');

  // Create demo influencers
  const influencers = [
    {
      nickname: '美妆小达人',
      platform: Platform.DOUYIN,
      platformId: 'dy_12345',
      phone: '13800138001',
      categories: ['美妆', '护肤'],
      tags: ['高配合度', '粉丝活跃'],
    },
    {
      nickname: '护肤种草官',
      platform: Platform.XIAOHONGSHU,
      platformId: 'xhs_67890',
      phone: '13800138002',
      categories: ['护肤', '生活'],
      tags: ['内容优质'],
    },
    {
      nickname: '直播带货王',
      platform: Platform.KUAISHOU,
      platformId: 'ks_11111',
      phone: '13800138003',
      categories: ['美妆', '服饰'],
      tags: ['转化率高', '价格敏感'],
    },
  ];

  for (const inf of influencers) {
    await prisma.influencer.upsert({
      where: {
        factoryId_platform_platformId: {
          factoryId: factory.id,
          platform: inf.platform,
          platformId: inf.platformId,
        },
      },
      update: inf,
      create: { ...inf, factoryId: factory.id },
    });
  }
  console.log('✅ Demo influencers created');

  // Create demo collaboration
  const influencer = await prisma.influencer.findFirst({
    where: { factoryId: factory.id },
  });

  if (influencer) {
    // Check if collaboration already exists
    const existingCollab = await prisma.collaboration.findFirst({
      where: {
        influencerId: influencer.id,
        factoryId: factory.id,
        businessStaffId: staff.id,
      },
    });

    if (!existingCollab) {
      await prisma.collaboration.create({
        data: {
          influencerId: influencer.id,
          factoryId: factory.id,
          businessStaffId: staff.id,
          stage: PipelineStage.CONTACTED,
        },
      });
      console.log('✅ Demo collaboration created');
    } else {
      console.log('✅ Demo collaboration already exists');
    }
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
