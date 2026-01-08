# 实施计划：平台管理端功能增强

## 概述

本文档定义了平台管理端功能增强的实施任务，包括达人管理、来源追踪、认证功能和数据统计增强。

## 任务列表

### 1. 数据库设计和迁移

- [ ] 1.1 创建 Prisma migration 文件
  - 添加 `InfluencerSourceType` 枚举（PLATFORM, FACTORY, STAFF）
  - 添加 `VerificationStatus` 枚举（UNVERIFIED, VERIFIED, REJECTED）
  - 扩展 Influencer 模型添加新字段
  - 更新 User 模型关系
  - _需求: 1.1, 2.1, 3.1_

- [ ] 1.2 更新 Prisma schema
  - 在 `schema.prisma` 中定义新的枚举类型
  - 在 Influencer 模型中添加 6 个新字段
  - 添加 User 与 Influencer 的新关系
  - _需求: 1.1, 2.1, 3.1_

- [ ] 1.3 运行数据库迁移
  - 执行 `npm run db:migrate`
  - 验证迁移成功
  - _需求: 1.1, 2.1, 3.1_

- [ ] 1.4 更新 seed 数据
  - 为现有达人数据添加来源信息
  - 设置部分达人为已认证状态
  - 添加认证历史示例数据
  - _需求: 1.1, 2.1, 3.1_

### 2. 共享类型定义

- [ ] 2.1 更新 shared 包类型定义
  - 导出 `InfluencerSourceType` 枚举
  - 导出 `VerificationStatus` 枚举
  - 定义 `InfluencerWithDetails` 接口
  - 定义 `VerificationHistoryEntry` 接口
  - 定义 `InfluencerStats` 接口
  - _需求: 1.1, 2.1, 3.1, 4.1_

### 3. 后端 API 实现

- [ ] 3.1 扩展 platform.service.ts - 达人列表
  - 实现 `listAllInfluencers()` 方法
  - 支持多维度筛选（平台、工厂、来源、认证状态）
  - 支持关键词搜索
  - 包含关联数据（工厂、创建人、认证人）
  - 实现分页逻辑
  - _需求: 1.1, 1.2, 1.3, 1.5, 1.6_

- [ ] 3.2 扩展 platform.service.ts - 达人详情
  - 实现 `getInfluencerDetail()` 方法
  - 返回完整的达人信息
  - 包含来源信息和认证历史
  - 包含合作记录摘要
  - _需求: 1.4, 1.7, 2.7_

- [ ] 3.3 扩展 platform.service.ts - 达人认证
  - 实现 `verifyInfluencer()` 方法
  - 支持通过/拒绝认证
  - 记录认证历史到 JSON 字段
  - 发送通知给工厂老板和添加人
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 3.4 扩展 platform.service.ts - 统计数据
  - 实现 `getInfluencerStats()` 方法
  - 统计来源分布
  - 统计认证状态分布
  - 统计平台分布
  - 计算来源质量指标（认证率、合作成功率）
  - _需求: 4.2, 4.3, 2.8_

- [ ] 3.5 实现达人列表导出功能
  - 实现 `exportInfluencers()` 方法
  - 使用 ExcelJS 生成 Excel 文件
  - 包含所有关键字段
  - 支持筛选条件
  - _需求: 1.9_

- [ ] 3.6 创建 platform-influencer.routes.ts
  - 定义 GET `/api/platform/influencers` 路由
  - 定义 GET `/api/platform/influencers/:id` 路由
  - 定义 POST `/api/platform/influencers/:id/verify` 路由
  - 定义 GET `/api/platform/influencers/stats` 路由
  - 定义 GET `/api/platform/influencers/export` 路由
  - 添加管理员权限验证中间件
  - _需求: 1.1, 3.1, 4.1_

- [ ] 3.7 创建管理员权限中间件
  - 实现 `requirePlatformAdmin` 中间件
  - 验证用户角色为 PLATFORM_ADMIN
  - 返回 403 如果权限不足
  - _需求: 3.1_

- [ ] 3.8 更新 influencer.service.ts
  - 在创建达人时自动记录 `createdBy`
  - 根据用户角色自动设置 `sourceType`
  - 设置默认 `verificationStatus` 为 UNVERIFIED
  - _需求: 2.1, 2.2, 2.3, 2.4_

### 4. 前端服务层实现

