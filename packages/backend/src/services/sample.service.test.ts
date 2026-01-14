import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as sampleService from './sample.service';

// 测试工厂和用户数据
let testFactoryId: string;
let testUserId: string;
let testInfluencerId: string;
let testCollaborationId: string;

describe('样品服务测试', () => {
  beforeAll(async () => {
    // 创建测试用户和工厂
    const testUser = await prisma.user.create({
      data: {
        email: `sample-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试商务',
        role: 'BUSINESS_STAFF',
      },
    });
    testUserId = testUser.id;

    const testFactory = await prisma.brand.create({
      data: {
        name: 'Test Sample Factory',
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
        nickname: '样品测试达人',
        platform: 'DOUYIN',
        platformId: `sample-test-${Date.now()}`,
        categories: ['美妆'],
        tags: [],
      },
    });
    testInfluencerId = testInfluencer.id;

    // 创建测试合作记录
    const testCollaboration = await prisma.collaboration.create({
      data: {
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
        isOverdue: false,
      },
    });
    testCollaborationId = testCollaboration.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.sampleDispatch.deleteMany({ where: { sample: { brandId: testFactoryId } } });
    await prisma.sample.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.influencer.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.brand.delete({ where: { id: testFactoryId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理样品和寄样数据
    await prisma.sampleDispatch.deleteMany({ where: { sample: { brandId: testFactoryId } } });
    await prisma.sample.deleteMany({ where: { brandId: testFactoryId } });
  });

  describe('样品 CRUD 操作', () => {
    it('应该能创建样品', async () => {
      const sample = await sampleService.createSample({
        brandId: testFactoryId,
        sku: 'TEST-SKU-001',
        name: '测试样品',
        unitCost: 1000, // 10元
        retailPrice: 2000, // 20元
        canResend: true,
        notes: '测试备注',
      });

      expect(sample).toBeDefined();
      expect(sample.id).toBeDefined();
      expect(sample.sku).toBe('TEST-SKU-001');
      expect(sample.name).toBe('测试样品');
      expect(sample.unitCost).toBe(1000);
      expect(sample.retailPrice).toBe(2000);
    });

    it('应该能获取样品列表', async () => {
      await sampleService.createSample({
        brandId: testFactoryId,
        sku: 'LIST-SKU-001',
        name: '列表测试样品1',
        unitCost: 500,
        retailPrice: 1000,
      });

      await sampleService.createSample({
        brandId: testFactoryId,
        sku: 'LIST-SKU-002',
        name: '列表测试样品2',
        unitCost: 800,
        retailPrice: 1500,
      });

      const result = await sampleService.listSamples(
        testFactoryId,
        {},
        { page: 1, pageSize: 20 }
      );

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
    });
  });

  // ==================== Property 4: 寄样成本计算属性测试 ====================
  /**
   * Property 4: 寄样成本计算正确性
   * 
   * 生成随机数量、单价、快递费
   * 验证总成本计算正确且无精度误差
   * 
   * **Validates: Requirements 3.4, 3.5**
   */
  describe('Property 4: 寄样成本计算正确性属性测试', () => {
    const fc = require('fast-check');

    // 生成单件成本（1-10000分，即0.01-100元）
    const unitCostArbitrary = fc.integer({ min: 1, max: 10000 });

    // 生成数量（1-100件）
    const quantityArbitrary = fc.integer({ min: 1, max: 100 });

    // 生成快递费（0-5000分，即0-50元）
    const shippingCostArbitrary = fc.integer({ min: 0, max: 5000 });

    /**
     * 属性测试：寄样总成本 = 数量 × 单件成本 + 快递费
     */
    it('寄样总成本应等于（数量 × 单件成本 + 快递费）', async () => {
      await fc.assert(
        fc.asyncProperty(
          unitCostArbitrary,
          quantityArbitrary,
          shippingCostArbitrary,
          async (unitCost: number, quantity: number, shippingCost: number) => {
            // 创建样品
            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `PBT-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `属性测试样品_${Date.now()}`,
              unitCost,
              retailPrice: unitCost * 2,
            });

            try {
              // 创建寄样记录
              const dispatch = await sampleService.createDispatch({
                sampleId: sample.id,
                collaborationId: testCollaborationId,
                businessStaffId: testUserId,
                quantity,
                shippingCost,
              });

              // 验证成本计算
              const expectedTotalSampleCost = quantity * unitCost;
              const expectedTotalCost = expectedTotalSampleCost + shippingCost;

              expect(dispatch.unitCostSnapshot).toBe(unitCost);
              expect(dispatch.totalSampleCost).toBe(expectedTotalSampleCost);
              expect(dispatch.shippingCost).toBe(shippingCost);
              expect(dispatch.totalCost).toBe(expectedTotalCost);

              // 验证整数运算无精度误差
              expect(Number.isInteger(dispatch.totalSampleCost)).toBe(true);
              expect(Number.isInteger(dispatch.totalCost)).toBe(true);
            } finally {
              // 清理
              await prisma.sampleDispatch.deleteMany({ where: { sampleId: sample.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：成本快照应保持不变，即使样品单价更新
     */
    it('成本快照应保持不变，即使样品单价更新', async () => {
      await fc.assert(
        fc.asyncProperty(
          unitCostArbitrary,
          unitCostArbitrary,
          quantityArbitrary,
          async (originalCost: number, newCost: number, quantity: number) => {
            // 确保新旧成本不同
            fc.pre(originalCost !== newCost);

            // 创建样品
            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `SNAP-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `快照测试样品_${Date.now()}`,
              unitCost: originalCost,
              retailPrice: originalCost * 2,
            });

            try {
              // 创建寄样记录
              const dispatch = await sampleService.createDispatch({
                sampleId: sample.id,
                collaborationId: testCollaborationId,
                businessStaffId: testUserId,
                quantity,
                shippingCost: 500,
              });

              // 更新样品单价
              await sampleService.updateSample(sample.id, testFactoryId, {
                unitCost: newCost,
              });

              // 重新获取寄样记录
              const fetchedDispatch = await sampleService.getDispatchById(dispatch.id, testFactoryId);

              // 验证快照保持原始成本
              expect(fetchedDispatch.unitCostSnapshot).toBe(originalCost);
              expect(fetchedDispatch.totalSampleCost).toBe(quantity * originalCost);
            } finally {
              // 清理
              await prisma.sampleDispatch.deleteMany({ where: { sampleId: sample.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：多次寄样的成本应该独立计算
     */
    it('多次寄样的成本应该独立计算', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              quantity: quantityArbitrary,
              shippingCost: shippingCostArbitrary,
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (dispatchInputs: Array<{ quantity: number; shippingCost: number }>) => {
            // 创建样品
            const unitCost = 1000;
            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `MULTI-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `多次寄样测试_${Date.now()}`,
              unitCost,
              retailPrice: unitCost * 2,
            });

            try {
              const dispatches = [];
              for (const input of dispatchInputs) {
                const dispatch = await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: testCollaborationId,
                  businessStaffId: testUserId,
                  quantity: input.quantity,
                  shippingCost: input.shippingCost,
                });
                dispatches.push(dispatch);
              }

              // 验证每次寄样的成本独立计算
              for (let i = 0; i < dispatches.length; i++) {
                const dispatch = dispatches[i];
                const input = dispatchInputs[i];
                const expectedTotalSampleCost = input.quantity * unitCost;
                const expectedTotalCost = expectedTotalSampleCost + input.shippingCost;

                expect(dispatch.totalSampleCost).toBe(expectedTotalSampleCost);
                expect(dispatch.totalCost).toBe(expectedTotalCost);
              }
            } finally {
              // 清理
              await prisma.sampleDispatch.deleteMany({ where: { sampleId: sample.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });


  // ==================== Property 5: 样品报表聚合属性测试 ====================
  /**
   * Property 5: 样品成本报表聚合正确性
   * 
   * 生成随机寄样记录集合
   * 验证聚合统计正确
   * 
   * **Validates: Requirements 3.7**
   */
  describe('Property 5: 样品成本报表聚合正确性属性测试', () => {
    const fc = require('fast-check');

    // 生成寄样数据的 Arbitrary
    const dispatchDataArbitrary = fc.record({
      quantity: fc.integer({ min: 1, max: 50 }),
      shippingCost: fc.integer({ min: 0, max: 3000 }),
      receivedStatus: fc.constantFrom('PENDING', 'RECEIVED', 'LOST'),
      onboardStatus: fc.constantFrom('UNKNOWN', 'ONBOARD', 'NOT_ONBOARD'),
    });

    /**
     * 属性测试：报表中的累计寄样数量应等于所有寄样记录数量之和
     */
    it('报表中的累计数量应等于所有寄样记录之和', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(dispatchDataArbitrary, { minLength: 1, maxLength: 5 }),
          async (dispatchDataList: Array<{
            quantity: number;
            shippingCost: number;
            receivedStatus: string;
            onboardStatus: string;
          }>) => {
            // 创建样品
            const unitCost = 1000;
            const sample = await sampleService.createSample({
              brandId: testFactoryId,
              sku: `REPORT-SKU-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `报表测试样品_${Date.now()}`,
              unitCost,
              retailPrice: unitCost * 2,
            });

            try {
              // 创建寄样记录
              const dispatches = [];
              for (const data of dispatchDataList) {
                const dispatch = await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: testCollaborationId,
                  businessStaffId: testUserId,
                  quantity: data.quantity,
                  shippingCost: data.shippingCost,
                });

                // 更新状态
                await sampleService.updateDispatchStatus(dispatch.id, testFactoryId, {
                  receivedStatus: data.receivedStatus as any,
                  onboardStatus: data.onboardStatus as any,
                });

                dispatches.push({ ...dispatch, ...data });
              }

              // 获取报表
              const report = await sampleService.getSampleCostReport(testFactoryId);

              // 计算预期值
              const expectedTotalDispatchCount = dispatchDataList.length;
              const expectedTotalQuantity = dispatchDataList.reduce((sum, d) => sum + d.quantity, 0);
              const expectedTotalSampleCost = dispatchDataList.reduce((sum, d) => sum + d.quantity * unitCost, 0);
              const expectedTotalShippingCost = dispatchDataList.reduce((sum, d) => sum + d.shippingCost, 0);
              const expectedTotalCost = expectedTotalSampleCost + expectedTotalShippingCost;
              const expectedReceivedCount = dispatchDataList.filter(d => d.receivedStatus === 'RECEIVED').length;
              const expectedOnboardCount = dispatchDataList.filter(d => d.onboardStatus === 'ONBOARD').length;

              // 验证汇总数据
              expect(report.summary.totalDispatchCount).toBe(expectedTotalDispatchCount);
              expect(report.summary.totalQuantity).toBe(expectedTotalQuantity);
              expect(report.summary.totalSampleCost).toBe(expectedTotalSampleCost);
              expect(report.summary.totalShippingCost).toBe(expectedTotalShippingCost);
              expect(report.summary.totalCost).toBe(expectedTotalCost);

              // 验证签收率和上车率
              const expectedReceivedRate = expectedTotalDispatchCount > 0 
                ? expectedReceivedCount / expectedTotalDispatchCount 
                : 0;
              const expectedOnboardRate = expectedTotalDispatchCount > 0 
                ? expectedOnboardCount / expectedTotalDispatchCount 
                : 0;

              expect(report.summary.overallReceivedRate).toBeCloseTo(expectedReceivedRate, 4);
              expect(report.summary.overallOnboardRate).toBeCloseTo(expectedOnboardRate, 4);
            } finally {
              // 清理
              await prisma.sampleDispatch.deleteMany({ where: { sampleId: sample.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：多个样品的报表聚合应正确
     */
    it('多个样品的报表聚合应正确', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              unitCost: fc.integer({ min: 100, max: 5000 }),
              quantity: fc.integer({ min: 1, max: 20 }),
              shippingCost: fc.integer({ min: 0, max: 2000 }),
            }),
            { minLength: 2, maxLength: 4 }
          ),
          async (sampleDataList: Array<{
            unitCost: number;
            quantity: number;
            shippingCost: number;
          }>) => {
            const createdSamples: string[] = [];

            try {
              // 创建多个样品和寄样记录
              for (let i = 0; i < sampleDataList.length; i++) {
                const data = sampleDataList[i];
                const sample = await sampleService.createSample({
                  brandId: testFactoryId,
                  sku: `MULTI-REPORT-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  name: `多样品报表测试_${i}_${Date.now()}`,
                  unitCost: data.unitCost,
                  retailPrice: data.unitCost * 2,
                });
                createdSamples.push(sample.id);

                await sampleService.createDispatch({
                  sampleId: sample.id,
                  collaborationId: testCollaborationId,
                  businessStaffId: testUserId,
                  quantity: data.quantity,
                  shippingCost: data.shippingCost,
                });
              }

              // 获取报表
              const report = await sampleService.getSampleCostReport(testFactoryId);

              // 计算预期汇总值
              const expectedTotalDispatchCount = sampleDataList.length;
              const expectedTotalQuantity = sampleDataList.reduce((sum, d) => sum + d.quantity, 0);
              const expectedTotalSampleCost = sampleDataList.reduce((sum, d) => sum + d.quantity * d.unitCost, 0);
              const expectedTotalShippingCost = sampleDataList.reduce((sum, d) => sum + d.shippingCost, 0);
              const expectedTotalCost = expectedTotalSampleCost + expectedTotalShippingCost;

              // 验证汇总数据
              expect(report.summary.totalDispatchCount).toBe(expectedTotalDispatchCount);
              expect(report.summary.totalQuantity).toBe(expectedTotalQuantity);
              expect(report.summary.totalSampleCost).toBe(expectedTotalSampleCost);
              expect(report.summary.totalShippingCost).toBe(expectedTotalShippingCost);
              expect(report.summary.totalCost).toBe(expectedTotalCost);

              // 验证每个样品的明细
              expect(report.items.length).toBe(sampleDataList.length);
            } finally {
              // 清理
              for (const sampleId of createdSamples) {
                await prisma.sampleDispatch.deleteMany({ where: { sampleId } });
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
