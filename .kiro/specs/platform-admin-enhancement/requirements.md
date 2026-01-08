# 平台管理端功能增强 - 需求文档

## 简介

本文档定义了平台管理端（Platform Admin）的功能增强需求，包括达人管理、数据统计、系统监控等核心功能。

## 术语表

- **Platform_Admin**: 平台管理员，负责管理整个系统
- **Factory**: 工厂，系统的租户单位
- **Influencer**: 达人，内容创作者
- **Verification**: 认证，对达人身份和资质的验证
- **Influencer_Source**: 达人来源，标识达人是由谁添加的（平台/工厂老板/商务人员）
- **Verification_Status**: 认证状态，包括未认证、已认证、认证失败
- **System_Monitor**: 系统监控，监控系统运行状态

---

## 需求 1: 达人管理功能

**用户故事**: 作为平台管理员，我想要查看和管理所有工厂的达人信息，以便进行平台级别的达人管理和认证。

### 验收标准

1. WHEN 管理员访问达人管理页面 THEN THE System SHALL 显示所有工厂的达人列表
2. THE System SHALL 显示每个达人的来源标识（平台添加/工厂老板添加/商务人员添加）
3. THE System SHALL 显示每个达人的认证状态（未认证、已认证、认证失败）
4. THE System SHALL 显示添加人信息（添加人姓名、添加时间）
5. WHEN 管理员搜索达人 THEN THE System SHALL 支持按昵称、平台、工厂名称、添加人搜索
6. WHEN 管理员筛选达人 THEN THE System SHALL 支持按平台、工厂、认证状态、来源类型筛选
7. WHEN 管理员查看达人详情 THEN THE System SHALL 显示达人的完整信息（基本信息、联系方式、粉丝数、所属工厂、添加人、合作记录）
8. WHEN 管理员点击达人卡片 THEN THE System SHALL 打开达人详情弹窗
9. THE System SHALL 支持导出达人列表为 Excel 文件（包含来源和认证状态）

---

## 需求 2: 达人来源追踪

**用户故事**: 作为平台管理员，我想要追踪每个达人是由谁添加的，以便了解达人的来源渠道和质量。

### 验收标准

1. THE System SHALL 记录每个达人的添加人信息（用户ID、用户姓名、用户角色）
2. THE System SHALL 记录达人的添加时间
3. THE System SHALL 区分达人来源类型：
   - 平台添加：由平台管理员直接添加
   - 工厂添加：由工厂老板添加
   - 商务添加：由商务人员添加
4. WHEN 达人被添加 THEN THE System SHALL 自动记录添加人和添加时间
5. WHEN 管理员查看达人列表 THEN THE System SHALL 显示来源标识（图标或标签）
6. WHEN 管理员筛选达人 THEN THE System SHALL 支持按来源类型筛选
7. THE System SHALL 在达人详情中显示完整的来源信息（添加人、添加时间、来源类型）
8. THE System SHALL 统计各来源渠道的达人数量和质量（认证率、合作成功率）

---

## 需求 3: 达人认证功能

**用户故事**: 作为平台管理员，我想要对达人进行认证审核，以便确保平台上的达人信息真实可靠。

### 验收标准

1. THE System SHALL 支持三种认证状态：未认证、已认证、认证失败
2. WHEN 达人首次添加 THEN THE System SHALL 默认设置为"未认证"状态
3. WHEN 管理员查看未认证达人 THEN THE System SHALL 显示"待认证"标识
4. WHEN 管理员点击"认证"按钮 THEN THE System SHALL 打开认证审核弹窗
5. WHEN 管理员审核达人信息 THEN THE System SHALL 显示达人的详细资料（昵称、平台、账号ID、粉丝数、联系方式、添加人）
6. WHEN 管理员通过认证 THEN THE System SHALL 更新达人状态为"已认证"并记录认证时间和认证人
7. WHEN 管理员拒绝认证 THEN THE System SHALL 更新达人状态为"认证失败"并要求填写拒绝原因
8. WHEN 达人认证状态变更 THEN THE System SHALL 发送通知给所属工厂的老板和添加人
9. THE System SHALL 记录认证历史（认证人、认证时间、认证结果、备注）
10. THE System SHALL 支持重新认证（对认证失败的达人）
11. WHEN 管理员筛选达人 THEN THE System SHALL 支持按认证状态筛选（全部/已认证/未认证/认证失败）

---

## 需求 4: 平台数据统计增强

**用户故事**: 作为平台管理员，我想要查看更详细的平台数据统计，以便了解平台的运营状况。

### 验收标准

1. THE System SHALL 显示平台总览数据（工厂数、用户数、达人数、合作数、样品数）
2. THE System SHALL 显示达人来源分布（平台添加、工厂老板添加、商务人员添加的数量和占比）
3. THE System SHALL 显示达人认证状态分布（已认证、未认证、认证失败的数量和占比）
4. THE System SHALL 显示增长趋势图（按日/周/月统计新增数据）
5. THE System SHALL 显示活跃度统计（活跃工厂数、活跃用户数、本月新增合作数）
6. THE System SHALL 显示套餐分布（各套餐的工厂数量和占比）
7. THE System SHALL 显示平台分布（各平台的达人数量：抖音、小红书、快手等）
8. THE System SHALL 显示合作状态分布（各阶段的合作数量）
9. THE System SHALL 支持选择时间范围查看统计数据
10. THE System SHALL 支持导出统计报表

---

## 需求 5: 用户管理功能

**用户故事**: 作为平台管理员，我想要查看和管理所有用户账号，以便进行用户支持和账号管理。

### 验收标准

