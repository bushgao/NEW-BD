import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as resultService from './result.service';
import * as sampleService from './sample.service';

// 测试工厂和用户数据
let testFactoryId: string;
let testUserId: string;
let testInfluencerId: string;

describe('合作结果服务测试', () => {
  beforeAll(async () => {
    // 创建测试用户和工厂
    const testUser = await prisma.user.create({
      data: {
        email: `result-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试商务',
        role: 'BUSINESS_STAFF',
      },
    });
    testUserId = testUser.id;

    const testFactory = await prisma.brand.create({
      data: {
        name: 'Test Result Factory',
        ownerId: testUser.id,
        status: 'APPROVED',
        planType: 'PROFESSIONAL',
        staffLimit: 10,
        influencerLimit: 1000,
      },
    });
    testFactoryId = testFactory.id;

    // 更新用户关联工厂ID
    await prisma.user.update({
      where: { id: testUser.id },
      data: { brandId: testFactory.id },
    });

    // 创建测试达人
    const testInfluencer = await prisma.influencer.create({
      data: {
        brandId: testFactoryId,
        nickname: '结果测试达人',
        platform: 'DOUYIN',
        platformId: `result-test-${Date.now()}`,
        categories: ['美妆'],
        tags: [],
      },
    });
    testInfluencerId = testInfluencer.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.sample.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.influencer.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.brand.delete({ where: { id: testFactoryId } });
    await prisma.user.delete({ where: { id: testUserId } });
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

  // ==================== Property 8: ROI计算属性测试 ====================
  /**
   * Property 8: ROI计算与回本状态判断
   * 
   * 生成随机成本和GMV数据
   * 验证ROI计算和回本状态判断正确
   * 
   * **Validates: Requirements 5.2, 5.3, 5.4**
   */
  describe('Property 8: ROI计算与回本状态判断属性测试', () => {
    const fc = require('fast-check');

    // 生成成本数据（分）
    const costArbitrary = fc.integer({ min: 100, max: 1000000 }); // 1元-10000元

    // 生成GMV数据（分）
    const gmvArbitrary = fc.integer({ min: 0, max: 5000000 }); // 0-50000元

    /**
     * 属性测试：ROI = 销售GMV / 合作总成本
     */
    it('ROI应等于销售GMV除以合作总成本', async () => {
      await fc.assert(
        fc.asyncProperty(
          costArbitrary,
          costArbitrary,
          costArbitrary,
          gmvArbitrary,
          async (sampleCost: number, pitFee: number, commission: number, gmv: number) => {
            // 创建合作记录
            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                brandId: testFactoryId,
                businessStaffId: testUserId,
                stage: 'PUBLISHED',
                isOverdue: false,
              },
            });

            // 创建样品和寄样记录
            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `ROI-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `ROI测试样品_${Date.now()}`,
              unitCost: sampleCost,
              retailPrice: sampleCost * 2,
            });

            await sampleService.createDispatch({
              sampleId: sample.id,
              collaborationId: collaboration.id,
              businessStaffId: testUserId,
              quantity: 1,
              shippingCost: 0,
            });

            try {
              // 创建合作结果
              const result = await resultService.createResult({
                collaborationId: collaboration.id,
                contentType: 'SHORT_VIDEO',
                publishedAt: new Date(),
                salesQuantity: 100,
                salesGmv: gmv,
                pitFee,
                actualCommission: commission,
                willRepeat: true,
              }, testFactoryId);

              // 计算预期值
              const expectedTotalCost = sampleCost + pitFee + commission;
              const expectedRoi = expectedTotalCost > 0 
                ? Math.round((gmv / expectedTotalCost) * 10000) / 10000 
                : 0;

              // 验证
              expect(result.totalSampleCost).toBe(sampleCost);
              expect(result.totalCollaborationCost).toBe(expectedTotalCost);
              expect(result.roi).toBeCloseTo(expectedRoi, 4);
            } finally {
              // 清理
              await prisma.collaborationResult.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：ROI < 1 时回本状态应为 LOSS
     */
    it('ROI < 1 时回本状态应为 LOSS', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 100000 }), // 成本 100-1000元
          async (totalCost: number) => {
            // GMV 小于成本
            const gmv = Math.floor(totalCost * 0.5); // 50% 的成本

            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                brandId: testFactoryId,
                businessStaffId: testUserId,
                stage: 'PUBLISHED',
                isOverdue: false,
              },
            });

            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `LOSS-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `LOSS测试样品_${Date.now()}`,
              unitCost: totalCost,
              retailPrice: totalCost * 2,
            });

            await sampleService.createDispatch({
              sampleId: sample.id,
              collaborationId: collaboration.id,
              businessStaffId: testUserId,
              quantity: 1,
              shippingCost: 0,
            });

            try {
              const result = await resultService.createResult({
                collaborationId: collaboration.id,
                contentType: 'SHORT_VIDEO',
                publishedAt: new Date(),
                salesQuantity: 10,
                salesGmv: gmv,
                pitFee: 0,
                actualCommission: 0,
                willRepeat: false,
              }, testFactoryId);

              expect(result.roi).toBeLessThan(1);
              expect(result.profitStatus).toBe('LOSS');
            } finally {
              await prisma.collaborationResult.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：1 <= ROI < 3 时回本状态应为 PROFIT
     */
    it('1 <= ROI < 3 时回本状态应为 PROFIT 或 BREAK_EVEN', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 100000 }),
          fc.double({ min: 1.01, max: 2.99 }),
          async (totalCost: number, roiMultiplier: number) => {
            const gmv = Math.floor(totalCost * roiMultiplier);

            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                brandId: testFactoryId,
                businessStaffId: testUserId,
                stage: 'PUBLISHED',
                isOverdue: false,
              },
            });

            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `PROFIT-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `PROFIT测试样品_${Date.now()}`,
              unitCost: totalCost,
              retailPrice: totalCost * 2,
            });

            await sampleService.createDispatch({
              sampleId: sample.id,
              collaborationId: collaboration.id,
              businessStaffId: testUserId,
              quantity: 1,
              shippingCost: 0,
            });

            try {
              const result = await resultService.createResult({
                collaborationId: collaboration.id,
                contentType: 'SHORT_VIDEO',
                publishedAt: new Date(),
                salesQuantity: 50,
                salesGmv: gmv,
                pitFee: 0,
                actualCommission: 0,
                willRepeat: true,
              }, testFactoryId);

              expect(result.roi).toBeGreaterThanOrEqual(1);
              expect(result.roi).toBeLessThan(3);
              expect(['PROFIT', 'BREAK_EVEN']).toContain(result.profitStatus);
            } finally {
              await prisma.collaborationResult.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：ROI >= 3 时回本状态应为 HIGH_PROFIT
     */
    it('ROI >= 3 时回本状态应为 HIGH_PROFIT', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10000, max: 50000 }),
          fc.double({ min: 3, max: 10 }),
          async (totalCost: number, roiMultiplier: number) => {
            const gmv = Math.floor(totalCost * roiMultiplier);

            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                brandId: testFactoryId,
                businessStaffId: testUserId,
                stage: 'PUBLISHED',
                isOverdue: false,
              },
            });

            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `HIGH-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `HIGH_PROFIT测试样品_${Date.now()}`,
              unitCost: totalCost,
              retailPrice: totalCost * 2,
            });

            await sampleService.createDispatch({
              sampleId: sample.id,
              collaborationId: collaboration.id,
              businessStaffId: testUserId,
              quantity: 1,
              shippingCost: 0,
            });

            try {
              const result = await resultService.createResult({
                collaborationId: collaboration.id,
                contentType: 'LIVE_STREAM',
                publishedAt: new Date(),
                salesQuantity: 200,
                salesGmv: gmv,
                pitFee: 0,
                actualCommission: 0,
                willRepeat: true,
              }, testFactoryId);

              expect(result.roi).toBeGreaterThanOrEqual(3);
              expect(result.profitStatus).toBe('HIGH_PROFIT');
            } finally {
              await prisma.collaborationResult.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：合作总成本 = 样品成本 + 坑位费 + 实付佣金
     */
    it('合作总成本应等于样品成本加坑位费加实付佣金', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 100, max: 50000 }),
          fc.integer({ min: 0, max: 100000 }),
          fc.integer({ min: 0, max: 50000 }),
          async (sampleCost: number, pitFee: number, commission: number) => {
            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                brandId: testFactoryId,
                businessStaffId: testUserId,
                stage: 'PUBLISHED',
                isOverdue: false,
              },
            });

            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `COST-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `成本测试样品_${Date.now()}`,
              unitCost: sampleCost,
              retailPrice: sampleCost * 2,
            });

            await sampleService.createDispatch({
              sampleId: sample.id,
              collaborationId: collaboration.id,
              businessStaffId: testUserId,
              quantity: 1,
              shippingCost: 0,
            });

            try {
              const result = await resultService.createResult({
                collaborationId: collaboration.id,
                contentType: 'SHORT_VIDEO',
                publishedAt: new Date(),
                salesQuantity: 100,
                salesGmv: 500000,
                pitFee,
                actualCommission: commission,
                willRepeat: true,
              }, testFactoryId);

              const expectedTotalCost = sampleCost + pitFee + commission;
              expect(result.totalCollaborationCost).toBe(expectedTotalCost);
            } finally {
              await prisma.collaborationResult.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.sampleDispatch.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });


  // ==================== Property 9: ROI报表聚合属性测试 ====================
  /**
   * Property 9: ROI报表分组聚合正确性
   * 
   * 生成随机合作结果集合
   * 验证分组汇总计算正确
   * 
   * **Validates: Requirements 5.5**
   */
  describe('Property 9: ROI报表分组聚合正确性属性测试', () => {
    const fc = require('fast-check');

    // 生成合作结果数据
    const resultDataArbitrary = fc.record({
      sampleCost: fc.integer({ min: 100, max: 10000 }),
      pitFee: fc.integer({ min: 0, max: 5000 }),
      commission: fc.integer({ min: 0, max: 3000 }),
      gmv: fc.integer({ min: 0, max: 100000 }),
    });

    /**
     * 属性测试：报表汇总ROI应等于总GMV除以总成本
     */
    it('报表汇总ROI应等于总GMV除以总成本', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(resultDataArbitrary, { minLength: 2, maxLength: 5 }),
          async (resultDataList: Array<{
            sampleCost: number;
            pitFee: number;
            commission: number;
            gmv: number;
          }>) => {
            const createdCollaborations: string[] = [];
            const createdSamples: string[] = [];

            try {
              // 创建多个合作结果
              for (let i = 0; i < resultDataList.length; i++) {
                const data = resultDataList[i];

                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: testUserId,
                    stage: 'PUBLISHED',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);

                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `REPORT-ROI-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `报表ROI测试样品_${i}_${Date.now()}`,
                  unitCost: data.sampleCost,
                  retailPrice: data.sampleCost * 2,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: collaboration.id,
                  businessStaffId: testUserId,
                  quantity: 1,
                  shippingCost: 0,
                });

                await resultService.createResult({
                  collaborationId: collaboration.id,
                  contentType: 'SHORT_VIDEO',
                  publishedAt: new Date(),
                  salesQuantity: 50,
                  salesGmv: data.gmv,
                  pitFee: data.pitFee,
                  actualCommission: data.commission,
                  willRepeat: true,
                }, testFactoryId);
              }

              // 获取ROI报表
              const report = await resultService.getRoiReport(testFactoryId, {
                groupBy: 'staff',
              });

              // 计算预期汇总值
              const expectedTotalGmv = resultDataList.reduce((sum, d) => sum + d.gmv, 0);
              const expectedTotalCost = resultDataList.reduce(
                (sum, d) => sum + d.sampleCost + d.pitFee + d.commission, 
                0
              );
              const expectedOverallRoi = expectedTotalCost > 0 
                ? Math.round((expectedTotalGmv / expectedTotalCost) * 10000) / 10000 
                : 0;

              // 验证汇总数据
              expect(report.summary.totalCollaborations).toBe(resultDataList.length);
              expect(report.summary.totalGmv).toBe(expectedTotalGmv);
              expect(report.summary.totalCost).toBe(expectedTotalCost);
              expect(report.summary.overallRoi).toBeCloseTo(expectedOverallRoi, 3);
            } finally {
              // 清理
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
     * 属性测试：回本率应等于回本数量除以总数量
     */
    it('回本率应等于回本数量除以总数量', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              sampleCost: fc.integer({ min: 1000, max: 5000 }),
              gmvMultiplier: fc.double({ min: 0.5, max: 5 }),
            }),
            { minLength: 3, maxLength: 6 }
          ),
          async (dataList: Array<{ sampleCost: number; gmvMultiplier: number }>) => {
            const createdCollaborations: string[] = [];
            const createdSamples: string[] = [];

            try {
              for (let i = 0; i < dataList.length; i++) {
                const data = dataList[i];
                const gmv = Math.floor(data.sampleCost * data.gmvMultiplier);

                const collaboration = await prisma.collaboration.create({
                  data: {
                    influencerId: testInfluencerId,
                    brandId: testFactoryId,
                    businessStaffId: testUserId,
                    stage: 'PUBLISHED',
                    isOverdue: false,
                  },
                });
                createdCollaborations.push(collaboration.id);

                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `PROFIT-RATE-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `回本率测试样品_${i}_${Date.now()}`,
                  unitCost: data.sampleCost,
                  retailPrice: data.sampleCost * 2,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: collaboration.id,
                  businessStaffId: testUserId,
                  quantity: 1,
                  shippingCost: 0,
                });

                await resultService.createResult({
                  collaborationId: collaboration.id,
                  contentType: 'SHORT_VIDEO',
                  publishedAt: new Date(),
                  salesQuantity: 30,
                  salesGmv: gmv,
                  pitFee: 0,
                  actualCommission: 0,
                  willRepeat: true,
                }, testFactoryId);
              }

              // 获取报表
              const report = await resultService.getRoiReport(testFactoryId, {
                groupBy: 'staff',
              });

              // 计算预期回本数量（ROI >= 1）
              const expectedProfitCount = dataList.filter(d => d.gmvMultiplier >= 1).length;
              const expectedProfitRate = dataList.length > 0 
                ? Math.round((expectedProfitCount / dataList.length) * 10000) / 100 
                : 0;

              // 验证
              expect(report.summary.profitRate).toBeCloseTo(expectedProfitRate, 1);
            } finally {
              // 清理
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
});
