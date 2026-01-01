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