1. WHEN 管理员访问用户管理页面 THEN THE System SHALL 显示所有用户列表
2. THE System SHALL 显示用户信息（姓名、邮箱、角色、所属工厂、注册时间、最后登录时间）
3. WHEN 管理员搜索用户 THEN THE System SHALL 支持按姓名、邮箱、工厂名称搜索
4. WHEN 管理员筛选用户 THEN THE System SHALL 支持按角色、工厂、状态筛选
5. WHEN 管理员查看用户详情 THEN THE System SHALL 显示用户的完整信息和操作日志
6. WHEN 管理员禁用用户 THEN THE System SHALL 阻止该用户登录系统
7. WHEN 管理员启用用户 THEN THE System SHALL 恢复该用户的登录权限
8. WHEN 管理员重置密码 THEN THE System SHALL 生成临时密码并发送给用户

---

## 需求 6: 系统监控功能

**用户故事**: 作为平台管理员，我想要监控系统的运行状态，以便及时发现和处理问题。

### 验收标准

1. THE System SHALL 显示系统健康状态（数据库连接、API 响应时间、错误率）
2. THE System SHALL 显示资源使用情况（CPU、内存、磁盘、数据库大小）
3. THE System SHALL 显示实时在线用户数
4. THE System SHALL 显示最近的错误日志（最近 100 条）
5. THE System SHALL 显示 API 调用统计（调用次数、平均响应时间、错误率）
6. WHEN 系统出现异常 THEN THE System SHALL 在监控页面显示警告标识
7. THE System SHALL 支持查看详细的系统日志

---

## 需求 7: 操作日志功能

**用户故事**: 作为平台管理员，我想要查看所有管理员的操作记录，以便进行审计和问题追溯。

### 验收标准

1. THE System SHALL 记录所有管理员操作（审核工厂、认证达人、修改配置、禁用用户等）
2. WHEN 管理员访问操作日志页面 THEN THE System SHALL 显示操作记录列表
3. THE System SHALL 显示操作信息（操作人、操作类型、操作对象、操作时间、操作结果）
4. WHEN 管理员搜索日志 THEN THE System SHALL 支持按操作人、操作类型、时间范围搜索
5. THE System SHALL 支持导出操作日志
6. THE System SHALL 保留操作日志至少 90 天

---

## 需求 8: 公告管理功能

**用户故事**: 作为平台管理员，我想要发布系统公告，以便通知所有用户重要信息。

### 验收标准

1. WHEN 管理员创建公告 THEN THE System SHALL 要求填写标题、内容、类型（通知/警告/紧急）
2. WHEN 管理员发布公告 THEN THE System SHALL 向所有用户显示公告
3. WHEN 管理员设置公告为"紧急" THEN THE System SHALL 在用户登录时强制显示
4. THE System SHALL 支持设置公告的生效时间和过期时间
5. THE System SHALL 支持设置公告的目标用户（全部用户/特定工厂/特定角色）
6. WHEN 管理员编辑公告 THEN THE System SHALL 更新公告内容并记录修改历史
7. WHEN 管理员删除公告 THEN THE System SHALL 停止向用户显示该公告

---

## 需求 9: 数据备份与恢复

**用户故事**: 作为平台管理员，我想要管理数据备份，以便在数据丢失时能够恢复。

### 验收标准

1. THE System SHALL 支持手动触发数据库备份
2. THE System SHALL 显示备份历史（备份时间、备份大小、备份状态）
3. WHEN 管理员创建备份 THEN THE System SHALL 生成完整的数据库备份文件
4. THE System SHALL 支持下载备份文件
5. THE System SHALL 支持设置自动备份计划（每日/每周）
6. THE System SHALL 保留最近 30 天的备份文件
7. WHEN 备份失败 THEN THE System SHALL 发送通知给管理员

---

## 需求 10: 系统配置管理

**用户故事**: 作为平台管理员，我想要管理系统配置，以便调整系统行为。

### 验收标准

1. THE System SHALL 支持配置系统参数（注册开关、邮件服务、短信服务、文件上传限制）
2. WHEN 管理员修改配置 THEN THE System SHALL 验证配置的有效性
3. WHEN 管理员保存配置 THEN THE System SHALL 立即生效（无需重启）
4. THE System SHALL 记录配置修改历史
5. THE System SHALL 支持恢复到上一次的配置
6. THE System SHALL 显示当前配置的生效状态

---

## 需求 11: 帮助与支持

**用户故事**: 作为平台管理员，我想要查看用户反馈和支持请求，以便提供技术支持。

### 验收标准

1. THE System SHALL 显示用户反馈列表（反馈人、工厂、反馈内容、反馈时间、处理状态）
2. WHEN 管理员查看反馈详情 THEN THE System SHALL 显示完整的反馈信息和用户联系方式
3. WHEN 管理员回复反馈 THEN THE System SHALL 发送回复给用户
4. WHEN 管理员标记反馈为"已处理" THEN THE System SHALL 更新反馈状态
5. THE System SHALL 支持按状态筛选反馈（待处理/处理中/已处理）
6. THE System SHALL 统计反馈数量和平均处理时间

---

## 功能优先级

### P0 - 必须实现（本期）
- 需求 1: 达人管理功能
- 需求 2: 达人来源追踪
- 需求 3: 达人认证功能
- 需求 4: 平台数据统计增强

### P1 - 重要功能（下期）
- 需求 5: 用户管理功能
- 需求 6: 系统监控功能
- 需求 7: 操作日志功能

### P2 - 可选功能（未来）
- 需求 8: 公告管理功能
- 需求 9: 数据备份与恢复
- 需求 10: 系统配置管理
- 需求 11: 帮助与支持

---

**更新时间**: 2026年1月6日  
**文档状态**: ✅ 已创建
