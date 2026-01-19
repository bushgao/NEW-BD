"use strict";
/**
 * 达人账号管理路由 (Influencer Account Routes)
 *
 * 路由前缀: /api/influencer-portal/account
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const influencer_account_service_1 = require("../services/influencer-account.service");
const influencer_auth_middleware_1 = require("../middleware/influencer-auth.middleware");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
// 所有路由都需要达人认证
router.use(influencer_auth_middleware_1.influencerAuthenticate);
/**
 * 验证请求参数
 */
function validateRequest(req, _res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((e) => e.msg).join(', ');
        throw (0, errorHandler_1.createBadRequestError)(errorMessages);
    }
    next();
}
/**
 * GET /api/influencer-portal/account
 * 获取账号信息
 */
router.get('/', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const account = await (0, influencer_account_service_1.getAccount)(accountId);
        res.json({
            success: true,
            data: account,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/influencer-portal/account/contacts
 * 获取联系人列表
 */
router.get('/contacts', async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const contacts = await (0, influencer_account_service_1.getContacts)(accountId);
        res.json({
            success: true,
            data: contacts,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/influencer-portal/account/contacts
 * 添加联系人
 */
router.post('/contacts', [
    (0, express_validator_1.body)('phone')
        .notEmpty().withMessage('手机号不能为空')
        .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
    (0, express_validator_1.body)('name').optional().isString().withMessage('姓名必须是字符串'),
    (0, express_validator_1.body)('contactType')
        .notEmpty().withMessage('联系人类型不能为空')
        .isIn(['SELF', 'ASSISTANT', 'AGENT', 'OTHER']).withMessage('联系人类型不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const { phone, name, contactType } = req.body;
        const contact = await (0, influencer_account_service_1.addContact)(accountId, { phone, name, contactType });
        res.status(201).json({
            success: true,
            data: contact,
            message: '联系人添加成功',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/influencer-portal/account/contacts/:id
 * 移除联系人
 */
router.delete('/contacts/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('联系人ID格式不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const contactId = req.params.id;
        await (0, influencer_account_service_1.removeContact)(accountId, contactId);
        res.json({
            success: true,
            message: '联系人已移除',
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/influencer-portal/account/contacts/:id
 * 更新联系人信息
 */
router.put('/contacts/:id', [
    (0, express_validator_1.param)('id').isUUID().withMessage('联系人ID格式不正确'),
    (0, express_validator_1.body)('name').optional().isString().withMessage('姓名必须是字符串'),
    (0, express_validator_1.body)('contactType')
        .optional()
        .isIn(['SELF', 'ASSISTANT', 'AGENT', 'OTHER']).withMessage('联系人类型不正确'),
], validateRequest, async (req, res, next) => {
    try {
        const accountId = req.influencer.accountId;
        const contactId = req.params.id;
        const { name, contactType } = req.body;
        const contact = await (0, influencer_account_service_1.updateContact)(accountId, contactId, { name, contactType });
        res.json({
            success: true,
            data: contact,
            message: '联系人信息已更新',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=influencer-account.routes.js.map