import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticate, requireBrandMember } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

const router = Router();

// 所有路由都需要认�?
router.use(authenticate);
router.use(requireBrandMember);

// ============================================
// 话术模板 CRUD
// ============================================

/**
 * GET /api/wechat-scripts
 * 获取话术列表
 */
router.get(
    '/',
    [
        query('sampleId').optional().isUUID(),
        query('onlyMine').optional().isBoolean(),
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { sampleId, onlyMine } = req.query;

            const where: any = {
                brandId: user.brandId,
            };

            // 如果指定了产品ID，则筛�?
            if (sampleId) {
                where.sampleId = sampleId;
            }

            // 商务只能看到自己创建的（除非是品牌）
            if (user.role === 'BUSINESS' || onlyMine === 'true') {
                where.createdBy = user.userId;
            }

            const scripts = await prisma.weChatScript.findMany({
                where,
                include: {
                    sample: {
                        select: { id: true, name: true, sku: true },
                    },
                    creator: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: [
                    { isDefault: 'desc' },
                    { createdAt: 'desc' },
                ],
            });

            return res.json({ success: true, data: scripts });
        } catch (error) {
            console.error('获取话术列表失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * GET /api/wechat-scripts/:id
 * 获取单个话术
 */
router.get(
    '/:id',
    [param('id').isUUID()],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { id } = req.params;

            const script = await prisma.weChatScript.findFirst({
                where: {
                    id,
                    brandId: user.brandId,
                },
                include: {
                    sample: {
                        select: { id: true, name: true, sku: true },
                    },
                    creator: {
                        select: { id: true, name: true },
                    },
                },
            });

            if (!script) {
                return res.status(404).json({ success: false, error: { message: '话术不存�? } });
            }

            return res.json({ success: true, data: script });
        } catch (error) {
            console.error('获取话术详情失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * POST /api/wechat-scripts
 * 创建话术
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('话术名称不能为空'),
        body('content').trim().notEmpty().withMessage('话术内容不能为空'),
        body('sampleId').optional({ nullable: true }).isUUID(),
        body('isDefault').optional().isBoolean(),
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { name, content, sampleId, isDefault } = req.body;

            // 如果设置为默认，先取消其他默�?
            if (isDefault) {
                await prisma.weChatScript.updateMany({
                    where: {
                        brandId: user.brandId,
                        sampleId: sampleId || null,
                        isDefault: true,
                    },
                    data: { isDefault: false },
                });
            }

            const script = await prisma.weChatScript.create({
                data: {
                    brandId: user.brandId,
                    name,
                    content,
                    sampleId: sampleId || null,
                    isDefault: isDefault || false,
                    createdBy: user.userId,
                },
                include: {
                    sample: {
                        select: { id: true, name: true, sku: true },
                    },
                    creator: {
                        select: { id: true, name: true },
                    },
                },
            });

            return res.status(201).json({ success: true, data: script });
        } catch (error) {
            console.error('创建话术失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * PUT /api/wechat-scripts/:id
 * 更新话术
 */
router.put(
    '/:id',
    [
        param('id').isUUID(),
        body('name').optional().trim().notEmpty(),
        body('content').optional().trim().notEmpty(),
        body('sampleId').optional({ nullable: true }).isUUID(),
        body('isDefault').optional().isBoolean(),
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { id } = req.params;
            const { name, content, sampleId, isDefault } = req.body;

            // 检查话术是否存在且有权�?
            const existing = await prisma.weChatScript.findFirst({
                where: {
                    id,
                    brandId: user.brandId,
                },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: { message: '话术不存�? } });
            }

            // 商务只能编辑自己创建�?
            if (user.role === 'BUSINESS' && existing.createdBy !== user.userId) {
                return res.status(403).json({ success: false, error: { message: '无权编辑此话�? } });
            }

            // 如果设置为默认，先取消其他默�?
            if (isDefault) {
                await prisma.weChatScript.updateMany({
                    where: {
                        brandId: user.brandId,
                        sampleId: sampleId !== undefined ? (sampleId || null) : existing.sampleId,
                        isDefault: true,
                        id: { not: id },
                    },
                    data: { isDefault: false },
                });
            }

            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (content !== undefined) updateData.content = content;
            if (sampleId !== undefined) updateData.sampleId = sampleId || null;
            if (isDefault !== undefined) updateData.isDefault = isDefault;

            const script = await prisma.weChatScript.update({
                where: { id },
                data: updateData,
                include: {
                    sample: {
                        select: { id: true, name: true, sku: true },
                    },
                    creator: {
                        select: { id: true, name: true },
                    },
                },
            });

            return res.json({ success: true, data: script });
        } catch (error) {
            console.error('更新话术失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * DELETE /api/wechat-scripts/:id
 * 删除话术
 */
router.delete(
    '/:id',
    [param('id').isUUID()],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { id } = req.params;

            // 检查话术是否存在且有权�?
            const existing = await prisma.weChatScript.findFirst({
                where: {
                    id,
                    brandId: user.brandId,
                },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: { message: '话术不存�? } });
            }

            // 商务只能删除自己创建�?
            if (user.role === 'BUSINESS' && existing.createdBy !== user.userId) {
                return res.status(403).json({ success: false, error: { message: '无权删除此话�? } });
            }

            await prisma.weChatScript.delete({
                where: { id },
            });

            return res.json({ success: true, message: '话术已删�? });
        } catch (error) {
            console.error('删除话术失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

/**
 * POST /api/wechat-scripts/:id/set-default
 * 设置为默认话�?
 */
router.post(
    '/:id/set-default',
    [param('id').isUUID()],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, error: { message: '参数验证失败', details: errors.array() } });
            }

            const user = (req as any).user;
            const { id } = req.params;

            // 检查话术是否存�?
            const existing = await prisma.weChatScript.findFirst({
                where: {
                    id,
                    brandId: user.brandId,
                },
            });

            if (!existing) {
                return res.status(404).json({ success: false, error: { message: '话术不存�? } });
            }

            // 取消同产品下其他默认
            await prisma.weChatScript.updateMany({
                where: {
                    brandId: user.brandId,
                    sampleId: existing.sampleId,
                    isDefault: true,
                },
                data: { isDefault: false },
            });

            // 设置当前为默�?
            const script = await prisma.weChatScript.update({
                where: { id },
                data: { isDefault: true },
                include: {
                    sample: {
                        select: { id: true, name: true, sku: true },
                    },
                    creator: {
                        select: { id: true, name: true },
                    },
                },
            });

            return res.json({ success: true, data: script });
        } catch (error) {
            console.error('设置默认话术失败:', error);
            return res.status(500).json({ success: false, error: { message: '服务器错�? } });
        }
    }
);

export default router;
