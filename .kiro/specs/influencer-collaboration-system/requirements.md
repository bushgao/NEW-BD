# Requirements Document

> Language Rule  
> 本项目所有说明性文本、设计说明、任务拆解均使用中文输出。
> 仅代码、API、变量名使用英文。

> UI/UX 语言规范
> - 所有用户界面文本必须使用中文
> - 所有对话框、提示信息、按钮文字必须使用中文
> - 所有错误提示、成功提示必须使用中文
> - 所有表单标签、占位符必须使用中文
> - 所有菜单、导航项必须使用中文
> - 测试用例描述使用中文

## Introduction

本系统是一个面向工厂与商务团队的「达人合作执行与成本管理系统」，核心解决"样品、跟进、结算、ROI 不清晰"的问题。

系统采用单入口多角色权限架构，不做全网达人数据分析，而是聚焦于企业内部的达人合作流程管理、样品成本核算、ROI 计算与商务人效追踪。

## Glossary

- **System**: 达人合作执行与成本管理系统
- **Factory_Owner**: 工厂老板角色，关注样品成本、总投入、ROI、商务绩效
- **Business_Staff**: 商务人员角色，负责达人跟进、寄样、排期、结果录入
- **Platform_Admin**: 平台管理员角色，负责工厂审核、账号管理、收费控制
- **Influencer**: 达人主体，代表同一个达人/同一个内容账号主体，与工厂合作进行内容创作和带货的创作者
- **InfluencerContact**: 达人联系人，挂在达人主体下的联系人，可为本人/商务/助理/经纪人等
- **Sample**: 样品，工厂提供给达人用于内容创作或直播带货的产品
- **Sample_Dispatch**: 寄样记录，商务向达人发送样品的操作记录
- **Collaboration**: 合作记录，达人与工厂的一次完整合作（从寄样到出结果）
- **ROI**: 投资回报率，销售GMV / 合作总成本
- **Pipeline_Stage**: 合作管道阶段，包括：线索达人、已联系、已报价、已寄样、已排期、已发布、已复盘

## Requirements

### Requirement 1: 用户认证与角色权限

**User Story:** As a 系统用户, I want 通过统一入口登录并根据角色看到不同的功能界面, so that 我可以访问与我职责相关的功能。

#### Acceptance Criteria

1. WHEN 用户访问系统 THEN THE System SHALL 显示统一的登录页面
2. WHEN 用户成功登录 THEN THE System SHALL 根据用户角色（Platform_Admin / Factory_Owner / Business_Staff）展示对应的功能菜单和看板
3. WHEN Platform_Admin 登录 THEN THE System SHALL 显示工厂管理、账号管理、收费管理等平台级功能
4. WHEN Factory_Owner 登录 THEN THE System SHALL 显示样品管理、成本看板、ROI报表、商务绩效等工厂级功能
5. WHEN Business_Staff 登录 THEN THE System SHALL 显示达人管理、跟进管道、寄样操作、合作记录等执行级功能
6. IF 用户尝试访问无权限的功能 THEN THE System SHALL 拒绝访问并提示权限不足

### Requirement 2: 达人信息管理

**User Story:** As a Business_Staff, I want 统一管理达人信息并支持去重和标签, so that 达人数据不再散落在飞书/Excel/微信中。

#### Acceptance Criteria

1. WHEN Business_Staff 添加新达人 THEN THE System SHALL 创建达人记录并存储基础信息（昵称、平台、账号ID、联系方式、类目标签）
2. WHEN Business_Staff 导入达人数据 THEN THE System SHALL 支持从Excel/CSV文件批量导入
3. WHEN 导入或添加达人时检测到重复（手机号/平台账号ID相同） THEN THE System SHALL 提示重复并允许用户选择合并或跳过
4. WHEN Business_Staff 编辑达人信息 THEN THE System SHALL 保存修改并记录变更历史
5. WHEN Business_Staff 搜索达人 THEN THE System SHALL 支持按昵称、类目、合作状态、标签进行筛选
6. WHEN Business_Staff 为达人添加标签 THEN THE System SHALL 支持自定义标签（如：高配合度、价格敏感、已踩坑）

