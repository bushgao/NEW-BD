"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStaffPermissions = getStaffPermissions;
exports.updateStaffPermissions = updateStaffPermissions;
exports.getPermissionTemplates = getPermissionTemplates;
exports.listStaff = listStaff;
exports.getStaffDetail = getStaffDetail;
exports.createStaff = createStaff;
exports.updateStaffStatus = updateStaffStatus;
exports.deleteStaff = deleteStaff;
exports.getQuotaUsage = getQuotaUsage;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const platform_service_1 = require("./platform.service");
const permissions_1 = require("../types/permissions");
// ============ Permission Management ============
/**
 * 获取商务权限
 */
async function getStaffPermissions(staffId, brandId) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            id: staffId,
            brandId,
            role: 'BUSINESS',
        },
        select: {
            permissions: true,
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('商务账号不存在');
    }
    const permissions = user.permissions || permissions_1.PERMISSION_TEMPLATES.basic.permissions;
    const template = (0, permissions_1.identifyTemplate)(permissions);
    return {
        permissions,
        template,
    };
}
/**
 * 更新商务权限
 */
async function updateStaffPermissions(staffId, brandId, permissions) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            id: staffId,
            brandId,
            role: 'BUSINESS',
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('商务账号不存在');
    }
    // 更新权限
    const updatedUser = await prisma_1.default.user.update({
        where: { id: staffId },
        data: {
            permissions: permissions,
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            permissions: true,
        },
    });
    const template = (0, permissions_1.identifyTemplate)(permissions);
    return {
        user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            status: 'ACTIVE',
            createdAt: updatedUser.createdAt,
        },
        permissions,
        template,
    };
}
/**
 * 获取权限模板列表
 */
function getPermissionTemplates() {
    return Object.values(permissions_1.PERMISSION_TEMPLATES);
}
// ============ Staff Management ============
/**
 * 获取工厂商务账号列表
 */
async function listStaff(brandId, pagination) {
    const { page, pageSize } = pagination;
    // 验证工厂存在
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    const [staff, total] = await Promise.all([
        prisma_1.default.user.findMany({
            where: {
                brandId,
                role: 'BUSINESS',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma_1.default.user.count({
            where: {
                brandId,
                role: 'BUSINESS',
            },
        }),
    ]);
    // 将数据转换为 StaffMember 格式
    const staffMembers = staff.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        createdAt: user.createdAt,
    }));
    return {
        data: staffMembers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}
/**
 * 获取商务账号详情（含工作统计）
 */
async function getStaffDetail(staffId, brandId) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            id: staffId,
            brandId,
            role: 'BUSINESS',
        },
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('商务账号不存在');
    }
    // 获取工作统计
    const [influencerCount, collaborationCount, dispatchCount, closedDeals, gmvResult] = await Promise.all([
        // 管理的达人数量（注：当前 Influencer 模型没有 createdBy 字段，使用 brandId 统计）
        prisma_1.default.influencer.count({
            where: {
                brandId,
            },
        }),
        // 创建的合作数量
        prisma_1.default.collaboration.count({
            where: {
                businessStaffId: staffId,
            },
        }),
        // 寄样次数
        prisma_1.default.sampleDispatch.count({
            where: {
                businessStaffId: staffId,
            },
        }),
        // 成交数量（已发布或已复盘）
        prisma_1.default.collaboration.count({
            where: {
                businessStaffId: staffId,
                stage: {
                    in: ['PUBLISHED', 'REVIEWED'],
                },
            },
        }),
        // 总GMV
        prisma_1.default.collaborationResult.aggregate({
            where: {
                collaboration: {
                    businessStaffId: staffId,
                },
            },
            _sum: {
                salesGmv: true,
            },
        }),
    ]);
    const staffDetail = {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        stats: {
            influencerCount,
            collaborationCount,
            dispatchCount,
            closedDeals,
            totalGmv: gmvResult._sum.salesGmv || 0,
        },
    };
    return staffDetail;
}
/**
 * 创建商务账号（检查配额）
 */
async function createStaff(brandId, data) {
    const { name, email, phone, password } = data;
    // 验证工厂存在
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    // 必须提供手机号（作为主要登录方式）
    if (!phone) {
        throw (0, errorHandler_1.createBadRequestError)('请提供手机号');
    }
    // 检查配额
    await (0, platform_service_1.validateQuota)(brandId, 'staff');
    // 检查手机号是否已存在
    const existingPhone = await prisma_1.default.user.findFirst({
        where: { phone },
    });
    if (existingPhone) {
        throw (0, errorHandler_1.createBadRequestError)('该手机号已被注册');
    }
    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
        const existingEmail = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingEmail) {
            throw (0, errorHandler_1.createBadRequestError)('该邮箱已被注册');
        }
    }
    // 加密密码
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    // 创建商务账号
    // email 现在是可选的，不再生成假邮箱
    const user = await prisma_1.default.user.create({
        data: {
            email: email || null, // 邮箱可选
            phone,
            passwordHash,
            name,
            role: 'BUSINESS',
            brandId,
            isIndependent: false,
            // 设置默认权限（基础商务）
            permissions: permissions_1.PERMISSION_TEMPLATES.basic.permissions,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
        },
    });
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: 'ACTIVE',
        createdAt: user.createdAt,
    };
}
/**
 * 更新商务账号状态（启用/禁用）
 */
async function updateStaffStatus(staffId, brandId, status) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            id: staffId,
            brandId,
            role: 'BUSINESS',
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('商务账号不存在');
    }
    // 更新状态
    const updatedUser = await prisma_1.default.user.update({
        where: { id: staffId },
        data: {
            status,
            disabledAt: status === 'DISABLED' ? new Date() : null,
        },
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
        },
    });
    return {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
    };
}
/**
 * 删除商务账号（保留业务数据）
 */
async function deleteStaff(staffId, brandId) {
    const user = await prisma_1.default.user.findFirst({
        where: {
            id: staffId,
            brandId,
            role: 'BUSINESS',
        },
    });
    if (!user) {
        throw (0, errorHandler_1.createNotFoundError)('商务账号不存在');
    }
    // 检查是否是工厂老板（不能删除工厂老板）
    if (user.role === 'BRAND') {
        throw (0, errorHandler_1.createForbiddenError)('不能删除工厂老板账号');
    }
    // 删除用户记录
    // 注意：由于外键关系，业务数据（达人、合作、寄样记录）会保留
    // businessStaffId 字段会保留，但用户无法登录
    await prisma_1.default.user.delete({
        where: { id: staffId },
    });
}
/**
 * 获取配额使用情况
 */
async function getQuotaUsage(brandId) {
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        include: {
            _count: {
                select: {
                    staff: true,
                    influencers: true,
                },
            },
        },
    });
    if (!factory) {
        throw (0, errorHandler_1.createNotFoundError)('工厂不存在');
    }
    const staffCurrent = factory._count.staff;
    const staffLimit = factory.staffLimit;
    const influencerCurrent = factory._count.influencers;
    const influencerLimit = factory.influencerLimit;
    return {
        staff: {
            current: staffCurrent,
            limit: staffLimit,
            available: Math.max(0, staffLimit - staffCurrent),
            isReached: staffCurrent >= staffLimit,
        },
        influencer: {
            current: influencerCurrent,
            limit: influencerLimit,
            available: Math.max(0, influencerLimit - influencerCurrent),
            isReached: influencerCurrent >= influencerLimit,
        },
    };
}
//# sourceMappingURL=staff-management.service.js.map