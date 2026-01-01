# Implementation Plan: 达人合作执行与成本管理系统

## Overview

本实现计划将系统分为6个主要阶段：项目初始化、认证模块、达人管理、样品与成本管理、合作流程与ROI、报表与看板。每个阶段包含具体的编码任务和测试任务。

## Tasks

- [x] 1. 项目初始化与基础架构
  - [x] 1.1 初始化项目结构
    - 创建 monorepo 结构（packages/frontend, packages/backend, packages/shared）
    - 配置 TypeScript、ESLint、Prettier
    - 配置 package.json scripts
    - _Requirements: 项目基础设施_

  - [x] 1.2 配置后端基础框架
    - 初始化 Express 应用
    - 配置 Prisma ORM 和 PostgreSQL 连接
    - 创建基础中间件（错误处理、日志、CORS）
    - _Requirements: 后端基础设施_

  - [x] 1.3 创建数据库 Schema
    - 编写 Prisma schema 定义所有数据模型
    - 创建初始迁移文件
    - 添加种子数据脚本
    - _Requirements: 数据模型_

  - [x] 1.4 配置前端基础框架
    - 初始化 React + Vite 项目
    - 配置 Ant Design 和主题
    - 配置路由（React Router）
    - 配置状态管理（Zustand）
    - _Requirements: 前端基础设施_

- [x] 2. Checkpoint - 基础架构验证
  - 确保项目可以正常启动
  - 确保数据库连接正常
  - 确保前后端可以通信

- [x] 3. 用户认证模块
  - [x] 3.1 实现认证服务后端
    - 实现用户注册接口（密码加密、角色分配）
    - 实现用户登录接口（JWT生成）
    - 实现Token验证中间件
    - 实现角色权限检查中间件
    - _Requirements: 1.1, 1.2, 1.6_

  - [x]* 3.2 编写认证服务属性测试
    - **Property 1: 角色权限隔离**
    - 使用 fast-check 生成随机用户和路径组合
    - 验证权限检查逻辑正确性
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

  - [x] 3.3 实现认证前端页面
    - 创建登录页面组件
    - 创建注册页面组件
    - 实现认证状态管理（Zustand store）
    - 实现路由守卫（根据角色重定向）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [-] 4. 达人管理模块
  - [x] 4.1 实现达人服务后端
    - 实现达人CRUD接口
    - 实现达人去重检测逻辑
    - 实现达人搜索和筛选接口
    - 实现标签管理接口
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [x]* 4.2 编写达人去重属性测试
    - **Property 2: 达人去重检测**
    - 生成包含重复数据的达人列表
    - 验证系统正确识别重复
    - **Validates: Requirements 2.3**

  - [x]* 4.3 编写达人搜索属性测试
    - **Property 3: 达人搜索结果一致性**
    - 生成随机达人数据和搜索条件
    - 验证返回结果都满足搜索条件
    - **Validates: Requirements 2.5**

  - [x] 4.4 实现达人批量导入
    - 实现Excel/CSV文件解析
    - 实现字段映射逻辑
    - 实现批量创建和去重处理
    - _Requirements: 2.2, 2.3_

  - [x] 4.5 实现达人管理前端
    - 创建达人列表页面（表格、搜索、筛选）
    - 创建达人详情/编辑弹窗
    - 创建批量导入弹窗
    - 创建标签管理组件
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_

- [x] 5. Checkpoint - 达人模块验证
  - 确保达人CRUD功能正常
  - 确保去重检测正常工作
  - 确保搜索筛选正常工作

- [x] 6. 样品与成本管理模块
  - [x] 6.1 实现样品服务后端
    - 实现样品CRUD接口
    - 实现寄样记录创建接口（自动计算成本）
    - 实现寄样状态更新接口
    - 实现样品成本报表接口
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x]* 6.2 编写寄样成本计算属性测试
    - **Property 4: 寄样成本计算正确性**
    - 生成随机数量、单价、快递费
    - 验证总成本计算正确且无精度误差
    - **Validates: Requirements 3.4, 3.5**

  - [x]* 6.3 编写样品报表聚合属性测试
    - **Property 5: 样品成本报表聚合正确性**
    - 生成随机寄样记录集合
    - 验证聚合统计正确
    - **Validates: Requirements 3.7**

  - [x] 6.4 实现样品管理前端
    - 创建样品列表页面
    - 创建样品添加/编辑表单
    - 创建寄样记录表单
    - 创建样品成本报表页面
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