### Requirement 3: 样品与成本管理

**User Story:** As a Factory_Owner, I want 录入样品的单件成本信息, so that 系统可以自动计算每次寄样的总成本。

#### Acceptance Criteria

1. WHEN Factory_Owner 添加样品 THEN THE System SHALL 创建样品记录并存储信息（SKU、名称、单件成本、建议零售价、是否可复寄）
2. WHEN Factory_Owner 编辑样品成本 THEN THE System SHALL 更新样品信息并保留历史成本记录
3. WHEN Business_Staff 创建寄样记录 THEN THE System SHALL 自动关联样品、达人、商务人员
4. WHEN Business_Staff 填写寄样数量 THEN THE System SHALL 自动计算寄样总成本（数量 × 单件成本）
5. WHEN Business_Staff 填写快递费用 THEN THE System SHALL 将快递成本计入本次寄样总成本
6. WHEN 寄样记录创建完成 THEN THE System SHALL 记录寄样时间、签收状态（未签收/已签收）、是否上车（未确认/已上车/未上）
7. WHEN Factory_Owner 查看样品成本报表 THEN THE System SHALL 显示各样品的累计寄样数量、累计成本、签收率、上车率

### Requirement 4: 合作流程管道

**User Story:** As a Business_Staff, I want 通过可视化管道追踪每个达人的合作进度, so that 我不会漏掉任何跟进节点。

#### Acceptance Criteria

1. WHEN Business_Staff 查看合作管道 THEN THE System SHALL 以看板形式展示各阶段的达人卡片（线索达人 → 已联系 → 已报价 → 已寄样 → 已排期 → 已发布 → 已复盘）
2. WHEN Business_Staff 拖动达人卡片到下一阶段 THEN THE System SHALL 更新合作状态并记录状态变更时间
3. WHEN Business_Staff 为合作设置截止时间 THEN THE System SHALL 保存截止时间并在临近时发出提醒
4. WHEN 合作超过截止时间未推进 THEN THE System SHALL 自动标记为"超期"并在看板上高亮显示
5. WHEN Business_Staff 记录跟进备注 THEN THE System SHALL 保存备注内容、记录时间、记录人
6. WHEN Business_Staff 标记卡点原因 THEN THE System SHALL 支持选择预设原因（报价太贵、达人拖延、不配合、其他）或自定义原因

### Requirement 5: 合作结果与ROI计算

**User Story:** As a Factory_Owner, I want 录入达人合作的真实销售结果并自动计算ROI, so that 我可以清楚知道每次合作是否回本。

#### Acceptance Criteria

1. WHEN Business_Staff 录入合作结果 THEN THE System SHALL 保存内容形式（短视频/直播）、发布时间、销售件数、销售GMV、佣金比例、坑位费、实付佣金
2. WHEN 合作结果录入完成 THEN THE System SHALL 自动计算合作总成本（样品成本 + 快递成本 + 坑位费 + 实付佣金）
3. WHEN 合作结果录入完成 THEN THE System SHALL 自动计算ROI（销售GMV / 合作总成本）
4. WHEN ROI计算完成 THEN THE System SHALL 自动判断回本状态（ROI < 1 为未回本，ROI >= 1 为已回本，ROI >= 3 为爆赚）
5. WHEN Factory_Owner 查看ROI报表 THEN THE System SHALL 支持按达人、按样品、按商务、按时间段汇总ROI
6. WHEN Business_Staff 标记是否复投 THEN THE System SHALL 记录复投意向并在达人档案中显示

### Requirement 6: 商务绩效统计

**User Story:** As a Factory_Owner, I want 查看每个商务的工作绩效数据, so that 我可以评估团队人效并优化资源分配。

#### Acceptance Criteria

1. WHEN Factory_Owner 查看商务绩效 THEN THE System SHALL 显示每个商务的建联数量、推进数量、成交数量
2. WHEN Factory_Owner 查看商务绩效 THEN THE System SHALL 显示每个商务负责的合作总GMV、总成本、平均ROI
3. WHEN Factory_Owner 查看商务绩效 THEN THE System SHALL 显示每个商务的寄样数量、寄样成本
4. WHEN Factory_Owner 选择时间范围 THEN THE System SHALL 按所选时间段筛选绩效数据
5. WHEN Factory_Owner 导出绩效报表 THEN THE System SHALL 支持导出为Excel格式

