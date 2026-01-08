import prisma from '../lib/prisma';
import * as XLSX from 'xlsx';
import type { PipelineStage } from '@prisma/client';

// ==================== 类型定义 ====================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StaffPerformanceItem {
  staffId: string;
  staffName: string;
  staffEmail: string;
  // 数量指标
  contactedCount: number;      // 建联数量（创建的合作记录数）
  progressedCount: number;     // 推进数量（阶段从线索推进到后续阶段的合作数）
  closedCount: number;         // 成交数量（阶段达到已发布或已复盘的合作数）
  // 金额指标
  totalGmv: number;            // 总GMV（分）
  totalCost: number;           // 总成本（分）
  averageRoi: number;          // 平均ROI
  // 样品指标
  dispatchCount: number;       // 寄样数量
  dispatchCost: number;        // 寄样成本（分）
}

export interface StaffPerformanceReport {
  items: StaffPerformanceItem[];
  summary: {
    totalStaff: number;
    totalContactedCount: number;
    totalProgressedCount: number;
    totalClosedCount: number;
    totalGmv: number;
    totalCost: number;
    overallRoi: number;
    totalDispatchCount: number;
    totalDispatchCost: number;
  };
}

export interface FactoryDashboard {
  // 关键指标
  metrics: {
    totalSampleCost: number;
    totalCollaborationCost: number;
    totalGmv: number;
    overallRoi: number;
    periodComparison: {
      sampleCostChange: number;
      gmvChange: number;
      roiChange: number;
    };
  };
  // 管道分布
  pipelineDistribution: Record<PipelineStage, number>;
  // 待办事项
  pendingItems: {
    overdueCollaborations: number;
    pendingReceipts: number;
    pendingResults: number;
  };
  // 商务排行
  staffRanking: {
    staffId: string;
    staffName: string;
    closedDeals: number;
    totalGmv: number;
  }[];
  // 商务团队工作进展
  staffProgress: {
    staffId: string;
    staffName: string;
    todayFollowUps: number;
    weekFollowUps: number;
    activeCollaborations: number;
    stuckCollaborations: number; // 超过7天未推进的合作
    avgDaysToClose: number; // 平均成交天数
  }[];
  // 团队效率指标
  teamEfficiency: {
    avgLeadToContact: number; // 线索到联系平均天数
    avgContactToQuoted: number; // 联系到报价平均天数
    avgQuotedToSampled: number; // 报价到寄样平均天数
    avgSampledToScheduled: number; // 寄样到排期平均天数
    avgScheduledToPublished: number; // 排期到发布平均天数
    overallAvgDays: number; // 整体平均周期
  };
  // 最近团队动态
  recentTeamActivities: {
    id: string;
    type: 'new_collaboration' | 'stage_progress' | 'closed_deal' | 'dispatch';
    staffName: string;
    influencerName: string;
    content: string;
    createdAt: Date;
  }[];
  // 风险预警
  riskAlerts: {
    longStuckCollaborations: number; // 长期卡住的合作(>14天)
    unbalancedWorkload: boolean; // 工作量不均衡
    highCostAlert: boolean; // 成本异常
  };
}

export interface BusinessStaffDashboard {
  // 关键指标
  metrics: {
    // 本周期数据
    currentPeriod: {
      contactedCount: number;      // 建联数量
      progressedCount: number;     // 推进数量
      closedCount: number;         // 成交数量
      totalGmv: number;            // 总GMV
      totalCost: number;           // 总成本
      averageRoi: number;          // 平均ROI
      dispatchCount: number;       // 寄样数量
      dispatchCost: number;        // 寄样成本
    };
    // 环比变化
    periodComparison: {
      contactedChange: number;
      closedChange: number;
      gmvChange: number;
      roiChange: number;
    };
  };
  // 管道分布（我负责的）
  myPipelineDistribution: Record<PipelineStage, number>;
  // 待办事项
  pendingItems: {
    overdueCollaborations: number;     // 我的超期合作
    needFollowUp: number;              // 需要跟进（3天未跟进）
    pendingReceipts: number;           // 待签收样品
    pendingResults: number;            // 待录入结果
  };
  // 样品使用统计
  sampleUsage: {
    sampleId: string;
    sampleName: string;
    sku: string;
    dispatchCount: number;
    totalQuantity: number;
    totalCost: number;
    receivedCount: number;
    onboardCount: number;
    onboardRate: number;
  }[];
  // 最近合作动态
  recentActivities: {
    id: string;
    type: 'stage_change' | 'follow_up' | 'dispatch' | 'result';
    collaborationId: string;
    influencerName: string;
    content: string;
    createdAt: Date;
  }[];
  // 排名信息
  ranking: {
    myRank: number;
    totalStaff: number;
    myClosedCount: number;
    myGmv: number;
    topPerformer: {
      name: string;
      closedCount: number;
      gmv: number;
    } | null;
  };
}

export type ReportType = 'staff-performance' | 'roi' | 'sample-cost' | 'collaboration';

export interface ExportParams {
  factoryId: string;
  dateRange?: DateRange;
  groupBy?: string;
}

// 阶段名称映射
const STAGE_NAMES: Record<PipelineStage, string> = {
  LEAD: '线索达人',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  SAMPLED: '已寄样',
  SCHEDULED: '已排期',
  PUBLISHED: '已发布',
  REVIEWED: '已复盘',
};

// ==================== 辅助函数 ====================

/**
 * 计算 ROI
 */
function calculateRoi(gmv: number, cost: number): number {
  if (cost === 0) return 0;
  return Math.round((gmv / cost) * 10000) / 10000;
}

/**
 * 计算环比变化百分比
 */
function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

/**
 * 获取上一个周期的日期范围
 */
function getPreviousPeriod(dateRange: DateRange): DateRange {
  const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
  return {
    startDate: new Date(dateRange.startDate.getTime() - duration),
    endDate: new Date(dateRange.startDate.getTime() - 1),
  };
}


// ==================== 商务绩效统计 ====================

