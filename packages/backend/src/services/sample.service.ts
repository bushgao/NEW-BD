import prisma from '../lib/prisma';
import {
  createBadRequestError,
  createNotFoundError,
  createConflictError,
} from '../middleware/errorHandler';
import type { ReceivedStatus, OnboardStatus } from '@prisma/client';

// 类型定义
export interface CreateSampleInput {
  brandId: string;
  sku: string;
  name: string;
  unitCost: number; // 单件成本（分）
  retailPrice: number; // 建议零售价（分）
  canResend?: boolean;
  notes?: string;
}

export interface UpdateSampleInput {
  sku?: string;
  name?: string;
  unitCost?: number;
  retailPrice?: number;
  canResend?: boolean;
  notes?: string;
}

export interface SampleFilter {
  keyword?: string;
  canResend?: boolean;
}

export interface CreateDispatchInput {
  sampleId: string;
  collaborationId: string;
  businessStaffId: string;
  quantity: number;
  shippingCost: number; // 快递费（分）
  trackingNumber?: string;
}

export interface UpdateDispatchStatusInput {
  receivedStatus?: ReceivedStatus;
  receivedAt?: Date;
  onboardStatus?: OnboardStatus;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface SampleCostReportItem {
  sampleId: string;
  sku: string;
  name: string;
  unitCost: number;
  totalDispatchCount: number;
  totalQuantity: number;
  totalSampleCost: number;
  totalShippingCost: number;
  totalCost: number;
  receivedCount: number;
  receivedRate: number;
  onboardCount: number;
  onboardRate: number;
}

export interface SampleCostReport {
  items: SampleCostReportItem[];
  summary: {
    totalDispatchCount: number;
    totalQuantity: number;
    totalSampleCost: number;
    totalShippingCost: number;
    totalCost: number;
    overallReceivedRate: number;
    overallOnboardRate: number;
  };
}

// ==================== 样品 CRUD ====================

/**
 * 创建样品
 */
export async function createSample(data: CreateSampleInput) {
  const { brandId, sku, name, unitCost, retailPrice, canResend, notes } = data;

  // 检查 SKU 是否重复
  const existing = await prisma.sample.findFirst({
    where: { brandId, sku },
  });

  if (existing) {
    throw createConflictError('SKU 已存在');
  }

  const sample = await prisma.sample.create({
    data: {
      brandId,
      sku: sku.trim(),
      name: name.trim(),
      unitCost,
      retailPrice,
      canResend: canResend ?? true,
      notes: notes?.trim() || null,
    },
  });

  return sample;
}

/**
 * 根据 ID 获取样品
 */
export async function getSampleById(id: string, brandId: string) {
  const sample = await prisma.sample.findFirst({
    where: { id, brandId },
  });

  if (!sample) {
    throw createNotFoundError('样品不存在');
  }

  return sample;
}

/**
 * 更新样品
 */
export async function updateSample(id: string, brandId: string, data: UpdateSampleInput) {
  const existing = await prisma.sample.findFirst({
    where: { id, brandId },
  });

  if (!existing) {
    throw createNotFoundError('样品不存在');
  }

  // 如果更新 SKU，检查是否重复
  if (data.sku && data.sku !== existing.sku) {
    const duplicate = await prisma.sample.findFirst({
      where: { brandId, sku: data.sku, id: { not: id } },
    });
    if (duplicate) {
      throw createConflictError('SKU 已存在');
    }
  }

  const updateData: any = {};
  if (data.sku !== undefined) updateData.sku = data.sku.trim();
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
  if (data.retailPrice !== undefined) updateData.retailPrice = data.retailPrice;
  if (data.canResend !== undefined) updateData.canResend = data.canResend;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

  const sample = await prisma.sample.update({
    where: { id },
    data: updateData,
  });

  return sample;
}

/**
 * 删除样品
 */
export async function deleteSample(id: string, brandId: string) {
  const existing = await prisma.sample.findFirst({
    where: { id, brandId },
  });

  if (!existing) {
    throw createNotFoundError('样品不存在');
  }

  // 检查是否有寄样记录
  const dispatchCount = await prisma.sampleDispatch.count({
    where: { sampleId: id },
  });

  if (dispatchCount > 0) {
    throw createBadRequestError('该样品存在寄样记录，无法删除');
  }

  await prisma.sample.delete({ where: { id } });
}

/**
 * 获取样品列表
 */
export async function listSamples(
  brandId: string,
  filter: SampleFilter,
  pagination: { page: number; pageSize: number }
) {
  const { keyword, canResend } = filter;
  const { page, pageSize } = pagination;

  const where: any = { brandId };

  if (keyword) {
    where.OR = [
      { sku: { contains: keyword, mode: 'insensitive' } },
      { name: { contains: keyword, mode: 'insensitive' } },
    ];
  }

  if (canResend !== undefined) {
    where.canResend = canResend;
  }

  const total = await prisma.sample.count({ where });

  const data = await prisma.sample.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}


// ==================== 寄样记录 ====================

/**
 * 创建寄样记录（自动计算成本）
 */
export async function createDispatch(data: CreateDispatchInput) {
  const { sampleId, collaborationId, businessStaffId, quantity, shippingCost, trackingNumber } = data;

  // 获取样品信息
  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
  });

  if (!sample) {
    throw createNotFoundError('样品不存在');
  }

  // 验证合作记录存在
  const collaboration = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
  });

  if (!collaboration) {
    throw createNotFoundError('合作记录不存在');
  }

  // 计算成本（使用整数运算避免精度问题）
  const unitCostSnapshot = sample.unitCost;
  const totalSampleCost = quantity * unitCostSnapshot;
  const totalCost = totalSampleCost + shippingCost;

  const dispatch = await prisma.sampleDispatch.create({
    data: {
      sampleId,
      collaborationId,
      businessStaffId,
      quantity,
      unitCostSnapshot,
      totalSampleCost,
      shippingCost,
      totalCost,
      trackingNumber: trackingNumber?.trim() || null,
      receivedStatus: 'PENDING',
      onboardStatus: 'UNKNOWN',
      dispatchedAt: new Date(),
    },
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
    },
  });

  return dispatch;
}

