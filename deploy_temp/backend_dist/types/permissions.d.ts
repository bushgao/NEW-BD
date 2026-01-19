/**
 * 商务权限管理类型定义
 */
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
export type PermissionTemplateId = 'basic' | 'advanced' | 'supervisor' | 'custom';
export interface PermissionTemplate {
    id: PermissionTemplateId;
    name: string;
    description: string;
    permissions: StaffPermissions;
}
export declare const PERMISSION_TEMPLATES: Record<PermissionTemplateId, PermissionTemplate>;
/**
 * 检查权限
 */
export declare function hasPermission(permissions: StaffPermissions | null | undefined, permission: string): boolean;
/**
 * 识别权限模板
 */
export declare function identifyTemplate(permissions: StaffPermissions): PermissionTemplateId;
//# sourceMappingURL=permissions.d.ts.map