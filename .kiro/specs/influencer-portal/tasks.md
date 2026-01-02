# Implementation Plan: 达人端口

> Language Rule  
> 本项目所有说明性文本、设计说明、任务拆解均使用中文输出。
> 仅代码、API、变量名使用英文。

## Overview

本实现计划将达人端口功能分解为可执行的编码任务。遵循"只新增，不修改"原则，所有任务都是新增代码，不改动现有功能。

## Tasks

- [x] 1. 数据库 Schema 扩展
  - [x] 1.1 新增达人端口相关数据库表
    - 在 `packages/backend/prisma/schema.prisma` 末尾新增 ContactType 枚举
    - 新增 InfluencerAccount 模型（达人账号）
    - 新增 InfluencerContact 模型（达人联系人）
    - 新增 InfluencerLoginLog 模型（登录日志）
    - 运行 `npx prisma migrate dev` 生成迁移
    - _Requirements: 11.3, 12.1, 12.3_

- [x] 2. 达人认证服务
  - [x] 2.1 创建达人认证服务
    - 新建 `packages/backend/src/services/influencer-auth.service.ts`
    - 实现 `sendVerificationCode(phone)` - 发送验证码（模拟实现，控制台输出）
    - 实现 `loginWithCode(phone, code, deviceInfo)` - 验证码登录
    - 实现首次登录自动创建账号和联系人逻辑
    - 实现 `verifyInfluencerToken(token)` - 验证达人Token
    - 实现 `refreshInfluencerToken(refreshToken)` - 刷新Token
    - _Requirements: 11.2, 11.3, 11.5, 11.6, 12.1_
  - [ ]* 2.2 编写达人认证服务属性测试
    - **Property 1: 首次登录自动创建账号和联系人**
    - **Property 2: 验证码验证正确性**
    - **Property 3: 登录审计日志完整性**
    - **Validates: Requirements 11.3, 11.5, 11.6, 12.1, 12.6**

- [x] 3. 达人认证中间件和路由
  - [x] 3.1 创建达人认证中间件
    - 新建 `packages/backend/src/middleware/influencer-auth.middleware.ts`
    - 实现 `influencerAuthMiddleware` - 验证达人Token
    - 检查联系人是否仍有效（未被移除）
    - _Requirements: 16.4, 16.5_
  - [x] 3.2 创建达人认证路由
    - 新建 `packages/backend/src/routes/influencer-auth.routes.ts`
    - POST `/api/influencer-portal/auth/send-code` - 发送验证码
    - POST `/api/influencer-portal/auth/login` - 验证码登录
    - POST `/api/influencer-portal/auth/refresh` - 刷新Token
    - GET `/api/influencer-portal/auth/me` - 获取当前用户信息
    - _Requirements: 11.2, 11.4, 16.4_

- [x] 4. 达人端口服务
  - [x] 4.1 创建达人端口服务
    - 新建 `packages/backend/src/services/influencer-portal.service.ts`
    - 实现 `getDashboard(accountId)` - 获取首页数据
    - 实现 `getSamples(accountId, filter)` - 获取样品列表（跨工厂聚合）
    - 实现 `getCollaborations(accountId, filter)` - 获取合作列表
    - 实现 `getCollaborationDetail(accountId, collabId)` - 获取合作详情
    - 实现 `confirmSampleReceived(accountId, dispatchId)` - 确认签收
    - 所有返回数据需过滤敏感信息
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1, 14.2, 14.4, 14.5, 15.2, 15.3_
  - [ ]* 4.2 编写达人端口服务属性测试
    - **Property 6: 样品数据跨工厂聚合正确性**
    - **Property 7: 样品筛选结果正确性**
    - **Property 8: 敏感信息隔离**
    - **Property 11: 达人数据隔离**
    - **Validates: Requirements 13.2, 13.4, 13.6, 14.5, 16.1, 16.2**

- [x] 5. 达人账号管理服务
  - [x] 5.1 创建达人账号管理服务
    - 新建 `packages/backend/src/services/influencer-account.service.ts`
    - 实现 `getAccount(accountId)` - 获取账号信息
    - 实现 `getContacts(accountId)` - 获取联系人列表
    - 实现 `addContact(accountId, data)` - 添加联系人
    - 实现 `removeContact(accountId, contactId)` - 移除联系人
    - 实现 `updateContact(accountId, contactId, data)` - 更新联系人
    - _Requirements: 12.2, 12.3, 12.5_
  - [ ]* 5.2 编写达人账号管理服务属性测试
    - **Property 4: 联系人数据一致性**
    - **Property 5: 联系人权限撤销即时性**
    - **Validates: Requirements 12.4, 12.5**

- [x] 6. 达人端口路由
  - [x] 6.1 创建达人端口路由
    - 新建 `packages/backend/src/routes/influencer-portal.routes.ts`
    - GET `/api/influencer-portal/dashboard` - 首页数据
    - GET `/api/influencer-portal/samples` - 样品列表
    - GET `/api/influencer-portal/collaborations` - 合作列表
    - GET `/api/influencer-portal/collaborations/:id` - 合作详情
    - POST `/api/influencer-portal/samples/:id/confirm-received` - 确认签收
    - _Requirements: 13.1, 13.2, 14.1, 14.4, 15.2, 16.4_
  - [x] 6.2 创建达人账号管理路由
    - 新建 `packages/backend/src/routes/influencer-account.routes.ts`
    - GET `/api/influencer-portal/account` - 获取账号信息
    - GET `/api/influencer-portal/account/contacts` - 获取联系人列表
    - POST `/api/influencer-portal/account/contacts` - 添加联系人
    - DELETE `/api/influencer-portal/account/contacts/:id` - 移除联系人
    - PUT `/api/influencer-portal/account/contacts/:id` - 更新联系人
    - _Requirements: 12.2, 12.3, 12.5_