/**
 * 获取寄样记录详情
 */
export async function getDispatchById(id: string, brandId: string) {
  const dispatch = await prisma.sampleDispatch.findFirst({
    where: {
      id,
      sample: { brandId },
    },
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!dispatch) {
    throw createNotFoundError('寄样记录不存在');
  }

  return dispatch;
}

/**
 * 更新寄样状态
 */
export async function updateDispatchStatus(
  id: string,
  brandId: string,
  data: UpdateDispatchStatusInput
) {
  const existing = await prisma.sampleDispatch.findFirst({
    where: {
      id,
      sample: { brandId },
    },
  });

  if (!existing) {
    throw createNotFoundError('寄样记录不存在');
  }

  const updateData: any = {};

  if (data.receivedStatus !== undefined) {
    updateData.receivedStatus = data.receivedStatus;
    if (data.receivedStatus === 'RECEIVED' && !existing.receivedAt) {
      updateData.receivedAt = data.receivedAt || new Date();
    }
  }

  if (data.onboardStatus !== undefined) {
    updateData.onboardStatus = data.onboardStatus;
  }

  const dispatch = await prisma.sampleDispatch.update({
    where: { id },
    data: updateData,
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
    },
  });

  return dispatch;
}

/**
 * 获取寄样记录列表
 */