### Requirement 7: 工厂老板看板

**User Story:** As a Factory_Owner, I want 在首页看到关键业务指标的汇总, so that 我可以快速了解整体运营状况。

#### Acceptance Criteria

1. WHEN Factory_Owner 进入首页 THEN THE System SHALL 显示本月/本周的关键指标卡片（总寄样成本、总合作成本、总GMV、整体ROI）
2. WHEN Factory_Owner 进入首页 THEN THE System SHALL 显示合作管道各阶段的数量分布
3. WHEN Factory_Owner 进入首页 THEN THE System SHALL 显示近期待跟进事项（超期合作、待签收样品、待录入结果）
4. WHEN Factory_Owner 进入首页 THEN THE System SHALL 显示商务人效排行（按成交数量或GMV排序）
5. WHEN Factory_Owner 点击指标卡片 THEN THE System SHALL 跳转到对应的详情页面

### Requirement 8: 平台管理功能

**User Story:** As a Platform_Admin, I want 管理入驻工厂和账号配额, so that 我可以控制平台运营和收费。

#### Acceptance Criteria

1. WHEN 工厂申请入驻 THEN THE Platform_Admin SHALL 能够审核并批准或拒绝申请
2. WHEN Platform_Admin 设置工厂套餐 THEN THE System SHALL 限制该工厂的商务账号数量、达人数量上限、数据保留周期
3. WHEN 工厂达到套餐限制 THEN THE System SHALL 提示升级套餐或限制新增操作
4. WHEN Platform_Admin 查看平台数据 THEN THE System SHALL 显示入驻工厂数量、活跃用户数、总合作数量等平台级指标
5. WHEN Platform_Admin 管理套餐配置 THEN THE System SHALL 支持创建和编辑套餐（免费版、专业版、企业版）的功能权限和配额

### Requirement 9: 数据导入导出

**User Story:** As a Business_Staff, I want 从现有的飞书/Excel导入数据并能导出报表, so that 我可以平滑迁移现有数据并满足汇报需求。

#### Acceptance Criteria

1. WHEN Business_Staff 上传Excel文件 THEN THE System SHALL 解析文件并预览待导入的数据
2. WHEN 预览导入数据时 THEN THE System SHALL 显示字段映射界面，允许用户匹配系统字段
3. WHEN 确认导入 THEN THE System SHALL 执行导入并报告成功/失败/重复的记录数量
4. WHEN 用户请求导出 THEN THE System SHALL 支持导出达人列表、寄样记录、合作结果、ROI报表为Excel格式
5. IF 导入数据格式错误 THEN THE System SHALL 提示具体错误位置和原因

### Requirement 10: 提醒与通知

**User Story:** As a Business_Staff, I want 收到系统的自动提醒, so that 我不会漏掉重要的跟进节点。

#### Acceptance Criteria

1. WHEN 合作即将到达截止时间（提前1天） THEN THE System SHALL 向负责商务发送提醒通知
2. WHEN 合作超过截止时间未推进 THEN THE System SHALL 向负责商务和Factory_Owner发送超期提醒
3. WHEN 样品寄出超过7天未签收 THEN THE System SHALL 向负责商务发送提醒
4. WHEN 达人已上车但超过14天未录入结果 THEN THE System SHALL 向负责商务发送提醒
5. WHEN 用户登录系统 THEN THE System SHALL 在通知中心显示未读提醒列表

### Requirement 11: 达人身份统一与多联系人管理

**User Story:** As a Business_Staff / Factory_Owner, I want 将同一达人在系统中统一为一个"达人主体"，并支持该达人拥有多个联系人（达人本人/商务/助理/经纪人等），so that 不同工厂/不同商务对该达人的样品与合作信息可以在同一达人视角下聚合，避免重复达人与信息割裂。

#### 定义与规则