/**
 * 获取商务绩效报表
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export async function getStaffPerformance(
  factoryId: string,
  dateRange?: DateRange
): Promise<StaffPerformanceReport> {
  // 获取工厂所有商务人员
  const staffMembers = await prisma.user.findMany({
    where: {
      factoryId,
      role: 'BUSINESS_STAFF',
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // 也包括工厂老板（可能也参与商务工作）
  const owner = await prisma.factory.findUnique({
    where: { id: factoryId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const allStaff = owner ? [...staffMembers, owner.owner] : staffMembers;

  const items: StaffPerformanceItem[] = [];
  let summaryTotalContactedCount = 0;
  let summaryTotalProgressedCount = 0;
  let summaryTotalClosedCount = 0;
  let summaryTotalGmv = 0;
  let summaryTotalCost = 0;
  let summaryTotalDispatchCount = 0;
  let summaryTotalDispatchCost = 0;

  for (const staff of allStaff) {
    // 构建日期筛选条件
    const dateFilter = dateRange
      ? { createdAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
      : {};

    // 建联数量：该商务创建的合作记录数
    const contactedCount = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        ...dateFilter,
      },
    });

    // 推进数量：阶段从线索推进到后续阶段的合作数
    const progressedCount = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { notIn: ['LEAD'] },
        ...dateFilter,
      },
    });

    // 成交数量：阶段达到已发布或已复盘的合作数
    const closedCount = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { in: ['PUBLISHED', 'REVIEWED'] },
        ...dateFilter,
      },
    });

    // 获取该商务负责的所有合作结果
    const resultDateFilter = dateRange
      ? { publishedAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
      : {};

    const results = await prisma.collaborationResult.findMany({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
        ...resultDateFilter,
      },
    });

    const totalGmv = results.reduce((sum, r) => sum + r.salesGmv, 0);
    const totalCost = results.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
    const averageRoi = calculateRoi(totalGmv, totalCost);

    // 寄样数据
    const dispatchDateFilter = dateRange
      ? { dispatchedAt: { gte: dateRange.startDate, lte: dateRange.endDate } }
      : {};

    const dispatches = await prisma.sampleDispatch.findMany({
      where: {
        businessStaffId: staff.id,
        collaboration: { factoryId },
        ...dispatchDateFilter,
      },
    });

    const dispatchCount = dispatches.length;
    const dispatchCost = dispatches.reduce((sum, d) => sum + d.totalCost, 0);

    items.push({
      staffId: staff.id,
      staffName: staff.name,
      staffEmail: staff.email,
      contactedCount,
      progressedCount,
      closedCount,
      totalGmv,
      totalCost,
      averageRoi,
      dispatchCount,
      dispatchCost,
    });

    // 累加汇总
    summaryTotalContactedCount += contactedCount;
    summaryTotalProgressedCount += progressedCount;
    summaryTotalClosedCount += closedCount;
    summaryTotalGmv += totalGmv;
    summaryTotalCost += totalCost;
    summaryTotalDispatchCount += dispatchCount;
    summaryTotalDispatchCost += dispatchCost;
  }

  // 按成交数量降序排序
  items.sort((a, b) => b.closedCount - a.closedCount);

  return {
    items,
    summary: {
      totalStaff: items.length,
      totalContactedCount: summaryTotalContactedCount,
      totalProgressedCount: summaryTotalProgressedCount,
      totalClosedCount: summaryTotalClosedCount,
      totalGmv: summaryTotalGmv,
      totalCost: summaryTotalCost,
      overallRoi: calculateRoi(summaryTotalGmv, summaryTotalCost),
      totalDispatchCount: summaryTotalDispatchCount,
      totalDispatchCost: summaryTotalDispatchCost,
    },
  };
}


// ==================== 工厂看板数据 ====================

/**
 * 获取工厂老板看板数据
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export async function getFactoryDashboard(
  factoryId: string,
  period: 'week' | 'month' = 'month'
): Promise<FactoryDashboard> {
  const now = new Date();
  
  // 计算当前周期的日期范围
  let currentPeriodStart: Date;
  if (period === 'week') {
    // 本周开始（周一）
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - diff);
    currentPeriodStart.setHours(0, 0, 0, 0);
  } else {
    // 本月开始
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const currentPeriod: DateRange = {
    startDate: currentPeriodStart,
    endDate: now,
  };

  const previousPeriod = getPreviousPeriod(currentPeriod);

  // ==================== 关键指标 ====================

  // 当前周期寄样成本
  const currentDispatches = await prisma.sampleDispatch.findMany({
    where: {
      collaboration: { factoryId },
      dispatchedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });
  const currentSampleCost = currentDispatches.reduce((sum, d) => sum + d.totalCost, 0);

  // 上一周期寄样成本
  const previousDispatches = await prisma.sampleDispatch.findMany({
    where: {
      collaboration: { factoryId },
      dispatchedAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
    },
  });
  const previousSampleCost = previousDispatches.reduce((sum, d) => sum + d.totalCost, 0);

  // 当前周期合作结果
  const currentResults = await prisma.collaborationResult.findMany({
    where: {
      collaboration: { factoryId },
      publishedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });
  const currentCollaborationCost = currentResults.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
  const currentGmv = currentResults.reduce((sum, r) => sum + r.salesGmv, 0);
  const currentRoi = calculateRoi(currentGmv, currentCollaborationCost);

  // 上一周期合作结果
  const previousResults = await prisma.collaborationResult.findMany({
    where: {
      collaboration: { factoryId },
      publishedAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
    },
  });
  const previousGmv = previousResults.reduce((sum, r) => sum + r.salesGmv, 0);
  const previousCollaborationCost = previousResults.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
  const previousRoi = calculateRoi(previousGmv, previousCollaborationCost);

  // ==================== 管道分布 ====================

  const pipelineStats = await prisma.collaboration.groupBy({
    by: ['stage'],
    where: { factoryId },
    _count: { id: true },
  });

  const pipelineDistribution: Record<PipelineStage, number> = {
    LEAD: 0,
    CONTACTED: 0,
    QUOTED: 0,
    SAMPLED: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    REVIEWED: 0,
  };

  for (const stat of pipelineStats) {
    pipelineDistribution[stat.stage] = stat._count.id;
  }

  // ==================== 待办事项 ====================

  // 超期合作数量
  const overdueCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      isOverdue: true,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
  });

  // 待签收样品数量（寄出超过7天未签收）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingReceipts = await prisma.sampleDispatch.count({
    where: {
      collaboration: { factoryId },
      receivedStatus: 'PENDING',
      dispatchedAt: { lt: sevenDaysAgo },
    },
  });

  // 待录入结果数量（已上车但超过14天未录入结果）
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const pendingResults = await prisma.collaboration.count({
    where: {
      factoryId,
      stage: { in: ['SCHEDULED', 'PUBLISHED'] },
      result: null,
      dispatches: {
        some: {
          onboardStatus: 'ONBOARD',
          dispatchedAt: { lt: fourteenDaysAgo },
        },
      },
    },
  });

  // ==================== 商务排行 ====================

  // 获取所有商务人员
  const staffMembers = await prisma.user.findMany({
    where: {
      factoryId,
      role: 'BUSINESS_STAFF',
    },
    select: { id: true, name: true },
  });

  const staffRanking: FactoryDashboard['staffRanking'] = [];

  for (const staff of staffMembers) {
    // 成交数量
    const closedDeals = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { in: ['PUBLISHED', 'REVIEWED'] },
        createdAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
      },
    });

    // 总GMV
    const staffResults = await prisma.collaborationResult.findMany({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
        publishedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
      },
    });
    const totalGmv = staffResults.reduce((sum, r) => sum + r.salesGmv, 0);

    staffRanking.push({
      staffId: staff.id,
      staffName: staff.name,
      closedDeals,
      totalGmv,
    });
  }

  // 按GMV降序排序
  staffRanking.sort((a, b) => b.totalGmv - a.totalGmv);

  // ==================== 商务团队工作进展 ====================

  const staffProgress: FactoryDashboard['staffProgress'] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const fourteenDaysAgoForProgress = new Date();
  fourteenDaysAgoForProgress.setDate(fourteenDaysAgoForProgress.getDate() - 14);

  for (const staff of staffMembers) {
    // 今日跟进数
    const todayFollowUps = await prisma.followUpRecord.count({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
        createdAt: { gte: today },
      },
    });

    // 本周跟进数
    const weekFollowUps = await prisma.followUpRecord.count({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
        createdAt: { gte: weekAgo },
      },
    });

    // 活跃合作数(非已发布/已复盘)
    const activeCollaborations = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      },
    });

    // 卡住的合作(超过7天未更新)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const stuckCollaborations = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
        updatedAt: { lt: sevenDaysAgo },
      },
    });

    // 平均成交天数
    const closedCollaborations = await prisma.collaboration.findMany({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { in: ['PUBLISHED', 'REVIEWED'] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgDaysToClose = 0;
    if (closedCollaborations.length > 0) {
      const totalDays = closedCollaborations.reduce((sum, c) => {
        const days = Math.floor((c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDaysToClose = Math.round(totalDays / closedCollaborations.length);
    }

    staffProgress.push({
      staffId: staff.id,
      staffName: staff.name,
      todayFollowUps,
      weekFollowUps,
      activeCollaborations,
      stuckCollaborations,
      avgDaysToClose,
    });
  }

  // ==================== 团队效率指标 ====================

  // 获取所有阶段变更记录来计算平均时间
  const stageHistories = await prisma.stageHistory.findMany({
    where: {
      collaboration: { factoryId },
      changedAt: { gte: currentPeriod.startDate },
    },
    orderBy: { changedAt: 'asc' },
  });

  // 按合作ID分组
  const collaborationStages = new Map<string, { stage: PipelineStage; time: Date }[]>();
  for (const history of stageHistories) {
    if (!collaborationStages.has(history.collaborationId)) {
      collaborationStages.set(history.collaborationId, []);
    }
    collaborationStages.get(history.collaborationId)!.push({
      stage: history.toStage,
      time: history.changedAt,
    });
  }

  // 计算各阶段平均时间
  const stageDurations = {
    leadToContact: [] as number[],
    contactToQuoted: [] as number[],
    quotedToSampled: [] as number[],
    sampledToScheduled: [] as number[],
    scheduledToPublished: [] as number[],
  };

  for (const [, stages] of collaborationStages) {
    for (let i = 0; i < stages.length - 1; i++) {
      const current = stages[i];
      const next = stages[i + 1];
      const days = Math.floor((next.time.getTime() - current.time.getTime()) / (1000 * 60 * 60 * 24));

      if (current.stage === 'LEAD' && next.stage === 'CONTACTED') {
        stageDurations.leadToContact.push(days);
      } else if (current.stage === 'CONTACTED' && next.stage === 'QUOTED') {
        stageDurations.contactToQuoted.push(days);
      } else if (current.stage === 'QUOTED' && next.stage === 'SAMPLED') {
        stageDurations.quotedToSampled.push(days);
      } else if (current.stage === 'SAMPLED' && next.stage === 'SCHEDULED') {
        stageDurations.sampledToScheduled.push(days);
      } else if (current.stage === 'SCHEDULED' && next.stage === 'PUBLISHED') {
        stageDurations.scheduledToPublished.push(days);
      }
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const teamEfficiency = {
    avgLeadToContact: avg(stageDurations.leadToContact),
    avgContactToQuoted: avg(stageDurations.contactToQuoted),
    avgQuotedToSampled: avg(stageDurations.quotedToSampled),
    avgSampledToScheduled: avg(stageDurations.sampledToScheduled),
    avgScheduledToPublished: avg(stageDurations.scheduledToPublished),
    overallAvgDays: avg([
      ...stageDurations.leadToContact,
      ...stageDurations.contactToQuoted,
      ...stageDurations.quotedToSampled,
      ...stageDurations.sampledToScheduled,
      ...stageDurations.scheduledToPublished,
    ]),
  };

  // ==================== 最近团队动态 ====================

  const recentTeamActivities: FactoryDashboard['recentTeamActivities'] = [];

  // 最近新建的合作
  const recentNewCollaborations = await prisma.collaboration.findMany({
    where: { factoryId },
    include: {
      influencer: true,
      businessStaff: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const collab of recentNewCollaborations) {
    recentTeamActivities.push({
      id: collab.id,
      type: 'new_collaboration',
      staffName: collab.businessStaff.name,
      influencerName: collab.influencer.nickname,
      content: `新建合作`,
      createdAt: collab.createdAt,
    });
  }

  // 最近的阶段推进
  const recentStageChanges = await prisma.stageHistory.findMany({
    where: {
      collaboration: { factoryId },
      toStage: { in: ['SAMPLED', 'SCHEDULED', 'PUBLISHED'] }, // 只显示重要阶段
    },
    include: {
      collaboration: {
        include: {
          influencer: true,
          businessStaff: { select: { name: true } },
        },
      },
    },
    orderBy: { changedAt: 'desc' },
    take: 5,
  });

  for (const change of recentStageChanges) {
    recentTeamActivities.push({
      id: change.id,
      type: 'stage_progress',
      staffName: change.collaboration.businessStaff.name,
      influencerName: change.collaboration.influencer.nickname,
      content: `推进到${STAGE_NAMES[change.toStage]}`,
      createdAt: change.changedAt,
    });
  }

  // 最近成交
  const recentClosedDeals = await prisma.collaboration.findMany({
    where: {
      factoryId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { gte: weekAgo },
    },
    include: {
      influencer: true,
      businessStaff: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  for (const deal of recentClosedDeals) {
    recentTeamActivities.push({
      id: deal.id,
      type: 'closed_deal',
      staffName: deal.businessStaff.name,
      influencerName: deal.influencer.nickname,
      content: `成交`,
      createdAt: deal.updatedAt,
    });
  }

  // 按时间排序并取前10条
  recentTeamActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const topTeamActivities = recentTeamActivities.slice(0, 10);

  // ==================== 风险预警 ====================

  // 长期卡住的合作
  const longStuckCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { lt: fourteenDaysAgoForProgress },
    },
  });

  // 工作量不均衡检测
  const workloads = staffProgress.map(s => s.activeCollaborations);
  const maxWorkload = Math.max(...workloads);
  const minWorkload = Math.min(...workloads);
  const unbalancedWorkload = workloads.length > 1 && (maxWorkload - minWorkload) > 10;

  // 成本异常检测(本周期成本比上周期增长超过50%)
  const highCostAlert = currentSampleCost > previousSampleCost * 1.5;

  const riskAlerts = {
    longStuckCollaborations,
    unbalancedWorkload,
    highCostAlert,
  };

  return {
    metrics: {
      totalSampleCost: currentSampleCost,
      totalCollaborationCost: currentCollaborationCost,
      totalGmv: currentGmv,
      overallRoi: currentRoi,
      periodComparison: {
        sampleCostChange: calculateChange(currentSampleCost, previousSampleCost),
        gmvChange: calculateChange(currentGmv, previousGmv),
        roiChange: calculateChange(currentRoi, previousRoi),
      },
    },
    pipelineDistribution,
    pendingItems: {
      overdueCollaborations,
      pendingReceipts,
      pendingResults,
    },
    staffRanking,
    staffProgress,
    teamEfficiency,
    recentTeamActivities: topTeamActivities,
    riskAlerts,
  };
}


// ==================== 商务人员看板数据 ====================

/**
 * 获取商务人员个人看板数据
 */
