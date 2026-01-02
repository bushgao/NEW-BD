/**
 * 达人账号管理路由 (Influencer Account Routes)
 * 
 * 路由前缀: /api/influencer-portal/account
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  getAccount,
  getContacts,
  addContact,
  removeContact,
  updateContact,
} from '../services/influencer-account.service';
import { influencerAuthenticate } from '../middleware/influencer-auth.middleware';
import { createBadRequestError } from '../middleware/errorHandler';

const router = Router();

// 所有路由都需要达人认证
router.use(influencerAuthenticate);

/**
 * 验证请求参数
 */
function validateRequest(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => e.msg).join(', ');
    throw createBadRequestError(errorMessages);
  }
  next();
}

/**
 * GET /api/influencer-portal/account
 * 获取账号信息
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const account = await getAccount(accountId);
      
      res.json({
        success: true,
        data: account,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/influencer-portal/account/contacts
 * 获取联系人列表
 */
router.get(
  '/contacts',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const contacts = await getContacts(accountId);
      
      res.json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/influencer-portal/account/contacts
 * 添加联系人
 */
router.post(
  '/contacts',
  [
    body('phone')
      .notEmpty().withMessage('手机号不能为空')
      .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
    body('name').optional().isString().withMessage('姓名必须是字符串'),
    body('contactType')
      .notEmpty().withMessage('联系人类型不能为空')
      .isIn(['SELF', 'ASSISTANT', 'AGENT', 'OTHER']).withMessage('联系人类型不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const { phone, name, contactType } = req.body;
      
      const contact = await addContact(accountId, { phone, name, contactType });
      
      res.status(201).json({
        success: true,
        data: contact,
        message: '联系人添加成功',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/influencer-portal/account/contacts/:id
 * 移除联系人
 */
router.delete(
  '/contacts/:id',
  [
    param('id').isUUID().withMessage('联系人ID格式不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const contactId = req.params.id;
      
      await removeContact(accountId, contactId);
      
      res.json({
        success: true,
        message: '联系人已移除',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/influencer-portal/account/contacts/:id
 * 更新联系人信息
 */
router.put(
  '/contacts/:id',
  [
    param('id').isUUID().withMessage('联系人ID格式不正确'),
    body('name').optional().isString().withMessage('姓名必须是字符串'),
    body('contactType')
      .optional()
      .isIn(['SELF', 'ASSISTANT', 'AGENT', 'OTHER']).withMessage('联系人类型不正确'),
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.influencer!.accountId;
      const contactId = req.params.id;
      const { name, contactType } = req.body;
      
      const contact = await updateContact(accountId, contactId, { name, contactType });
      
      res.json({
        success: true,
        data: contact,
        message: '联系人信息已更新',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
