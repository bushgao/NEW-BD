import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as notificationService from './notification.service';
import * as sampleService from './sample.service';

// 测试工厂和用户数据
let testFactoryId: string;
let testOwnerId: string;
let testStaffId: string;
let testInfluencerId: string;

describe('通知服务测试', () => {
  beforeAll(async () => {
    // 创建测试工厂老板
    const testOwner = await prisma.user.create({
      data: {
        email: `notify-owner-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试老板',
        role: 'FACTORY_OWNER',
      },
    });
    testOwnerId = testOwner.id;

    const testFactory = await prisma.factory.create({
      data: {
        name: 'Test Notification Factory',
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
      data: { factoryId: testFactory.id },
    });

    // 创建测试商务人员
    const testStaff = await prisma.user.create({
      data: {
        email: `notify-staff-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试商务',
        role: 'BUSINESS_STAFF',
        factoryId: testFactoryId,
      },
    });
    testStaffId = testStaff.id;

    // 创建测试达人
    const testInfluencer = await prisma.influencer.create({
      data: {
        factoryId: testFactoryId,
        nickname: '通知测试达人',
        platform: 'DOUYIN',
        platformId: `notify-test-${Date.now()}`,
        categories: ['美妆'],
        tags: [],
      },
    });
    testInfluencerId = testInfluencer.id;
  });

  afterAll(async () => {
    // 清理测试数据 - 注意顺序，先清理有外键依赖的表
    await prisma.notification.deleteMany({ where: { userId: { in: [testOwnerId, testStaffId] } } });
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { factoryId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { factoryId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { factoryId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { factoryId: testFactoryId } });
    await prisma.sample.deleteMany({ where: { factoryId: testFactoryId } });
    await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
    // 先断开用户与工厂的关联
    await prisma.user.updateMany({ where: { factoryId: testFactoryId }, data: { factoryId: null } });
    await prisma.user.update({ where: { id: testOwnerId }, data: { factoryId: null } });
    await prisma.factory.delete({ where: { id: testFactoryId } });
    await prisma.user.delete({ where: { id: testStaffId } });
    await prisma.user.delete({ where: { id: testOwnerId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理数据
    await prisma.notification.deleteMany({ where: { userId: { in: [testOwnerId, testStaffId] } } });
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { factoryId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { factoryId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { factoryId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { factoryId: testFactoryId } });
    await prisma.sample.deleteMany({ where: { factoryId: testFactoryId } });
  });

  // ==================== Property 14: 通知触发条件属性测试 ====================
  /**
   * Property 14: 通知触发条件正确性
   * 
   * 生成随机时间和合作状态场景
   * 验证通知触发逻辑正确
   * 
   * **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
   */
  describe('Property 14: 通知触发条件正确性属性测试', () => {
    const fc = require('fast-check');

    /**
     * 属性测试：截止时间在未来24小时内应触发即将到期提醒
     */
    it('截止时间在未来24小时内应触发即将到期提醒', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 23 }), // 1-23小时后
          async (hoursLater: number) => {
            const now = new Date();
            const deadline = new Date(now.getTime() + hoursLater * 60 * 60 * 1000);

            // 创建即将到期的合作
            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                factoryId: testFactoryId,
                businessStaffId: testStaffId,
                stage: 'SAMPLED',
                deadline,
                isOverdue: false,
              },
            });

            try {
              // 运行检查
              const count = await notificationService.checkDeadlineApproaching();

              // 验证触发了通知
              expect(count).toBeGreaterThanOrEqual(1);

              // 验证通知内容
              const notifications = await prisma.notification.findMany({
                where: {
                  userId: testStaffId,
                  type: notificationService.NotificationType.DEADLINE_APPROACHING,
                  relatedId: collaboration.id,
                },
              });

              expect(notifications.length).toBe(1);
              expect(notifications[0].title).toBe('合作即将到期');
            } finally {
              await prisma.notification.deleteMany({ where: { relatedId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：截止时间超过24小时不应触发即将到期提醒
     */
    it('截止时间超过24小时不应触发即将到期提醒', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 25, max: 168 }), // 25小时-7天后
          async (hoursLater: number) => {
            const now = new Date();
            const deadline = new Date(now.getTime() + hoursLater * 60 * 60 * 1000);

            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                factoryId: testFactoryId,
                businessStaffId: testStaffId,
                stage: 'SAMPLED',
                deadline,
                isOverdue: false,
              },
            });

            try {
              await notificationService.checkDeadlineApproaching();

              // 验证没有触发通知
              const notifications = await prisma.notification.findMany({
                where: {
                  userId: testStaffId,
                  type: notificationService.NotificationType.DEADLINE_APPROACHING,
                  relatedId: collaboration.id,
                },
              });

              expect(notifications.length).toBe(0);
            } finally {
              await prisma.notification.deleteMany({ where: { relatedId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：已超期的合作应触发超期提醒
     */
    it('已超期的合作应触发超期提醒', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 72 }), // 1-72小时前
          async (hoursAgo: number) => {
            const now = new Date();
            const deadline = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

            // 创建已超期但未标记的合作
            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                factoryId: testFactoryId,
                businessStaffId: testStaffId,
                stage: 'SAMPLED',
                deadline,
                isOverdue: false, // 未标记
              },
            });

            try {
              // 运行检查
              const count = await notificationService.checkOverdueCollaborations();

              // 验证触发了通知
              expect(count).toBeGreaterThanOrEqual(1);

              // 验证合作被标记为超期
              const updatedCollab = await prisma.collaboration.findUnique({
                where: { id: collaboration.id },
              });
              expect(updatedCollab?.isOverdue).toBe(true);

              // 验证通知内容
              const notifications = await prisma.notification.findMany({
                where: {
                  type: notificationService.NotificationType.DEADLINE_OVERDUE,
                  relatedId: collaboration.id,
                },
              });

              // 应该有商务和老板两条通知
              expect(notifications.length).toBeGreaterThanOrEqual(1);
            } finally {
              await prisma.notification.deleteMany({ where: { relatedId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：寄样超过7天未签收应触发签收提醒
     */
    it('寄样超过7天未签收应触发签收提醒', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 8, max: 30 }), // 8-30天前
          async (daysAgo: number) => {
            const now = new Date();
            const dispatchedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            // 创建合作
            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                factoryId: testFactoryId,
                businessStaffId: testStaffId,
                stage: 'SAMPLED',
                isOverdue: false,
              },
            });

            // 创建样品
            const sample = await sampleService.createSample({
              factoryId: testFactoryId,
              sku: `NOTIFY-SAMPLE-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `通知测试样品_${Date.now()}`,
              unitCost: 1000,
              retailPrice: 2000,
            });

            // 创建寄样记录（手动设置过去的时间）
            const dispatch = await prisma.sampleDispatch.create({
              data: {
                sampleId: sample.id,
                collaborationId: collaboration.id,
                businessStaffId: testStaffId,
                quantity: 1,
                unitCostSnapshot: 1000,
                totalSampleCost: 1000,
                shippingCost: 500,
                totalCost: 1500,
                receivedStatus: 'PENDING',
                onboardStatus: 'UNKNOWN',
                dispatchedAt,
              },
            });

            try {
              // 运行检查
              const count = await notificationService.checkPendingSampleReceipts();

              // 验证触发了通知
              expect(count).toBeGreaterThanOrEqual(1);

              // 验证通知内容
              const notifications = await prisma.notification.findMany({
                where: {
                  userId: testStaffId,
                  type: notificationService.NotificationType.SAMPLE_NOT_RECEIVED,
                  relatedId: dispatch.id,
                },
              });

              expect(notifications.length).toBe(1);
              expect(notifications[0].title).toBe('样品未签收提醒');
            } finally {
              await prisma.notification.deleteMany({ where: { relatedId: dispatch.id } });
              await prisma.sampleDispatch.delete({ where: { id: dispatch.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：寄样未超过7天不应触发签收提醒
     */
    it('寄样未超过7天不应触发签收提醒', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 6 }), // 1-6天前
          async (daysAgo: number) => {
            const now = new Date();
            const dispatchedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

            const collaboration = await prisma.collaboration.create({
              data: {
                influencerId: testInfluencerId,
                factoryId: testFactoryId,
                businessStaffId: testStaffId,
                stage: 'SAMPLED',
                isOverdue: false,
              },
            });

            const sample = await sampleService.createSample({
              factoryId: testFactoryId,
              sku: `NOTIFY-RECENT-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: `近期寄样测试_${Date.now()}`,
              unitCost: 1000,
              retailPrice: 2000,
            });

            const dispatch = await prisma.sampleDispatch.create({
              data: {
                sampleId: sample.id,
                collaborationId: collaboration.id,
                businessStaffId: testStaffId,
                quantity: 1,
                unitCostSnapshot: 1000,
                totalSampleCost: 1000,
                shippingCost: 500,
                totalCost: 1500,
                receivedStatus: 'PENDING',
                onboardStatus: 'UNKNOWN',
                dispatchedAt,
              },
            });

            try {
              await notificationService.checkPendingSampleReceipts();

              // 验证没有触发通知
              const notifications = await prisma.notification.findMany({
                where: {
                  userId: testStaffId,
                  type: notificationService.NotificationType.SAMPLE_NOT_RECEIVED,
                  relatedId: dispatch.id,
                },
              });

              expect(notifications.length).toBe(0);
            } finally {
              await prisma.notification.deleteMany({ where: { relatedId: dispatch.id } });
              await prisma.sampleDispatch.delete({ where: { id: dispatch.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
              await prisma.sample.delete({ where: { id: sample.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：已签收的样品不应触发签收提醒
     */
    it('已签收的样品不应触发签收提醒', async () => {
      const now = new Date();
      const dispatchedAt = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10天前

      const collaboration = await prisma.collaboration.create({
        data: {
          influencerId: testInfluencerId,
          factoryId: testFactoryId,
          businessStaffId: testStaffId,
          stage: 'SAMPLED',
          isOverdue: false,
        },
      });

      const sample = await sampleService.createSample({
        factoryId: testFactoryId,
        sku: `NOTIFY-RECEIVED-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: `已签收测试_${Date.now()}`,
        unitCost: 1000,
        retailPrice: 2000,
      });

      const dispatch = await prisma.sampleDispatch.create({
        data: {
          sampleId: sample.id,
          collaborationId: collaboration.id,
          businessStaffId: testStaffId,
          quantity: 1,
          unitCostSnapshot: 1000,
          totalSampleCost: 1000,
          shippingCost: 500,
          totalCost: 1500,
          receivedStatus: 'RECEIVED', // 已签收
          onboardStatus: 'UNKNOWN',
          dispatchedAt,
          receivedAt: new Date(),
        },
      });

      try {
        await notificationService.checkPendingSampleReceipts();

        // 验证没有触发通知
        const notifications = await prisma.notification.findMany({
          where: {
            userId: testStaffId,
            type: notificationService.NotificationType.SAMPLE_NOT_RECEIVED,
            relatedId: dispatch.id,
          },
        });

        expect(notifications.length).toBe(0);
      } finally {
        await prisma.notification.deleteMany({ where: { relatedId: dispatch.id } });
        await prisma.sampleDispatch.delete({ where: { id: dispatch.id } });
        await prisma.collaboration.delete({ where: { id: collaboration.id } });
        await prisma.sample.delete({ where: { id: sample.id } });
      }
    });
  });
});
