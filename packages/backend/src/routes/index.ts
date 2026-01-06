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
import staffManagementRoutes from './staff-management.routes';

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
      name: '达人合作执行与成本管理系统 API',
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

// Staff management routes (factory owner only)
router.use('/staff', staffManagementRoutes);

// ============================================
// 达人端口路由（独立模块，与商务端完全隔离）
// ============================================
router.use('/influencer-portal/auth', influencerAuthRoutes);
router.use('/influencer-portal', influencerPortalRoutes);
router.use('/influencer-portal/account', influencerAccountRoutes);

export default router;
