/**
 * 权限检查 Hook
 * 
 * 用于在前端检查用户权限，控制功能显示和操作
 */

import { useAuthStore } from '../stores/authStore';

// 商务权限结构（与后端保持一致）
export interface StaffPermissions {
  dataVisibility: {
    viewOthersInfluencers: boolean;
    viewOthersCollaborations: boolean;
    viewOthersPerformance: boolean;
    viewTeamData: boolean;
    viewRanking: boolean;
  };
  operations: {
    manageInfluencers: boolean;
    manageSamples: boolean;
    manageCollaborations: boolean;
    deleteCollaborations: boolean;
    exportData: boolean;
    batchOperations: boolean;
  };
  advanced: {
    viewCostData: boolean;
    viewROIData: boolean;
    modifyOthersData: boolean;
  };
}

export interface UsePermissionsReturn {
  hasPermission: (permission: string) => boolean;
  permissions: StaffPermissions | null;
  isLoading: boolean;
  canViewOthersData: boolean;
  canManageSamples: boolean;
  canDeleteCollaborations: boolean;
  canViewCostData: boolean;
}

/**
 * 权限检查 Hook
 * 
 * @returns 权限检查函数和权限状态
 * 
 * @example
 * const { hasPermission, canManageSamples } = usePermissions();
 * 
 * if (hasPermission('operations.manageSamples')) {
 *   // 显示样品管理按钮
 * }
 * 
 * if (canManageSamples) {
 *   // 显示样品管理按钮（快捷方式）
 * }
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuthStore();

  // 工厂老板拥有所有权限
  if (user?.role === 'BRAND') {
    return {
      hasPermission: () => true,
      permissions: null,
      isLoading: false,
      canViewOthersData: true,
      canManageSamples: true,
      canDeleteCollaborations: true,
      canViewCostData: true,
    };
  }

  // 平台管理员拥有所有权限
  if (user?.role === 'PLATFORM_ADMIN') {
    return {
      hasPermission: () => true,
      permissions: null,
      isLoading: false,
      canViewOthersData: true,
      canManageSamples: true,
      canDeleteCollaborations: true,
      canViewCostData: true,
    };
  }

  // 商务人员权限检查
  const permissions = (user as any)?.permissions as StaffPermissions | undefined;

  const hasPermission = (permission: string): boolean => {
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
  };

  return {
    hasPermission,
    permissions: permissions || null,
    isLoading: false,
    canViewOthersData: hasPermission('dataVisibility.viewOthersInfluencers'),
    canManageSamples: hasPermission('operations.manageSamples'),
    canDeleteCollaborations: hasPermission('operations.deleteCollaborations'),
    canViewCostData: hasPermission('advanced.viewCostData'),
  };
}
