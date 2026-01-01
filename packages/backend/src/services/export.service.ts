import * as XLSX from 'xlsx';
import prisma from '../lib/prisma';
import type { Platform, PipelineStage, ReceivedStatus, OnboardStatus, ProfitStatus } from '@prisma/client';

// ==================== 类型定义 ====================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type ExportType = 
  | 'influencers'
  | 'samples'
  | 'dispatches'
  | 'collaborations'
  | 'results'
  | 'staff-performance'
  | 'roi-report'
  | 'sample-cost-report';

export interface ExportOptions {
  factoryId: string;
  dateRange?: DateRange;
  groupBy?: string;
  filters?: Record<string, any>;
}

// 平台名称映射
const PLATFORM_NAMES: Record<Platform, string> = {
  DOUYIN: '抖音',
  KUAISHOU: '快手',
  XIAOHONGSHU: '小红书',
  WEIBO: '微博',
  OTHER: '其他',
};

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

// 签收状态映射
const RECEIVED_STATUS_NAMES: Record<ReceivedStatus, string> = {
  PENDING: '待签收',
  RECEIVED: '已签收',
  LOST: '已丢失',
};

// 上车状态映射
const ONBOARD_STATUS_NAMES: Record<OnboardStatus, string> = {
  UNKNOWN: '未确认',
  ONBOARD: '已上车',
  NOT_ONBOARD: '未上车',
};

// 回本状态映射
const PROFIT_STATUS_NAMES: Record<ProfitStatus, string> = {
  LOSS: '未回本',
  BREAK_EVEN: '刚回本',
  PROFIT: '已回本',
  HIGH_PROFIT: '爆赚',
};

// ==================== 辅助函数 ====================

/**
 * 格式化金额（分转元）
 */
function formatMoney(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * 格式化日期
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('zh-CN');
}

/**
 * 格式化日期时间
 */
function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString('zh-CN');
}

/**
 * 创建Excel工作簿并返回Buffer
 */
