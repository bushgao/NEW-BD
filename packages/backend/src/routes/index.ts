import { Router } from 'express';
import authRoutes from './auth.routes';
import influencerRoutes from './influencer.routes';
import sampleRoutes from './sample.routes';
import collaborationRoutes from './collaboration.routes';
import resultRoutes from './result.routes';
import reportRoutes from './report.routes';
import platformRoutes from './platform.routes';
import importExportRoutes from './import-export.routes';
import notificationRoutes from './notification.routes';
import notificationTemplateRoutes from './notification-template.routes';
import staffManagementRoutes from './staff-management.routes';
import userRoutes from './user.routes';
import globalInfluencerRoutes from './global-influencer.routes';
import invitationRoutes from './invitation.routes';

// 达人端口路由（独立模块）
import influencerAuthRoutes from './influencer-auth.routes';
import influencerPortalRoutes from './influencer-portal.routes';
import influencerAccountRoutes from './influencer-account.routes';

const router = Router();

// API version info
router.get('/', (_req, res) => {
    res.json({
        success: true,
        data: {
            name: '达人合作执行与成本管理系统API',
            version: '1.0.0',
        },
    });
});

// Auth routes
router.use('/auth', authRoutes);

// Influencer routes
router.use('/influencers', influencerRoutes);

// Sample routes
router.use('/samples', sampleRoutes);

// Collaboration routes
router.use('/collaborations', collaborationRoutes);

// Result routes
router.use('/results', resultRoutes);

// Report routes
router.use('/reports', reportRoutes);

// Platform routes (admin only)
router.use('/platform', platformRoutes);

// Import/Export routes
router.use('/', importExportRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Notification template routes (admin only)
router.use('/notification-templates', notificationTemplateRoutes);

// Staff management routes (factory owner only)
router.use('/staff', staffManagementRoutes);

// User routes (preferences, settings)
router.use('/users', userRoutes);

// Global influencer routes (global influencer pool)
router.use('/global-influencers', globalInfluencerRoutes);

// Invitation routes (brand invite staff)
router.use('/invitations', invitationRoutes);

// Subscription routes (subscription management)
import subscriptionRoutes from './subscription.routes';
router.use('/subscription', subscriptionRoutes);

// ============================================
// 达人端口路由（独立模块，与商务端完全隔离）
// ============================================
router.use('/influencer-portal/auth', influencerAuthRoutes);
router.use('/influencer-portal', influencerPortalRoutes);
router.use('/influencer-portal/account', influencerAccountRoutes);

export default router;