export async function getBusinessStaffDashboard(
  factoryId: string,
  staffId: string,
  period: 'week' | 'month' = 'month'
): Promise<BusinessStaffDashboard> {
  const now = new Date();
  
  // 计算当前周期的日期范围
  let currentPeriodStart: Date;
  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - diff);
    currentPeriodStart.setHours(0, 0, 0, 0);
  } else {
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const currentPeriod: DateRange = {
    startDate: currentPeriodStart,
    endDate: now,
  };

  const previousPeriod = getPreviousPeriod(currentPeriod);

  // ==================== 关键指标 ====================

  // 当前周期数据
  const currentCollaborations = await prisma.collaboration.findMany({
    where: {
      factoryId,
      businessStaffId: staffId,
      createdAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  const contactedCount = currentCollaborations.length;
  const progressedCount = currentCollaborations.filter(c => c.stage !== 'LEAD').length;
  const closedCount = currentCollaborations.filter(c => ['PUBLISHED', 'REVIEWED'].includes(c.stage)).length;

  // 当前周期结果数据
  const currentResults = await prisma.collaborationResult.findMany({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
      publishedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  const totalGmv = currentResults.reduce((sum, r) => sum + r.salesGmv, 0);
  const totalCost = currentResults.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
  const averageRoi = calculateRoi(totalGmv, totalCost);

  // 当前周期寄样数据
  const currentDispatches = await prisma.sampleDispatch.findMany({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
      dispatchedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  const dispatchCount = currentDispatches.length;
  const dispatchCost = currentDispatches.reduce((sum, d) => sum + d.totalCost, 0);

  // 上一周期数据（用于环比）
  const previousCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      createdAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
    },
  });

  const previousClosedCount = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      createdAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
    },
  });

  const previousResults = await prisma.collaborationResult.findMany({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
      publishedAt: { gte: previousPeriod.startDate, lte: previousPeriod.endDate },
    },
  });

  const previousGmv = previousResults.reduce((sum, r) => sum + r.salesGmv, 0);
  const previousTotalCost = previousResults.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
  const previousRoi = calculateRoi(previousGmv, previousTotalCost);

  // ==================== 管道分布 ====================

  const myPipelineStats = await prisma.collaboration.groupBy({
    by: ['stage'],
    where: {
      factoryId,
      businessStaffId: staffId,
    },
    _count: { id: true },
  });

  const myPipelineDistribution: Record<PipelineStage, number> = {
    LEAD: 0,
    CONTACTED: 0,
    QUOTED: 0,
    SAMPLED: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    REVIEWED: 0,
  };

  for (const stat of myPipelineStats) {
    myPipelineDistribution[stat.stage] = stat._count.id;
  }

  // ==================== 待办事项 ====================

  // 我的超期合作
  const overdueCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      isOverdue: true,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
  });

  // 需要跟进（3天未跟进的合作）
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const allMyCollaborations = await prisma.collaboration.findMany({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const needFollowUp = allMyCollaborations.filter(c => {
    if (c.followUps.length === 0) return true;
    return new Date(c.followUps[0].createdAt) < threeDaysAgo;
  }).length;

  // 待签收样品（我寄出的）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingReceipts = await prisma.sampleDispatch.count({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
      receivedStatus: 'PENDING',
      dispatchedAt: { lt: sevenDaysAgo },
    },
  });

  // 待录入结果（我负责的已上车合作）
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const pendingResults = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { in: ['SCHEDULED', 'PUBLISHED'] },
      result: null,
      dispatches: {
        some: {
          onboardStatus: 'ONBOARD',
          dispatchedAt: { lt: fourteenDaysAgo },
        },
      },
    },
  });

  // ==================== 样品使用统计 ====================

  const myDispatches = await prisma.sampleDispatch.findMany({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
    },
    include: {
      sample: true,
    },
  });

  const sampleMap = new Map<string, {
    sampleId: string;
    sampleName: string;
    sku: string;
    dispatchCount: number;
    totalQuantity: number;
    totalCost: number;
    receivedCount: number;
    onboardCount: number;
  }>();

  for (const dispatch of myDispatches) {
    if (!sampleMap.has(dispatch.sampleId)) {
      sampleMap.set(dispatch.sampleId, {
        sampleId: dispatch.sampleId,
        sampleName: dispatch.sample.name,
        sku: dispatch.sample.sku,
        dispatchCount: 0,
        totalQuantity: 0,
        totalCost: 0,
        receivedCount: 0,
        onboardCount: 0,
      });
    }

    const sampleStat = sampleMap.get(dispatch.sampleId)!;
    sampleStat.dispatchCount += 1;
    sampleStat.totalQuantity += dispatch.quantity;
    sampleStat.totalCost += dispatch.totalCost;
    if (dispatch.receivedStatus === 'RECEIVED') sampleStat.receivedCount += 1;
    if (dispatch.onboardStatus === 'ONBOARD') sampleStat.onboardCount += 1;
  }

  const sampleUsage = Array.from(sampleMap.values()).map(s => ({
    ...s,
    onboardRate: s.dispatchCount > 0 ? s.onboardCount / s.dispatchCount : 0,
  }));

  // 按寄样次数降序排序
  sampleUsage.sort((a, b) => b.dispatchCount - a.dispatchCount);

  // ==================== 最近合作动态 ====================

  const recentActivities: BusinessStaffDashboard['recentActivities'] = [];

  // 最近的阶段变更
  const recentStageChanges = await prisma.stageHistory.findMany({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
    },
    include: {
      collaboration: {
        include: {
          influencer: true,
        },
      },
    },
    orderBy: { changedAt: 'desc' },
    take: 5,
  });

  for (const change of recentStageChanges) {
    recentActivities.push({
      id: change.id,
      type: 'stage_change',
      collaborationId: change.collaborationId,
      influencerName: change.collaboration.influencer.nickname,
      content: `阶段变更: ${change.fromStage ? STAGE_NAMES[change.fromStage] + ' → ' : ''}${STAGE_NAMES[change.toStage]}`,
      createdAt: change.changedAt,
    });
  }

  // 最近的跟进记录
  const recentFollowUps = await prisma.followUpRecord.findMany({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
    },
    include: {
      collaboration: {
        include: {
          influencer: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  for (const followUp of recentFollowUps) {
    recentActivities.push({
      id: followUp.id,
      type: 'follow_up',
      collaborationId: followUp.collaborationId,
      influencerName: followUp.collaboration.influencer.nickname,
      content: `跟进: ${followUp.content.substring(0, 50)}${followUp.content.length > 50 ? '...' : ''}`,
      createdAt: followUp.createdAt,
    });
  }

  // 最近的寄样记录
  const recentDispatchRecords = await prisma.sampleDispatch.findMany({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
    },
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
    },
    orderBy: { dispatchedAt: 'desc' },
    take: 5,
  });

  for (const dispatch of recentDispatchRecords) {
    recentActivities.push({
      id: dispatch.id,
      type: 'dispatch',
      collaborationId: dispatch.collaborationId,
      influencerName: dispatch.collaboration.influencer.nickname,
      content: `寄样: ${dispatch.sample.name} x${dispatch.quantity}`,
      createdAt: dispatch.dispatchedAt,
    });
  }

  // 按时间排序并取前10条
  recentActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const topActivities = recentActivities.slice(0, 10);

  // ==================== 排名信息 ====================

  // 获取所有商务人员的成交数据
  const allStaff = await prisma.user.findMany({
    where: {
      factoryId,
      role: 'BUSINESS_STAFF',
    },
    select: { id: true, name: true },
  });

  const staffPerformance: { staffId: string; name: string; closedCount: number; gmv: number }[] = [];

  for (const staff of allStaff) {
    const staffClosedCount = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staff.id,
        stage: { in: ['PUBLISHED', 'REVIEWED'] },
        createdAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
      },
    });

    const staffResults = await prisma.collaborationResult.findMany({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
        publishedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
      },
    });

    const staffGmv = staffResults.reduce((sum, r) => sum + r.salesGmv, 0);

    staffPerformance.push({
      staffId: staff.id,
      name: staff.name,
      closedCount: staffClosedCount,
      gmv: staffGmv,
    });
  }

  // 按GMV降序排序
  staffPerformance.sort((a, b) => b.gmv - a.gmv);

  const myRank = staffPerformance.findIndex(s => s.staffId === staffId) + 1;
  const myPerformance = staffPerformance.find(s => s.staffId === staffId);
  const topPerformer = staffPerformance[0];

  return {
    metrics: {
      currentPeriod: {
        contactedCount,
        progressedCount,
        closedCount,
        totalGmv,
        totalCost,
        averageRoi,
        dispatchCount,
        dispatchCost,
      },
      periodComparison: {
        contactedChange: calculateChange(contactedCount, previousCollaborations),
        closedChange: calculateChange(closedCount, previousClosedCount),
        gmvChange: calculateChange(totalGmv, previousGmv),
        roiChange: calculateChange(averageRoi, previousRoi),
      },
    },
    myPipelineDistribution,
    pendingItems: {
      overdueCollaborations,
      needFollowUp,
      pendingReceipts,
      pendingResults,
    },
    sampleUsage,
    recentActivities: topActivities,
    ranking: {
      myRank,
      totalStaff: allStaff.length,
      myClosedCount: myPerformance?.closedCount || 0,
      myGmv: myPerformance?.gmv || 0,
      topPerformer: topPerformer && topPerformer.staffId !== staffId ? {
        name: topPerformer.name,
        closedCount: topPerformer.closedCount,
        gmv: topPerformer.gmv,
      } : null,
    },
  };
}


// ==================== 报表导出 ====================

/**
 * 导出商务绩效报表为Excel
 */
export async function exportStaffPerformanceReport(
  factoryId: string,
  dateRange?: DateRange
): Promise<Buffer> {
  const report = await getStaffPerformance(factoryId, dateRange);

  // 准备Excel数据
  const data = report.items.map((item) => ({
    '商务姓名': item.staffName,
    '邮箱': item.staffEmail,
    '建联数量': item.contactedCount,
    '推进数量': item.progressedCount,
    '成交数量': item.closedCount,
    '总GMV（元）': (item.totalGmv / 100).toFixed(2),
    '总成本（元）': (item.totalCost / 100).toFixed(2),
    '平均ROI': item.averageRoi.toFixed(4),
    '寄样数量': item.dispatchCount,
    '寄样成本（元）': (item.dispatchCost / 100).toFixed(2),
  }));

  // 添加汇总行
  data.push({
    '商务姓名': '汇总',
    '邮箱': '',
    '建联数量': report.summary.totalContactedCount,
    '推进数量': report.summary.totalProgressedCount,
    '成交数量': report.summary.totalClosedCount,
    '总GMV（元）': (report.summary.totalGmv / 100).toFixed(2),
    '总成本（元）': (report.summary.totalCost / 100).toFixed(2),
    '平均ROI': report.summary.overallRoi.toFixed(4),
    '寄样数量': report.summary.totalDispatchCount,
    '寄样成本（元）': (report.summary.totalDispatchCost / 100).toFixed(2),
  });

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 15 }, // 商务姓名
    { wch: 25 }, // 邮箱
    { wch: 10 }, // 建联数量
    { wch: 10 }, // 推进数量
    { wch: 10 }, // 成交数量
    { wch: 15 }, // 总GMV
    { wch: 15 }, // 总成本
    { wch: 12 }, // 平均ROI
    { wch: 10 }, // 寄样数量
    { wch: 15 }, // 寄样成本
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '商务绩效');

  // 生成Buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * 导出ROI报表为Excel
 */
export async function exportRoiReport(
  factoryId: string,
  groupBy: 'influencer' | 'sample' | 'staff' | 'month',
  dateRange?: DateRange
): Promise<Buffer> {
  // 获取ROI报表数据（复用result.service中的逻辑）
  const results = await prisma.collaborationResult.findMany({
    where: {
      collaboration: { factoryId },
      ...(dateRange ? {
        publishedAt: { gte: dateRange.startDate, lte: dateRange.endDate },
      } : {}),
    },
    include: {
      collaboration: {
        include: {
          influencer: true,
          businessStaff: { select: { id: true, name: true } },
          dispatches: { include: { sample: true } },
        },
      },
    },
  });

  // 按维度分组
  const groupMap = new Map<string, {
    groupName: string;
    totalCost: number;
    totalGmv: number;
    count: number;
    profitCount: number;
  }>();

  for (const result of results) {
    let groupKey: string;
    let groupName: string;

    switch (groupBy) {
      case 'influencer':
        groupKey = result.collaboration.influencerId;
        groupName = result.collaboration.influencer.nickname;
        break;
      case 'sample':
        const firstDispatch = result.collaboration.dispatches[0];
        if (firstDispatch) {
          groupKey = firstDispatch.sampleId;
          groupName = firstDispatch.sample.name;
        } else {
          groupKey = 'no-sample';
          groupName = '无样品';
        }
        break;
      case 'staff':
        groupKey = result.collaboration.businessStaffId;
        groupName = result.collaboration.businessStaff.name;
        break;
      case 'month':
        const date = new Date(result.publishedAt);
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        groupName = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        break;
      default:
        groupKey = 'all';
        groupName = '全部';
    }

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { groupName, totalCost: 0, totalGmv: 0, count: 0, profitCount: 0 });
    }
    const group = groupMap.get(groupKey)!;
    group.totalCost += result.totalCollaborationCost;
    group.totalGmv += result.salesGmv;
    group.count += 1;
    if (result.roi >= 1) group.profitCount += 1;
  }

  // 准备Excel数据
  const groupByNames: Record<string, string> = {
    influencer: '达人',
    sample: '样品',
    staff: '商务',
    month: '月份',
  };

  const data = Array.from(groupMap.entries()).map(([, group]) => ({
    [groupByNames[groupBy]]: group.groupName,
    '合作数量': group.count,
    '总成本（元）': (group.totalCost / 100).toFixed(2),
    '总GMV（元）': (group.totalGmv / 100).toFixed(2),
    'ROI': calculateRoi(group.totalGmv, group.totalCost).toFixed(4),
    '回本数量': group.profitCount,
    '回本率': group.count > 0 ? `${((group.profitCount / group.count) * 100).toFixed(1)}%` : '0%',
  }));

  // 按ROI降序排序
  data.sort((a, b) => parseFloat(b['ROI']) - parseFloat(a['ROI']));

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'ROI报表');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * 导出合作记录为Excel
 */
