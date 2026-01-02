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