- [x] 7. 合作流程模块
  - [x] 7.1 实现合作服务后端
    - 实现合作记录CRUD接口
    - 实现阶段状态更新接口
    - 实现截止时间和超期判断逻辑
    - 实现跟进记录和卡点原因接口
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x]* 7.2 编写合作阶段状态属性测试
    - **Property 6: 合作阶段状态一致性**
    - 生成随机状态转换序列
    - 验证状态值合法且变更时间记录正确
    - **Validates: Requirements 4.1, 4.2**

  - [x]* 7.3 编写超期判断属性测试
    - **Property 7: 超期判断正确性**
    - 生成随机截止时间和当前时间组合
    - 验证超期标记逻辑正确
    - **Validates: Requirements 4.4**

  - [x] 7.4 实现合作管道前端
    - 创建看板组件（拖拽式）
    - 创建合作卡片组件
    - 创建跟进记录弹窗
    - 创建截止时间设置组件
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [x] 8. Checkpoint - 合作流程验证
  - 确保看板拖拽功能正常
  - 确保超期判断正确
  - 确保跟进记录保存正常

- [x] 9. 合作结果与ROI模块
  - [x] 9.1 实现合作结果服务后端
    - 实现合作结果录入接口
    - 实现ROI自动计算逻辑
    - 实现回本状态判断逻辑
    - 实现ROI报表接口（按维度分组）
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x]* 9.2 编写ROI计算属性测试
    - **Property 8: ROI计算与回本状态判断**
    - 生成随机成本和GMV数据
    - 验证ROI计算和回本状态判断正确
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x]* 9.3 编写ROI报表聚合属性测试
    - **Property 9: ROI报表分组聚合正确性**
    - 生成随机合作结果集合
    - 验证分组汇总计算正确
    - **Validates: Requirements 5.5**

  - [x] 9.4 实现合作结果前端
    - 创建合作结果录入表单
    - 创建ROI报表页面（支持多维度切换）
    - 创建合作详情页面（含成本明细）
    - _Requirements: 5.1, 5.5, 5.6_

- [x] 10. 商务绩效与看板模块
  - [x] 10.1 实现报表服务后端
    - 实现商务绩效统计接口
    - 实现工厂看板数据接口
    - 实现报表导出接口（Excel）
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x]* 10.2 编写商务绩效统计属性测试
    - **Property 10: 商务绩效统计正确性**
    - 生成随机商务和合作数据
    - 验证绩效指标计算正确
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

  - [x]* 10.3 编写看板指标聚合属性测试
    - **Property 11: 看板指标聚合正确性**
    - 生成随机工厂数据
    - 验证看板指标计算正确
    - **Validates: Requirements 7.1**

  - [x] 10.4 实现商务绩效前端
    - 创建商务绩效列表页面
    - 创建绩效详情页面
    - 实现报表导出功能
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 10.5 实现工厂老板看板前端
    - 创建看板首页（指标卡片）
    - 创建管道分布图表
    - 创建待办事项列表
    - 创建商务排行榜
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Checkpoint - 报表与看板验证
  - 确保绩效统计数据正确
  - 确保看板指标计算正确
  - 确保报表导出功能正常

- [x] 12. 平台管理模块
  - [x] 12.1 实现平台管理服务后端
    - 实现工厂入驻审核接口
    - 实现套餐配置管理接口
    - 实现配额检查中间件
    - 实现平台数据统计接口
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x]* 12.2 编写套餐配额限制属性测试
    - **Property 13: 套餐配额限制**
    - 生成随机工厂和配额场景
    - 验证配额限制逻辑正确
    - **Validates: Requirements 8.2, 8.3**

  - [x] 12.3 实现平台管理前端
    - 创建工厂审核列表页面
    - 创建套餐配置页面
    - 创建平台数据看板
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 13. 数据导入导出模块
  - [x] 13.1 实现导入导出服务后端
    - 实现Excel文件解析服务
    - 实现字段映射和验证逻辑
    - 实现批量导入事务处理
    - 实现多种报表导出接口
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [-]* 13.2 编写数据导入导出Round-Trip属性测试
    - **Property 12: 数据导入导出Round-Trip**
    - 生成随机有效数据集
    - 验证导出后再导入数据等价
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
    - _注：此测试为可选项，已跳过_

  - [x] 13.3 实现导入导出前端
    - 创建导入向导组件（文件上传、字段映射、预览确认）
    - 创建导出按钮和格式选择
    - 创建导入结果反馈页面
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. 提醒与通知模块
  - [x] 14.1 实现通知服务后端
    - 实现定时任务检查超期和待办
    - 实现通知创建和存储逻辑
    - 实现通知查询和标记已读接口
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x]* 14.2 编写通知触发条件属性测试
    - **Property 14: 通知触发条件正确性**
    - 生成随机时间和合作状态场景
    - 验证通知触发逻辑正确
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [x] 14.3 实现通知前端
    - 创建通知中心组件
    - 创建通知列表页面
    - 实现未读通知角标
    - _Requirements: 10.5_

- [x] 15. Final Checkpoint - 全功能验证
  - 确保所有属性测试通过
  - 确保完整用户流程可走通
  - 确保所有角色权限正确

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library
- All monetary values stored in cents (分) to avoid floating-point precision issues
