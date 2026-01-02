# Requirements Document: 达人端口

> Language Rule  
> 本项目所有说明性文本、设计说明、任务拆解均使用中文输出。
> 仅代码、API、变量名使用英文。

> UI/UX 语言规范
> - 所有用户界面文本必须使用中文

## Introduction

本模块为现有「达人合作执行与成本管理系统」新增"达人端口"功能，让达人可以通过独立的登录入口查看自己在平台内所有工厂的样品和合作信息。

核心原则：
- **只新增，不修改**：不改动现有商务端/老板端的任何功能
- **数据隔离**：达人只能看到与自己相关的数据，工厂之间数据完全隔离
- **跨工厂聚合**：达人可以看到平台内所有工厂给他寄的样品（通过手机号关联）

## Glossary

- **Influencer_User**: 达人用户，通过达人端口登录的用户
- **InfluencerAccount**: 达人账号，独立于工厂的达人身份记录
- **InfluencerContact**: 达人联系人，支持一个达人账号下有多个联系人（本人/助理/经纪人）

## Requirements

### Requirement 11: 达人账号与登录

**User Story:** As a 达人, I want 通过独立的登录入口进入系统查看我的样品信息, so that 我可以统一管理来自不同工厂的样品。

#### Acceptance Criteria

1. WHEN 用户访问登录页面 THEN THE System SHALL 显示两个登录入口：「商务/老板登录」和「达人登录」
2. WHEN 达人点击「达人登录」 THEN THE System SHALL 显示手机号+验证码登录表单
3. WHEN 达人首次登录（手机号不存在） THEN THE System SHALL 自动创建 InfluencerAccount 记录
4. WHEN 达人登录成功 THEN THE System SHALL 跳转到达人专属界面（不是商务端界面）
5. IF 验证码错误或过期 THEN THE System SHALL 提示错误并允许重新获取
6. WHEN 达人登录后 THEN THE System SHALL 记录登录时间和设备信息用于安全审计

### Requirement 12: 达人多联系人支持

**User Story:** As a 达人, I want 允许我的助理或经纪人也能登录查看我的样品信息, so that 团队可以协作管理样品。

#### Acceptance Criteria

1. WHEN 达人首次登录 THEN THE System SHALL 自动创建一个"本人"类型的联系人记录
2. WHEN 达人查看账号设置 THEN THE System SHALL 显示当前账号下的所有联系人列表
3. WHEN 达人添加联系人 THEN THE System SHALL 支持设置联系人类型（本人/助理/经纪人/其他）
4. WHEN 联系人用自己的手机号登录 THEN THE System SHALL 关联到对应的达人账号，看到相同的数据
5. WHEN 达人移除某个联系人 THEN THE System SHALL 立即撤销该联系人的访问权限
6. WHEN 任何联系人登录查看数据 THEN THE System SHALL 记录审计日志（谁在何时查看）

### Requirement 13: 达人样品视图

**User Story:** As a 达人, I want 查看所有工厂给我寄的样品信息, so that 我可以统一管理样品状态。

#### Acceptance Criteria

1. WHEN 达人进入首页 THEN THE System SHALL 显示样品总览（总数量、各状态数量）
2. WHEN 达人查看样品列表 THEN THE System SHALL 按工厂分组显示所有样品
3. WHEN 显示样品信息 THEN THE System SHALL 包含：样品名称、来源工厂、寄出时间、快递单号、当前状态
4. WHEN 达人筛选样品 THEN THE System SHALL 支持按工厂、状态、时间范围筛选
5. WHEN 样品状态为"已寄出" THEN THE System SHALL 显示快递信息（快递公司、单号）
6. THE System SHALL NOT 向达人显示样品成本、ROI等敏感信息

### Requirement 14: 达人合作进度视图

**User Story:** As a 达人, I want 查看与各工厂的合作进度, so that 我可以了解当前合作状态。

#### Acceptance Criteria

1. WHEN 达人查看合作列表 THEN THE System SHALL 显示所有进行中的合作记录
2. WHEN 显示合作信息 THEN THE System SHALL 包含：工厂名称、合作阶段、关联样品、截止时间
3. WHEN 合作有截止时间 THEN THE System SHALL 显示倒计时或超期提醒
4. WHEN 达人点击合作详情 THEN THE System SHALL 显示该合作的完整时间线（阶段变更历史）
5. THE System SHALL NOT 向达人显示工厂的内部备注、成本信息、ROI数据

### Requirement 15: 达人确认操作

**User Story:** As a 达人, I want 确认样品签收状态, so that 工厂可以及时了解样品是否送达。

#### Acceptance Criteria

1. WHEN 样品状态为"已寄出" THEN THE System SHALL 显示「确认签收」按钮
2. WHEN 达人点击「确认签收」 THEN THE System SHALL 更新样品状态为"已签收"并记录签收时间
3. WHEN 达人确认签收 THEN THE System SHALL 同步更新工厂端的寄样记录状态
4. WHEN 达人确认签收 THEN THE System SHALL 向负责商务发送通知
5. IF 样品已被工厂端标记为签收 THEN THE System SHALL 显示"已签收"状态，不再显示确认按钮

### Requirement 16: 数据隔离与安全

**User Story:** As a 平台管理员, I want 确保达人端数据完全隔离, so that 达人只能看到自己的数据，工厂之间也互不可见。

#### Acceptance Criteria

1. WHEN 达人查询数据 THEN THE System SHALL 仅返回与该达人手机号关联的记录
2. WHEN 达人查看样品 THEN THE System SHALL NOT 显示其他达人的任何信息
3. WHEN 达人查看工厂信息 THEN THE System SHALL 仅显示工厂名称，不显示工厂内部数据
4. THE System SHALL 使用独立的 API 路由处理达人端请求（/api/influencer-portal/*）
5. THE System SHALL 在所有达人端 API 中验证达人身份，拒绝非达人用户访问
6. WHEN 工厂端查询达人 THEN THE System SHALL 仅返回该工厂自己录入的达人记录（现有逻辑不变）

