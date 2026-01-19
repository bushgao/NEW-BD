import prisma from '../lib/prisma';

// 默认通知模板
const DEFAULT_TEMPLATES = [
    {
        type: 'WELCOME',
        title: '🎉 欢迎加入 Zilo！',
        content: `您好！感谢您注册 Zilo 达人合作管理平台。

为了帮助您快速上手，请添加我们的专属顾问微信，即可：

✅ 开通 30天免费试用 资格
✅ 获取 1对1 产品演示
✅ 领取专属入门指南

期待与您合作！`,
        isEnabled: true,
        metadata: {
            qrCodeUrl: '/wechat-demo-qr.jpg',
            showQrCode: true,
        },
    },
    {
        type: 'DEADLINE_APPROACHING',
        title: '⏰ 合作即将到期',
        content: '您负责的合作 "{{influencerName}}" 将于 {{deadline}} 到期，请及时跟进。',
        isEnabled: true,
        metadata: null,
    },
    {
        type: 'DEADLINE_OVERDUE',
        title: '⚠️ 合作已超期',
        content: '您负责的合作 "{{influencerName}}" 已超过截止日期，请尽快处理。',
        isEnabled: true,
        metadata: null,
    },
    {
        type: 'SAMPLE_NOT_RECEIVED',
        title: '📦 样品未签收提醒',
        content: '达人 "{{influencerName}}" 的样品已寄出超过7天，仍未签收，请跟进确认。',
        isEnabled: true,
        metadata: null,
    },
    {
        type: 'RESULT_NOT_RECORDED',
        title: '📊 结果待录入提醒',
        content: '达人 "{{influencerName}}" 已上车超过14天，请及时录入合作结果。',
        isEnabled: true,
        metadata: null,
    },
];

// ==================== 模板 CRUD ====================

/**
 * 获取所有通知模板
 */
export async function listTemplates() {
    return prisma.notificationTemplate.findMany({
        orderBy: { createdAt: 'asc' },
    });
}

/**
 * 根据类型获取模板
 */
export async function getTemplateByType(type: string) {
    return prisma.notificationTemplate.findUnique({
        where: { type },
    });
}

/**
 * 更新模板
 */
export async function updateTemplate(
    type: string,
    data: {
        title?: string;
        content?: string;
        isEnabled?: boolean;
        metadata?: Record<string, unknown>;
    }
) {
    return prisma.notificationTemplate.update({
        where: { type },
        data: {
            ...data,
            updatedAt: new Date(),
        } as any,  // 绕过Prisma的JSON类型检查
    });
}

/**
 * 初始化默认模板（如果不存在）
 */
export async function seedDefaultTemplates() {
    for (const template of DEFAULT_TEMPLATES) {
        const existing = await prisma.notificationTemplate.findUnique({
            where: { type: template.type },
        });

        if (!existing) {
            await prisma.notificationTemplate.create({
                data: template as any,  // 绕过Prisma的JSON类型检查
            });
            console.log(`✅ Created template: ${template.type}`);
        }
    }
}

/**
 * 根据模板创建通知（支持变量替换）
 */
export async function createNotificationFromTemplate(
    userId: string,
    templateType: string,
    variables: Record<string, string> = {}
) {
    const template = await getTemplateByType(templateType);

    if (!template || !template.isEnabled) {
        console.log(`Template ${templateType} not found or disabled`);
        return null;
    }

    // 变量替换
    let content = template.content;
    let title = template.title;

    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        content = content.replace(new RegExp(placeholder, 'g'), value);
        title = title.replace(new RegExp(placeholder, 'g'), value);
    }

    // 创建通知
    return prisma.notification.create({
        data: {
            userId,
            type: templateType,
            title,
            content,
        },
    });
}

/**
 * 为新用户创建欢迎通知
 */
export async function createWelcomeNotification(userId: string) {
    return createNotificationFromTemplate(userId, 'WELCOME');
}