- **Influencer（达人主体）**：业务对象，代表"同一个达人/同一个内容账号主体"
- **InfluencerContact（达人联系人）**：挂在 Influencer 下的联系人，可为"本人/商务/助理/经纪人"等
- **统一原则**：系统以"达人主体"为唯一归属，联系人只是该主体的协作入口与沟通对象
- **安全原则**：手机号仅用于匹配与去重，不作为登录凭证；任何"仅凭手机号即可访问达人数据"的设计均视为不合规

#### Acceptance Criteria

1. WHEN Business_Staff 创建/编辑达人信息 THEN THE System SHALL 支持维护一个 Influencer（达人主体），并可新增/编辑多个 InfluencerContact（联系人）
2. WHEN 创建联系人 THEN THE System SHALL 允许设置联系人类型（本人/商务/助理/经纪人/其他）与是否为主联系人（isPrimary）
3. WHEN Business_Staff 在寄样或建立合作时选择达人 THEN THE System SHALL 支持同时选择"达人主体 + 具体联系人"，并将样品/合作归属到达人主体（Influencer）
4. WHEN 同一达人在不同工厂/不同商务下被多次录入 THEN THE System SHALL 提供去重策略与合并能力：
   - 优先级建议：平台账号ID/小程序绑定身份 > 手机号 > 其他弱标识（如微信号文本）
   - Platform_Admin SHALL 支持手动合并两个 Influencer，并将其历史样品/合作/联系人统一归并
5. WHEN 达人侧入口（未来）发生身份绑定 THEN THE System SHALL 以不可伪造身份（如小程序 OpenID/UnionID）绑定到某个 InfluencerContact，并由该 Contact 归属的 Influencer 决定可见数据范围
6. WHEN 一个 Influencer 存在多个联系人 THEN THE System SHALL 允许多个联系人分别绑定自己的身份进入"达人视角"，但仅能看到该 Influencer 相关的样品与合作信息，并记录审计日志（谁在何时查看/确认）
7. IF 联系人被移除或禁用 THEN THE System SHALL 立即撤销其进入达人视角的权限，不影响 Influencer 主体与历史数据
8. WHEN 展示达人相关信息（商务端/老板端） THEN THE System SHALL 默认展示主联系人，并允许查看该达人所有联系人列表与最近沟通记录（如有）

### Requirement 12: 商务账号管理（工厂老板）

**User Story:** As a Factory_Owner, I want 管理工厂的商务账号（查看、添加、禁用、删除），so that 我可以控制团队成员的访问权限并确保不超出套餐配额。

#### Acceptance Criteria

1. WHEN Factory_Owner 查看商务账号列表 THEN THE System SHALL 显示所有商务账号的信息（姓名、邮箱、状态、加入时间）
2. WHEN Factory_Owner 查看商务账号列表 THEN THE System SHALL 显示当前配额使用情况（已开通 X/Y 个商务账号）
3. WHEN Factory_Owner 添加新商务账号 THEN THE System SHALL 检查是否超出配额限制（staffLimit）
4. IF 添加商务账号时已达配额上限 THEN THE System SHALL 拒绝操作并提示"已达到商务账号数量上限（X/Y），请升级套餐"
5. WHEN Factory_Owner 成功添加商务账号 THEN THE System SHALL 创建用户记录、设置初始密码、发送邀请邮件（可选）
6. WHEN Factory_Owner 禁用商务账号 THEN THE System SHALL 更新账号状态为"已禁用"，该商务无法登录但数据保留
7. WHEN Factory_Owner 启用已禁用的商务账号 THEN THE System SHALL 恢复账号状态为"正常"，该商务可以重新登录
8. WHEN Factory_Owner 删除商务账号 THEN THE System SHALL 显示确认对话框，说明"删除后该商务无法登录，但其创建的达人和合作记录将保留"
9. WHEN Factory_Owner 确认删除商务账号 THEN THE System SHALL 删除用户记录，但保留该商务创建的业务数据（达人、合作、寄样记录等）
10. WHEN Factory_Owner 查看商务账号详情 THEN THE System SHALL 显示该商务的工作统计（管理的达人数量、创建的合作数量、寄样次数）
