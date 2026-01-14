import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as reportService from './report.service';
import * as sampleService from './sample.service';
import * as resultService from './result.service';

// 测试工厂和用户数据
let testFactoryId: string;
let testOwnerId: string;
let testStaffIds: string[] = [];
let testInfluencerId: string;

describe('报表服务属性测试', () => {
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

    const testFactory = await prisma.brand.create({
      data: {
        name: 'Test Report Factory',
        ownerId: testOwner.id,
        status: 'APPROVED',
        planType: 'PROFESSIONAL',
        staffLimit: 10,
        influencerLimit: 1000,
      },
    });
    testFactoryId = testFactory.id;

    // 更新老板关联工厂ID
    await prisma.user.update({
      where: { id: testOwner.id },
      data: { brandId: testFactory.id },
    });

    // 创建测试商务人员
    for (let i = 0; i < 2; i++) {
      const staff = await prisma.user.create({
        data: {
          email: `report-staff-${i}-${Date.now()}@example.com`,
          passwordHash: 'test-hash',
          name: `测试商务${i + 1}`,
          role: 'BUSINESS_STAFF',
          brandId: testFactoryId,
        },
      });
      testStaffIds.push(staff.id);
    }

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
  });

  afterAll(async () => {
    // 清理测试数据 - 注意顺序，先清理有外键依赖的表
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.sample.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.influencer.deleteMany({ where: { brandId: testFactoryId } });
    // 先断开用户与工厂的关联
    await prisma.user.updateMany({ where: { brandId: testFactoryId }, data: { brandId: null } });
    await prisma.user.update({ where: { id: testOwnerId }, data: { brandId: null } });
    await prisma.brand.delete({ where: { id: testFactoryId } });
    for (const staffId of testStaffIds) {
      await prisma.user.delete({ where: { id: staffId } });
    }
    await prisma.user.delete({ where: { id: testOwnerId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理数据
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.sample.deleteMany({ where: { brandId: testFactoryId } });
  });

  // ==================== Property 10: 商务绩效统计属性测试 ====================
  /**
   * Property 10: 商务绩效统计正确性
   * 
   * 生成随机商务和合作数据
   * 验证绩效指标计算正确
   * 
   * **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
   */
  describe('Property 10: 商务绩效统计正确性属性测试', () => {
    const fc = require('fast-check');

    // 生成合作阶段
    const stageArbitrary = fc.constantFrom(
      'LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'
    );

    /**
     * 属性测试：建联数量应等于该商务创建的合作记录数
     */
    it('建联数量应等于该商务创建的合作记录数', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (collaborationCount: number) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];

            try {
              // 创建指定数量的合作记录
              for (let i = 0; i < collaborationCount; i++) {
                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: 'LEAD',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);
              }

              // 获取绩效报表
              const report = await reportService.getStaffPerformance(testFactoryId);

              // 找到该商务的绩效数据
              const staffPerformance = report.items.find(item => item.staffId === staffId);

              expect(staffPerformance).toBeDefined();
              expect(staffPerformance!.contactedCount).toBe(collaborationCount);
            } finally {
              // 清理
              for (const collabId of createdCollaborations) {
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：推进数量应等于阶段从线索推进到后续阶段的合作数
     */
    it('推进数量应等于阶段从线索推进到后续阶段的合作数', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(stageArbitrary, { minLength: 2, maxLength: 5 }),
          async (stages: string[]) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];

            try {
              // 创建不同阶段的合作记录
              for (const stage of stages) {
                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: stage as any,
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);
              }

              // 获取绩效报表
              const report = await reportService.getStaffPerformance(testFactoryId);

              // 计算预期推进数量（非LEAD阶段的数量）
              const expectedProgressedCount = stages.filter(s => s !== 'LEAD').length;

              const staffPerformance = report.items.find(item => item.staffId === staffId);
              expect(staffPerformance).toBeDefined();
              expect(staffPerformance!.progressedCount).toBe(expectedProgressedCount);
            } finally {
              // 清理
              for (const collabId of createdCollaborations) {
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：成交数量应等于阶段达到已发布或已复盘的合作数
     */
    it('成交数量应等于阶段达到已发布或已复盘的合作数', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(stageArbitrary, { minLength: 2, maxLength: 5 }),
          async (stages: string[]) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];

            try {
              for (const stage of stages) {
                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: stage as any,
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);
              }

              const report = await reportService.getStaffPerformance(testFactoryId);

              // 计算预期成交数量
              const expectedClosedCount = stages.filter(
                s => s === 'PUBLISHED' || s === 'REVIEWED'
              ).length;

              const staffPerformance = report.items.find(item => item.staffId === staffId);
              expect(staffPerformance).toBeDefined();
              expect(staffPerformance!.closedCount).toBe(expectedClosedCount);
            } finally {
              for (const collabId of createdCollaborations) {
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：总GMV应等于该商务负责的所有合作结果GMV之和
     */
    it('总GMV应等于该商务负责的所有合作结果GMV之和', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 10000, max: 500000 }), { minLength: 1, maxLength: 3 }),
          async (gmvList: number[]) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];
            const createdSamples: string[] = [];

            try {
              for (let i = 0; i < gmvList.length; i++) {
                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: 'PUBLISHED',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);

                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `PERF-GMV-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `绩效GMV测试样品_${i}`,
                  unitCost: 1000,
                  retailPrice: 2000,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: collaboration.id,
                  businessStaffId: staffId,
                  quantity: 1,
                  shippingCost: 0,
                });

                await resultService.createResult({
                  collaborationId: collaboration.id,
                  contentType: 'SHORT_VIDEO',
                  publishedAt: new Date(),
                  salesQuantity: 50,
                  salesGmv: gmvList[i],
                  pitFee: 0,
                  actualCommission: 0,
                  willRepeat: true,
                }, testFactoryId);
              }

              const report = await reportService.getStaffPerformance(testFactoryId);

              const expectedTotalGmv = gmvList.reduce((sum, gmv) => sum + gmv, 0);

              const staffPerformance = report.items.find(item => item.staffId === staffId);
              expect(staffPerformance).toBeDefined();
              expect(staffPerformance!.totalGmv).toBe(expectedTotalGmv);
            } finally {
              for (const collabId of createdCollaborations) {
                await prisma.collaborationResult.deleteMany({ where: { collaborationId: collabId } });
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
              for (const sampleId of createdSamples) {
                await prisma.sample.delete({ where: { id: sampleId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });


  // ==================== Property 11: 看板指标聚合属性测试 ====================
  /**
   * Property 11: 看板指标聚合正确性
   * 
   * 生成随机工厂数据
   * 验证看板指标计算正确
   * 
   * **Validates: Requirements 7.1**
   */
  describe('Property 11: 看板指标聚合正确性属性测试', () => {
    const fc = require('fast-check');

    /**
     * 属性测试：总寄样成本应等于所有寄样记录总成本之和
     */
    it('总寄样成本应等于所有寄样记录总成本之和', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              unitCost: fc.integer({ min: 100, max: 5000 }),
              quantity: fc.integer({ min: 1, max: 10 }),
              shippingCost: fc.integer({ min: 0, max: 1000 }),
            }),
            { minLength: 1, maxLength: 4 }
          ),
          async (dispatchDataList: Array<{
            unitCost: number;
            quantity: number;
            shippingCost: number;
          }>) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];
            const createdSamples: string[] = [];

            try {
              for (let i = 0; i < dispatchDataList.length; i++) {
                const data = dispatchDataList[i];

                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: 'SAMPLED',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);

                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `DASH-SAMPLE-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `看板寄样测试_${i}`,
                  unitCost: data.unitCost,
                  retailPrice: data.unitCost * 2,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: collaboration.id,
                  businessStaffId: staffId,
                  quantity: data.quantity,
                  shippingCost: data.shippingCost,
                });
              }

              // 获取看板数据
              const dashboard = await reportService.getFactoryDashboard(testFactoryId);

              // 计算预期总寄样成本
              const expectedTotalSampleCost = dispatchDataList.reduce(
                (sum, d) => sum + (d.unitCost * d.quantity + d.shippingCost),
                0
              );

              expect(dashboard.metrics.totalSampleCost).toBe(expectedTotalSampleCost);
            } finally {
              for (const collabId of createdCollaborations) {
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
              for (const sampleId of createdSamples) {
                await prisma.sample.delete({ where: { id: sampleId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：总GMV应等于所有合作结果GMV之和
     */
    it('总GMV应等于所有合作结果GMV之和', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 10000, max: 200000 }), { minLength: 1, maxLength: 3 }),
          async (gmvList: number[]) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];
            const createdSamples: string[] = [];

            try {
              for (let i = 0; i < gmvList.length; i++) {
                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: 'PUBLISHED',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);

                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `DASH-GMV-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `看板GMV测试_${i}`,
                  unitCost: 1000,
                  retailPrice: 2000,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: collaboration.id,
                  businessStaffId: staffId,
                  quantity: 1,
                  shippingCost: 0,
                });

                await resultService.createResult({
                  collaborationId: collaboration.id,
                  contentType: 'SHORT_VIDEO',
                  publishedAt: new Date(),
                  salesQuantity: 50,
                  salesGmv: gmvList[i],
                  pitFee: 0,
                  actualCommission: 0,
                  willRepeat: true,
                }, testFactoryId);
              }

              const dashboard = await reportService.getFactoryDashboard(testFactoryId);

              const expectedTotalGmv = gmvList.reduce((sum, gmv) => sum + gmv, 0);

              expect(dashboard.metrics.totalGmv).toBe(expectedTotalGmv);
            } finally {
              for (const collabId of createdCollaborations) {
                await prisma.collaborationResult.deleteMany({ where: { collaborationId: collabId } });
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
              for (const sampleId of createdSamples) {
                await prisma.sample.delete({ where: { id: sampleId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：整体ROI应等于总GMV除以总合作成本
     */
    it('整体ROI应等于总GMV除以总合作成本', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              sampleCost: fc.integer({ min: 500, max: 5000 }),
              gmv: fc.integer({ min: 5000, max: 100000 }),
            }),
            { minLength: 1, maxLength: 3 }
          ),
          async (dataList: Array<{ sampleCost: number; gmv: number }>) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];
            const createdSamples: string[] = [];

            try {
              for (let i = 0; i < dataList.length; i++) {
                const data = dataList[i];

                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: 'PUBLISHED',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);

                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `DASH-ROI-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `看板ROI测试_${i}`,
                  unitCost: data.sampleCost,
                  retailPrice: data.sampleCost * 2,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: collaboration.id,
                  businessStaffId: staffId,
                  quantity: 1,
                  shippingCost: 0,
                });

                await resultService.createResult({
                  collaborationId: collaboration.id,
                  contentType: 'SHORT_VIDEO',
                  publishedAt: new Date(),
                  salesQuantity: 50,
                  salesGmv: data.gmv,
                  pitFee: 0,
                  actualCommission: 0,
                  willRepeat: true,
                }, testFactoryId);
              }

              const dashboard = await reportService.getFactoryDashboard(testFactoryId);

              const expectedTotalGmv = dataList.reduce((sum, d) => sum + d.gmv, 0);
              const expectedTotalCost = dataList.reduce((sum, d) => sum + d.sampleCost, 0);
              const expectedRoi = expectedTotalCost > 0 
                ? Math.round((expectedTotalGmv / expectedTotalCost) * 10000) / 10000 
                : 0;

              expect(dashboard.metrics.totalGmv).toBe(expectedTotalGmv);
              expect(dashboard.metrics.totalCollaborationCost).toBe(expectedTotalCost);
              expect(dashboard.metrics.overallRoi).toBeCloseTo(expectedRoi, 3);
            } finally {
              for (const collabId of createdCollaborations) {
                await prisma.collaborationResult.deleteMany({ where: { collaborationId: collabId } });
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
              for (const sampleId of createdSamples) {
                await prisma.sample.delete({ where: { id: sampleId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：管道分布应正确统计各阶段数量
     */
    it('管道分布应正确统计各阶段数量', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.constantFrom('LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED', 'PUBLISHED', 'REVIEWED'),
            { minLength: 3, maxLength: 8 }
          ),
          async (stages: string[]) => {
            const staffId = testStaffIds[0];
            const createdCollaborations: string[] = [];

            try {
              for (const stage of stages) {
                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: staffId,
                    stage: stage as any,
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);
              }

              const dashboard = await reportService.getFactoryDashboard(testFactoryId);

              // 计算预期各阶段数量
              const expectedDistribution: Record<string, number> = {
                LEAD: 0, CONTACTED: 0, QUOTED: 0, SAMPLED: 0,
                SCHEDULED: 0, PUBLISHED: 0, REVIEWED: 0,
              };
              for (const stage of stages) {
                expectedDistribution[stage]++;
              }

              // 验证
              for (const [stage, count] of Object.entries(expectedDistribution)) {
                expect(dashboard.pipelineDistribution[stage as keyof typeof dashboard.pipelineDistribution]).toBe(count);
              }
            } finally {
              for (const collabId of createdCollaborations) {
                await prisma.stageHistory.deleteMany({ where: { collaborationId: collabId } });
                await prisma.collaboration.delete({ where: { id: collabId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
