/**
 * 获取所有通知模板
 */
export declare function listTemplates(): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    isEnabled: boolean;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
/**
 * 根据类型获取模板
 */
export declare function getTemplateByType(type: string): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    isEnabled: boolean;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
/**
 * 更新模板
 */
export declare function updateTemplate(type: string, data: {
    title?: string;
    content?: string;
    isEnabled?: boolean;
    metadata?: Record<string, unknown>;
}): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    isEnabled: boolean;
    metadata: import("@prisma/client/runtime/library").JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * 初始化默认模板（如果不存在）
 */
export declare function seedDefaultTemplates(): Promise<void>;
/**
 * 根据模板创建通知（支持变量替换）
 */
export declare function createNotificationFromTemplate(userId: string, templateType: string, variables?: Record<string, string>): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    relatedId: string | null;
    userId: string;
} | null>;
/**
 * 为新用户创建欢迎通知
 */
export declare function createWelcomeNotification(userId: string): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    relatedId: string | null;
    userId: string;
} | null>;
//# sourceMappingURL=notification-template.service.d.ts.map