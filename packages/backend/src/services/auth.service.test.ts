/**
 * 认证服务属性测试
 * Property 1: 角色权限隔离
 * 
 * 使用 fast-check 生成随机用户和路径组合
 * 验证权限检查逻辑正确性
 * 
 * **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { hasPermission, hasMinimumRole, ROLE_HIERARCHY } from '../middleware/auth.middleware';
import type { UserRole } from '@ics/shared';

// 定义角色和路径的权限映射
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // 平台管理员专属路由
  '/admin': ['PLATFORM_ADMIN'],
  '/platform/factories': ['PLATFORM_ADMIN'],
  '/platform/plans': ['PLATFORM_ADMIN'],
  
  // 工厂老板专属路由
  '/samples': ['FACTORY_OWNER'],
  '/reports': ['FACTORY_OWNER'],
  '/reports/staff-performance': ['FACTORY_OWNER', 'PLATFORM_ADMIN'],
  '/reports/dashboard': ['FACTORY_OWNER', 'PLATFORM_ADMIN'],
  
  // 工厂成员（老板+商务）可访问的路由
  '/influencers': ['FACTORY_OWNER', 'BUSINESS_STAFF'],
  '/pipeline': ['FACTORY_OWNER', 'BUSINESS_STAFF'],
  '/results': ['FACTORY_OWNER', 'BUSINESS_STAFF'],
  '/collaborations': ['FACTORY_OWNER', 'BUSINESS_STAFF'],
  
  // 所有认证用户可访问的路由
  '/dashboard': ['PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF'],
  '/notifications': ['PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF'],
};

// 所有有效角色
const ALL_ROLES: UserRole[] = ['PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF'];

// 生成随机角色的 Arbitrary
const roleArbitrary = fc.constantFrom<UserRole>('PLATFORM_ADMIN', 'FACTORY_OWNER', 'BUSINESS_STAFF');

// 生成随机路径的 Arbitrary
const pathArbitrary = fc.constantFrom(...Object.keys(ROUTE_PERMISSIONS));

describe('认证服务属性测试', () => {
  describe('Property 1: 角色权限隔离', () => {
    /**
     * 属性测试：对于任意用户角色和功能路径组合，
     * 如果用户角色在该路径的允许角色列表中，则应该允许访问；
     * 否则应该拒绝访问。
     */
    it('对于任意角色和路径组合，权限检查结果应与预定义规则一致', () => {
      fc.assert(
        fc.property(roleArbitrary, pathArbitrary, (userRole, path) => {
          const allowedRoles = ROUTE_PERMISSIONS[path];
          const hasAccess = hasPermission(userRole, allowedRoles);
          const shouldHaveAccess = allowedRoles.includes(userRole);
          
          // 验证：hasPermission 的结果应该与直接检查 includes 一致
          expect(hasAccess).toBe(shouldHaveAccess);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：平台管理员应该能访问所有平台级功能
     */
    it('平台管理员应该能访问所有平台管理功能', () => {
      const platformAdminRoutes = ['/admin', '/platform/factories', '/platform/plans'];
      
      fc.assert(
        fc.property(fc.constantFrom(...platformAdminRoutes), (path) => {
          const allowedRoles = ROUTE_PERMISSIONS[path];
          const hasAccess = hasPermission('PLATFORM_ADMIN', allowedRoles);
          
          expect(hasAccess).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：工厂老板不应该能访问平台管理功能
     */
    it('工厂老板不应该能访问平台管理专属功能', () => {
      const platformOnlyRoutes = ['/admin', '/platform/factories', '/platform/plans'];
      
      fc.assert(
        fc.property(fc.constantFrom(...platformOnlyRoutes), (path) => {
          const allowedRoles = ROUTE_PERMISSIONS[path];
          const hasAccess = hasPermission('FACTORY_OWNER', allowedRoles);
          
          expect(hasAccess).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：商务人员不应该能访问工厂老板专属功能
     */
    it('商务人员不应该能访问工厂老板专属功能', () => {
      const ownerOnlyRoutes = ['/samples', '/reports'];
      
      fc.assert(
        fc.property(fc.constantFrom(...ownerOnlyRoutes), (path) => {
          const allowedRoles = ROUTE_PERMISSIONS[path];
          const hasAccess = hasPermission('BUSINESS_STAFF', allowedRoles);
          
          expect(hasAccess).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：工厂成员（老板和商务）都应该能访问达人管理、合作管道等功能
     */
    it('工厂成员都应该能访问共享功能', () => {
      const sharedRoutes = ['/influencers', '/pipeline', '/results', '/collaborations'];
      const factoryMembers: UserRole[] = ['FACTORY_OWNER', 'BUSINESS_STAFF'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...factoryMembers),
          fc.constantFrom(...sharedRoutes),
          (role, path) => {
            const allowedRoles = ROUTE_PERMISSIONS[path];
            const hasAccess = hasPermission(role, allowedRoles);
            
            expect(hasAccess).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：所有认证用户都应该能访问通用功能
     */
    it('所有认证用户都应该能访问通用功能', () => {
      const commonRoutes = ['/dashboard', '/notifications'];
      
      fc.assert(
        fc.property(roleArbitrary, fc.constantFrom(...commonRoutes), (role, path) => {
          const allowedRoles = ROUTE_PERMISSIONS[path];
          const hasAccess = hasPermission(role, allowedRoles);
          
          expect(hasAccess).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('角色层级验证', () => {
    /**
     * 属性测试：角色层级应该是传递的
     * 如果 A >= B 且 B >= C，则 A >= C
     */
    it('角色层级应该满足传递性', () => {
      fc.assert(
        fc.property(roleArbitrary, roleArbitrary, roleArbitrary, (roleA, roleB, roleC) => {
          const levelA = ROLE_HIERARCHY[roleA];
          const levelB = ROLE_HIERARCHY[roleB];
          const levelC = ROLE_HIERARCHY[roleC];
          
          if (levelA >= levelB && levelB >= levelC) {
            expect(levelA >= levelC).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：hasMinimumRole 应该与层级比较一致
     */
    it('hasMinimumRole 应该与角色层级比较一致', () => {
      fc.assert(
        fc.property(roleArbitrary, roleArbitrary, (userRole, minimumRole) => {
          const result = hasMinimumRole(userRole, minimumRole);
          const expected = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRole];
          
          expect(result).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：平台管理员应该满足任何最低角色要求
     */
    it('平台管理员应该满足任何最低角色要求', () => {
      fc.assert(
        fc.property(roleArbitrary, (minimumRole) => {
          const result = hasMinimumRole('PLATFORM_ADMIN', minimumRole);
          expect(result).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：商务人员只能满足商务人员的最低要求
     */
    it('商务人员只能满足商务人员的最低角色要求', () => {
      const higherRoles: UserRole[] = ['PLATFORM_ADMIN', 'FACTORY_OWNER'];
      
      fc.assert(
        fc.property(fc.constantFrom(...higherRoles), (minimumRole) => {
          const result = hasMinimumRole('BUSINESS_STAFF', minimumRole);
          expect(result).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('权限检查边界条件', () => {
    /**
     * 属性测试：空的允许角色列表应该拒绝所有用户
     */
    it('空的允许角色列表应该拒绝所有用户', () => {
      fc.assert(
        fc.property(roleArbitrary, (role) => {
          const hasAccess = hasPermission(role, []);
          expect(hasAccess).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：包含所有角色的列表应该允许所有用户
     */
    it('包含所有角色的列表应该允许所有用户', () => {
      fc.assert(
        fc.property(roleArbitrary, (role) => {
          const hasAccess = hasPermission(role, ALL_ROLES);
          expect(hasAccess).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * 属性测试：只包含自己角色的列表应该只允许自己
     */
    it('只包含单一角色的列表应该只允许该角色', () => {
      fc.assert(
        fc.property(roleArbitrary, roleArbitrary, (allowedRole, testRole) => {
          const hasAccess = hasPermission(testRole, [allowedRole]);
          const expected = testRole === allowedRole;
          
          expect(hasAccess).toBe(expected);
        }),
        { numRuns: 100 }
      );
    });
  });
});