export async function listDispatches(
  brandId: string,
  filter: {
    sampleId?: string;
    collaborationId?: string;
    businessStaffId?: string;
    receivedStatus?: ReceivedStatus;
    onboardStatus?: OnboardStatus;
  },
  pagination: { page: number; pageSize: number }
) {
  const { page, pageSize } = pagination;

  const where: any = {
    sample: { brandId },
  };

  if (filter.sampleId) where.sampleId = filter.sampleId;
  if (filter.collaborationId) where.collaborationId = filter.collaborationId;
  if (filter.businessStaffId) where.businessStaffId = filter.businessStaffId;
  if (filter.receivedStatus) where.receivedStatus = filter.receivedStatus;
  if (filter.onboardStatus) where.onboardStatus = filter.onboardStatus;

  const total = await prisma.sampleDispatch.count({ where });

  const data = await prisma.sampleDispatch.findMany({
    where,
    orderBy: { dispatchedAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ==================== 样品成本报表 ====================

/**
 * 获取样品成本报表
 */
export async function getSampleCostReport(
  brandId: string,
  dateRange?: DateRange
): Promise<SampleCostReport> {
  // 构建日期筛选条件
  const dateFilter = dateRange
    ? {
        dispatchedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      }
    : {};

  // 获取工厂所有样品
  const samples = await prisma.sample.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
  });

  const items: SampleCostReportItem[] = [];
  let summaryTotalDispatchCount = 0;
  let summaryTotalQuantity = 0;
  let summaryTotalSampleCost = 0;
  let summaryTotalShippingCost = 0;
  let summaryTotalCost = 0;
  let summaryReceivedCount = 0;
  let summaryOnboardCount = 0;

  for (const sample of samples) {
    // 获取该样品的所有寄样记录
    const dispatches = await prisma.sampleDispatch.findMany({
      where: {
        sampleId: sample.id,
        ...dateFilter,
      },
    });

    if (dispatches.length === 0) {
      continue; // 跳过没有寄样记录的样品
    }

    const totalDispatchCount = dispatches.length;
    const totalQuantity = dispatches.reduce((sum, d) => sum + d.quantity, 0);
    const totalSampleCost = dispatches.reduce((sum, d) => sum + d.totalSampleCost, 0);
    const totalShippingCost = dispatches.reduce((sum, d) => sum + d.shippingCost, 0);
    const totalCost = dispatches.reduce((sum, d) => sum + d.totalCost, 0);
    const receivedCount = dispatches.filter((d) => d.receivedStatus === 'RECEIVED').length;
    const onboardCount = dispatches.filter((d) => d.onboardStatus === 'ONBOARD').length;

    items.push({
      sampleId: sample.id,
      sku: sample.sku,
      name: sample.name,
      unitCost: sample.unitCost,
      totalDispatchCount,
      totalQuantity,
      totalSampleCost,
      totalShippingCost,
      totalCost,
      receivedCount,
      receivedRate: totalDispatchCount > 0 ? receivedCount / totalDispatchCount : 0,
      onboardCount,
      onboardRate: totalDispatchCount > 0 ? onboardCount / totalDispatchCount : 0,
    });

    // 累加汇总数据
    summaryTotalDispatchCount += totalDispatchCount;
    summaryTotalQuantity += totalQuantity;
    summaryTotalSampleCost += totalSampleCost;
    summaryTotalShippingCost += totalShippingCost;
    summaryTotalCost += totalCost;
    summaryReceivedCount += receivedCount;
    summaryOnboardCount += onboardCount;
  }

  return {
    items,
    summary: {
      totalDispatchCount: summaryTotalDispatchCount,
      totalQuantity: summaryTotalQuantity,
      totalSampleCost: summaryTotalSampleCost,
      totalShippingCost: summaryTotalShippingCost,
      totalCost: summaryTotalCost,
      overallReceivedRate:
        summaryTotalDispatchCount > 0 ? summaryReceivedCount / summaryTotalDispatchCount : 0,
      overallOnboardRate:
        summaryTotalDispatchCount > 0 ? summaryOnboardCount / summaryTotalDispatchCount : 0,
    },
  };
}
