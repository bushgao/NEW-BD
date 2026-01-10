const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('\n=== 创建测试数据 ===\n');

    // 获取pinpai001用户和其Factory
    const user = await prisma.user.findUnique({
      where: { email: 'pinpai001@gmail.com' },
      include: { ownedFactory: true }
    });

    if (!user || !user.ownedFactory) {
      console.log('❌ 找不到用户或Factory');
      return;
    }

    const factoryId = user.ownedFactory.id;
    console.log(`✅ 找到Factory: ${user.ownedFactory.name} (${factoryId})`);
    console.log('');

    // 1. 创建样品
    console.log('📦 创建样品...');
    const samples = await Promise.all([
      prisma.sample.create({
        data: {
          factoryId,
          sku: 'SKU001',
          name: '口红 - 玫瑰红',
          unitCost: 3000, // 30元
          retailPrice: 9900, // 99元
          canResend: true,
          notes: '热门色号'
        }
      }),
      prisma.sample.create({
        data: {
          factoryId,
          sku: 'SKU002',
          name: '口红 - 珊瑚橙',
          unitCost: 3000,
          retailPrice: 9900,
          canResend: true
        }
      }),
      prisma.sample.create({
        data: {
          factoryId,
          sku: 'SKU003',
          name: '眼影盘 - 大地色',
          unitCost: 5000, // 50元
          retailPrice: 15900, // 159元
          canResend: true,
          notes: '12色眼影盘'
        }
      })
    ]);
    console.log(`   ✅ 创建了 ${samples.length} 个样品`);
    console.log('');

    // 2. 创建达人
    console.log('🎭 创建达人...');
    const influencers = await Promise.all([
      prisma.influencer.create({
        data: {
          factoryId,
          nickname: '美妆小仙女',
          platform: 'DOUYIN',
          platformId: 'dy001',
          phone: '13800138001',
          wechat: 'wx001',
          followers: '50万',
          categories: ['美妆', '护肤'],
          tags: ['口红测评', '种草'],
          notes: '粉丝活跃度高',
          createdBy: user.id,
          sourceType: 'STAFF'
        }
      }),
      prisma.influencer.create({
        data: {
          factoryId,
          nickname: '时尚达人Lisa',
          platform: 'XIAOHONGSHU',
          platformId: 'xhs001',
          phone: '13800138002',
          wechat: 'wx002',
          followers: '30万',
          categories: ['美妆', '时尚'],
          tags: ['好物推荐', '测评'],
          createdBy: user.id,
          sourceType: 'STAFF'
        }
      }),
      prisma.influencer.create({
        data: {
          factoryId,
          nickname: '美妆博主小红',
          platform: 'DOUYIN',
          platformId: 'dy002',
          phone: '13800138003',
          wechat: 'wx003',
          followers: '80万',
          categories: ['美妆'],
          tags: ['口红', '眼影', '测评'],
          notes: '带货能力强',
          createdBy: user.id,
          sourceType: 'STAFF'
        }
      }),
      prisma.influencer.create({
        data: {
          factoryId,
          nickname: '护肤专家Amy',
          platform: 'XIAOHONGSHU',
          platformId: 'xhs002',
          phone: '13800138004',
          wechat: 'wx004',
          followers: '20万',
          categories: ['护肤', '美妆'],
          tags: ['成分党', '测评'],
          createdBy: user.id,
          sourceType: 'STAFF'
        }
      }),
      prisma.influencer.create({
        data: {
          factoryId,
          nickname: '美妆教程君',
          platform: 'DOUYIN',
          platformId: 'dy003',
          phone: '13800138005',
          wechat: 'wx005',
          followers: '100万',
          categories: ['美妆', '教程'],
          tags: ['化妆教程', '好物分享'],
          notes: '粉丝粘性高',
          createdBy: user.id,
          sourceType: 'STAFF'
        }
      })
    ]);
    console.log(`   ✅ 创建了 ${influencers.length} 个达人`);
    console.log('');

    // 3. 创建合作
    console.log('🤝 创建合作...');
    
    // 创建不同阶段的合作
    const collaborations = [];
    
    // LEAD阶段
    collaborations.push(await prisma.collaboration.create({
      data: {
        influencerId: influencers[0].id,
        factoryId,
        businessStaffId: user.id,
        stage: 'LEAD',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5天前
      }
    }));

    // CONTACTED阶段
    collaborations.push(await prisma.collaboration.create({
      data: {
        influencerId: influencers[1].id,
        factoryId,
        businessStaffId: user.id,
        stage: 'CONTACTED',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4天前
      }
    }));

    // QUOTED阶段
    collaborations.push(await prisma.collaboration.create({
      data: {
        influencerId: influencers[2].id,
        factoryId,
        businessStaffId: user.id,
        stage: 'QUOTED',
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前
      }
    }));

    // SAMPLED阶段（已寄样）
    const sampledCollab = await prisma.collaboration.create({
      data: {
        influencerId: influencers[3].id,
        factoryId,
        businessStaffId: user.id,
        stage: 'SAMPLED',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
      }
    });
    collaborations.push(sampledCollab);

    // 为SAMPLED合作创建寄样记录
    await prisma.sampleDispatch.create({
      data: {
        sampleId: samples[0].id,
        collaborationId: sampledCollab.id,
        businessStaffId: user.id,
        quantity: 2,
        unitCostSnapshot: samples[0].unitCost,
        totalSampleCost: samples[0].unitCost * 2,
        shippingCost: 1500, // 15元快递费
        totalCost: samples[0].unitCost * 2 + 1500,
        trackingNumber: 'SF1234567890',
        receivedStatus: 'RECEIVED',
        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        onboardStatus: 'ONBOARD'
      }
    });

    // SCHEDULED阶段
    collaborations.push(await prisma.collaboration.create({
      data: {
        influencerId: influencers[4].id,
        factoryId,
        businessStaffId: user.id,
        stage: 'SCHEDULED',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10天前
      }
    }));

    // PUBLISHED阶段（已发布，创建结果）
    const publishedCollab = await prisma.collaboration.create({
      data: {
        influencerId: influencers[2].id,
        factoryId,
        businessStaffId: user.id,
        stage: 'PUBLISHED',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15天前
      }
    });
    collaborations.push(publishedCollab);

    // 创建合作结果
    await prisma.collaborationResult.create({
      data: {
        collaborationId: publishedCollab.id,
        contentType: 'SHORT_VIDEO',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        salesQuantity: 150,
        salesGmv: 1485000, // 14850元
        commissionRate: 20,
        pitFee: 50000, // 500元坑位费
        actualCommission: 297000, // 2970元佣金
        totalSampleCost: 7500, // 样品成本75元
        totalCollaborationCost: 354500, // 总成本3545元
        roi: 4.19, // ROI 4.19
        profitStatus: 'HIGH_PROFIT',
        willRepeat: true,
        notes: '效果很好，可以继续合作'
      }
    });

    console.log(`   ✅ 创建了 ${collaborations.length} 个合作`);
    console.log('');

    // 4. 创建跟进记录
    console.log('📝 创建跟进记录...');
    const followUps = await Promise.all([
      prisma.followUpRecord.create({
        data: {
          collaborationId: collaborations[1].id,
          userId: user.id,
          content: '已联系达人，等待回复',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.followUpRecord.create({
        data: {
          collaborationId: collaborations[2].id,
          userId: user.id,
          content: '已发送报价，达人表示需要考虑',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.followUpRecord.create({
        data: {
          collaborationId: collaborations[3].id,
          userId: user.id,
          content: '样品已寄出，快递单号：SF1234567890',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        }
      }),
      prisma.followUpRecord.create({
        data: {
          collaborationId: collaborations[3].id,
          userId: user.id,
          content: '达人已收到样品，反馈很满意',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      })
    ]);
    console.log(`   ✅ 创建了 ${followUps.length} 条跟进记录`);
    console.log('');

    // 5. 统计结果
    console.log('📊 测试数据创建完成！\n');
    console.log('数据统计:');
    console.log(`   样品: ${samples.length}`);
    console.log(`   达人: ${influencers.length}`);
    console.log(`   合作: ${collaborations.length}`);
    console.log(`   寄样记录: 1`);
    console.log(`   合作结果: 1`);
    console.log(`   跟进记录: ${followUps.length}`);
    console.log('');

    console.log('✅ 现在可以登录查看Dashboard了！');
    console.log('   用户: pinpai001@gmail.com');
    console.log('   密码: (您的密码)');
    console.log('');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