- [x] 7. 后端路由注册
  - [x] 7.1 在主入口注册达人端口路由
    - 修改 `packages/backend/src/index.ts`
    - 导入并注册 influencer-auth.routes
    - 导入并注册 influencer-portal.routes
    - 导入并注册 influencer-account.routes
    - _Requirements: 16.4_

- [x] 8. Checkpoint - 后端功能验证
  - 确保所有后端测试通过
  - 使用 Postman 或 curl 测试 API 端点
  - 如有问题请询问用户

- [x] 9. 前端达人登录入口
  - [x] 9.1 修改登录页面添加达人登录入口
    - 修改 `packages/frontend/src/pages/Login/index.tsx`
    - 在现有登录表单下方添加「达人登录」按钮
    - 点击后跳转到达人登录页面
    - _Requirements: 11.1_
  - [x] 9.2 创建达人登录页面
    - 新建 `packages/frontend/src/pages/InfluencerPortal/Login.tsx`
    - 实现手机号输入框
    - 实现发送验证码按钮（60秒倒计时）
    - 实现验证码输入框
    - 实现登录按钮
    - _Requirements: 11.2, 11.4_

- [x] 10. 前端达人端口服务
  - [x] 10.1 创建达人端口 API 服务
    - 新建 `packages/frontend/src/services/influencer-portal.service.ts`
    - 实现 sendVerificationCode(phone)
    - 实现 login(phone, code)
    - 实现 getDashboard()
    - 实现 getSamples(filter)
    - 实现 getCollaborations(filter)
    - 实现 getCollaborationDetail(id)
    - 实现 confirmSampleReceived(dispatchId)
    - 实现 getAccount()
    - 实现 getContacts()
    - 实现 addContact(data)
    - 实现 removeContact(id)
    - _Requirements: 11.2, 13.1, 13.2, 14.1, 15.2, 12.2_

- [x] 11. 前端达人端口状态管理
  - [x] 11.1 创建达人端口状态 Store
    - 新建 `packages/frontend/src/stores/influencerPortalStore.ts`
    - 管理达人登录状态
    - 管理达人Token
    - 实现登录/登出方法
    - _Requirements: 11.4_

- [x] 12. 前端达人端口页面
  - [x] 12.1 创建达人端口布局
    - 新建 `packages/frontend/src/layouts/InfluencerPortalLayout.tsx`
    - 实现达人端口专属导航栏
    - 包含：首页、样品、合作、账号设置
    - _Requirements: 11.4_
  - [x] 12.2 创建达人首页
    - 新建 `packages/frontend/src/pages/InfluencerPortal/Dashboard.tsx`
    - 显示样品统计卡片（总数、待签收、已签收）
    - 显示合作统计卡片（总数、进行中、已完成）
    - 显示最近样品列表
    - _Requirements: 13.1_
  - [x] 12.3 创建达人样品列表页
    - 新建 `packages/frontend/src/pages/InfluencerPortal/Samples.tsx`
    - 按工厂分组显示样品
    - 实现筛选功能（工厂、状态、时间）
    - 显示快递信息
    - 实现确认签收按钮
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 15.1, 15.2_
  - [x] 12.4 创建达人合作列表页
    - 新建 `packages/frontend/src/pages/InfluencerPortal/Collaborations.tsx`
    - 显示合作列表
    - 显示截止时间和超期提醒
    - 点击查看详情
    - _Requirements: 14.1, 14.2, 14.3_
  - [x] 12.5 创建达人合作详情页
    - 新建 `packages/frontend/src/pages/InfluencerPortal/CollaborationDetail.tsx`
    - 显示合作基本信息
    - 显示关联样品列表
    - 显示阶段变更时间线
    - _Requirements: 14.4_
  - [x] 12.6 创建达人账号设置页
    - 新建 `packages/frontend/src/pages/InfluencerPortal/Settings.tsx`
    - 显示账号信息
    - 显示联系人列表
    - 实现添加/移除联系人功能
    - _Requirements: 12.2, 12.3, 12.5_

- [x] 13. 前端路由配置
  - [x] 13.1 配置达人端口路由
    - 修改 `packages/frontend/src/routes/index.tsx`
    - 添加达人登录路由 `/influencer-portal/login`
    - 添加达人端口路由组 `/influencer-portal/*`
    - 配置达人端口路由守卫
    - _Requirements: 11.4, 16.4_

- [x] 14. 签收通知集成
  - [x] 14.1 实现签收通知功能
    - 修改 `packages/backend/src/services/influencer-portal.service.ts`
    - 在 confirmSampleReceived 中调用 NotificationService
    - 向负责商务发送签收通知
    - _Requirements: 15.4_

- [ ] 15. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 手动测试完整流程：达人登录 → 查看样品 → 确认签收 → 管理联系人
  - 验证数据隔离：达人只能看到自己的数据
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选测试任务，可跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- Checkpoint 任务用于阶段性验证，确保增量开发的正确性
- 属性测试验证核心正确性属性，确保系统行为符合规范
