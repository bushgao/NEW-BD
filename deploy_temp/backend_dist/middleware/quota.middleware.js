"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInfluencerQuota = exports.checkStaffQuota = void 0;
exports.checkQuota = checkQuota;
const platform_service_1 = require("../services/platform.service");
/**
 * Middleware factory to check quota before creating resources
 * @param type - The type of quota to check ('staff' or 'influencer')
 */
function checkQuota(type) {
    return async (req, _res, next) => {
        try {
            // Get brandId from user context or request body
            const brandId = req.user?.brandId || req.body.brandId;
            if (!brandId) {
                // If no brandId, skip quota check (will be handled by other validation)
                return next();
            }
            // Platform admins bypass quota checks
            if (req.user?.role === 'PLATFORM_ADMIN') {
                return next();
            }
            await (0, platform_service_1.validateQuota)(brandId, type);
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Middleware to check staff quota
 */
exports.checkStaffQuota = checkQuota('staff');
/**
 * Middleware to check influencer quota
 */
exports.checkInfluencerQuota = checkQuota('influencer');
//# sourceMappingURL=quota.middleware.js.map