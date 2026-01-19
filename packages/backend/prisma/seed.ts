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
      influencerLimit: 500,
      dataRetentionDays: 30, // 30天试用期，到期锁定
      price: 0,
      features: ['基础达人管理', '基础样品管理', '基础合作流程', '30天免费试用'],
    },
    {
      planType: PlanType.PERSONAL,
      name: '个人版',
      staffLimit: 1,
      influencerLimit: 500,
      dataRetentionDays: 365, // 年付，数据保留一年
      price: 59900, // 599元/年
      features: ['全部基础功能', '个人达人库', '基础报表', '1人商务'],
    },
    {
      planType: PlanType.PROFESSIONAL,
      name: '专业版',
      staffLimit: 20,
      influencerLimit: 2000,
      dataRetentionDays: 365, // 年付，数据保留一年
      price: 199900, // 1999元/年
      features: ['全部基础功能', '高级报表', '数据导出', '优先支持', '20人商务团队'],
    },
    {
      planType: PlanType.ENTERPRISE,
      name: '企业版',
      staffLimit: 50,
      influencerLimit: 10000,
      dataRetentionDays: 365, // 年付，数据保留一年
      price: 299900, // 2999元/年
      features: ['全部专业版功能', 'API接入', '专属客服', '50人商务团队', '无限达人'],
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
      role: UserRole.BRAND,
    },
  });
  console.log('✅ Factory owner created:', owner.email);


  // Create demo brand
  const brand = await prisma.brand.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      name: '示例品牌',
      ownerId: owner.id,
      status: 'APPROVED',
      planType: PlanType.PROFESSIONAL,
      staffLimit: 10,
      influencerLimit: 500,
    },
  });
  console.log('✅ Demo brand created:', brand.name);

  // Update owner with brand reference
  await prisma.user.update({
    where: { id: owner.id },
    data: { brandId: brand.id },
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
      role: UserRole.BUSINESS,
      brandId: brand.id,
      isIndependent: false,
    },
  });
  console.log('✅ Business staff created:', staff.email);

  // Create independent business user (for testing targeted invitations)
  const independentPwd = await bcrypt.hash('123456', 10);
  const independentUser = await prisma.user.upsert({
    where: { email: '13800000001@phone.local' },
    update: {},
    create: {
      email: '13800000001@phone.local',
      passwordHash: independentPwd,
      name: 'Independent Biz',
      phone: '13800000001',
      role: UserRole.BUSINESS,
      isIndependent: true,
    },
  });

  // Create personal brand for independent user
  const personalBrand = await prisma.brand.upsert({
    where: { ownerId: independentUser.id },
    update: {},
    create: {
      name: '个人工作区 - Independent Biz',
      ownerId: independentUser.id,
      status: 'APPROVED',
      planType: PlanType.FREE,
      staffLimit: 1,
      influencerLimit: 50,
    },
  });
  await prisma.user.update({
    where: { id: independentUser.id },
    data: { brandId: personalBrand.id },
  });
  console.log('✅ Independent business created:', independentUser.phone);

  // Create demo samples
  const samples = [
    { sku: 'SKU001', name: '美白面膜', unitCost: 1500, retailPrice: 9900, canResend: true },
    { sku: 'SKU002', name: '保湿精华', unitCost: 2500, retailPrice: 19900, canResend: true },
    { sku: 'SKU003', name: '防晒霜', unitCost: 1800, retailPrice: 12900, canResend: false },
  ];

  for (const sample of samples) {
    await prisma.sample.upsert({
      where: { brandId_sku: { brandId: brand.id, sku: sample.sku } },
      update: sample,
      create: { ...sample, brandId: brand.id },
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
        brandId_platform_platformId: {
          brandId: brand.id,
          platform: inf.platform,
          platformId: inf.platformId,
        },
      },
      update: inf,
      create: { ...inf, brandId: brand.id },
    });
  }
  console.log('✅ Demo influencers created');

  // Create demo collaboration
  const influencer = await prisma.influencer.findFirst({
    where: { brandId: brand.id },
  });

  if (influencer) {
    // Check if collaboration already exists
    const existingCollab = await prisma.collaboration.findFirst({
      where: {
        influencerId: influencer.id,
        brandId: brand.id,
        businessStaffId: staff.id,
      },
    });

    if (!existingCollab) {
      await prisma.collaboration.create({
        data: {
          influencerId: influencer.id,
          brandId: brand.id,
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
