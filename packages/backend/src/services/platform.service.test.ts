import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as platformService from './platform.service';

// 测试工厂和用户数据
let testFactoryId: string;
let testOwnerId: string;

describe('平台服务测试', () => {
  beforeAll(async () => {
    // 创建测试工厂老板
    const testOwner = await prisma.user.create({
      data: {
        email: `platform-owner-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试老板',
        role: 'FACTORY_OWNER',
      },
    });
    testOwnerId = testOwner.id;

    const testFactory = await prisma.factory.create({
      data: {
        name: 'Test Platform Factory',
        ownerId: testOwner.id,
        status: 'APPROVED',
        planType: 'FREE',
        staffLimit: 3,
        influencerLimit: 5, // 设置较小的限制用于测试
      },
    });
    testFactoryId = testFactory.id;

    // 更新老板关联工厂ID
    await prisma.user.update({
      where: { id: testOwner.id },
      data: { factoryId: testFactory.id },
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
    await prisma.user.deleteMany({ where: { factoryId: testFactoryId, id: { not: testOwnerId } } });
    await prisma.factory.delete({ where: { id: testFactoryId } });
    await prisma.user.delete({ where: { id: testOwnerId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理达人和商务数据
    await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
    await prisma.user.deleteMany({ where: { factoryId: testFactoryId, id: { not: testOwnerId } } });
  });

  // ==================== Property 13: 套餐配额限制属性测试 ====================
  /**
   * Property 13: 套餐配额限制
   * 
   * 生成随机工厂和配额场景
   * 验证配额限制逻辑正确
   * 
   * **Validates: Requirements 8.2, 8.3**
   */
  describe('Property 13: 套餐配额限制属性测试', () => {
    const fc = require('fast-check');

    /**
     * 属性测试：达人数量未达上限时应允许新增
     */
    it('达人数量未达上限时应允许新增', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 4 }), // 小于限制5
          async (influencerCount: number) => {
            // 创建指定数量的达人
            for (let i = 0; i < influencerCount; i++) {
              await prisma.influencer.create({
                data: {
                  factoryId: testFactoryId,
                  nickname: `配额测试达人_${i}_${Date.now()}`,
                  platform: 'DOUYIN',
                  platformId: `quota-inf-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  categories: ['美妆'],
                  tags: [],
                },
              });
            }

            try {
              // 检查配额
              const quota = await platformService.checkFactoryQuota(testFactoryId, 'influencer');

              expect(quota.current).toBe(influencerCount);
              expect(quota.limit).toBe(5);
              expect(quota.allowed).toBe(true);

              // 验证可以继续新增
              await expect(
                platformService.validateQuota(testFactoryId, 'influencer')
              ).resolves.not.toThrow();
            } finally {
              // 清理
              await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：达人数量达到上限时应拒绝新增
     */
    it('达人数量达到上限时应拒绝新增', async () => {
      // 创建达到上限的达人
      for (let i = 0; i < 5; i++) {
        await prisma.influencer.create({
          data: {
            factoryId: testFactoryId,
            nickname: `上限测试达人_${i}_${Date.now()}`,
            platform: 'DOUYIN',
            platformId: `limit-inf-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
            categories: ['美妆'],
            tags: [],
          },
        });
      }

      try {
        // 检查配额
        const quota = await platformService.checkFactoryQuota(testFactoryId, 'influencer');

        expect(quota.current).toBe(5);
        expect(quota.limit).toBe(5);
        expect(quota.allowed).toBe(false);

        // 验证新增被拒绝
        await expect(
          platformService.validateQuota(testFactoryId, 'influencer')
        ).rejects.toThrow('已达到达人数量上限');
      } finally {
        // 清理
        await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
      }
    });

    /**
     * 属性测试：商务账号数量未达上限时应允许新增
     */
    it('商务账号数量未达上限时应允许新增', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 1 }), // 小于限制3，考虑老板也算一个
          async (staffCount: number) => {
            // 创建指定数量的商务账号
            const createdStaffIds: string[] = [];
            for (let i = 0; i < staffCount; i++) {
              const staff = await prisma.user.create({
                data: {
                  email: `quota-staff-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}@example.com`,
                  passwordHash: 'test-hash',
                  name: `配额测试商务_${i}`,
                  role: 'BUSINESS_STAFF',
                  factoryId: testFactoryId,
                },
              });
              createdStaffIds.push(staff.id);
            }

            try {
              // 检查配额 - 注意老板也被计入staff
              const quota = await platformService.checkFactoryQuota(testFactoryId, 'staff');

              // 当前数量 = 创建的商务 + 老板(1)
              expect(quota.current).toBe(staffCount + 1);
              expect(quota.limit).toBe(3);
              expect(quota.allowed).toBe(true);

              // 验证可以继续新增
              await expect(
                platformService.validateQuota(testFactoryId, 'staff')
              ).resolves.not.toThrow();
            } finally {
              // 清理
              for (const staffId of createdStaffIds) {
                await prisma.user.delete({ where: { id: staffId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：商务账号数量达到上限时应拒绝新增
     */
    it('商务账号数量达到上限时应拒绝新增', async () => {
      // 创建达到上限的商务账号（老板算1个，再创建2个）
      const createdStaffIds: string[] = [];
      for (let i = 0; i < 2; i++) {
        const staff = await prisma.user.create({
          data: {
            email: `limit-staff-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}@example.com`,
            passwordHash: 'test-hash',
            name: `上限测试商务_${i}`,
            role: 'BUSINESS_STAFF',
            factoryId: testFactoryId,
          },
        });
        createdStaffIds.push(staff.id);
      }

      try {
        // 检查配额
        const quota = await platformService.checkFactoryQuota(testFactoryId, 'staff');

        expect(quota.current).toBe(3); // 老板(1) + 商务(2)
        expect(quota.limit).toBe(3);
        expect(quota.allowed).toBe(false);

        // 验证新增被拒绝
        await expect(
          platformService.validateQuota(testFactoryId, 'staff')
        ).rejects.toThrow('已达到商务账号数量上限');
      } finally {
        // 清理
        for (const staffId of createdStaffIds) {
          await prisma.user.delete({ where: { id: staffId } });
        }
      }
    });

    /**
     * 属性测试：配额检查应返回正确的当前数量和限制
     */
    it('配额检查应返回正确的当前数量和限制', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 5 }),
          fc.integer({ min: 0, max: 1 }), // 考虑老板占1个位置
          async (influencerCount: number, staffCount: number) => {
            // 创建达人
            for (let i = 0; i < influencerCount; i++) {
              await prisma.influencer.create({
                data: {
                  factoryId: testFactoryId,
                  nickname: `检查测试达人_${i}_${Date.now()}`,
                  platform: 'DOUYIN',
                  platformId: `check-inf-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  categories: ['美妆'],
                  tags: [],
                },
              });
            }

            // 创建商务
            const createdStaffIds: string[] = [];
            for (let i = 0; i < staffCount; i++) {
              const staff = await prisma.user.create({
                data: {
                  email: `check-staff-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}@example.com`,
                  passwordHash: 'test-hash',
                  name: `检查测试商务_${i}`,
                  role: 'BUSINESS_STAFF',
                  factoryId: testFactoryId,
                },
              });
              createdStaffIds.push(staff.id);
            }

            try {
              // 检查达人配额
              const influencerQuota = await platformService.checkFactoryQuota(testFactoryId, 'influencer');
              expect(influencerQuota.current).toBe(influencerCount);
              expect(influencerQuota.limit).toBe(5);
              expect(influencerQuota.allowed).toBe(influencerCount < 5);

              // 检查商务配额 - 老板也算1个
              const staffQuota = await platformService.checkFactoryQuota(testFactoryId, 'staff');
              expect(staffQuota.current).toBe(staffCount + 1); // +1 for owner
              expect(staffQuota.limit).toBe(3);
              expect(staffQuota.allowed).toBe(staffCount + 1 < 3);
            } finally {
              // 清理
              await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
              for (const staffId of createdStaffIds) {
                await prisma.user.delete({ where: { id: staffId } });
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：升级套餐后配额限制应更新
     */
    it('升级套餐后配额限制应更新', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 6, max: 10 }), // 必须大于5才能允许新增
          fc.integer({ min: 4, max: 10 }), // 必须大于3才能允许新增
          async (newInfluencerLimit: number, newStaffLimit: number) => {
            // 先创建达到原限制的达人
            for (let i = 0; i < 5; i++) {
              await prisma.influencer.create({
                data: {
                  factoryId: testFactoryId,
                  nickname: `升级测试达人_${i}_${Date.now()}`,
                  platform: 'DOUYIN',
                  platformId: `upgrade-inf-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                  categories: ['美妆'],
                  tags: [],
                },
              });
            }

            try {
              // 验证原限制下不允许新增
              const beforeQuota = await platformService.checkFactoryQuota(testFactoryId, 'influencer');
              expect(beforeQuota.allowed).toBe(false);

              // 升级套餐（增加限制）
              await platformService.updateFactory(testFactoryId, {
                influencerLimit: newInfluencerLimit,
                staffLimit: newStaffLimit,
              });

              // 验证新限制下允许新增
              const afterQuota = await platformService.checkFactoryQuota(testFactoryId, 'influencer');
              expect(afterQuota.limit).toBe(newInfluencerLimit);
              expect(afterQuota.allowed).toBe(true);
            } finally {
              // 恢复原限制
              await platformService.updateFactory(testFactoryId, {
                influencerLimit: 5,
                staffLimit: 3,
              });
              // 清理
              await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
