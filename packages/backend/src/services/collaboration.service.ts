import prisma from '../lib/prisma';
import {
  createBadRequestError,
  createNotFoundError,
} from '../middleware/errorHandler';
import type { PipelineStage, BlockReason } from '@prisma/client';

// 类型定义
export interface CreateCollaborationInput {
  influencerId: string;
  factoryId: string;
  businessStaffId: string;
  stage?: PipelineStage;
  deadline?: Date;
  notes?: string;
}

export interface UpdateCollaborationInput {
  deadline?: Date;
  blockReason?: BlockReason | null;
}

export interface CollaborationFilter {
  stage?: PipelineStage;
  businessStaffId?: string;
  influencerId?: string;
  isOverdue?: boolean;
  keyword?: string;
}

export interface PipelineView {
  stages: {
    stage: PipelineStage;
    stageName: string;
    collaborations: CollaborationCard[];
    count: number;
  }[];
  totalCount: number;
}

export interface CollaborationCard {
  id: string;
  influencer: {
    id: string;
    nickname: string;
    platform: string;
    platformId: string;
  };
  businessStaff: {
    id: string;
    name: string;
  };
  stage: PipelineStage;
  deadline: Date | null;
  isOverdue: boolean;
  blockReason: BlockReason | null;
  followUpCount: number;
  dispatchCount: number;
  lastFollowUp: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 阶段名称映射
export const STAGE_NAMES: Record<PipelineStage, string> = {
  LEAD: '线索达人',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  SAMPLED: '已寄样',
  SCHEDULED: '已排期',
  PUBLISHED: '已发布',
  REVIEWED: '已复盘',
};

// 阶段顺序
export const STAGE_ORDER: PipelineStage[] = [
  'LEAD',
  'CONTACTED',
  'QUOTED',
  'SAMPLED',
  'SCHEDULED',
  'PUBLISHED',
  'REVIEWED',
];


// ==================== 合作记录 CRUD ====================

/**
 * 创建合作记录
 */
export async function createCollaboration(data: CreateCollaborationInput) {
  const { influencerId, factoryId, businessStaffId, stage, deadline, notes } = data;

  // 验证达人存在且属于该工厂
  const influencer = await prisma.influencer.findFirst({
    where: { id: influencerId, factoryId },
  });

  if (!influencer) {
    throw createNotFoundError('达人不存在或不属于该工厂');
  }

  // 验证商务人员存在且属于该工厂
  const staff = await prisma.user.findFirst({
    where: { id: businessStaffId, factoryId },
  });

  if (!staff) {
    throw createNotFoundError('商务人员不存在或不属于该工厂');
  }

  const initialStage = stage || 'LEAD';

  // 创建合作记录和初始阶段历史
  const collaboration = await prisma.collaboration.create({
    data: {
      influencerId,
      factoryId,
      businessStaffId,
      stage: initialStage,
      deadline,
      isOverdue: false,
      stageHistory: {
        create: {
          fromStage: null,
          toStage: initialStage,
          notes: notes || '创建合作记录',
        },
      },
    },
    include: {
      influencer: true,
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      dispatches: true,
      stageHistory: {
        orderBy: { changedAt: 'desc' },
      },
    },
  });

  return collaboration;
}

/**
 * 根据 ID 获取合作记录详情
 */
export async function getCollaborationById(id: string, factoryId: string) {
  const collaboration = await prisma.collaboration.findFirst({
    where: { id, factoryId },
    include: {
      influencer: true,
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
      dispatches: {
        include: {
          sample: true,
        },
        orderBy: { dispatchedAt: 'desc' },
      },
      stageHistory: {
        orderBy: { changedAt: 'desc' },
      },
      result: true,
    },
  });

  if (!collaboration) {
    throw createNotFoundError('合作记录不存在');
  }

  return collaboration;
}

/**
 * 更新合作记录基本信息
 */
export async function updateCollaboration(
  id: string,
  factoryId: string,
  data: UpdateCollaborationInput
) {
  const existing = await prisma.collaboration.findFirst({
    where: { id, factoryId },
  });

  if (!existing) {
    throw createNotFoundError('合作记录不存在');
  }

  const updateData: any = {};

  if (data.deadline !== undefined) {
    updateData.deadline = data.deadline;
    // 更新超期状态
    if (data.deadline) {
      updateData.isOverdue = new Date() > data.deadline;
    } else {
      updateData.isOverdue = false;
    }
  }

  if (data.blockReason !== undefined) {
    updateData.blockReason = data.blockReason;
  }

  const collaboration = await prisma.collaboration.update({
    where: { id },
    data: updateData,
    include: {
      influencer: true,
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return collaboration;
}

/**
 * 删除合作记录
 */
export async function deleteCollaboration(id: string, factoryId: string) {
  const existing = await prisma.collaboration.findFirst({
    where: { id, factoryId },
    include: {
      result: true,
    },
  });

  if (!existing) {
    throw createNotFoundError('合作记录不存在');
  }

  // 如果已有合作结果，不允许删除
  if (existing.result) {
    throw createBadRequestError('该合作已有结果记录，无法删除');
  }

  // 删除关联数据（级联删除）
  await prisma.$transaction([
    prisma.followUpRecord.deleteMany({ where: { collaborationId: id } }),
    prisma.stageHistory.deleteMany({ where: { collaborationId: id } }),
    prisma.sampleDispatch.deleteMany({ where: { collaborationId: id } }),
    prisma.collaboration.delete({ where: { id } }),
  ]);
}


/**
 * 获取合作记录列表
 */
export async function listCollaborations(
  factoryId: string,
  filter: CollaborationFilter,
  pagination: { page: number; pageSize: number }
) {
  const { stage, businessStaffId, influencerId, isOverdue, keyword } = filter;
  const { page, pageSize } = pagination;

  const where: any = { factoryId };

  if (stage) where.stage = stage;
  if (businessStaffId) where.businessStaffId = businessStaffId;
  if (influencerId) where.influencerId = influencerId;
  if (isOverdue !== undefined) where.isOverdue = isOverdue;

  if (keyword) {
    where.influencer = {
      OR: [
        { nickname: { contains: keyword, mode: 'insensitive' } },
        { platformId: { contains: keyword, mode: 'insensitive' } },
      ],
    };
  }

  const total = await prisma.collaboration.count({ where });

  const data = await prisma.collaboration.findMany({
    where,
    orderBy: [{ isOverdue: 'desc' }, { updatedAt: 'desc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      influencer: true,
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      dispatches: true,
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

// ==================== 阶段状态管理 ====================

/**
 * 更新合作阶段
 */
export async function updateStage(
  id: string,
  factoryId: string,
  newStage: PipelineStage,
  notes?: string
) {
  const existing = await prisma.collaboration.findFirst({
    where: { id, factoryId },
  });

  if (!existing) {
    throw createNotFoundError('合作记录不存在');
  }

  // 验证阶段值合法
  if (!STAGE_ORDER.includes(newStage)) {
    throw createBadRequestError('无效的阶段状态');
  }

  const oldStage = existing.stage;

  // 如果阶段没有变化，直接返回
  if (oldStage === newStage) {
    return prisma.collaboration.findFirst({
      where: { id },
      include: {
        influencer: true,
        businessStaff: {
          select: { id: true, name: true, email: true },
        },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });
  }

  // 更新合作记录和创建阶段历史
  const collaboration = await prisma.$transaction(async (tx) => {
    // 创建阶段变更历史
    await tx.stageHistory.create({
      data: {
        collaborationId: id,
        fromStage: oldStage,
        toStage: newStage,
        notes,
      },
    });

    // 更新合作记录
    return tx.collaboration.update({
      where: { id },
      data: {
        stage: newStage,
        // 阶段推进后，重置超期状态（如果有截止时间会重新计算）
        isOverdue: existing.deadline ? new Date() > existing.deadline : false,
      },
      include: {
        influencer: true,
        businessStaff: {
          select: { id: true, name: true, email: true },
        },
        stageHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });
  });

  return collaboration;
}

/**
 * 获取阶段变更历史
 */
export async function getStageHistory(id: string, factoryId: string) {
  const collaboration = await prisma.collaboration.findFirst({
    where: { id, factoryId },
  });

  if (!collaboration) {
    throw createNotFoundError('合作记录不存在');
  }

  const history = await prisma.stageHistory.findMany({
    where: { collaborationId: id },
    orderBy: { changedAt: 'desc' },
  });

  return history.map((h) => ({
    ...h,
    fromStageName: h.fromStage ? STAGE_NAMES[h.fromStage] : null,
    toStageName: STAGE_NAMES[h.toStage],
  }));
}


// ==================== 截止时间和超期判断 ====================

/**
 * 设置截止时间
 */
export async function setDeadline(id: string, factoryId: string, deadline: Date | null) {
  const existing = await prisma.collaboration.findFirst({
    where: { id, factoryId },
  });

  if (!existing) {
    throw createNotFoundError('合作记录不存在');
  }

  // 计算是否超期
  const isOverdue = deadline ? new Date() > deadline : false;

  const collaboration = await prisma.collaboration.update({
    where: { id },
    data: {
      deadline,
      isOverdue,
    },
    include: {
      influencer: true,
      businessStaff: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return collaboration;
}

/**
 * 检查并更新所有超期状态
 * 用于定时任务
 */
export async function checkAndUpdateOverdueStatus(factoryId?: string) {
  const now = new Date();

  const where: any = {
    deadline: { not: null, lt: now },
    isOverdue: false,
    // 排除已完成的阶段
    stage: { notIn: ['PUBLISHED', 'REVIEWED'] },
  };

  if (factoryId) {
    where.factoryId = factoryId;
  }

  const result = await prisma.collaboration.updateMany({
    where,
    data: { isOverdue: true },
  });

  return result.count;
}

/**
 * 获取超期合作列表
 */
export async function getOverdueCollaborations(
  factoryId: string,
  pagination: { page: number; pageSize: number }
) {
  const { page, pageSize } = pagination;

  const where = {
    factoryId,
    isOverdue: true,
  };

  const total = await prisma.collaboration.count({ where });

  const data = await prisma.collaboration.findMany({
    where,
    orderBy: { deadline: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      influencer: true,
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

// ==================== 跟进记录 ====================

/**
 * 添加跟进记录
 */
export async function addFollowUp(
  collaborationId: string,
  factoryId: string,
  userId: string,
  content: string
) {
  // 验证合作记录存在
  const collaboration = await prisma.collaboration.findFirst({
    where: { id: collaborationId, factoryId },
  });

  if (!collaboration) {
    throw createNotFoundError('合作记录不存在');
  }

  if (!content || !content.trim()) {
    throw createBadRequestError('跟进内容不能为空');
  }

  const followUp = await prisma.followUpRecord.create({
    data: {
      collaborationId,
      userId,
      content: content.trim(),
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  // 更新合作记录的更新时间
  await prisma.collaboration.update({
    where: { id: collaborationId },
    data: { updatedAt: new Date() },
  });

  return followUp;
}

/**
 * 获取跟进记录列表
 */
export async function getFollowUps(
  collaborationId: string,
  factoryId: string,
  pagination: { page: number; pageSize: number }
) {
  // 验证合作记录存在
  const collaboration = await prisma.collaboration.findFirst({
    where: { id: collaborationId, factoryId },
  });

  if (!collaboration) {
    throw createNotFoundError('合作记录不存在');
  }

  const { page, pageSize } = pagination;

  const total = await prisma.followUpRecord.count({
    where: { collaborationId },
  });

  const data = await prisma.followUpRecord.findMany({
    where: { collaborationId },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: {
        select: { id: true, name: true },
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


// ==================== 卡点原因 ====================

/**
 * 设置卡点原因
 */
export async function setBlockReason(
  id: string,
  factoryId: string,
  reason: BlockReason | null,
  notes?: string
) {
  const existing = await prisma.collaboration.findFirst({
    where: { id, factoryId },
  });

  if (!existing) {
    throw createNotFoundError('合作记录不存在');
  }

  // 如果设置了卡点原因，同时添加跟进记录
  const collaboration = await prisma.$transaction(async (tx) => {
    const updated = await tx.collaboration.update({
      where: { id },
      data: { blockReason: reason },
      include: {
        influencer: true,
        businessStaff: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 如果有备注，添加跟进记录
    if (notes && notes.trim()) {
      const reasonText = reason ? BLOCK_REASON_NAMES[reason] : '清除卡点';
      await tx.followUpRecord.create({
        data: {
          collaborationId: id,
          userId: existing.businessStaffId,
          content: `[${reasonText}] ${notes.trim()}`,
        },
      });
    }

    return updated;
  });

  return collaboration;
}

// 卡点原因名称映射
export const BLOCK_REASON_NAMES: Record<BlockReason, string> = {
  PRICE_HIGH: '报价太贵',
  DELAYED: '达人拖延',
  UNCOOPERATIVE: '不配合',
  OTHER: '其他原因',
};

// ==================== 管道视图 ====================

/**
 * 获取管道视图数据
 */
export async function getPipelineView(
  factoryId: string,
  filter?: { businessStaffId?: string; keyword?: string }
): Promise<PipelineView> {
  const where: any = { factoryId };

  if (filter?.businessStaffId) {
    where.businessStaffId = filter.businessStaffId;
  }

  if (filter?.keyword) {
    where.influencer = {
      OR: [
        { nickname: { contains: filter.keyword, mode: 'insensitive' } },
        { platformId: { contains: filter.keyword, mode: 'insensitive' } },
      ],
    };
  }

  // 获取所有合作记录
  const collaborations = await prisma.collaboration.findMany({
    where,
    include: {
      influencer: true,
      businessStaff: {
        select: { id: true, name: true },
      },
      followUps: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      dispatches: true,
    },
    orderBy: [{ isOverdue: 'desc' }, { updatedAt: 'desc' }],
  });

  // 按阶段分组
  const stageMap = new Map<PipelineStage, CollaborationCard[]>();

  // 初始化所有阶段
  for (const stage of STAGE_ORDER) {
    stageMap.set(stage, []);
  }

  // 分组合作记录
  for (const collab of collaborations) {
    const card: CollaborationCard = {
      id: collab.id,
      influencer: {
        id: collab.influencer.id,
        nickname: collab.influencer.nickname,
        platform: collab.influencer.platform,
        platformId: collab.influencer.platformId,
      },
      businessStaff: {
        id: collab.businessStaff.id,
        name: collab.businessStaff.name,
      },
      stage: collab.stage,
      deadline: collab.deadline,
      isOverdue: collab.isOverdue,
      blockReason: collab.blockReason,
      followUpCount: collab.followUps.length,
      dispatchCount: collab.dispatches.length,
      lastFollowUp: collab.followUps[0]?.createdAt || null,
      createdAt: collab.createdAt,
      updatedAt: collab.updatedAt,
    };

    stageMap.get(collab.stage)?.push(card);
  }

  // 构建返回结果
  const stages = STAGE_ORDER.map((stage) => ({
    stage,
    stageName: STAGE_NAMES[stage],
    collaborations: stageMap.get(stage) || [],
    count: stageMap.get(stage)?.length || 0,
  }));

  return {
    stages,
    totalCount: collaborations.length,
  };
}

/**
 * 获取管道统计数据
 */
export async function getPipelineStats(factoryId: string) {
  const stats = await prisma.collaboration.groupBy({
    by: ['stage'],
    where: { factoryId },
    _count: { id: true },
  });

  const result: Record<PipelineStage, number> = {
    LEAD: 0,
    CONTACTED: 0,
    QUOTED: 0,
    SAMPLED: 0,
    SCHEDULED: 0,
    PUBLISHED: 0,
    REVIEWED: 0,
  };

  for (const stat of stats) {
    result[stat.stage] = stat._count.id;
  }

  const overdueCount = await prisma.collaboration.count({
    where: { factoryId, isOverdue: true },
  });

  return {
    byStage: result,
    total: Object.values(result).reduce((a, b) => a + b, 0),
    overdueCount,
  };
}
