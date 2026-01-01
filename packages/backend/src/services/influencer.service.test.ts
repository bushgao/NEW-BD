import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import * as influencerService from './influencer.service';
import type { Platform } from '@ics/shared';

// 测试工厂和用户数据
let testFactoryId: string;
let testUserId: string;

describe('达人服务测试', () => {
  beforeAll(async () => {
    // 创建测试用户和工厂
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        name: 'Test User',
        role: 'FACTORY_OWNER',
      },
    });
    testUserId = testUser.id;

    const testFactory = await prisma.factory.create({
      data: {
        name: 'Test Factory',
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
      data: { factoryId: testFactory.id },
    });
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
    await prisma.factory.delete({ where: { id: testFactoryId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // 每个测试前清理达人数据
    await prisma.influencer.deleteMany({ where: { factoryId: testFactoryId } });
  });

  describe('CRUD 操作', () => {
    it('应该能创建新达人', async () => {
      const input = {
        factoryId: testFactoryId,
        nickname: '测试达人',
        platform: 'DOUYIN' as Platform,
        platformId: 'test123',
        phone: '13800138000',
        categories: ['美妆', '护肤'],
        tags: ['高配合度'],
        notes: '测试备注',
      };

      const influencer = await influencerService.create(input);

      expect(influencer).toBeDefined();
      expect(influencer.id).toBeDefined();
      expect(influencer.nickname).toBe('测试达人');
      expect(influencer.platform).toBe('DOUYIN');
      expect(influencer.platformId).toBe('test123');
      expect(influencer.phone).toBe('13800138000');
      expect(influencer.categories).toEqual(['美妆', '护肤']);
      expect(influencer.tags).toEqual(['高配合度']);
      expect(influencer.notes).toBe('测试备注');
    });

    it('应该能根据ID获取达人', async () => {
      const created = await influencerService.create({
        factoryId: testFactoryId,
        nickname: '获取测试',
        platform: 'KUAISHOU' as Platform,
        platformId: 'get123',
      });

      const fetched = await influencerService.getById(created.id, testFactoryId);

      expect(fetched).toBeDefined();
      expect(fetched.id).toBe(created.id);
      expect(fetched.nickname).toBe('获取测试');
    });

    it('应该能更新达人信息', async () => {
      const created = await influencerService.create({
        factoryId: testFactoryId,
        nickname: '更新前',
        platform: 'XIAOHONGSHU' as Platform,
        platformId: 'update123',
      });

      const updated = await influencerService.update(created.id, testFactoryId, {
        nickname: '更新后',
        phone: '13900139000',
        tags: ['新标签'],
      });

      expect(updated.nickname).toBe('更新后');
      expect(updated.phone).toBe('13900139000');
      expect(updated.tags).toEqual(['新标签']);
    });

    it('应该能删除达人', async () => {
      const created = await influencerService.create({
        factoryId: testFactoryId,
        nickname: '删除测试',
        platform: 'WEIBO' as Platform,
        platformId: 'delete123',
      });

      await influencerService.remove(created.id, testFactoryId);

      await expect(
        influencerService.getById(created.id, testFactoryId)
      ).rejects.toThrow('达人不存在');
    });
  });

  describe('去重检测', () => {
    it('应该能检测手机号重复', async () => {
      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '原达人',
        platform: 'DOUYIN' as Platform,
        platformId: 'original123',
        phone: '13800138001',
      });

      const result = await influencerService.checkDuplicate(
        testFactoryId,
        '13800138001',
        undefined,
        undefined
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateType).toBe('phone');
      expect(result.existingInfluencer?.nickname).toBe('原达人');
    });

    it('应该能检测平台+账号ID重复', async () => {
      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '原达人2',
        platform: 'KUAISHOU' as Platform,
        platformId: 'dup456',
      });

      const result = await influencerService.checkDuplicate(
        testFactoryId,
        undefined,
        'KUAISHOU' as Platform,
        'dup456'
      );

      expect(result.isDuplicate).toBe(true);
      expect(result.duplicateType).toBe('platformId');
    });

    it('应该阻止创建重复达人', async () => {
      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '已存在',
        platform: 'DOUYIN' as Platform,
        platformId: 'exists789',
        phone: '13800138002',
      });

      await expect(
        influencerService.create({
          factoryId: testFactoryId,
          nickname: '新达人',
          platform: 'DOUYIN' as Platform,
          platformId: 'exists789',
        })
      ).rejects.toThrow('平台账号ID已存在');
    });

    it('唯一数据应该返回无重复', async () => {
      const result = await influencerService.checkDuplicate(
        testFactoryId,
        '13800138999',
        'DOUYIN' as Platform,
        'unique999'
      );

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('搜索和筛选', () => {
    beforeEach(async () => {
      // 创建搜索测试数据
      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '美妆达人小红',
        platform: 'DOUYIN' as Platform,
        platformId: 'search001',
        categories: ['美妆', '护肤'],
        tags: ['高配合度', '价格敏感'],
      });

      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '美食博主小明',
        platform: 'KUAISHOU' as Platform,
        platformId: 'search002',
        categories: ['美食', '生活'],
        tags: ['高配合度'],
      });

      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '科技达人小李',
        platform: 'XIAOHONGSHU' as Platform,
        platformId: 'search003',
        categories: ['科技', '数码'],
        tags: ['已踩坑'],
      });
    });

    it('应该能按关键词搜索（昵称）', async () => {
      const result = await influencerService.list(
        testFactoryId,
        { keyword: '美妆' },
        { page: 1, pageSize: 20 }
      );

      expect(result.data.length).toBe(1);
      expect(result.data[0].nickname).toBe('美妆达人小红');
    });

    it('应该能按平台筛选', async () => {
      const result = await influencerService.list(
        testFactoryId,
        { platform: 'KUAISHOU' as Platform },
        { page: 1, pageSize: 20 }
      );

      expect(result.data.length).toBe(1);
      expect(result.data[0].nickname).toBe('美食博主小明');
    });

    it('应该能按类目筛选', async () => {
      const result = await influencerService.list(
        testFactoryId,
        { category: '美妆' },
        { page: 1, pageSize: 20 }
      );

      expect(result.data.length).toBe(1);
      expect(result.data[0].nickname).toBe('美妆达人小红');
    });

    it('应该能按标签筛选', async () => {
      const result = await influencerService.list(
        testFactoryId,
        { tags: ['高配合度'] },
        { page: 1, pageSize: 20 }
      );

      expect(result.data.length).toBe(2);
      const nicknames = result.data.map((i) => i.nickname);
      expect(nicknames).toContain('美妆达人小红');
      expect(nicknames).toContain('美食博主小明');
    });

    it('无筛选条件应返回所有达人', async () => {
      const result = await influencerService.list(
        testFactoryId,
        {},
        { page: 1, pageSize: 20 }
      );

      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('分页应该正确工作', async () => {
      const page1 = await influencerService.list(
        testFactoryId,
        {},
        { page: 1, pageSize: 2 }
      );

      expect(page1.data.length).toBe(2);
      expect(page1.total).toBe(3);
      expect(page1.totalPages).toBe(2);

      const page2 = await influencerService.list(
        testFactoryId,
        {},
        { page: 2, pageSize: 2 }
      );

      expect(page2.data.length).toBe(1);
    });
  });

  describe('标签管理', () => {
    it('应该能给达人添加标签', async () => {
      const created = await influencerService.create({
        factoryId: testFactoryId,
        nickname: '标签测试',
        platform: 'DOUYIN' as Platform,
        platformId: 'tags001',
        tags: ['原标签'],
      });

      const updated = await influencerService.addTags(
        created.id,
        testFactoryId,
        ['新标签1', '新标签2']
      );

      expect(updated.tags).toContain('原标签');
      expect(updated.tags).toContain('新标签1');
      expect(updated.tags).toContain('新标签2');
      expect(updated.tags.length).toBe(3);
    });

    it('应该能移除达人标签', async () => {
      const created = await influencerService.create({
        factoryId: testFactoryId,
        nickname: '移除标签测试',
        platform: 'DOUYIN' as Platform,
        platformId: 'tags002',
        tags: ['标签A', '标签B', '标签C'],
      });

      const updated = await influencerService.removeTags(
        created.id,
        testFactoryId,
        ['标签B']
      );

      expect(updated.tags).toContain('标签A');
      expect(updated.tags).toContain('标签C');
      expect(updated.tags).not.toContain('标签B');
      expect(updated.tags.length).toBe(2);
    });

    it('应该能获取工厂所有唯一标签', async () => {
      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '达人1',
        platform: 'DOUYIN' as Platform,
        platformId: 'alltags001',
        tags: ['标签X', '标签Y'],
      });

      await influencerService.create({
        factoryId: testFactoryId,
        nickname: '达人2',
        platform: 'KUAISHOU' as Platform,
        platformId: 'alltags002',
        tags: ['标签Y', '标签Z'],
      });

      const allTags = await influencerService.getAllTags(testFactoryId);

      expect(allTags).toContain('标签X');
      expect(allTags).toContain('标签Y');
      expect(allTags).toContain('标签Z');
      expect(allTags.length).toBe(3);
    });
  });


  // ==================== 属性测试 ====================
  /**
   * Property 2: 达人去重检测
   * 
   * 生成包含重复数据的达人列表
   * 验证系统正确识别重复
   * 
   * **Validates: Requirements 2.3**
   */
  describe('Property 2: 达人去重检测属性测试', () => {
    // 需要在这里导入 fast-check
    const fc = require('fast-check');
    
    // 生成有效手机号的 Arbitrary
    const phoneArbitrary = fc.integer({ min: 13000000000, max: 19999999999 }).map((n: number) => n.toString());

    // 生成平台的 Arbitrary
    const platformArbitrary = fc.constantFrom('DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER');

    // 生成平台ID的 Arbitrary (使用时间戳确保唯一)
    const platformIdArbitrary = fc.integer({ min: 10000, max: 99999 })
      .map((n: number) => `pbt_${n}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

    /**
     * 属性测试：对于任意两个具有相同手机号的达人，系统应该检测到重复
     */
    it('相同手机号应该被检测为重复', async () => {
      await fc.assert(
        fc.asyncProperty(phoneArbitrary, async (phone: string) => {
          // 先创建一个达人
          const first = await influencerService.create({
            factoryId: testFactoryId,
            nickname: `手机重复测试_${Date.now()}`,
            platform: 'DOUYIN' as Platform,
            platformId: `phone_dup_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            phone,
          });

          try {
            // 检查重复
            const result = await influencerService.checkDuplicate(
              testFactoryId,
              phone,
              'KUAISHOU' as Platform, // 不同平台
              `different_${Date.now()}` // 不同平台ID
            );

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateType).toBe('phone');
            expect(result.existingInfluencer?.id).toBe(first.id);
          } finally {
            // 清理
            await prisma.influencer.delete({ where: { id: first.id } });
          }
        }),
        { numRuns: 10 } // 减少运行次数因为涉及数据库操作
      );
    });

    /**
     * 属性测试：对于任意两个具有相同平台+账号ID的达人，系统应该检测到重复
     */
    it('相同平台+账号ID应该被检测为重复', async () => {
      await fc.assert(
        fc.asyncProperty(platformArbitrary, platformIdArbitrary, async (platform: Platform, platformId: string) => {
          // 先创建一个达人
          const first = await influencerService.create({
            factoryId: testFactoryId,
            nickname: `平台重复测试_${Date.now()}`,
            platform,
            platformId,
          });

          try {
            // 检查重复
            const result = await influencerService.checkDuplicate(
              testFactoryId,
              undefined, // 不同手机号
              platform,
              platformId
            );

            expect(result.isDuplicate).toBe(true);
            expect(result.duplicateType).toBe('platformId');
            expect(result.existingInfluencer?.id).toBe(first.id);
          } finally {
            // 清理
            await prisma.influencer.delete({ where: { id: first.id } });
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：不同的手机号和平台ID组合不应该被检测为重复
     */
    it('不同的手机号和平台ID组合不应该被检测为重复', async () => {
      await fc.assert(
        fc.asyncProperty(
          phoneArbitrary,
          phoneArbitrary,
          platformIdArbitrary,
          platformIdArbitrary,
          async (phone1: string, phone2: string, platformId1: string, platformId2: string) => {
            // 确保两组数据不同
            fc.pre(phone1 !== phone2 && platformId1 !== platformId2);

            // 先创建一个达人
            const first = await influencerService.create({
              factoryId: testFactoryId,
              nickname: `唯一性测试_${Date.now()}`,
              platform: 'DOUYIN' as Platform,
              platformId: platformId1,
              phone: phone1,
            });

            try {
              // 检查不同数据是否被误判为重复
              const result = await influencerService.checkDuplicate(
                testFactoryId,
                phone2,
                'DOUYIN' as Platform,
                platformId2
              );

              expect(result.isDuplicate).toBe(false);
            } finally {
              // 清理
              await prisma.influencer.delete({ where: { id: first.id } });
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：创建重复达人应该抛出错误
     */
    it('创建重复达人应该抛出错误', async () => {
      await fc.assert(
        fc.asyncProperty(platformArbitrary, platformIdArbitrary, async (platform: Platform, platformId: string) => {
          // 先创建一个达人
          const first = await influencerService.create({
            factoryId: testFactoryId,
            nickname: `创建重复测试_${Date.now()}`,
            platform,
            platformId,
          });

          try {
            // 尝试创建重复达人
            await expect(
              influencerService.create({
                factoryId: testFactoryId,
                nickname: `重复达人_${Date.now()}`,
                platform,
                platformId,
              })
            ).rejects.toThrow('平台账号ID已存在');
          } finally {
            // 清理
            await prisma.influencer.delete({ where: { id: first.id } });
          }
        }),
        { numRuns: 10 }
      );
    });

    /**
     * 属性测试：排除自身ID时不应该检测到重复
     */
    it('排除自身ID时不应该检测到重复', async () => {
      await fc.assert(
        fc.asyncProperty(phoneArbitrary, platformIdArbitrary, async (phone: string, platformId: string) => {
          // 创建一个达人
          const influencer = await influencerService.create({
            factoryId: testFactoryId,
            nickname: `自身排除测试_${Date.now()}`,
            platform: 'DOUYIN' as Platform,
            platformId,
            phone,
          });

          try {
            // 检查时排除自身ID
            const result = await influencerService.checkDuplicate(
              testFactoryId,
              phone,
              'DOUYIN' as Platform,
              platformId,
              influencer.id // 排除自身
            );

            expect(result.isDuplicate).toBe(false);
          } finally {
            // 清理
            await prisma.influencer.delete({ where: { id: influencer.id } });
          }
        }),
        { numRuns: 10 }
      );
    });
  });

  // ==================== Property 3: 达人搜索属性测试 ====================
  /**
   * Property 3: 达人搜索结果一致性
   * 
   * 生成随机达人数据和搜索条件
   * 验证返回结果都满足搜索条件
   * 
   * **Validates: Requirements 2.5**
   */
  describe('Property 3: 达人搜索结果一致性属性测试', () => {
    const fc = require('fast-check');

    // 生成平台的 Arbitrary
    const platformArbitrary = fc.constantFrom('DOUYIN', 'KUAISHOU', 'XIAOHONGSHU', 'WEIBO', 'OTHER');

    // 生成类目的 Arbitrary
    const categoryArbitrary = fc.constantFrom('美妆', '护肤', '美食', '科技', '生活', '时尚', '母婴');

    // 生成标签的 Arbitrary
    const tagArbitrary = fc.constantFrom('高配合度', '价格敏感', '已踩坑', '优质', '新人');

    /**
     * 属性测试：按关键词搜索返回的结果都应包含该关键词
     */
    it('按关键词搜索返回的结果都应包含该关键词', async () => {
      // 先创建一些测试数据
      const testInfluencers = await Promise.all([
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `搜索测试_美妆达人_${Date.now()}`,
          platform: 'DOUYIN' as Platform,
          platformId: `search_kw_1_${Date.now()}`,
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `搜索测试_美食博主_${Date.now()}`,
          platform: 'KUAISHOU' as Platform,
          platformId: `search_kw_2_${Date.now()}`,
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `搜索测试_科技达人_${Date.now()}`,
          platform: 'XIAOHONGSHU' as Platform,
          platformId: `search_kw_3_${Date.now()}`,
        }),
      ]);

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.constantFrom('美妆', '美食', '科技'),
            async (keyword: string) => {
              const result = await influencerService.list(
                testFactoryId,
                { keyword },
                { page: 1, pageSize: 100 }
              );

              // 验证所有返回结果的昵称都包含关键词
              for (const influencer of result.data) {
                const nicknameContains = influencer.nickname.toLowerCase().includes(keyword.toLowerCase());
                const platformIdContains = influencer.platformId.toLowerCase().includes(keyword.toLowerCase());
                expect(nicknameContains || platformIdContains).toBe(true);
              }
            }
          ),
          { numRuns: 10 }
        );
      } finally {
        // 清理
        for (const inf of testInfluencers) {
          await prisma.influencer.delete({ where: { id: inf.id } });
        }
      }
    });

    /**
     * 属性测试：按平台筛选返回的结果都应属于该平台
     */
    it('按平台筛选返回的结果都应属于该平台', async () => {
      // 创建不同平台的测试数据
      const testInfluencers = await Promise.all([
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `平台测试_抖音_${Date.now()}`,
          platform: 'DOUYIN' as Platform,
          platformId: `search_plat_1_${Date.now()}`,
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `平台测试_快手_${Date.now()}`,
          platform: 'KUAISHOU' as Platform,
          platformId: `search_plat_2_${Date.now()}`,
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `平台测试_小红书_${Date.now()}`,
          platform: 'XIAOHONGSHU' as Platform,
          platformId: `search_plat_3_${Date.now()}`,
        }),
      ]);

      try {
        await fc.assert(
          fc.asyncProperty(platformArbitrary, async (platform: Platform) => {
            const result = await influencerService.list(
              testFactoryId,
              { platform },
              { page: 1, pageSize: 100 }
            );

            // 验证所有返回结果都属于指定平台
            for (const influencer of result.data) {
              expect(influencer.platform).toBe(platform);
            }
          }),
          { numRuns: 10 }
        );
      } finally {
        // 清理
        for (const inf of testInfluencers) {
          await prisma.influencer.delete({ where: { id: inf.id } });
        }
      }
    });

    /**
     * 属性测试：按类目筛选返回的结果都应包含该类目
     */
    it('按类目筛选返回的结果都应包含该类目', async () => {
      // 创建不同类目的测试数据
      const testInfluencers = await Promise.all([
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `类目测试_1_${Date.now()}`,
          platform: 'DOUYIN' as Platform,
          platformId: `search_cat_1_${Date.now()}`,
          categories: ['美妆', '护肤'],
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `类目测试_2_${Date.now()}`,
          platform: 'KUAISHOU' as Platform,
          platformId: `search_cat_2_${Date.now()}`,
          categories: ['美食', '生活'],
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `类目测试_3_${Date.now()}`,
          platform: 'XIAOHONGSHU' as Platform,
          platformId: `search_cat_3_${Date.now()}`,
          categories: ['科技', '数码'],
        }),
      ]);

      try {
        await fc.assert(
          fc.asyncProperty(categoryArbitrary, async (category: string) => {
            const result = await influencerService.list(
              testFactoryId,
              { category },
              { page: 1, pageSize: 100 }
            );

            // 验证所有返回结果都包含指定类目
            for (const influencer of result.data) {
              expect(influencer.categories).toContain(category);
            }
          }),
          { numRuns: 10 }
        );
      } finally {
        // 清理
        for (const inf of testInfluencers) {
          await prisma.influencer.delete({ where: { id: inf.id } });
        }
      }
    });

    /**
     * 属性测试：按标签筛选返回的结果都应包含至少一个指定标签
     */
    it('按标签筛选返回的结果都应包含至少一个指定标签', async () => {
      // 创建不同标签的测试数据
      const testInfluencers = await Promise.all([
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `标签测试_1_${Date.now()}`,
          platform: 'DOUYIN' as Platform,
          platformId: `search_tag_1_${Date.now()}`,
          tags: ['高配合度', '优质'],
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `标签测试_2_${Date.now()}`,
          platform: 'KUAISHOU' as Platform,
          platformId: `search_tag_2_${Date.now()}`,
          tags: ['价格敏感', '新人'],
        }),
        influencerService.create({
          factoryId: testFactoryId,
          nickname: `标签测试_3_${Date.now()}`,
          platform: 'XIAOHONGSHU' as Platform,
          platformId: `search_tag_3_${Date.now()}`,
          tags: ['已踩坑'],
        }),
      ]);

      try {
        await fc.assert(
          fc.asyncProperty(
            fc.array(tagArbitrary, { minLength: 1, maxLength: 2 }),
            async (tags: string[]) => {
              const result = await influencerService.list(
                testFactoryId,
                { tags },
                { page: 1, pageSize: 100 }
              );

              // 验证所有返回结果都包含至少一个指定标签
              for (const influencer of result.data) {
                const hasMatchingTag = tags.some(tag => influencer.tags.includes(tag));
                expect(hasMatchingTag).toBe(true);
              }
            }
          ),
          { numRuns: 10 }
        );
      } finally {
        // 清理
        for (const inf of testInfluencers) {
          await prisma.influencer.delete({ where: { id: inf.id } });
        }
      }
    });
  });
});
