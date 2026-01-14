/**
 * 商务权限管理类型定义
 */

// 商务权限结构
export interface StaffPermissions {
  dataVisibility: {
    viewOthersInfluencers: boolean;      // 查看其他商务的达人
    viewOthersCollaborations: boolean;   // 查看其他商务的合作
    viewOthersPerformance: boolean;      // 查看其他商务的业绩
    viewTeamData: boolean;               // 查看团队数据
    viewRanking: boolean;                // 查看排行榜
  };
  operations: {
    manageInfluencers: boolean;          // 管理达人
    manageSamples: boolean;              // 管理样品
    manageCollaborations: boolean;       // 管理合作
    deleteCollaborations: boolean;       // 删除合作
    exportData: boolean;                 // 导出数据
    batchOperations: boolean;            // 批量操作
  };
  advanced: {
    viewCostData: boolean;               // 查看成本
    viewROIData: boolean;                // 查看ROI
    modifyOthersData: boolean;           // 修改他人数据
  };
}

// 权限模板类型
export type PermissionTemplateId = 'basic' | 'advanced' | 'supervisor' | 'custom';

// 权限模板
export interface PermissionTemplate {
  id: PermissionTemplateId;
  name: string;
  description: string;
  permissions: StaffPermissions;
}

// 权限模板常量
export const PERMISSION_TEMPLATES: Record<PermissionTemplateId, PermissionTemplate> = {
  basic: {
    id: 'basic',
    name: '基础商务',
    description: '只能管理自己的数据，不能查看其他商务详情，不能管理样品',
    permissions: {
      dataVisibility: {
        viewOthersInfluencers: false,
        viewOthersCollaborations: false,
        viewOthersPerformance: false,
        viewTeamData: true,
        viewRanking: true,
      },
      operations: {
        manageInfluencers: true,
        manageSamples: false,
        manageCollaborations: true,
        deleteCollaborations: false,
        exportData: true,
        batchOperations: true,
      },
      advanced: {
        viewCostData: false,
        viewROIData: true,
        modifyOthersData: false,
      },
    },
  },
  advanced: {
    id: 'advanced',
    name: '高级商务',
    description: '可以管理样品，可以查看其他商务业绩（学习用）',
    permissions: {
      dataVisibility: {
        viewOthersInfluencers: false,
        viewOthersCollaborations: false,
        viewOthersPerformance: true,
        viewTeamData: true,
        viewRanking: true,
      },
      operations: {
        manageInfluencers: true,
        manageSamples: true,
        manageCollaborations: true,
        deleteCollaborations: false,
        exportData: true,
        batchOperations: true,
      },
      advanced: {
        viewCostData: false,
        viewROIData: true,
        modifyOthersData: false,
      },
    },
  },
  supervisor: {
    id: 'supervisor',
    name: '团队主管',
    description: '可以查看所有数据，拥有最高权限（仅次于工厂老板）',
    permissions: {
      dataVisibility: {
        viewOthersInfluencers: true,
        viewOthersCollaborations: true,
        viewOthersPerformance: true,
        viewTeamData: true,
        viewRanking: true,
      },
      operations: {
        manageInfluencers: true,
        manageSamples: true,
        manageCollaborations: true,
        deleteCollaborations: true,
        exportData: true,
        batchOperations: true,
      },
      advanced: {
        viewCostData: true,
        viewROIData: true,
        modifyOthersData: true,
      },
    },
  },
  custom: {
    id: 'custom',
    name: '自定义',
    description: '工厂老板自由组合权限',
    permissions: {
      dataVisibility: {
        viewOthersInfluencers: false,
        viewOthersCollaborations: false,
        viewOthersPerformance: false,
        viewTeamData: true,
        viewRanking: true,
      },
      operations: {
        manageInfluencers: true,
        manageSamples: false,
        manageCollaborations: true,
        deleteCollaborations: false,
        exportData: true,
        batchOperations: true,
      },
      advanced: {
        viewCostData: false,
        viewROIData: true,
        modifyOthersData: false,
      },
    },
  },
};

/**
 * 检查权限
 */
export function hasPermission(
  permissions: StaffPermissions | null | undefined,
  permission: string
): boolean {
  if (!permissions) {
    return false;
  }

  const [category, key] = permission.split('.');

  if (!category || !key) {
    return false;
  }

  const categoryPermissions = permissions[category as keyof StaffPermissions];
  if (!categoryPermissions) {
    return false;
  }

  return (categoryPermissions as any)[key] ?? false;
}

/**
 * 深度比较两个权限对象是否相等
 */
function deepEqualPermissions(a: StaffPermissions, b: StaffPermissions): boolean {
  // 比较 dataVisibility
  if (
    a.dataVisibility.viewOthersInfluencers !== b.dataVisibility.viewOthersInfluencers ||
    a.dataVisibility.viewOthersCollaborations !== b.dataVisibility.viewOthersCollaborations ||
    a.dataVisibility.viewOthersPerformance !== b.dataVisibility.viewOthersPerformance ||
    a.dataVisibility.viewTeamData !== b.dataVisibility.viewTeamData ||
    a.dataVisibility.viewRanking !== b.dataVisibility.viewRanking
  ) {
    return false;
  }

  // 比较 operations
  if (
    a.operations.manageInfluencers !== b.operations.manageInfluencers ||
    a.operations.manageSamples !== b.operations.manageSamples ||
    a.operations.manageCollaborations !== b.operations.manageCollaborations ||
    a.operations.deleteCollaborations !== b.operations.deleteCollaborations ||
    a.operations.exportData !== b.operations.exportData ||
    a.operations.batchOperations !== b.operations.batchOperations
  ) {
    return false;
  }

  // 比较 advanced
  if (
    a.advanced.viewCostData !== b.advanced.viewCostData ||
    a.advanced.viewROIData !== b.advanced.viewROIData ||
    a.advanced.modifyOthersData !== b.advanced.modifyOthersData
  ) {
    return false;
  }

  return true;
}

/**
 * 识别权限模板
 */
export function identifyTemplate(permissions: StaffPermissions): PermissionTemplateId {
  // 如果 permissions 为空或结构不完整，返回 custom
  if (!permissions || !permissions.dataVisibility || !permissions.operations || !permissions.advanced) {
    return 'custom';
  }

  // 检查是否匹配预设模板
  for (const [templateId, template] of Object.entries(PERMISSION_TEMPLATES)) {
    if (templateId === 'custom') continue;

    if (deepEqualPermissions(permissions, template.permissions)) {
      return templateId as PermissionTemplateId;
    }
  }

  return 'custom';
}
