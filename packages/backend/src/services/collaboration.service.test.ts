import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as collaborationService from './collaboration.service';
import type { PipelineStage } from '@prisma/client';

// 测试工厂和用户数据
let testFactoryId: string;
let testUserId: string;
let testInfluencerId: string;

describe('合作流程服务测试', () => {
  beforeAll(async () => {
    // 创建测试用户和工厂
    const testUser = await prisma.user.create({
      data: {
        email: `collab-test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: '测试商务',
        role: 'BUSINESS_STAFF',
      },
    });
    testUserId = testUser.id;

    const testFactory = await prisma.brand.create({
      data: {
        name: 'Test Collab Factory',
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
        nickname: '测试达人',
        platform: 'DOUYIN',
        platformId: `collab-test-${Date.now()}`,
        categories: ['美妆'],
        tags: [],
      },
    });
    testInfluencerId = testInfluencer.id;
  });

  afterAll(async () => {
    // 清理测试数据 - 注意顺序，先清理有外键依赖的表
    await prisma.followUpRecord.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
    await prisma.influencer.deleteMany({ where: { brandId: testFactoryId } });
    // 先断开用户与工厂的关联
    await prisma.user.update({ where: { id: testUserId }, data: { brandId: null } });
    await prisma.brand.delete({ where: { id: testFactoryId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理合作数据
    await prisma.followUpRecord.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.stageHistory.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.sampleDispatch.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaborationResult.deleteMany({ where: { collaboration: { brandId: testFactoryId } } });
    await prisma.collaboration.deleteMany({ where: { brandId: testFactoryId } });
  });


  describe('看板拖拽功能 - 阶段状态更新', () => {
    it('应该能创建合作记录并设置初始阶段', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
        notes: '初始创建',
      });

      expect(collaboration).toBeDefined();
      expect(collaboration.id).toBeDefined();
      expect(collaboration.stage).toBe('LEAD');
      expect(collaboration.isOverdue).toBe(false);
    });

    it('应该能更新合作阶段（模拟拖拽）', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 模拟拖拽到"已联系"阶段
      const updated = await collaborationService.updateStage(
        collaboration.id,
        testFactoryId,
        'CONTACTED',
        '已与达人取得联系'
      );

      expect(updated?.stage).toBe('CONTACTED');
    });

    it('应该记录阶段变更历史', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 更新阶段
      await collaborationService.updateStage(
        collaboration.id,
        testFactoryId,
        'CONTACTED',
        '联系备注'
      );

      // 获取阶段历史
      const history = await collaborationService.getStageHistory(
        collaboration.id,
        testFactoryId
      );

      expect(history.length).toBeGreaterThanOrEqual(2);
      // 最新的历史记录应该是从 LEAD 到 CONTACTED
      const latestHistory = history[0];
      expect(latestHistory.fromStage).toBe('LEAD');
      expect(latestHistory.toStage).toBe('CONTACTED');
    });

    it('应该能连续更新多个阶段', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 模拟完整的阶段推进流程
      const stages: PipelineStage[] = ['CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED'];
      
      for (const stage of stages) {
        await collaborationService.updateStage(
          collaboration.id,
          testFactoryId,
          stage
        );
      }

      const final = await collaborationService.getCollaborationById(
        collaboration.id,
        testFactoryId
      );

      expect(final.stage).toBe('SCHEDULED');
    });

    it('阶段状态应为预定义的7个阶段之一', async () => {
      const validStages: PipelineStage[] = [
        'LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 
        'SCHEDULED', 'PUBLISHED', 'REVIEWED'
      ];

      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 验证所有有效阶段都可以设置
      for (const stage of validStages) {
        const updated = await collaborationService.updateStage(
          collaboration.id,
          testFactoryId,
          stage
        );
        expect(updated?.stage).toBe(stage);
      }
    });

    it('获取管道视图应返回所有阶段的数据', async () => {
      // 创建多个不同阶段的合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      const pipelineView = await collaborationService.getPipelineView(testFactoryId);

      expect(pipelineView.stages).toBeDefined();
      expect(pipelineView.stages.length).toBe(7); // 7个阶段
      expect(pipelineView.totalCount).toBeGreaterThanOrEqual(1);
    });
  });


  describe('超期判断功能', () => {
    it('设置截止时间后应正确计算超期状态', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 设置一个过去的截止时间
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000); // 昨天
      const updated = await collaborationService.setDeadline(
        collaboration.id,
        testFactoryId,
        pastDeadline
      );

      expect(updated.isOverdue).toBe(true);
    });

    it('未来的截止时间不应标记为超期', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 设置一个未来的截止时间
      const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7天后
      const updated = await collaborationService.setDeadline(
        collaboration.id,
        testFactoryId,
        futureDeadline
      );

      expect(updated.isOverdue).toBe(false);
    });

    it('清除截止时间后超期状态应重置', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 先设置过去的截止时间
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await collaborationService.setDeadline(
        collaboration.id,
        testFactoryId,
        pastDeadline
      );

      // 清除截止时间
      const cleared = await collaborationService.setDeadline(
        collaboration.id,
        testFactoryId,
        null
      );

      expect(cleared.isOverdue).toBe(false);
      expect(cleared.deadline).toBeNull();
    });

    it('批量检查超期状态应正确更新', async () => {
      // 创建一个带过去截止时间的合作（但isOverdue初始为false）
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 直接在数据库中设置过去的截止时间但不更新isOverdue
      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await prisma.collaboration.update({
        where: { id: collaboration.id },
        data: { deadline: pastDeadline, isOverdue: false },
      });

      // 运行批量检查
      const updatedCount = await collaborationService.checkAndUpdateOverdueStatus(testFactoryId);

      expect(updatedCount).toBeGreaterThanOrEqual(1);

      // 验证状态已更新
      const updated = await collaborationService.getCollaborationById(
        collaboration.id,
        testFactoryId
      );
      expect(updated.isOverdue).toBe(true);
    });

    it('获取超期合作列表应只返回超期记录', async () => {
      // 创建一个超期合作
      const overdueCollab = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });
      await collaborationService.setDeadline(
        overdueCollab.id,
        testFactoryId,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      // 创建一个正常合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'CONTACTED',
      });

      const overdueList = await collaborationService.getOverdueCollaborations(
        testFactoryId,
        { page: 1, pageSize: 20 }
      );

      expect(overdueList.data.length).toBe(1);
      expect(overdueList.data[0].isOverdue).toBe(true);
    });
  });


  describe('跟进记录功能', () => {
    it('应该能添加跟进记录', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      const followUp = await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '第一次跟进：已发送合作邀请'
      );

      expect(followUp).toBeDefined();
      expect(followUp.id).toBeDefined();
      expect(followUp.content).toBe('第一次跟进：已发送合作邀请');
      expect(followUp.collaborationId).toBe(collaboration.id);
      expect(followUp.userId).toBe(testUserId);
    });

    it('应该能获取跟进记录列表', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      // 添加多条跟进记录
      await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '跟进1'
      );
      await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '跟进2'
      );
      await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '跟进3'
      );

      const followUps = await collaborationService.getFollowUps(
        collaboration.id,
        testFactoryId,
        { page: 1, pageSize: 20 }
      );

      expect(followUps.data.length).toBe(3);
      expect(followUps.total).toBe(3);
    });

    it('跟进记录应按时间倒序排列', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '第一条'
      );
      
      // 稍微延迟以确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '第二条'
      );

      const followUps = await collaborationService.getFollowUps(
        collaboration.id,
        testFactoryId,
        { page: 1, pageSize: 20 }
      );

      // 最新的应该在前面
      expect(followUps.data[0].content).toBe('第二条');
      expect(followUps.data[1].content).toBe('第一条');
    });

    it('空内容的跟进记录应被拒绝', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      await expect(
        collaborationService.addFollowUp(
          collaboration.id,
          testFactoryId,
          testUserId,
          ''
        )
      ).rejects.toThrow('跟进内容不能为空');

      await expect(
        collaborationService.addFollowUp(
          collaboration.id,
          testFactoryId,
          testUserId,
          '   '
        )
      ).rejects.toThrow('跟进内容不能为空');
    });

    it('跟进记录应包含用户信息', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      const followUp = await collaborationService.addFollowUp(
        collaboration.id,
        testFactoryId,
        testUserId,
        '测试跟进'
      );

      expect(followUp.user).toBeDefined();
      expect(followUp.user?.id).toBe(testUserId);
      expect(followUp.user?.name).toBe('测试商务');
    });
  });

  describe('卡点原因功能', () => {
    it('应该能设置卡点原因', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'QUOTED',
      });

      const updated = await collaborationService.setBlockReason(
        collaboration.id,
        testFactoryId,
        'PRICE_HIGH',
        '达人报价超出预算'
      );

      expect(updated.blockReason).toBe('PRICE_HIGH');
    });

    it('应该能清除卡点原因', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'QUOTED',
      });

      await collaborationService.setBlockReason(
        collaboration.id,
        testFactoryId,
        'DELAYED'
      );

      const cleared = await collaborationService.setBlockReason(
        collaboration.id,
        testFactoryId,
        null
      );

      expect(cleared.blockReason).toBeNull();
    });
  });

  describe('管道统计功能', () => {
    it('应该能获取各阶段的统计数据', async () => {
      // 创建不同阶段的合作
      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'CONTACTED',
      });

      const stats = await collaborationService.getPipelineStats(testFactoryId);

      expect(stats.byStage).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.byStage.LEAD).toBeGreaterThanOrEqual(1);
      expect(stats.byStage.CONTACTED).toBeGreaterThanOrEqual(1);
    });

    it('统计应包含超期数量', async () => {
      const collaboration = await collaborationService.createCollaboration({
        influencerId: testInfluencerId,
        brandId: testFactoryId,
        businessStaffId: testUserId,
        stage: 'LEAD',
      });

      await collaborationService.setDeadline(
        collaboration.id,
        testFactoryId,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      const stats = await collaborationService.getPipelineStats(testFactoryId);

      expect(stats.overdueCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== Property 6: 合作阶段状态属性测试 ====================
  /**
   * Property 6: 合作阶段状态一致性
   * 
   * 生成随机状态转换序列
   * 验证状态值合法且变更时间记录正确
   * 
   * **Validates: Requirements 4.1, 4.2**
   */
  describe('Property 6: 合作阶段状态一致性属性测试', () => {
    const fc = require('fast-check');

    // 有效的阶段列表
    const VALID_STAGES: PipelineStage[] = [
      'LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 
      'SCHEDULED', 'PUBLISHED', 'REVIEWED'
    ];

    // 生成阶段的 Arbitrary
    const stageArbitrary = fc.constantFrom(...VALID_STAGES);

    /**
     * 属性测试：任意阶段状态都应为预定义的7个阶段之一
     */
    it('任意阶段状态都应为预定义的7个阶段之一', async () => {
      await fc.assert(
        fc.asyncProperty(stageArbitrary, async (stage: PipelineStage) => {
          const collaboration = await collaborationService.createCollaboration({
            influencerId: testInfluencerId,
            brandId: testFactoryId,
            businessStaffId: testUserId,
            stage,
          });

          try {
            expect(VALID_STAGES).toContain(collaboration.stage);
            expect(collaboration.stage).toBe(stage);
          } finally {
            await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
            await prisma.collaboration.delete({ where: { id: collaboration.id } });
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：阶段变更应记录变更时间
     */
    it('阶段变更应记录变更时间', async () => {
      await fc.assert(
        fc.asyncProperty(
          stageArbitrary,
          stageArbitrary,
          async (fromStage: PipelineStage, toStage: PipelineStage) => {
            // 确保阶段不同
            fc.pre(fromStage !== toStage);

            const collaboration = await collaborationService.createCollaboration({
              influencerId: testInfluencerId,
              brandId: testFactoryId,
              businessStaffId: testUserId,
              stage: fromStage,
            });

            try {
              const beforeUpdate = new Date();

              // 更新阶段
              await collaborationService.updateStage(
                collaboration.id,
                testFactoryId,
                toStage,
                '属性测试阶段变更'
              );

              const afterUpdate = new Date();

              // 获取阶段历史
              const history = await collaborationService.getStageHistory(
                collaboration.id,
                testFactoryId
              );

              // 验证最新的历史记录
              const latestHistory = history[0];
              expect(latestHistory.fromStage).toBe(fromStage);
              expect(latestHistory.toStage).toBe(toStage);
              
              // 验证变更时间在合理范围内
              const changedAt = new Date(latestHistory.changedAt);
              expect(changedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime() - 1000);
              expect(changedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime() + 1000);
            } finally {
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：连续多次阶段变更都应正确记录
     */
    it('连续多次阶段变更都应正确记录', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(stageArbitrary, { minLength: 2, maxLength: 5 }),
          async (stages: PipelineStage[]) => {
            // 确保相邻阶段不同
            const uniqueStages = stages.filter((stage, index) => 
              index === 0 || stage !== stages[index - 1]
            );
            fc.pre(uniqueStages.length >= 2);

            const collaboration = await collaborationService.createCollaboration({
              influencerId: testInfluencerId,
              brandId: testFactoryId,
              businessStaffId: testUserId,
              stage: uniqueStages[0],
            });

            try {
              // 依次更新阶段
              for (let i = 1; i < uniqueStages.length; i++) {
                await collaborationService.updateStage(
                  collaboration.id,
                  testFactoryId,
                  uniqueStages[i]
                );
              }

              // 获取阶段历史
              const history = await collaborationService.getStageHistory(
                collaboration.id,
                testFactoryId
              );

              // 验证历史记录数量（初始创建 + 后续变更）
              expect(history.length).toBe(uniqueStages.length);

              // 验证最终阶段
              const finalCollab = await collaborationService.getCollaborationById(
                collaboration.id,
                testFactoryId
              );
              expect(finalCollab.stage).toBe(uniqueStages[uniqueStages.length - 1]);
            } finally {
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Property 7: 超期判断属性测试 ====================
  /**
   * Property 7: 超期判断正确性
   * 
   * 生成随机截止时间和当前时间组合
   * 验证超期标记逻辑正确
   * 
   * **Validates: Requirements 4.4**
   */
  describe('Property 7: 超期判断正确性属性测试', () => {
    const fc = require('fast-check');

    // 生成过去时间偏移（1-30天前）
    const pastOffsetArbitrary = fc.integer({ min: 1, max: 30 });

    // 生成未来时间偏移（1-30天后）
    const futureOffsetArbitrary = fc.integer({ min: 1, max: 30 });

    /**
     * 属性测试：截止时间在过去时应标记为超期
     */
    it('截止时间在过去时应标记为超期', async () => {
      await fc.assert(
        fc.asyncProperty(pastOffsetArbitrary, async (daysAgo: number) => {
          const collaboration = await collaborationService.createCollaboration({
            influencerId: testInfluencerId,
            brandId: testFactoryId,
            businessStaffId: testUserId,
            stage: 'LEAD',
          });

          try {
            // 设置过去的截止时间
            const pastDeadline = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            const updated = await collaborationService.setDeadline(
              collaboration.id,
              testFactoryId,
              pastDeadline
            );

            expect(updated.isOverdue).toBe(true);
            expect(updated.deadline).toEqual(pastDeadline);
          } finally {
            await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
            await prisma.collaboration.delete({ where: { id: collaboration.id } });
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：截止时间在未来时不应标记为超期
     */
    it('截止时间在未来时不应标记为超期', async () => {
      await fc.assert(
        fc.asyncProperty(futureOffsetArbitrary, async (daysLater: number) => {
          const collaboration = await collaborationService.createCollaboration({
            influencerId: testInfluencerId,
            brandId: testFactoryId,
            businessStaffId: testUserId,
            stage: 'LEAD',
          });

          try {
            // 设置未来的截止时间
            const futureDeadline = new Date(Date.now() + daysLater * 24 * 60 * 60 * 1000);
            const updated = await collaborationService.setDeadline(
              collaboration.id,
              testFactoryId,
              futureDeadline
            );

            expect(updated.isOverdue).toBe(false);
            expect(updated.deadline).toEqual(futureDeadline);
          } finally {
            await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
            await prisma.collaboration.delete({ where: { id: collaboration.id } });
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：清除截止时间后超期状态应重置为false
     */
    it('清除截止时间后超期状态应重置为false', async () => {
      await fc.assert(
        fc.asyncProperty(pastOffsetArbitrary, async (daysAgo: number) => {
          const collaboration = await collaborationService.createCollaboration({
            influencerId: testInfluencerId,
            brandId: testFactoryId,
            businessStaffId: testUserId,
            stage: 'LEAD',
          });

          try {
            // 先设置过去的截止时间（使其超期）
            const pastDeadline = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
            await collaborationService.setDeadline(
              collaboration.id,
              testFactoryId,
              pastDeadline
            );

            // 清除截止时间
            const cleared = await collaborationService.setDeadline(
              collaboration.id,
              testFactoryId,
              null
            );

            expect(cleared.isOverdue).toBe(false);
            expect(cleared.deadline).toBeNull();
          } finally {
            await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
            await prisma.collaboration.delete({ where: { id: collaboration.id } });
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：无截止时间的合作不应标记为超期
     */
    it('无截止时间的合作不应标记为超期', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('LEAD', 'CONTACTED', 'QUOTED', 'SAMPLED', 'SCHEDULED'),
          async (stage: PipelineStage) => {
            const collaboration = await collaborationService.createCollaboration({
              influencerId: testInfluencerId,
              brandId: testFactoryId,
              businessStaffId: testUserId,
              stage,
            });

            try {
              // 不设置截止时间
              expect(collaboration.isOverdue).toBe(false);
              expect(collaboration.deadline).toBeNull();
            } finally {
              await prisma.stageHistory.deleteMany({ where: { collaborationId: collaboration.id } });
              await prisma.collaboration.delete({ where: { id: collaboration.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