export async function exportCollaborationReport(
  factoryId: string,
  dateRange?: DateRange
): Promise<Buffer> {
  const collaborations = await prisma.collaboration.findMany({
    where: {
      factoryId,
      ...(dateRange ? {
        createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
      } : {}),
    },
    include: {
      influencer: true,
      businessStaff: { select: { name: true } },
      dispatches: true,
      result: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = collaborations.map((c) => ({
    '达人昵称': c.influencer.nickname,
    '平台': c.influencer.platform,
    '平台ID': c.influencer.platformId,
    '商务': c.businessStaff.name,
    '阶段': STAGE_NAMES[c.stage],
    '是否超期': c.isOverdue ? '是' : '否',
    '截止时间': c.deadline ? c.deadline.toLocaleDateString('zh-CN') : '',
    '寄样次数': c.dispatches.length,
    '寄样成本（元）': (c.dispatches.reduce((sum, d) => sum + d.totalCost, 0) / 100).toFixed(2),
    '销售GMV（元）': c.result ? (c.result.salesGmv / 100).toFixed(2) : '',
    'ROI': c.result ? c.result.roi.toFixed(4) : '',
    '创建时间': c.createdAt.toLocaleDateString('zh-CN'),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 12 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '合作记录');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}



// ==================== ROI 分析数据 ====================

export interface StaffROIData {
  staffId: string;
  staffName: string;
  totalGmv: number;
  totalCost: number;
  roi: number;
  collaborationCount: number;
}

export interface CostBreakdown {
  sampleCost: number;
  collaborationCost: number;
  otherCost: number;
}

export interface ScatterDataPoint {
  cost: number;
  revenue: number;
  roi: number;
  name: string;
}

export interface ROIAnalysisData {
  byStaff: StaffROIData[];
  costBreakdown: CostBreakdown;
  costVsRevenue: ScatterDataPoint[];
}

/**
 * 获取 ROI 分析数据
 * 用于工厂老板 Dashboard 的 ROI 分析图表
 */
export async function getRoiAnalysis(factoryId: string): Promise<ROIAnalysisData> {
  // ==================== 按商务统计 ROI ====================
  
  const staffMembers = await prisma.user.findMany({
    where: {
      factoryId,
      role: 'BUSINESS_STAFF',
    },
    select: { id: true, name: true },
  });

  const byStaff: StaffROIData[] = [];

  for (const staff of staffMembers) {
    // 获取该商务的所有合作结果
    const results = await prisma.collaborationResult.findMany({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
      },
    });

    if (results.length === 0) continue;

    const totalGmv = results.reduce((sum, r) => sum + r.salesGmv, 0);
    const totalCost = results.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
    const roi = calculateRoi(totalGmv, totalCost);

    byStaff.push({
      staffId: staff.id,
      staffName: staff.name,
      totalGmv,
      totalCost,
      roi,
      collaborationCount: results.length,
    });
  }

  // 按 ROI 降序排序
  byStaff.sort((a, b) => b.roi - a.roi);

  // ==================== 成本构成分析 ====================

  // 样品成本
  const sampleDispatches = await prisma.sampleDispatch.findMany({
    where: {
      collaboration: { factoryId },
    },
  });
  const sampleCost = sampleDispatches.reduce((sum, d) => sum + d.totalCost, 0);

  // 合作成本（从结果中获取）
  const allResults = await prisma.collaborationResult.findMany({
    where: {
      collaboration: { factoryId },
    },
  });
  const collaborationCost = allResults.reduce((sum, r) => sum + r.totalCollaborationCost, 0);

  // 其他成本（暂时为0，可以后续扩展）
  const otherCost = 0;

  const costBreakdown: CostBreakdown = {
    sampleCost,
    collaborationCost,
    otherCost,
  };

  // ==================== 成本-收益散点图数据 ====================

  const costVsRevenue: ScatterDataPoint[] = byStaff.map(staff => ({
    cost: staff.totalCost,
    revenue: staff.totalGmv,
    roi: staff.roi,
    name: staff.staffName,
  }));

  return {
    byStaff,
    costBreakdown,
    costVsRevenue,
  };
}


// ==================== 管道漏斗数据 ====================

export interface PipelineStageData {
  stage: string;
  stageName: string;
  count: number;
  conversionRate: number;
  dropRate: number;
}

export interface PipelineFunnelData {
  stages: PipelineStageData[];
  totalCount: number;
  overallConversionRate: number;
}

/**
 * 获取管道漏斗数据
 * 用于工厂老板 Dashboard 的管道漏斗图
 */
export async function getPipelineFunnel(factoryId: string): Promise<PipelineFunnelData> {
  // 定义管道阶段顺序 - 使用实际的 PipelineStage 枚举值
  const stages: Array<{ stage: PipelineStage; name: string }> = [
    { stage: 'LEAD', name: '线索达人' },
    { stage: 'CONTACTED', name: '已联系' },
    { stage: 'QUOTED', name: '已报价' },
    { stage: 'SAMPLED', name: '已寄样' },
    { stage: 'SCHEDULED', name: '已排期' },
    { stage: 'PUBLISHED', name: '已发布' },
  ];

  const stageData: PipelineStageData[] = [];
  let previousCount = 0;

  for (let i = 0; i < stages.length; i++) {
    const { stage, name } = stages[i];

    // 查询该阶段的合作数量
    const count = await prisma.collaboration.count({
      where: {
        factoryId,
        stage: stage,
      },
    });

    // 计算转化率和流失率
    let conversionRate = 0;
    let dropRate = 0;

    if (i > 0 && previousCount > 0) {
      conversionRate = (count / previousCount) * 100;
      dropRate = 100 - conversionRate;
    }

    stageData.push({
      stage,
      stageName: name,
      count,
      conversionRate,
      dropRate,
    });

    previousCount = count;
  }

  // 计算总合作数（所有阶段的合作总和）
  const totalCount = await prisma.collaboration.count({
    where: { factoryId },
  });

  // 计算总转化率（从第一阶段到最后阶段）
  const firstStageCount = stageData[0]?.count || 0;
  const lastStageCount = stageData[stageData.length - 1]?.count || 0;
  const overallConversionRate =
    firstStageCount > 0 ? (lastStageCount / firstStageCount) * 100 : 0;

  return {
    stages: stageData,
    totalCount,
    overallConversionRate,
  };
}


// ==================== 商务对比分析 ====================

export interface StaffComparisonMetrics {
  leads: number;
  deals: number;
  gmv: number;
  roi: number;
  efficiency: number;
}

export interface StaffComparisonData {
  staffId: string;
  staffName: string;
  metrics: StaffComparisonMetrics;
  normalizedMetrics: StaffComparisonMetrics;
}

export interface StaffComparisonAnalysis {
  staffData: StaffComparisonData[];
  insights: {
    strengths: Record<string, string[]>;
    weaknesses: Record<string, string[]>;
  };
}

/**
 * 获取商务对比分析数据
 * 用于工厂老板 Dashboard 的商务对比分析
 */
export async function getStaffComparison(
  factoryId: string,
  staffIds: string[]
): Promise<StaffComparisonAnalysis> {
  if (staffIds.length < 2 || staffIds.length > 3) {
    throw new Error('请选择2-3个商务进行对比');
  }

  const staffData: StaffComparisonData[] = [];
  const allMetrics: StaffComparisonMetrics[] = [];

  // 获取每个商务的数据
  for (const staffId of staffIds) {
    const staff = await prisma.user.findUnique({
      where: { id: staffId },
      select: { id: true, name: true },
    });

    if (!staff) continue;

    // 建联数（创建的合作数）
    const leads = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staffId,
      },
    });

    // 成交数
    const deals = await prisma.collaboration.count({
      where: {
        factoryId,
        businessStaffId: staffId,
        stage: { in: ['PUBLISHED', 'REVIEWED'] },
      },
    });

    // GMV 和成本
    const results = await prisma.collaborationResult.findMany({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staffId,
        },
      },
    });

    const gmv = results.reduce((sum, r) => sum + r.salesGmv, 0);
    const totalCost = results.reduce((sum, r) => sum + r.totalCollaborationCost, 0);
    const roi = calculateRoi(gmv, totalCost);

    // 效率（平均成交天数的倒数，归一化为0-100）
    const closedCollaborations = await prisma.collaboration.findMany({
      where: {
        factoryId,
        businessStaffId: staffId,
        stage: { in: ['PUBLISHED', 'REVIEWED'] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgDaysToClose = 0;
    if (closedCollaborations.length > 0) {
      const totalDays = closedCollaborations.reduce((sum, c) => {
        const days = Math.floor((c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDaysToClose = totalDays / closedCollaborations.length;
    }

    // 效率分数：天数越少，效率越高（假设30天为基准，超过30天效率降低）
    const efficiency = avgDaysToClose > 0 ? Math.max(0, 100 - (avgDaysToClose / 30) * 100) : 0;

    const metrics: StaffComparisonMetrics = {
      leads,
      deals,
      gmv: gmv / 100, // 转换为元
      roi,
      efficiency,
    };

    allMetrics.push(metrics);

    staffData.push({
      staffId: staff.id,
      staffName: staff.name,
      metrics,
      normalizedMetrics: { ...metrics }, // 稍后归一化
    });
  }

  // 归一化指标（0-100）
  const maxValues: StaffComparisonMetrics = {
    leads: Math.max(...allMetrics.map(m => m.leads), 1),
    deals: Math.max(...allMetrics.map(m => m.deals), 1),
    gmv: Math.max(...allMetrics.map(m => m.gmv), 1),
    roi: Math.max(...allMetrics.map(m => m.roi), 1),
    efficiency: 100, // 效率已经是0-100
  };

  staffData.forEach(staff => {
    staff.normalizedMetrics = {
      leads: (staff.metrics.leads / maxValues.leads) * 100,
      deals: (staff.metrics.deals / maxValues.deals) * 100,
      gmv: (staff.metrics.gmv / maxValues.gmv) * 100,
      roi: (staff.metrics.roi / maxValues.roi) * 100,
      efficiency: staff.metrics.efficiency,
    };
  });

  // 生成优劣势分析
  const insights: StaffComparisonAnalysis['insights'] = {
    strengths: {},
    weaknesses: {},
  };

  staffData.forEach(staff => {
    insights.strengths[staff.staffId] = [];
    insights.weaknesses[staff.staffId] = [];

    // 找出该商务的优势（归一化值 > 70）
    Object.entries(staff.normalizedMetrics).forEach(([key, value]) => {
      if (value > 70) {
        const metricName = {
          leads: '建联能力',
          deals: '成交能力',
          gmv: 'GMV产出',
          roi: 'ROI表现',
          efficiency: '工作效率',
        }[key];
        insights.strengths[staff.staffId].push(metricName || key);
      }
    });

    // 找出该商务的劣势（归一化值 < 40）
    Object.entries(staff.normalizedMetrics).forEach(([key, value]) => {
      if (value < 40) {
        const metricName = {
          leads: '建联能力',
          deals: '成交能力',
          gmv: 'GMV产出',
          roi: 'ROI表现',
          efficiency: '工作效率',
        }[key];
        insights.weaknesses[staff.staffId].push(metricName || key);
      }
    });
  });

  return {
    staffData,
    insights,
  };
}


// ==================== 商务工作质量评分 ====================

export interface QualityScore {
  overall: number;
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
  trend: ScoreTrend[];
  suggestions: string[];
}

export interface ScoreTrend {
  date: string;
  overall: number;
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
}

/**
 * 计算商务工作质量评分
 * 综合评分算法：
 * - 跟进频率 (25%): 基于跟进记录的频率和及时性
 * - 转化率 (30%): 从线索到成交的转化率
 * - ROI (25%): 合作的投资回报率
 * - 效率 (20%): 合作推进速度和完成时间
 */
export async function getStaffQualityScore(
  staffId: string,
  factoryId: string
): Promise<QualityScore> {
  // 获取最近30天的数据
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. 计算跟进频率评分 (0-100)
  const followUpScore = await calculateFollowUpScore(staffId, factoryId, thirtyDaysAgo);

  // 2. 计算转化率评分 (0-100)
  const conversionScore = await calculateConversionScore(staffId, factoryId);

  // 3. 计算 ROI 评分 (0-100)
  const roiScore = await calculateROIScore(staffId, factoryId);

  // 4. 计算效率评分 (0-100)
  const efficiencyScore = await calculateEfficiencyScore(staffId, factoryId);

  // 5. 计算综合评分（加权平均）
  const overall = Math.round(
    followUpScore * 0.25 +
    conversionScore * 0.30 +
    roiScore * 0.25 +
    efficiencyScore * 0.20
  );

  // 6. 获取评分趋势（最近7天）
  const trend = await getScoreTrend(staffId, factoryId, {
    overall,
    followUpFrequency: followUpScore,
    conversionRate: conversionScore,
    roi: roiScore,
    efficiency: efficiencyScore
  });

  // 7. 生成改进建议
  const suggestions = generateSuggestions({
    followUpFrequency: followUpScore,
    conversionRate: conversionScore,
    roi: roiScore,
    efficiency: efficiencyScore
  });

  return {
    overall,
    followUpFrequency: followUpScore,
    conversionRate: conversionScore,
    roi: roiScore,
    efficiency: efficiencyScore,
    trend,
    suggestions
  };
}

/**
 * 计算跟进频率评分
 * 评分标准：
 * - 每个合作平均跟进次数
 * - 跟进的及时性（距离上次跟进的天数）
 * - 活跃合作的跟进覆盖率
 */
async function calculateFollowUpScore(
  staffId: string,
  factoryId: string,
  since: Date
): Promise<number> {
  // 获取该商务的所有活跃合作（非已复盘）
  const activeCollaborations = await prisma.collaboration.findMany({
    where: {
      businessStaffId: staffId,
      factory: {
        id: factoryId
      },
      stage: {
        not: 'REVIEWED'
      }
    },
    include: {
      followUps: {
        where: {
          createdAt: {
            gte: since
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (activeCollaborations.length === 0) {
    return 50; // 没有活跃合作，给予中等分数
  }

  let totalScore = 0;
  const now = new Date();

  for (const collab of activeCollaborations) {
    let collabScore = 0;

    // 1. 跟进次数评分 (0-40分)
    const followUpCount = collab.followUps.length;
    if (followUpCount >= 5) collabScore += 40;
    else if (followUpCount >= 3) collabScore += 30;
    else if (followUpCount >= 1) collabScore += 20;
    else collabScore += 0;

    // 2. 跟进及时性评分 (0-40分)
    if (collab.followUps.length > 0) {
      const lastFollowUp = collab.followUps[0];
      const daysSinceLastFollowUp = Math.floor(
        (now.getTime() - lastFollowUp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastFollowUp <= 2) collabScore += 40;
      else if (daysSinceLastFollowUp <= 5) collabScore += 30;
      else if (daysSinceLastFollowUp <= 7) collabScore += 20;
      else if (daysSinceLastFollowUp <= 14) collabScore += 10;
      else collabScore += 0;
    }

    // 3. 跟进质量评分 (0-20分) - 基于跟进内容长度
    if (collab.followUps.length > 0) {
      const avgContentLength = collab.followUps.reduce((sum, f) => sum + (f.content?.length || 0), 0) / collab.followUps.length;
      if (avgContentLength >= 50) collabScore += 20;
      else if (avgContentLength >= 30) collabScore += 15;
      else if (avgContentLength >= 10) collabScore += 10;
      else collabScore += 5;
    }

    totalScore += collabScore;
  }

  const avgScore = totalScore / activeCollaborations.length;
  return Math.min(100, Math.round(avgScore));
}

/**
 * 计算转化率评分
 * 评分标准：
 * - 从线索到联系的转化率
 * - 从联系到报价的转化率
 * - 从报价到寄样的转化率
 * - 从寄样到成交的转化率
 */
async function calculateConversionScore(
  staffId: string,
  factoryId: string
): Promise<number> {
  // 获取该商务的所有合作
  const allCollaborations = await prisma.collaboration.findMany({
    where: {
      businessStaffId: staffId,
      factory: {
        id: factoryId
      }
    },
    select: {
      stage: true
    }
  });

  if (allCollaborations.length === 0) {
    return 50; // 没有数据，给予中等分数
  }

  const stageCounts = {
    LEAD: 0,
    CONTACTED: 0,
    QUOTED: 0,
    SAMPLED: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    REVIEWED: 0
  };

  // 统计各阶段数量
  allCollaborations.forEach(collab => {
    stageCounts[collab.stage]++;
  });

  // 计算各阶段转化率
  const totalLeads = allCollaborations.length;
  const contactedRate = totalLeads > 0 ? (totalLeads - stageCounts.LEAD) / totalLeads : 0;
  const quotedRate = totalLeads > 0 ? (stageCounts.QUOTED + stageCounts.SAMPLED + stageCounts.SCHEDULED + stageCounts.PUBLISHED + stageCounts.REVIEWED) / totalLeads : 0;
  const sampledRate = totalLeads > 0 ? (stageCounts.SAMPLED + stageCounts.SCHEDULED + stageCounts.PUBLISHED + stageCounts.REVIEWED) / totalLeads : 0;
  const closedRate = totalLeads > 0 ? (stageCounts.PUBLISHED + stageCounts.REVIEWED) / totalLeads : 0;

  // 加权计算总转化率评分
  const score = (
    contactedRate * 20 +  // 联系转化率权重 20%
    quotedRate * 25 +     // 报价转化率权重 25%
    sampledRate * 30 +    // 寄样转化率权重 30%
    closedRate * 25       // 成交转化率权重 25%
  ) * 100;

  return Math.min(100, Math.round(score));
}

/**
 * 计算 ROI 评分
 * 评分标准：
 * - 平均 ROI 值
 * - ROI 的稳定性
 * - 高 ROI 合作的占比
 */
async function calculateROIScore(
  staffId: string,
  factoryId: string
): Promise<number> {
  // 获取该商务已完成的合作及其结果
  const completedCollaborations = await prisma.collaboration.findMany({
    where: {
      businessStaffId: staffId,
      factory: {
        id: factoryId
      },
      stage: {
        in: ['PUBLISHED', 'REVIEWED']
      }
    },
    include: {
      result: true,
      dispatches: {
        include: {
          sample: true
        }
      }
    }
  });

  if (completedCollaborations.length === 0) {
    return 50; // 没有完成的合作，给予中等分数
  }

  const roiValues: number[] = [];

  for (const collab of completedCollaborations) {
    if (!collab.result) continue;

    // 计算总成本
    let totalCost = 0;
    for (const dispatch of collab.dispatches) {
      totalCost += dispatch.totalCost;
    }

    // 计算总GMV
    const totalGmv = collab.result.gmv || 0;

    // 计算ROI
    if (totalCost > 0) {
      const roi = ((totalGmv - totalCost) / totalCost) * 100;
      roiValues.push(roi);
    }
  }

  if (roiValues.length === 0) {
    return 50;
  }

  // 计算平均ROI
  const avgROI = roiValues.reduce((sum, roi) => sum + roi, 0) / roiValues.length;

  // 计算高ROI合作占比 (ROI > 200%)
  const highROICount = roiValues.filter(roi => roi > 200).length;
  const highROIRate = highROICount / roiValues.length;

  // 评分逻辑
  let score = 0;

  // 1. 基于平均ROI (0-70分)
  if (avgROI >= 300) score += 70;
  else if (avgROI >= 200) score += 60;
  else if (avgROI >= 150) score += 50;
  else if (avgROI >= 100) score += 40;
  else if (avgROI >= 50) score += 30;
  else if (avgROI >= 0) score += 20;
  else score += 10;

  // 2. 基于高ROI占比 (0-30分)
  score += highROIRate * 30;

  return Math.min(100, Math.round(score));
}

/**
 * 计算效率评分
 * 评分标准：
 * - 平均成交周期
 * - 阶段推进速度
 * - 超期合作占比
 */
async function calculateEfficiencyScore(
  staffId: string,
  factoryId: string
): Promise<number> {
  // 获取该商务的所有合作
  const collaborations = await prisma.collaboration.findMany({
    where: {
      businessStaffId: staffId,
      factory: {
        id: factoryId
      }
    },
    select: {
      stage: true,
      createdAt: true,
      updatedAt: true,
      deadline: true
    }
  });

  if (collaborations.length === 0) {
    return 50;
  }

  let totalScore = 0;
  const now = new Date();

  // 1. 计算平均推进速度 (0-50分)
  const completedCollabs = collaborations.filter(c => 
    c.stage === 'PUBLISHED' || c.stage === 'REVIEWED'
  );

  if (completedCollabs.length > 0) {
    const avgDaysToComplete = completedCollabs.reduce((sum, c) => {
      const days = Math.floor(
        (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0) / completedCollabs.length;

    if (avgDaysToComplete <= 7) totalScore += 50;
    else if (avgDaysToComplete <= 14) totalScore += 40;
    else if (avgDaysToComplete <= 21) totalScore += 30;
    else if (avgDaysToComplete <= 30) totalScore += 20;
    else totalScore += 10;
  } else {
    totalScore += 25; // 没有完成的合作，给予中等分数
  }

  // 2. 计算超期率 (0-30分)
  const overdueCollabs = collaborations.filter(c => {
    if (!c.deadline) return false;
    if (c.stage === 'PUBLISHED' || c.stage === 'REVIEWED') return false;
    return c.deadline < now;
  });

  const overdueRate = collaborations.length > 0 ? overdueCollabs.length / collaborations.length : 0;
  totalScore += (1 - overdueRate) * 30;

  // 3. 计算活跃度 (0-20分) - 最近更新时间
  const recentlyUpdated = collaborations.filter(c => {
    const daysSinceUpdate = Math.floor(
      (now.getTime() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceUpdate <= 7;
  });

  const activeRate = collaborations.length > 0 ? recentlyUpdated.length / collaborations.length : 0;
  totalScore += activeRate * 20;

  return Math.min(100, Math.round(totalScore));
}

/**
 * 获取评分趋势（最近7天）
 * 简化版：基于当前评分生成模拟趋势数据
 */
async function getScoreTrend(
  staffId: string,
  factoryId: string,
  currentScores: {
    overall: number;
    followUpFrequency: number;
    conversionRate: number;
    roi: number;
    efficiency: number;
  }
): Promise<ScoreTrend[]> {
  const trend: ScoreTrend[] = [];
  const today = new Date();

  // 生成最近7天的评分趋势（基于当前评分添加随机波动）
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // 添加一些随机波动 (-5 到 +5)
    const variation = Math.random() * 10 - 5;

    trend.push({
      date: date.toISOString().split('T')[0],
      overall: Math.max(0, Math.min(100, Math.round(currentScores.overall + variation))),
      followUpFrequency: Math.max(0, Math.min(100, Math.round(currentScores.followUpFrequency + variation))),
      conversionRate: Math.max(0, Math.min(100, Math.round(currentScores.conversionRate + variation))),
      roi: Math.max(0, Math.min(100, Math.round(currentScores.roi + variation))),
      efficiency: Math.max(0, Math.min(100, Math.round(currentScores.efficiency + variation)))
    });
  }

  return trend;
}

/**
 * 生成改进建议
 */
function generateSuggestions(scores: {
  followUpFrequency: number;
  conversionRate: number;
  roi: number;
  efficiency: number;
}): string[] {
  const suggestions: string[] = [];

  // 跟进频率建议
  if (scores.followUpFrequency < 60) {
    suggestions.push('建议增加跟进频率，保持与达人的定期沟通，建议每3-5天跟进一次');
  } else if (scores.followUpFrequency < 80) {
    suggestions.push('跟进频率良好，可以进一步优化跟进内容的质量和针对性');
  }

  // 转化率建议
  if (scores.conversionRate < 60) {
    suggestions.push('转化率偏低，建议优化沟通话术，提高达人合作意愿');
    suggestions.push('可以尝试提供更有吸引力的合作条件或样品');
  } else if (scores.conversionRate < 80) {
    suggestions.push('转化率中等，建议分析流失原因，针对性改进');
  }

  // ROI建议
  if (scores.roi < 60) {
    suggestions.push('ROI表现需要提升，建议选择更匹配的达人，提高合作质量');
    suggestions.push('可以优先选择历史ROI表现好的达人类型');
  } else if (scores.roi < 80) {
    suggestions.push('ROI表现良好，可以总结成功经验，复制到其他合作中');
  }

  // 效率建议
  if (scores.efficiency < 60) {
    suggestions.push('工作效率有待提高，建议优化工作流程，减少不必要的等待时间');
    suggestions.push('及时推进合作进度，避免合作长时间停滞');
  } else if (scores.efficiency < 80) {
    suggestions.push('工作效率中等，可以使用快捷操作功能提高效率');
  }

  // 综合建议
  if (suggestions.length === 0) {
    suggestions.push('各项指标表现优秀，继续保持！');
    suggestions.push('可以分享成功经验，帮助团队其他成员提升');
  }

  return suggestions;
}


// ==================== 商务工作日历 ====================

interface CalendarEvent {
  date: string;
  type: 'deadline' | 'scheduled' | 'followup';
  title: string;
  collaborationId: string;
  influencerName: string;
  stage: string;
}

interface WorkloadData {
  date: string;
  count: number;
  level: 'low' | 'medium' | 'high';
}

interface CalendarData {
  events: CalendarEvent[];
  workload: WorkloadData[];
  stats: {
    totalEvents: number;
    deadlines: number;
    scheduled: number;
    followups: number;
    avgDailyWorkload: number;
  };
}

/**
 * 获取商务工作日历数据
 * 显示指定月份的工作安排，包括：
 * - 截止日期
 * - 排期日期
 * - 跟进提醒
 * - 工作负载热力图
 */
export async function getStaffCalendar(
  staffId: string,
  factoryId: string,
  month: string // 格式: YYYY-MM
): Promise<CalendarData> {
  // 解析月份
  const [year, monthNum] = month.split('-').map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  // 获取该商务在指定月份的所有合作
  const collaborations = await prisma.collaboration.findMany({
    where: {
      businessStaffId: staffId,
      factory: {
        id: factoryId
      },
      OR: [
        // 截止日期在本月
        {
          deadline: {
            gte: startDate,
            lte: endDate
          }
        },
        // 发布日期在本月（通过result关联）
        {
          result: {
            publishedAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        // 创建时间在本月（用于跟进提醒）
        {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      ]
    },
    include: {
      influencer: {
        select: {
          nickname: true
        }
      },
      result: {
        select: {
          publishedAt: true
        }
      },
      followUps: {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  const events: CalendarEvent[] = [];
  const workloadMap = new Map<string, number>();

  // 处理每个合作，生成事件
  for (const collab of collaborations) {
    const influencerName = collab.influencer.nickname;
    const stageNames: Record<string, string> = {
      LEAD: '线索达人',
      CONTACTED: '已联系',
      QUOTED: '已报价',
      SAMPLED: '已寄样',
      SCHEDULED: '已排期',
      PUBLISHED: '已发布',
      REVIEWED: '已复盘'
    };
    const stageName = stageNames[collab.stage] || collab.stage;

    // 1. 截止日期事件
    if (collab.deadline && collab.deadline >= startDate && collab.deadline <= endDate) {
      const dateStr = collab.deadline.toISOString().split('T')[0];
      events.push({
        date: dateStr,
        type: 'deadline',
        title: `${influencerName} - 截止日期`,
        collaborationId: collab.id,
        influencerName,
        stage: stageName
      });
      workloadMap.set(dateStr, (workloadMap.get(dateStr) || 0) + 1);
    }

    // 2. 发布日期事件（排期日期）
    if (collab.result?.publishedAt && collab.result.publishedAt >= startDate && collab.result.publishedAt <= endDate) {
      const dateStr = collab.result.publishedAt.toISOString().split('T')[0];
      events.push({
        date: dateStr,
        type: 'scheduled',
        title: `${influencerName} - 发布排期`,
        collaborationId: collab.id,
        influencerName,
        stage: stageName
      });
      workloadMap.set(dateStr, (workloadMap.get(dateStr) || 0) + 1);
    }

    // 3. 跟进提醒事件（基于最近的跟进记录）
    for (const followUp of collab.followUps) {
      const dateStr = followUp.createdAt.toISOString().split('T')[0];
      events.push({
        date: dateStr,
        type: 'followup',
        title: `${influencerName} - 跟进记录`,
        collaborationId: collab.id,
        influencerName,
        stage: stageName
      });
      workloadMap.set(dateStr, (workloadMap.get(dateStr) || 0) + 1);
    }
  }

  // 生成工作负载数据
  const workload: WorkloadData[] = [];
  const daysInMonth = endDate.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    const count = workloadMap.get(dateStr) || 0;

    // 根据事件数量确定负载等级
    let level: 'low' | 'medium' | 'high' = 'low';
    if (count >= 5) level = 'high';
    else if (count >= 3) level = 'medium';

    workload.push({
      date: dateStr,
      count,
      level
    });
  }

  // 计算统计数据
  const deadlines = events.filter(e => e.type === 'deadline').length;
  const scheduled = events.filter(e => e.type === 'scheduled').length;
  const followups = events.filter(e => e.type === 'followup').length;
  const totalEvents = events.length;
  const avgDailyWorkload = totalEvents / daysInMonth;

  return {
    events,
    workload,
    stats: {
      totalEvents,
      deadlines,
      scheduled,
      followups,
      avgDailyWorkload
    }
  };
}


// ==================== 每日摘要数据 ====================

export interface DailySummaryData {
  overdueCollaborations: number;
  pendingSamples: number;
  pendingResults: number;
  alerts: Alert[];
  highlights: string[];
}

export interface Alert {
  id: string;
  type: 'overdue' | 'pending_sample' | 'pending_result' | 'low_conversion' | 'high_cost';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
}

/**
 * 获取每日摘要数据
 * 用于快捷操作面板
 * Requirements: FR-1.3
 */
export async function getDailySummary(factoryId: string): Promise<DailySummaryData> {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // ==================== 统计超期合作数量 ====================
  const overdueCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      isOverdue: true,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
  });

  // ==================== 统计待签收样品数量 ====================
  // 寄出超过7天未签收的样品
  const pendingSamples = await prisma.sampleDispatch.count({
    where: {
      collaboration: { factoryId },
      receivedStatus: 'PENDING',
      dispatchedAt: { lt: sevenDaysAgo },
    },
  });

  // ==================== 统计待录入结果数量 ====================
  // 已上车但超过14天未录入结果的合作
  const pendingResults = await prisma.collaboration.count({
    where: {
      factoryId,
      stage: { in: ['SCHEDULED', 'PUBLISHED'] },
      result: null,
      dispatches: {
        some: {
          onboardStatus: 'ONBOARD',
          dispatchedAt: { lt: fourteenDaysAgo },
        },
      },
    },
  });

  // ==================== 生成预警信息 ====================
  const alerts: Alert[] = [];

  // 1. 超期合作预警
  if (overdueCollaborations > 0) {
    alerts.push({
      id: 'overdue-collaborations',
      type: 'overdue',
      title: '超期合作预警',
      description: `有 ${overdueCollaborations} 个合作已超过截止日期，请及时跟进处理`,
      severity: overdueCollaborations > 10 ? 'high' : overdueCollaborations > 5 ? 'medium' : 'low',
      createdAt: now,
    });
  }

  // 2. 待签收样品预警
  if (pendingSamples > 0) {
    alerts.push({
      id: 'pending-samples',
      type: 'pending_sample',
      title: '待签收样品提醒',
      description: `有 ${pendingSamples} 个样品寄出超过7天未签收，请联系达人确认`,
      severity: pendingSamples > 10 ? 'high' : pendingSamples > 5 ? 'medium' : 'low',
      createdAt: now,
    });
  }

  // 3. 待录入结果预警
  if (pendingResults > 0) {
    alerts.push({
      id: 'pending-results',
      type: 'pending_result',
      title: '待录入结果提醒',
      description: `有 ${pendingResults} 个合作已上车超过14天未录入结果，请及时录入数据`,
      severity: pendingResults > 10 ? 'high' : pendingResults > 5 ? 'medium' : 'low',
      createdAt: now,
    });
  }

  // 4. 低转化率预警（本月转化率低于20%）
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      createdAt: { gte: thisMonthStart },
    },
  });

  const thisMonthClosed = await prisma.collaboration.count({
    where: {
      factoryId,
      createdAt: { gte: thisMonthStart },
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
    },
  });

  const conversionRate = thisMonthCollaborations > 0 ? (thisMonthClosed / thisMonthCollaborations) * 100 : 0;

  if (thisMonthCollaborations >= 10 && conversionRate < 20) {
    alerts.push({
      id: 'low-conversion',
      type: 'low_conversion',
      title: '转化率偏低',
      description: `本月转化率为 ${conversionRate.toFixed(1)}%，低于正常水平，建议优化跟进策略`,
      severity: conversionRate < 10 ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // 5. 成本异常预警（本月成本比上月增长超过50%）
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const thisMonthDispatches = await prisma.sampleDispatch.findMany({
    where: {
      collaboration: { factoryId },
      dispatchedAt: { gte: thisMonthStart },
    },
  });
  const thisMonthCost = thisMonthDispatches.reduce((sum, d) => sum + d.totalCost, 0);

  const lastMonthDispatches = await prisma.sampleDispatch.findMany({
    where: {
      collaboration: { factoryId },
      dispatchedAt: { gte: lastMonthStart, lte: lastMonthEnd },
    },
  });
  const lastMonthCost = lastMonthDispatches.reduce((sum, d) => sum + d.totalCost, 0);

  if (lastMonthCost > 0 && thisMonthCost > lastMonthCost * 1.5) {
    const costIncrease = ((thisMonthCost - lastMonthCost) / lastMonthCost) * 100;
    alerts.push({
      id: 'high-cost',
      type: 'high_cost',
      title: '成本异常增长',
      description: `本月寄样成本比上月增长 ${costIncrease.toFixed(1)}%，请注意控制成本`,
      severity: costIncrease > 100 ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // 按严重程度排序
  alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  // ==================== 生成亮点信息 ====================
  const highlights: string[] = [];

  // 1. 本周新增成交
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay() + 1);
  thisWeekStart.setHours(0, 0, 0, 0);

  const thisWeekClosed = await prisma.collaboration.count({
    where: {
      factoryId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { gte: thisWeekStart },
    },
  });

  if (thisWeekClosed > 0) {
    highlights.push(`本周新增 ${thisWeekClosed} 个成交合作`);
  }

  // 2. 本周高ROI合作
  const thisWeekResults = await prisma.collaborationResult.findMany({
    where: {
      collaboration: { factoryId },
      publishedAt: { gte: thisWeekStart },
      roi: { gte: 2 },
    },
    include: {
      collaboration: {
        include: {
          influencer: { select: { nickname: true } },
        },
      },
    },
    orderBy: { roi: 'desc' },
    take: 1,
  });

  if (thisWeekResults.length > 0) {
    const topResult = thisWeekResults[0];
    highlights.push(
      `${topResult.collaboration.influencer.nickname} 的合作ROI达到 ${topResult.roi.toFixed(2)}，表现优异`
    );
  }

  // 3. 团队效率提升
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(lastWeekEnd.getMilliseconds() - 1);

  const lastWeekClosed = await prisma.collaboration.count({
    where: {
      factoryId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { gte: lastWeekStart, lte: lastWeekEnd },
    },
  });

  if (lastWeekClosed > 0 && thisWeekClosed > lastWeekClosed) {
    const improvement = ((thisWeekClosed - lastWeekClosed) / lastWeekClosed) * 100;
    highlights.push(`团队效率提升 ${improvement.toFixed(0)}%，继续保持`);
  }

  return {
    overdueCollaborations,
    pendingSamples,
    pendingResults,
    alerts,
    highlights,
  };
}

// ==================== 智能提醒系统 ====================

export interface SmartAlert {
  id: string;
  type: 'summary' | 'warning' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface SmartAlertsResponse {
  alerts: SmartAlert[];
  unreadCount: number;
}

/**
 * 获取智能提醒列表
 * 生成每日工作摘要、异常预警和重要节点提醒
 * Requirements: FR-1.3
 */
export async function getSmartAlerts(factoryId: string, userId?: string): Promise<SmartAlertsResponse> {
  const now = new Date();
  const alerts: SmartAlert[] = [];

  // ==================== 1. 每日工作摘要 ====================
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // 今日新增合作
  const todayNewCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      createdAt: { gte: todayStart, lt: todayEnd },
    },
  });

  // 今日推进合作
  const todayProgressedCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      updatedAt: { gte: todayStart, lt: todayEnd },
      createdAt: { lt: todayStart },
    },
  });

  // 今日成交
  const todayClosedDeals = await prisma.collaboration.count({
    where: {
      factoryId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { gte: todayStart, lt: todayEnd },
    },
  });

  if (todayNewCollaborations > 0 || todayProgressedCollaborations > 0 || todayClosedDeals > 0) {
    alerts.push({
      id: `summary-${now.getTime()}`,
      type: 'summary',
      priority: 'low',
      title: '今日工作摘要',
      description: `今日新增 ${todayNewCollaborations} 个合作，推进 ${todayProgressedCollaborations} 个合作，成交 ${todayClosedDeals} 个合作`,
      timestamp: now,
      read: false,
      actionUrl: '/app/dashboard',
      actionLabel: '查看详情',
    });
  }

  // ==================== 2. 异常预警 ====================
  
  // 2.1 超期合作预警
  const overdueCollaborations = await prisma.collaboration.findMany({
    where: {
      factoryId,
      isOverdue: true,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
    include: {
      influencer: { select: { nickname: true } },
      businessStaff: { select: { name: true } },
    },
    take: 5,
  });

  if (overdueCollaborations.length > 0) {
    const totalOverdue = await prisma.collaboration.count({
      where: {
        factoryId,
        isOverdue: true,
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      },
    });

    alerts.push({
      id: `warning-overdue-${now.getTime()}`,
      type: 'warning',
      priority: totalOverdue > 10 ? 'high' : totalOverdue > 5 ? 'medium' : 'low',
      title: '超期合作预警',
      description: `有 ${totalOverdue} 个合作已超过截止日期，需要立即处理`,
      timestamp: now,
      read: false,
      actionUrl: '/app/pipeline?filter=overdue',
      actionLabel: '立即处理',
      metadata: {
        count: totalOverdue,
        samples: overdueCollaborations.map(c => ({
          id: c.id,
          influencer: c.influencer.nickname,
          staff: c.businessStaff?.name,
          deadline: c.deadline,
        })),
      },
    });
  }

  // 2.2 长时间未跟进预警
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const stuckCollaborations = await prisma.collaboration.findMany({
    where: {
      factoryId,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { lt: sevenDaysAgo },
    },
    include: {
      influencer: { select: { nickname: true } },
      businessStaff: { select: { name: true } },
    },
    take: 5,
  });

  if (stuckCollaborations.length > 0) {
    const totalStuck = await prisma.collaboration.count({
      where: {
        factoryId,
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
        updatedAt: { lt: sevenDaysAgo },
      },
    });

    alerts.push({
      id: `warning-stuck-${now.getTime()}`,
      type: 'warning',
      priority: totalStuck > 10 ? 'high' : 'medium',
      title: '长时间未跟进',
      description: `有 ${totalStuck} 个合作超过7天未更新，可能需要重新激活`,
      timestamp: now,
      read: false,
      actionUrl: '/app/pipeline?filter=stuck',
      actionLabel: '查看详情',
      metadata: {
        count: totalStuck,
        samples: stuckCollaborations.map(c => ({
          id: c.id,
          influencer: c.influencer.nickname,
          staff: c.businessStaff?.name,
          lastUpdate: c.updatedAt,
        })),
      },
    });
  }

  // 2.3 待签收样品预警
  const pendingSamples = await prisma.sampleDispatch.findMany({
    where: {
      collaboration: { factoryId },
      receivedStatus: 'PENDING',
      dispatchedAt: { lt: sevenDaysAgo },
    },
    include: {
      collaboration: {
        include: {
          influencer: { select: { nickname: true } },
        },
      },
    },
    take: 5,
  });

  if (pendingSamples.length > 0) {
    const totalPending = await prisma.sampleDispatch.count({
      where: {
        collaboration: { factoryId },
        receivedStatus: 'PENDING',
        dispatchedAt: { lt: sevenDaysAgo },
      },
    });

    alerts.push({
      id: `warning-samples-${now.getTime()}`,
      type: 'warning',
      priority: totalPending > 10 ? 'high' : 'medium',
      title: '待签收样品提醒',
      description: `有 ${totalPending} 个样品寄出超过7天未签收，请联系达人确认`,
      timestamp: now,
      read: false,
      actionUrl: '/app/samples?filter=pending',
      actionLabel: '查看详情',
      metadata: {
        count: totalPending,
        samples: pendingSamples.map(s => ({
          id: s.id,
          influencer: s.collaboration.influencer.nickname,
          dispatchedAt: s.dispatchedAt,
        })),
      },
    });
  }

  // 2.4 低转化率预警
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCollaborations = await prisma.collaboration.count({
    where: {
      factoryId,
      createdAt: { gte: thisMonthStart },
    },
  });

  const thisMonthClosed = await prisma.collaboration.count({
    where: {
      factoryId,
      createdAt: { gte: thisMonthStart },
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
    },
  });

  const conversionRate = thisMonthCollaborations > 0 ? (thisMonthClosed / thisMonthCollaborations) * 100 : 0;

  if (thisMonthCollaborations >= 10 && conversionRate < 20) {
    alerts.push({
      id: `warning-conversion-${now.getTime()}`,
      type: 'warning',
      priority: conversionRate < 10 ? 'high' : 'medium',
      title: '转化率偏低',
      description: `本月转化率为 ${conversionRate.toFixed(1)}%，低于正常水平（20%），建议优化跟进策略`,
      timestamp: now,
      read: false,
      actionUrl: '/app/reports',
      actionLabel: '查看分析',
      metadata: {
        conversionRate,
        totalCollaborations: thisMonthCollaborations,
        closedDeals: thisMonthClosed,
      },
    });
  }

  // ==================== 3. 重要节点提醒 ====================
  
  // 3.1 即将到期的合作（3天内）
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const upcomingDeadlines = await prisma.collaboration.findMany({
    where: {
      factoryId,
      deadline: { gte: now, lte: threeDaysLater },
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
    include: {
      influencer: { select: { nickname: true } },
      businessStaff: { select: { name: true } },
    },
    orderBy: { deadline: 'asc' },
    take: 5,
  });

  if (upcomingDeadlines.length > 0) {
    const totalUpcoming = await prisma.collaboration.count({
      where: {
        factoryId,
        deadline: { gte: now, lte: threeDaysLater },
        stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      },
    });

    alerts.push({
      id: `reminder-deadline-${now.getTime()}`,
      type: 'reminder',
      priority: 'high',
      title: '即将到期提醒',
      description: `有 ${totalUpcoming} 个合作将在3天内到期，请抓紧推进`,
      timestamp: now,
      read: false,
      actionUrl: '/app/pipeline?filter=upcoming',
      actionLabel: '查看详情',
      metadata: {
        count: totalUpcoming,
        samples: upcomingDeadlines.map(c => ({
          id: c.id,
          influencer: c.influencer.nickname,
          staff: c.businessStaff?.name,
          deadline: c.deadline,
        })),
      },
    });
  }

  // 3.2 即将排期的合作（7天内）
  // Note: scheduledDate field doesn't exist in Collaboration model
  // This feature would require a schema update to add scheduledDate field
  /*
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const upcomingSchedules = await prisma.collaboration.findMany({
    where: {
      factoryId,
      scheduledDate: { gte: now, lte: sevenDaysLater },
      stage: 'SCHEDULED',
    },
    include: {
      influencer: { select: { nickname: true } },
      businessStaff: { select: { name: true } },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 5,
  });

  if (upcomingSchedules.length > 0) {
    const totalSchedules = await prisma.collaboration.count({
      where: {
        factoryId,
        scheduledDate: { gte: now, lte: sevenDaysLater },
        stage: 'SCHEDULED',
      },
    });

    alerts.push({
      id: `reminder-schedule-${now.getTime()}`,
      type: 'reminder',
      priority: 'medium',
      title: '即将排期提醒',
      description: `有 ${totalSchedules} 个合作将在7天内排期发布，请做好准备`,
      timestamp: now,
      read: false,
      actionUrl: '/app/pipeline?stage=SCHEDULED',
      actionLabel: '查看详情',
      metadata: {
        count: totalSchedules,
        samples: upcomingSchedules.map(c => ({
          id: c.id,
          influencer: c.influencer.nickname,
          staff: c.businessStaff?.name,
          scheduledDate: c.scheduledDate,
        })),
      },
    });
  }
  */

  // 3.3 待录入结果提醒（发布超过7天）
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const pendingResults = await prisma.collaboration.findMany({
    where: {
      factoryId,
      stage: { in: ['SCHEDULED', 'PUBLISHED'] },
      result: null,
      dispatches: {
        some: {
          onboardStatus: 'ONBOARD',
          dispatchedAt: { lt: fourteenDaysAgo },
        },
      },
    },
    include: {
      influencer: { select: { nickname: true } },
      businessStaff: { select: { name: true } },
    },
    take: 5,
  });

  if (pendingResults.length > 0) {
    const totalPendingResults = await prisma.collaboration.count({
      where: {
        factoryId,
        stage: { in: ['SCHEDULED', 'PUBLISHED'] },
        result: null,
        dispatches: {
          some: {
            onboardStatus: 'ONBOARD',
            dispatchedAt: { lt: fourteenDaysAgo },
          },
        },
      },
    });

    alerts.push({
      id: `reminder-results-${now.getTime()}`,
      type: 'reminder',
      priority: 'medium',
      title: '待录入结果提醒',
      description: `有 ${totalPendingResults} 个合作已上车超过14天未录入结果，请及时录入数据`,
      timestamp: now,
      read: false,
      actionUrl: '/app/results?filter=pending',
      actionLabel: '立即录入',
      metadata: {
        count: totalPendingResults,
        samples: pendingResults.map(c => ({
          id: c.id,
          influencer: c.influencer.nickname,
          staff: c.businessStaff?.name,
        })),
      },
    });
  }

  // ==================== 按优先级和时间排序 ====================
  alerts.sort((a, b) => {
    // 先按优先级排序
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // 优先级相同，按时间排序（新的在前）
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // 计算未读数量
  const unreadCount = alerts.filter(a => !a.read).length;

  return {
    alerts,
    unreadCount,
  };
}

/**
 * 标记提醒为已读
 * Requirements: FR-1.3
 */
export async function markAlertAsRead(alertId: string, userId: string): Promise<void> {
  // 这里可以将已读状态存储到数据库中
  // 为了简化，暂时不实现持久化存储
  // 实际应用中可以创建一个 AlertReadStatus 表来记录用户的已读状态
  console.log(`Alert ${alertId} marked as read by user ${userId}`);
}

/**
 * 标记所有提醒为已读
 * Requirements: FR-1.3
 */
export async function markAllAlertsAsRead(userId: string, factoryId: string): Promise<void> {
  // 这里可以将所有提醒标记为已读
  // 为了简化，暂时不实现持久化存储
  console.log(`All alerts marked as read by user ${userId} for factory ${factoryId}`);
}


// ==================== 今日工作清单 ====================

export interface TodoItem {
  id: string;
  type: 'followup' | 'deadline' | 'dispatch' | 'result';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueTime?: Date;
  relatedId: string;
  completed?: boolean;
  snoozedUntil?: Date;
}

export interface TodayGoal {
  type: 'followup' | 'dispatch' | 'deal';
  target: number;
  current: number;
  label: string;
}

export interface TodayTodosResponse {
  todos: TodoItem[];
  goals: TodayGoal[];
  summary: {
    total: number;
    completed: number;
    overdue: number;
  };
}

/**
 * 获取今日待办事项
 * Requirements: FR-2.4
 */
export async function getTodayTodos(
  factoryId: string,
  staffId: string
): Promise<TodayTodosResponse> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todos: TodoItem[] = [];

  // ==================== 1. 需要跟进的合作 ====================
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const collaborationsNeedingFollowUp = await prisma.collaboration.findMany({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
    },
    include: {
      influencer: true,
      followUps: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  for (const collab of collaborationsNeedingFollowUp) {
    const lastFollowUp = collab.followUps[0];
    const needsFollowUp = !lastFollowUp || new Date(lastFollowUp.createdAt) < threeDaysAgo;

    if (needsFollowUp) {
      const daysSinceLastFollowUp = lastFollowUp
        ? Math.floor((now.getTime() - new Date(lastFollowUp.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      todos.push({
        id: `followup-${collab.id}`,
        type: 'followup',
        title: `跟进 ${collab.influencer.nickname}`,
        description: `${daysSinceLastFollowUp > 7 ? '长时间未跟进' : '需要跟进'}，当前阶段：${getStageLabel(collab.stage)}`,
        priority: daysSinceLastFollowUp > 7 ? 'high' : daysSinceLastFollowUp > 5 ? 'medium' : 'low',
        dueTime: lastFollowUp ? new Date(new Date(lastFollowUp.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000) : undefined,
        relatedId: collab.id,
      });
    }
  }

  // ==================== 2. 即将到期的合作 ====================
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const upcomingDeadlines = await prisma.collaboration.findMany({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      deadline: {
        gte: now,
        lte: threeDaysLater,
      },
    },
    include: {
      influencer: true,
    },
  });

  for (const collab of upcomingDeadlines) {
    const daysUntilDeadline = Math.ceil((new Date(collab.deadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    todos.push({
      id: `deadline-${collab.id}`,
      type: 'deadline',
      title: `${collab.influencer.nickname} 即将到期`,
      description: `还有 ${daysUntilDeadline} 天到期，当前阶段：${getStageLabel(collab.stage)}`,
      priority: daysUntilDeadline <= 1 ? 'high' : daysUntilDeadline <= 2 ? 'medium' : 'low',
      dueTime: collab.deadline!,
      relatedId: collab.id,
    });
  }

  // ==================== 3. 超期的合作 ====================
  const overdueCollaborations = await prisma.collaboration.findMany({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
      deadline: {
        lt: now,
      },
    },
    include: {
      influencer: true,
    },
  });

  for (const collab of overdueCollaborations) {
    const daysOverdue = Math.floor((now.getTime() - new Date(collab.deadline!).getTime()) / (1000 * 60 * 60 * 24));

    todos.push({
      id: `overdue-${collab.id}`,
      type: 'deadline',
      title: `${collab.influencer.nickname} 已超期`,
      description: `已超期 ${daysOverdue} 天，当前阶段：${getStageLabel(collab.stage)}`,
      priority: 'high',
      dueTime: collab.deadline!,
      relatedId: collab.id,
    });
  }

  // ==================== 4. 待签收样品 ====================
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const pendingDispatches = await prisma.sampleDispatch.findMany({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
      receivedStatus: 'PENDING',
      dispatchedAt: { lt: sevenDaysAgo },
    },
    include: {
      collaboration: {
        include: {
          influencer: true,
        },
      },
      sample: true,
    },
  });

  for (const dispatch of pendingDispatches) {
    const daysSinceDispatch = Math.floor((now.getTime() - new Date(dispatch.dispatchedAt).getTime()) / (1000 * 60 * 60 * 24));

    todos.push({
      id: `dispatch-${dispatch.id}`,
      type: 'dispatch',
      title: `确认 ${dispatch.collaboration.influencer.nickname} 签收`,
      description: `${dispatch.sample.name} 已寄出 ${daysSinceDispatch} 天，待确认签收`,
      priority: daysSinceDispatch > 14 ? 'high' : daysSinceDispatch > 10 ? 'medium' : 'low',
      dueTime: new Date(new Date(dispatch.dispatchedAt).getTime() + 7 * 24 * 60 * 60 * 1000),
      relatedId: dispatch.id,
    });
  }

  // ==================== 5. 待录入结果 ====================
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const collaborationsNeedingResults = await prisma.collaboration.findMany({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { in: ['SCHEDULED', 'PUBLISHED'] },
      result: null,
      dispatches: {
        some: {
          onboardStatus: 'ONBOARD',
          dispatchedAt: { lt: fourteenDaysAgo },
        },
      },
    },
    include: {
      influencer: true,
      dispatches: {
        where: {
          onboardStatus: 'ONBOARD',
        },
        orderBy: {
          dispatchedAt: 'asc',
        },
        take: 1,
      },
    },
  });

  for (const collab of collaborationsNeedingResults) {
    const dispatch = collab.dispatches[0];
    const daysSinceOnboard = Math.floor((now.getTime() - new Date(dispatch.dispatchedAt).getTime()) / (1000 * 60 * 60 * 24));

    todos.push({
      id: `result-${collab.id}`,
      type: 'result',
      title: `录入 ${collab.influencer.nickname} 的结果`,
      description: `已上车 ${daysSinceOnboard} 天，待录入合作结果`,
      priority: daysSinceOnboard > 30 ? 'high' : daysSinceOnboard > 21 ? 'medium' : 'low',
      dueTime: new Date(new Date(dispatch.dispatchedAt).getTime() + 14 * 24 * 60 * 60 * 1000),
      relatedId: collab.id,
    });
  }

  // ==================== 今日目标 ====================
  const goals: TodayGoal[] = [];

  // 今日跟进目标（假设每天至少跟进5个合作）
  const todayFollowUps = await prisma.followUpRecord.count({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
      createdAt: { gte: todayStart, lt: todayEnd },
    },
  });

  goals.push({
    type: 'followup',
    target: 5,
    current: todayFollowUps,
    label: '今日跟进',
  });

  // 今日寄样目标（假设每天至少寄样2次）
  const todayDispatches = await prisma.sampleDispatch.count({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
      dispatchedAt: { gte: todayStart, lt: todayEnd },
    },
  });

  goals.push({
    type: 'dispatch',
    target: 2,
    current: todayDispatches,
    label: '今日寄样',
  });

  // 今日成交目标（假设每天至少成交1单）
  const todayDeals = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { gte: todayStart, lt: todayEnd },
    },
  });

  goals.push({
    type: 'deal',
    target: 1,
    current: todayDeals,
    label: '今日成交',
  });

  // ==================== 统计信息 ====================
  const overdueTodos = todos.filter(t => t.dueTime && new Date(t.dueTime) < now).length;

  return {
    todos,
    goals,
    summary: {
      total: todos.length,
      completed: 0, // 这里暂时返回0，实际应该从数据库中查询已完成的待办
      overdue: overdueTodos,
    },
  };
}

/**
 * 获取阶段标签
 */
function getStageLabel(stage: PipelineStage): string {
  const labels: Record<PipelineStage, string> = {
    LEAD: '线索',
    CONTACTED: '已联系',
    QUOTED: '已报价',
    SAMPLED: '已寄样',
    SCHEDULED: '已排期',
    PUBLISHED: '已发布',
    REVIEWED: '已复盘',
  };
  return labels[stage] || stage;
}


// ==================== 工作统计 ====================

export interface WorkStats {
  leadsAdded: number;
  collaborationsCreated: number;
  samplesDispatched: number;
  followUpsCompleted: number;
  dealsCompleted: number;
  gmv: number;
  goalProgress: number;
  rankChange: number;
}

export interface WorkStatsTrend {
  date: string;
  leadsAdded: number;
  collaborationsCreated: number;
  dealsCompleted: number;
  gmv: number;
}

export interface WorkStatsResponse {
  stats: WorkStats;
  trend: WorkStatsTrend[];
}

/**
 * 获取商务人员工作统计
 * Requirements: FR-2.4
 */
export async function getWorkStats(
  factoryId: string,
  staffId: string,
  period: 'today' | 'week' | 'month' = 'week'
): Promise<WorkStatsResponse> {
  const now = new Date();
  
  // 计算当前周期的日期范围
  let currentPeriodStart: Date;
  let previousPeriodStart: Date;
  let previousPeriodEnd: Date;
  
  if (period === 'today') {
    // 今日
    currentPeriodStart = new Date(now);
    currentPeriodStart.setHours(0, 0, 0, 0);
    
    // 昨日
    previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(-1);
  } else if (period === 'week') {
    // 本周开始（周一）
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - diff);
    currentPeriodStart.setHours(0, 0, 0, 0);
    
    // 上周
    previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(-1);
  } else {
    // 本月开始
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 上月
    previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(-1);
  }

  const currentPeriod: DateRange = {
    startDate: currentPeriodStart,
    endDate: now,
  };

  // ==================== 统计当前周期数据 ====================

  // 1. 建联数（创建的达人数）
  const leadsAdded = await prisma.influencer.count({
    where: {
      createdBy: staffId,
      createdAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  // 2. 创建的合作数
  const collaborationsCreated = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      createdAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  // 3. 寄样次数
  const samplesDispatched = await prisma.sampleDispatch.count({
    where: {
      businessStaffId: staffId,
      collaboration: { factoryId },
      dispatchedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  // 4. 跟进次数
  const followUpsCompleted = await prisma.followUpRecord.count({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
      createdAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  // 5. 成交数
  const dealsCompleted = await prisma.collaboration.count({
    where: {
      factoryId,
      businessStaffId: staffId,
      stage: { in: ['PUBLISHED', 'REVIEWED'] },
      updatedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  // 6. GMV
  const results = await prisma.collaborationResult.findMany({
    where: {
      collaboration: {
        factoryId,
        businessStaffId: staffId,
      },
      publishedAt: { gte: currentPeriod.startDate, lte: currentPeriod.endDate },
    },
  });

  const gmv = results.reduce((sum, r) => sum + r.salesGmv, 0);

  // ==================== 计算目标完成度 ====================

  // 根据周期设置不同的目标
  let targetDeals = 0;
  let targetGmv = 0;

  if (period === 'today') {
    targetDeals = 1; // 今日目标：1单
    targetGmv = 50000; // 今日目标：500元
  } else if (period === 'week') {
    targetDeals = 5; // 本周目标：5单
    targetGmv = 500000; // 本周目标：5000元
  } else {
    targetDeals = 20; // 本月目标：20单
    targetGmv = 2000000; // 本月目标：20000元
  }

  // 计算完成度（取成交数和GMV的平均值）
  const dealsProgress = targetDeals > 0 ? (dealsCompleted / targetDeals) * 100 : 0;
  const gmvProgress = targetGmv > 0 ? (gmv / targetGmv) * 100 : 0;
  const goalProgress = Math.round((dealsProgress + gmvProgress) / 2);

  // ==================== 计算排名变化 ====================

  // 获取当前周期排名
  const currentRanking = await getStaffRanking(factoryId, currentPeriod);
  const currentRank = currentRanking.findIndex(s => s.staffId === staffId) + 1;

  // 获取上一周期排名
  const previousPeriod: DateRange = {
    startDate: previousPeriodStart,
    endDate: previousPeriodEnd,
  };
  const previousRanking = await getStaffRanking(factoryId, previousPeriod);
  const previousRank = previousRanking.findIndex(s => s.staffId === staffId) + 1;

  // 计算排名变化（正数表示上升，负数表示下降）
  const rankChange = previousRank > 0 && currentRank > 0 ? previousRank - currentRank : 0;

  // ==================== 生成趋势数据 ====================

  const trend: WorkStatsTrend[] = [];

  if (period === 'today') {
    // 今日趋势：按小时统计（最近8小时）
    for (let i = 7; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const hourLeads = await prisma.influencer.count({
        where: {
          createdBy: staffId,
          createdAt: { gte: hourStart, lt: hourEnd },
        },
      });

      const hourCollabs = await prisma.collaboration.count({
        where: {
          factoryId,
          businessStaffId: staffId,
          createdAt: { gte: hourStart, lt: hourEnd },
        },
      });

      const hourDeals = await prisma.collaboration.count({
        where: {
          factoryId,
          businessStaffId: staffId,
          stage: { in: ['PUBLISHED', 'REVIEWED'] },
          updatedAt: { gte: hourStart, lt: hourEnd },
        },
      });

      const hourResults = await prisma.collaborationResult.findMany({
        where: {
          collaboration: {
            factoryId,
            businessStaffId: staffId,
          },
          publishedAt: { gte: hourStart, lt: hourEnd },
        },
      });

      const hourGmv = hourResults.reduce((sum, r) => sum + r.salesGmv, 0);

      trend.push({
        date: `${hourStart.getHours()}:00`,
        leadsAdded: hourLeads,
        collaborationsCreated: hourCollabs,
        dealsCompleted: hourDeals,
        gmv: hourGmv / 100, // 转换为元
      });
    }
  } else if (period === 'week') {
    // 本周趋势：按天统计
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(currentPeriodStart);
      dayStart.setDate(dayStart.getDate() + (6 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLeads = await prisma.influencer.count({
        where: {
          createdBy: staffId,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const dayCollabs = await prisma.collaboration.count({
        where: {
          factoryId,
          businessStaffId: staffId,
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const dayDeals = await prisma.collaboration.count({
        where: {
          factoryId,
          businessStaffId: staffId,
          stage: { in: ['PUBLISHED', 'REVIEWED'] },
          updatedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const dayResults = await prisma.collaborationResult.findMany({
        where: {
          collaboration: {
            factoryId,
            businessStaffId: staffId,
          },
          publishedAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const dayGmv = dayResults.reduce((sum, r) => sum + r.salesGmv, 0);

      trend.push({
        date: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        leadsAdded: dayLeads,
        collaborationsCreated: dayCollabs,
        dealsCompleted: dayDeals,
        gmv: dayGmv / 100, // 转换为元
      });
    }
  } else {
    // 本月趋势：按周统计
    const weeksInMonth = Math.ceil((now.getDate() - currentPeriodStart.getDate() + 1) / 7);
    
    for (let i = 0; i < Math.min(weeksInMonth, 4); i++) {
      const weekStart = new Date(currentPeriodStart);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // 确保不超过当前时间
      if (weekEnd > now) {
        weekEnd.setTime(now.getTime());
      }

      const weekLeads = await prisma.influencer.count({
        where: {
          createdBy: staffId,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      });

      const weekCollabs = await prisma.collaboration.count({
        where: {
          factoryId,
          businessStaffId: staffId,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      });

      const weekDeals = await prisma.collaboration.count({
        where: {
          factoryId,
          businessStaffId: staffId,
          stage: { in: ['PUBLISHED', 'REVIEWED'] },
          updatedAt: { gte: weekStart, lte: weekEnd },
        },
      });

      const weekResults = await prisma.collaborationResult.findMany({
        where: {
          collaboration: {
            factoryId,
            businessStaffId: staffId,
          },
          publishedAt: { gte: weekStart, lte: weekEnd },
        },
      });

      const weekGmv = weekResults.reduce((sum, r) => sum + r.salesGmv, 0);

      trend.push({
        date: `第${i + 1}周`,
        leadsAdded: weekLeads,
        collaborationsCreated: weekCollabs,
        dealsCompleted: weekDeals,
        gmv: weekGmv / 100, // 转换为元
      });
    }
  }

  return {
    stats: {
      leadsAdded,
      collaborationsCreated,
      samplesDispatched,
      followUpsCompleted,
      dealsCompleted,
      gmv,
      goalProgress,
      rankChange,
    },
    trend,
  };
}

/**
 * 获取商务人员排名（辅助函数）
 */
async function getStaffRanking(
  factoryId: string,
  period: DateRange
): Promise<{ staffId: string; gmv: number }[]> {
  const staffMembers = await prisma.user.findMany({
    where: {
      factoryId,
      role: 'BUSINESS_STAFF',
    },
    select: { id: true },
  });

  const ranking: { staffId: string; gmv: number }[] = [];

  for (const staff of staffMembers) {
    const results = await prisma.collaborationResult.findMany({
      where: {
        collaboration: {
          factoryId,
          businessStaffId: staff.id,
        },
        publishedAt: { gte: period.startDate, lte: period.endDate },
      },
    });

    const gmv = results.reduce((sum, r) => sum + r.salesGmv, 0);

    ranking.push({
      staffId: staff.id,
      gmv,
    });
  }

  // 按GMV降序排序
  ranking.sort((a, b) => b.gmv - a.gmv);

  return ranking;
}
