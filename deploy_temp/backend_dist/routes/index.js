"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const influencer_routes_1 = __importDefault(require("./influencer.routes"));
const sample_routes_1 = __importDefault(require("./sample.routes"));
const collaboration_routes_1 = __importDefault(require("./collaboration.routes"));
const result_routes_1 = __importDefault(require("./result.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const platform_routes_1 = __importDefault(require("./platform.routes"));
const import_export_routes_1 = __importDefault(require("./import-export.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const notification_template_routes_1 = __importDefault(require("./notification-template.routes"));
const staff_management_routes_1 = __importDefault(require("./staff-management.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const global_influencer_routes_1 = __importDefault(require("./global-influencer.routes"));
const invitation_routes_1 = __importDefault(require("./invitation.routes"));
// 达人端口路由（独立模块）
const influencer_auth_routes_1 = __importDefault(require("./influencer-auth.routes"));
const influencer_portal_routes_1 = __importDefault(require("./influencer-portal.routes"));
const influencer_account_routes_1 = __importDefault(require("./influencer-account.routes"));
const router = (0, express_1.Router)();
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
router.use('/auth', auth_routes_1.default);
// Influencer routes
router.use('/influencers', influencer_routes_1.default);
// Sample routes
router.use('/samples', sample_routes_1.default);
// Collaboration routes
router.use('/collaborations', collaboration_routes_1.default);
// Result routes
router.use('/results', result_routes_1.default);
// Report routes
router.use('/reports', report_routes_1.default);
// Platform routes (admin only)
router.use('/platform', platform_routes_1.default);
// Import/Export routes
router.use('/', import_export_routes_1.default);
// Notification routes
router.use('/notifications', notification_routes_1.default);
// Notification template routes (admin only)
router.use('/notification-templates', notification_template_routes_1.default);
// Staff management routes (factory owner only)
router.use('/staff', staff_management_routes_1.default);
// User routes (preferences, settings)
router.use('/users', user_routes_1.default);
// Global influencer routes (global influencer pool)
router.use('/global-influencers', global_influencer_routes_1.default);
// Invitation routes (brand invite staff)
router.use('/invitations', invitation_routes_1.default);
// Subscription routes (subscription management)
const subscription_routes_1 = __importDefault(require("./subscription.routes"));
router.use('/subscription', subscription_routes_1.default);
// ============================================
// 达人端口路由（独立模块，与商务端完全隔离）
// ============================================
router.use('/influencer-portal/auth', influencer_auth_routes_1.default);
router.use('/influencer-portal', influencer_portal_routes_1.default);
router.use('/influencer-portal/account', influencer_account_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map