- [ ] 4.1 创建 platform-influencer.service.ts
  - 实现 `listAllInfluencers()` API 调用
  - 实现 `getInfluencerDetail()` API 调用
  - 实现 `verifyInfluencer()` API 调用
  - 实现 `getInfluencerStats()` API 调用
  - 实现 `exportInfluencers()` 下载逻辑
  - _需求: 1.1, 3.1, 4.1_

### 5. 前端组件实现

- [ ] 5.1 创建达人管理列表页面
  - 创建 `InfluencerManagement.tsx` 组件
  - 实现筛选栏（平台、工厂、来源、认证状态）
  - 实现搜索功能
  - 实现表格展示（昵称、平台、粉丝数、工厂、来源、认证状态）
  - 实现分页
  - 添加导出按钮
  - _需求: 1.1, 1.2, 1.3, 1.5, 1.6, 1.9_

- [ ] 5.2 实现来源和认证状态徽章
  - 创建 `renderSourceBadge()` 函数
  - 创建 `renderVerificationBadge()` 函数
  - 使用不同颜色区分状态
  - _需求: 1.2, 1.3_

- [ ] 5.3 创建达人详情弹窗
  - 创建 `InfluencerDetailModal.tsx` 组件
  - 实现基本信息标签页
  - 实现来源信息标签页
  - 实现认证信息标签页（包含认证历史时间线）
  - 实现合作记录标签页
  - _需求: 1.4, 1.7, 2.7, 3.9_

- [ ] 5.4 创建认证审核弹窗
  - 创建 `VerificationModal.tsx` 组件
  - 显示达人详细信息
  - 实现认证表单（通过/拒绝）
  - 实现备注输入（拒绝时必填）
  - 实现提交逻辑
  - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 5.5 创建统计数据看板
  - 创建 `InfluencerStatsPanel.tsx` 组件
  - 显示总数和认证状态统计
  - 实现来源分布饼图
  - 实现平台分布柱状图
  - 实现来源质量分析表格
  - _需求: 4.1, 4.2, 4.3, 2.8_

- [ ] 5.6 集成到平台管理页面
  - 在 `Admin/index.tsx` 中添加"达人管理"标签页
  - 添加统计数据看板到概览区域
  - 更新路由配置
  - _需求: 1.1, 4.1_

### 6. 通知功能集成

- [ ] 6.1 实现认证通知
  - 在认证成功/失败时发送通知
  - 通知工厂老板
  - 通知达人添加人
  - 包含认证结果和备注
  - _需求: 3.8_

### 7. 测试

- [ ] 7.1 后端单元测试
  - 测试 `listAllInfluencers()` 方法
  - 测试 `getInfluencerDetail()` 方法
  - 测试 `verifyInfluencer()` 方法
  - 测试 `getInfluencerStats()` 方法
  - 测试权限验证中间件
  - _需求: 所有_

- [ ] 7.2 前端功能测试
  - 测试达人列表加载和筛选
  - 测试达人详情查看
  - 测试认证审核流程
  - 测试统计数据显示
  - 测试导出功能
  - _需求: 所有_

- [ ] 7.3 集成测试
  - 测试完整的认证流程
  - 测试通知发送
  - 测试数据隔离
  - 测试权限控制
  - _需求: 所有_

### 8. 文档和部署

- [ ] 8.1 更新 API 文档
  - 记录新增的 API 端点
  - 记录请求/响应格式
  - 记录权限要求
  - _需求: 所有_

- [ ] 8.2 更新用户文档
  - 编写平台管理员使用指南
  - 编写达人认证流程说明
  - 添加截图和示例
  - _需求: 所有_

- [ ] 8.3 部署准备
  - 确认所有测试通过
  - 准备数据库迁移脚本
  - 更新部署文档
  - _需求: 所有_

## 检查点

### Checkpoint 1 - 数据库迁移完成
确保所有数据库更改已应用，seed 数据正确。如有问题请询问用户。

### Checkpoint 2 - 后端 API 完成
确保所有 API 端点正常工作，权限验证正确。如有问题请询问用户。

### Checkpoint 3 - 前端组件完成
确保所有页面和组件正常显示，交互流畅。如有问题请询问用户。

### Checkpoint 4 - 测试完成
确保所有测试通过，功能符合需求。如有问题请询问用户。

## 注意事项

1. 所有任务按顺序执行，确保依赖关系正确
2. 每个任务完成后进行自测
3. 遇到问题及时记录并寻求帮助
4. 保持代码质量和一致性
5. 及时更新文档

---

**文档状态**: ✅ 已创建  
**预计工期**: 7-10 天  
**开始日期**: 待定