function createExcelBuffer(data: any[], sheetName: string, colWidths?: number[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  if (colWidths) {
    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// ==================== 导出函数 ====================

/**
 * 导出达人列表
 * Requirements: 9.4
 */
export async function exportInfluencers(options: ExportOptions): Promise<Buffer> {
  const { factoryId, filters } = options;

  const where: any = { factoryId };
  if (filters?.platform) where.platform = filters.platform;
  if (filters?.keyword) {
    where.OR = [
      { nickname: { contains: filters.keyword, mode: 'insensitive' } },
      { platformId: { contains: filters.keyword, mode: 'insensitive' } },
    ];
  }

  const influencers = await prisma.influencer.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  const data = influencers.map(inf => ({
    '昵称': inf.nickname,
    '平台': PLATFORM_NAMES[inf.platform],
    '平台账号ID': inf.platformId,
    '手机号': inf.phone || '',
    '类目': inf.categories.join(', '),
    '标签': inf.tags.join(', '),
    '备注': inf.notes || '',
    '创建时间': formatDateTime(inf.createdAt),
  }));

  return createExcelBuffer(data, '达人列表', [15, 10, 20, 15, 20, 20, 30, 20]);
}

/**
 * 导出样品列表
 * Requirements: 9.4
 */
export async function exportSamples(options: ExportOptions): Promise<Buffer> {
  const { factoryId } = options;

  const samples = await prisma.sample.findMany({
    where: { factoryId },
    orderBy: { createdAt: 'desc' },
  });

  const data = samples.map(s => ({
    'SKU': s.sku,
    '名称': s.name,
    '单件成本（元）': formatMoney(s.unitCost),
    '建议零售价（元）': formatMoney(s.retailPrice),
    '可复寄': s.canResend ? '是' : '否',
    '备注': s.notes || '',
    '创建时间': formatDateTime(s.createdAt),
  }));

  return createExcelBuffer(data, '样品列表', [15, 20, 15, 15, 10, 30, 20]);
}

/**
 * 导出寄样记录
 * Requirements: 9.4
 */
export async function exportDispatches(options: ExportOptions): Promise<Buffer> {
  const { factoryId, dateRange } = options;

  const where: any = {
    sample: { factoryId },
  };

  if (dateRange) {
    where.dispatchedAt = {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    };
  }

  const dispatches = await prisma.sampleDispatch.findMany({
    where,
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
      businessStaff: {
        select: { name: true },
      },
    },
    orderBy: { dispatchedAt: 'desc' },
  });

  const data = dispatches.map(d => ({
    '样品SKU': d.sample.sku,
    '样品名称': d.sample.name,
    '达人昵称': d.collaboration.influencer.nickname,
    '平台': PLATFORM_NAMES[d.collaboration.influencer.platform],
    '商务': d.businessStaff.name,
    '数量': d.quantity,
    '单件成本（元）': formatMoney(d.unitCostSnapshot),
    '样品成本（元）': formatMoney(d.totalSampleCost),
    '快递费（元）': formatMoney(d.shippingCost),
    '总成本（元）': formatMoney(d.totalCost),
    '快递单号': d.trackingNumber || '',
    '签收状态': RECEIVED_STATUS_NAMES[d.receivedStatus],
    '签收时间': formatDateTime(d.receivedAt),
    '上车状态': ONBOARD_STATUS_NAMES[d.onboardStatus],
    '寄样时间': formatDateTime(d.dispatchedAt),
  }));

  return createExcelBuffer(data, '寄样记录', [
    12, 20, 15, 10, 12, 8, 15, 15, 12, 12, 20, 10, 18, 10, 18
  ]);
}

/**
 * 导出合作记录
 * Requirements: 9.4
 */
export async function exportCollaborations(options: ExportOptions): Promise<Buffer> {
  const { factoryId, dateRange } = options;

  const where: any = { factoryId };

  if (dateRange) {
    where.createdAt = {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    };
  }

  const collaborations = await prisma.collaboration.findMany({
    where,
    include: {
      influencer: true,
      businessStaff: { select: { name: true } },
      dispatches: true,
      result: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = collaborations.map(c => ({
    '达人昵称': c.influencer.nickname,
    '平台': PLATFORM_NAMES[c.influencer.platform],
    '平台账号ID': c.influencer.platformId,
    '商务': c.businessStaff.name,
    '阶段': STAGE_NAMES[c.stage],
    '是否超期': c.isOverdue ? '是' : '否',
    '截止时间': formatDate(c.deadline),
    '寄样次数': c.dispatches.length,
    '寄样成本（元）': formatMoney(c.dispatches.reduce((sum, d) => sum + d.totalCost, 0)),
    '销售GMV（元）': c.result ? formatMoney(c.result.salesGmv) : '',
    '合作成本（元）': c.result ? formatMoney(c.result.totalCollaborationCost) : '',
    'ROI': c.result ? c.result.roi.toFixed(4) : '',
    '回本状态': c.result ? PROFIT_STATUS_NAMES[c.result.profitStatus] : '',
    '创建时间': formatDateTime(c.createdAt),
  }));

  return createExcelBuffer(data, '合作记录', [
    15, 10, 20, 12, 10, 10, 12, 10, 15, 15, 15, 10, 10, 18
  ]);
}

/**
 * 导出合作结果
 * Requirements: 9.4
 */
export async function exportResults(options: ExportOptions): Promise<Buffer> {
  const { factoryId, dateRange } = options;

  const where: any = {
    collaboration: { factoryId },
  };

  if (dateRange) {
    where.publishedAt = {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    };
  }

  const results = await prisma.collaborationResult.findMany({
    where,
    include: {
      collaboration: {
        include: {
          influencer: true,
          businessStaff: { select: { name: true } },
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });

  const data = results.map(r => ({
    '达人昵称': r.collaboration.influencer.nickname,
    '平台': PLATFORM_NAMES[r.collaboration.influencer.platform],
    '商务': r.collaboration.businessStaff.name,
    '内容形式': r.contentType === 'SHORT_VIDEO' ? '短视频' : '直播',
    '发布时间': formatDateTime(r.publishedAt),
    '销售件数': r.salesQuantity,
    '销售GMV（元）': formatMoney(r.salesGmv),
    '佣金比例（%）': r.commissionRate ? `${r.commissionRate}%` : '',
    '坑位费（元）': formatMoney(r.pitFee),
    '实付佣金（元）': formatMoney(r.actualCommission),
    '样品成本（元）': formatMoney(r.totalSampleCost),
    '合作总成本（元）': formatMoney(r.totalCollaborationCost),
    'ROI': r.roi.toFixed(4),
    '回本状态': PROFIT_STATUS_NAMES[r.profitStatus],
    '是否复投': r.willRepeat ? '是' : '否',
    '备注': r.notes || '',
  }));

  return createExcelBuffer(data, '合作结果', [
    15, 10, 12, 10, 18, 10, 15, 12, 12, 15, 15, 15, 10, 10, 10, 30
  ]);
}

/**
 * 统一导出接口
 */
export async function exportData(
  type: ExportType,
  options: ExportOptions
): Promise<{ buffer: Buffer; filename: string }> {
  const timestamp = new Date().toISOString().slice(0, 10);
  let buffer: Buffer;
  let filename: string;

  switch (type) {
    case 'influencers':
      buffer = await exportInfluencers(options);
      filename = `达人列表_${timestamp}.xlsx`;
      break;
    case 'samples':
      buffer = await exportSamples(options);
      filename = `样品列表_${timestamp}.xlsx`;
      break;
    case 'dispatches':
      buffer = await exportDispatches(options);
      filename = `寄样记录_${timestamp}.xlsx`;
      break;
    case 'collaborations':
      buffer = await exportCollaborations(options);
      filename = `合作记录_${timestamp}.xlsx`;
      break;
    case 'results':
      buffer = await exportResults(options);
      filename = `合作结果_${timestamp}.xlsx`;
      break;
    default:
      throw new Error(`不支持的导出类型: ${type}`);
  }

  return { buffer, filename };
}
