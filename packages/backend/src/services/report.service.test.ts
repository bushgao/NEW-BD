import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as reportService from './report.service';
import * as collaborationService from './collaboration.service';
import * as resultService from './result.service';

// 测试数据
let testFactoryId: string;
let testOwnerId: string;
let testStaffId1: string;
let testStaffId2: string;
let testInfluencerId: string;
let testSampleId: string;

describe('报表与看板服务测试', () => {
  beforeAll(async () => {
    // 创建测试工厂老板
    const testOwner = await prisma.user.create({
      data: {
        email: `report-owner-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试老板',
        role: 'FACTORY_OWNER',
      },
    });
    testOwnerId = testOwner.id;

    // 创建测试工厂
    const testFactory = await prisma.brand.create({
      data: {
        name: 'Report Test Factory',
        ownerId: testOwner.id,
        status: 'APPROVED',
        planType: 'PROFESSIONAL',
        staffLimit: 10,
        influencerLimit: 1000,
      },
    });
    testFactoryId = testFactory.id;

    // 更新老板关联工厂
    await prisma.user.update({
      where: { id: testOwner.id },
      data: { brandId: testFactory.id },
    });

    // 创建测试商务人员1
    const testStaff1 = await prisma.user.create({
      data: {
        email: `report-staff1-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '商务员工1',
        role: 'BUSINESS_STAFF',
        brandId: testFactory.id,
      },
    });
    testStaffId1 = testStaff1.id;

    // 创建测试商务人员2
    const testStaff2 = await prisma.user.create({
      data: {
        email: `report-staff2-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '商务员工2',
        role: 'BUSINESS_STAFF',
        brandId: testFactory.id,
      },
    });
    testStaffId2 = testStaff2.id;

    // 创建测试达人
    const testInfluencer = await prisma.influencer.create({
      data: {
        brandId: testFactoryId,
        nickname: '报表测试达人',
        platform: 'DOUYIN',
        platformId: `report-test-${Date.now()}`,
        categories: ['美妆'],
        tags: [],
      },
    });
    testInfluencerId = testInfluencer.id;

    // 创建测试样品
    const testSample = await prisma.sample.create({
      data: {
        brandId: testFactoryId,
        sku: 'REPORT-TEST-001',
        name: '报表测试样品',
        unitCost: 5000, // 50元
        retailPrice: 19900, // 199元
        canResend: true,
      },
    });
    testSampleId = testSample.id;
  });

  afterAll(async () => {
    // 清理测试数据 - 注意顺序，先删除依赖的数据
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.followUpRecord.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.sample.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.influencer.deleteMany({ where: { brandId: testFactoryId } });
    
    // 先删除商务人员（他们引用了工厂）
    await prisma.user.deleteMany({ 
      where: { 
        brandId: testFactoryId,
        id: { not: testOwnerId } // 不删除老板，因为工厂引用了他
      } 
    });
    
    // 删除工厂
    await prisma.brand.delete({ where: { id: testFactoryId } });
    
    // 最后删除老板
    await prisma.user.delete({ where: { id: testOwnerId } });
    
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理合作相关数据
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.followUpRecord.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
  });

  describe('商务绩效统计正确性', () => {
    it('应该正确统计商务建联数量', async () => {
      // 商务1创建2个合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'LEAD',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'CONTACTED',
      });

      // 商务2创建1个合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId2,
        stage: 'LEAD',
      });

      const report = await reportService.getStaffPerformance(testFactoryId);

      const staff1 = report.items.find(i => i.staffId === testStaffId1);
      const staff2 = report.items.find(i => i.staffId === testStaffId2);

      expect(staff1?.contactedCount).toBe(2);
      expect(staff2?.contactedCount).toBe(1);
      expect(report.summary.totalContactedCount).toBe(3);
    });

    it('应该正确统计推进数量（非线索阶段）', async () => {
      // 商务1：1个线索，1个已联系
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'LEAD',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'CONTACTED',
      });

      const report = await reportService.getStaffPerformance(testFactoryId);
      const staff1 = report.items.find(i => i.staffId === testStaffId1);

      // 推进数量应该是1（只有CONTACTED，不包括LEAD）
      expect(staff1?.progressedCount).toBe(1);
    });

    it('应该正确统计成交数量（已发布或已复盘）', async () => {
      // 创建不同阶段的合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'SAMPLED',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'PUBLISHED',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'REVIEWED',
      });

      const report = await reportService.getStaffPerformance(testFactoryId);
      const staff1 = report.items.find(i => i.staffId === testStaffId1);

      // 成交数量应该是2（PUBLISHED + REVIEWED）
      expect(staff1?.closedCount).toBe(2);
    });

    it('应该正确计算平均ROI', async () => {
      // 创建合作并录入结果
      const collab = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'PUBLISHED',
      });

      // 创建寄样记录
      await prisma.sampleDispatch.create({
        data: {
          sampleId: testSampleId,
          collaborationId: collab.id,
          businessStaffId: testStaffId1,
          quantity: 2,
          unitCostSnapshot: 5000,
          totalSampleCost: 10000, // 100元
          shippingCost: 1500, // 15元
          totalCost: 11500, // 115元
          receivedStatus: 'RECEIVED',
          onboardStatus: 'ONBOARD',
          dispatchedAt: new Date(),
        },
      });

      // 录入合作结果
      await resultService.createResult({
        collaborationId: collab.id,
        contentType: 'SHORT_VIDEO',
        publishedAt: new Date(),
        salesQuantity: 50,
        salesGmv: 500000, // 5000元
        commissionRate: 20,
        pitFee: 0,
        actualCommission: 100000, // 1000元
        willRepeat: true,
      }, testFactoryId);

      const report = await reportService.getStaffPerformance(testFactoryId);
      const staff1 = report.items.find(i => i.staffId === testStaffId1);

      expect(staff1?.totalGmv).toBe(500000);
      expect(staff1?.totalCost).toBeGreaterThan(0);
      expect(staff1?.averageRoi).toBeGreaterThan(0);
    });
  });

  describe('看板指标计算正确性', () => {
    it('应该正确计算管道分布', async () => {
      // 创建不同阶段的合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'LEAD',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'LEAD',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'CONTACTED',
      });
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'SAMPLED',
      });

      const dashboard = await reportService.getFactoryDashboard(testFactoryId);

      expect(dashboard.pipelineDistribution.LEAD).toBe(2);
      expect(dashboard.pipelineDistribution.CONTACTED).toBe(1);
      expect(dashboard.pipelineDistribution.SAMPLED).toBe(1);
      expect(dashboard.pipelineDistribution.QUOTED).toBe(0);
    });

    it('应该正确统计超期合作数量', async () => {
      // 创建超期合作
      const collab = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'CONTACTED',
      });

      // 设置过去的截止时间
      await collaborationService.setDeadline(
        collab.id,
        testFactoryId,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const dashboard = await reportService.getFactoryDashboard(testFactoryId);

      expect(dashboard.pendingItems.overdueCollaborations).toBeGreaterThanOrEqual(1);
    });

    it('应该正确计算寄样成本', async () => {
      const collab = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'SAMPLED',
      });

      // 创建寄样记录
      await prisma.sampleDispatch.create({
        data: {
          sampleId: testSampleId,
          collaborationId: collab.id,
          businessStaffId: testStaffId1,
          quantity: 3,
          unitCostSnapshot: 5000,
          totalSampleCost: 15000,
          shippingCost: 2000,
          totalCost: 17000, // 170元
          receivedStatus: 'PENDING',
          onboardStatus: 'UNKNOWN',
          dispatchedAt: new Date(),
        },
      });

      const dashboard = await reportService.getFactoryDashboard(testFactoryId);

      expect(dashboard.metrics.totalSampleCost).toBe(17000);
    });

    it('应该正确计算整体ROI', async () => {
      const collab = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'PUBLISHED',
      });

      // 创建寄样记录
      await prisma.sampleDispatch.create({
        data: {
          sampleId: testSampleId,
          collaborationId: collab.id,
          businessStaffId: testStaffId1,
          quantity: 1,
          unitCostSnapshot: 5000,
          totalSampleCost: 5000,
          shippingCost: 1000,
          totalCost: 6000,
          receivedStatus: 'RECEIVED',
          onboardStatus: 'ONBOARD',
          dispatchedAt: new Date(),
        },
      });

      // 录入合作结果
      await resultService.createResult({
        collaborationId: collab.id,
        contentType: 'SHORT_VIDEO',
        publishedAt: new Date(),
        salesQuantity: 20,
        salesGmv: 200000, // 2000元
        commissionRate: 10,
        pitFee: 0,
        actualCommission: 20000, // 200元
        willRepeat: true,
      }, testFactoryId);

      const dashboard = await reportService.getFactoryDashboard(testFactoryId);

      expect(dashboard.metrics.totalGmv).toBe(200000);
      expect(dashboard.metrics.totalCollaborationCost).toBeGreaterThan(0);
      expect(dashboard.metrics.overallRoi).toBeGreaterThan(0);
    });

    it('应该正确生成商务排行榜', async () => {
      // 商务1创建成交合作
      const collab1 = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'PUBLISHED',
      });

      await prisma.sampleDispatch.create({
        data: {
          sampleId: testSampleId,
          collaborationId: collab1.id,
          businessStaffId: testStaffId1,
          quantity: 1,
          unitCostSnapshot: 5000,
          totalSampleCost: 5000,
          shippingCost: 1000,
          totalCost: 6000,
          receivedStatus: 'RECEIVED',
          onboardStatus: 'ONBOARD',
          dispatchedAt: new Date(),
        },
      });

      await resultService.createResult({
        collaborationId: collab1.id,
        contentType: 'SHORT_VIDEO',
        publishedAt: new Date(),
        salesQuantity: 100,
        salesGmv: 1000000, // 10000元
        commissionRate: 10,
        pitFee: 0,
        actualCommission: 100000,
        willRepeat: true,
      }, testFactoryId);

      const dashboard = await reportService.getFactoryDashboard(testFactoryId);

      expect(dashboard.staffRanking.length).toBeGreaterThanOrEqual(1);
      // 排行榜应按GMV降序
      if (dashboard.staffRanking.length > 1) {
        expect(dashboard.staffRanking[0].totalGmv).toBeGreaterThanOrEqual(
          dashboard.staffRanking[1].totalGmv
        );
      }
    });
  });

  describe('报表导出功能', () => {
    it('应该能导出商务绩效报表为Excel', async () => {
      // 创建一些测试数据
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'CONTACTED',
      });

      const buffer = await reportService.exportStaffPerformanceReport(testFactoryId);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      // Excel文件的magic number
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
    });

    it('应该能导出ROI报表为Excel', async () => {
      const collab = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'PUBLISHED',
      });

      await prisma.sampleDispatch.create({
        data: {
          sampleId: testSampleId,
          collaborationId: collab.id,
          businessStaffId: testStaffId1,
          quantity: 1,
          unitCostSnapshot: 5000,
          totalSampleCost: 5000,
          shippingCost: 1000,
          totalCost: 6000,
          receivedStatus: 'RECEIVED',
          onboardStatus: 'ONBOARD',
          dispatchedAt: new Date(),
        },
      });

      await resultService.createResult({
        collaborationId: collab.id,
        contentType: 'SHORT_VIDEO',
        publishedAt: new Date(),
        salesQuantity: 10,
        salesGmv: 100000,
        commissionRate: 10,
        pitFee: 0,
        actualCommission: 10000,
        willRepeat: false,
      }, testFactoryId);

      const buffer = await reportService.exportRoiReport(testFactoryId, 'staff');

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
    });

    it('应该能导出合作记录为Excel', async () => {
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'SAMPLED',
      });

      const buffer = await reportService.exportCollaborationReport(testFactoryId);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
    });

    it('应该支持按日期范围导出', async () => {
      const now = new Date();
      const dateRange = {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now,
      };

      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testStaffId1,
        stage: 'CONTACTED',
      });

      const buffer = await reportService.exportStaffPerformanceReport(testFactoryId, dateRange);

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
