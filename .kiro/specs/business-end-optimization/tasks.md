# 业务端优化 - 任务分解

**创建时间**: 2026年1月6日  
**预计工作量**: 7-11天  
**状态**: 待开始

---

## 📋 任务概述

本任务列表将业务端优化项目分解为可执行的开发任务。按照优先级和依赖关系组织，确保增量交付和及时验证。

**任务标记说明**:
- `[ ]` - 未开始
- `[x]` - 已完成
- `*` - 可选任务（可跳过以加快MVP交付）

---

## 🎯 第一周：工厂老板端优化（6天）

### Day 1-2: 数据可视化增强

- [x] 1. 实现趋势图表组件 ✅
  - [x] 1.1 创建 TrendChart 组件 ✅
    - 支持折线图展示 GMV/成本/ROI 趋势
    - 支持时间范围切换（7天/30天/90天）
    - 显示同比/环比数据
    - _需求: FR-1.1_
    - _文件: `packages/frontend/src/components/charts/TrendChart.tsx`_
  
  - [x] 1.2 创建后端 API `/reports/dashboard/trends` ✅
    - 查询指定时间范围的数据
    - 计算同比/环比变化
    - 返回格式化的图表数据
    - _需求: FR-1.1_
    - _文件: `packages/backend/src/services/trend.service.ts`, `packages/backend/src/routes/report.routes.ts`_
  
  - [x] 1.3 集成到 Dashboard 页面 ✅
    - 在关键指标卡片下方添加趋势图表
    - 添加时间范围选择器
    - 添加加载状态和错误处理
    - _需求: FR-1.1_
    - _文件: `packages/frontend/src/pages/Dashboard/index.tsx`_

- [x] 2. 实现 ROI 分析图表 ✅
  - [x] 2.1 创建 ROIAnalysisChart 组件 ✅
    - 柱状图：各商务 ROI 对比
    - 饼图：成本构成分析
    - 散点图：成本-收益关系
    - _需求: FR-1.1_
    - _文件: `packages/frontend/src/components/charts/ROIAnalysisChart.tsx`_
  
  - [x] 2.2 创建后端 API `/reports/dashboard/roi-analysis` ✅
    - 查询各商务的 ROI 数据
    - 计算成本构成比例
    - 生成散点图数据
    - _需求: FR-1.1_
    - _文件: `packages/backend/src/services/report.service.ts`, `packages/backend/src/routes/report.routes.ts`_
  
  - [x] 2.3 集成到 Dashboard 页面 ✅
    - 添加图表切换功能
    - 添加数据筛选功能
    - _需求: FR-1.1_
    - _文件: `packages/frontend/src/pages/Dashboard/index.tsx`_

- [x] 3. 实现管道漏斗图 ✅
  - [x] 3.1 创建 PipelineFunnelChart 组件 ✅
    - 漏斗图展示各阶段数量
    - 显示转化率
    - 显示平均停留时长
    - _需求: FR-1.1_
    - _文件: `packages/frontend/src/components/charts/PipelineFunnelChart.tsx`_
  
  - [x] 3.2 创建后端 API `/reports/dashboard/pipeline-funnel` ✅
    - 统计各阶段合作数量
    - 计算阶段转化率
    - 计算平均停留时长
    - _需求: FR-1.1_
    - _文件: `packages/backend/src/services/report.service.ts`, `packages/backend/src/routes/report.routes.ts`_
  
  - [x] 3.3 集成到 Dashboard 页面 ✅
    - 替换现有的圆形进度条
    - 添加详细数据展示
    - _需求: FR-1.1_
    - _文件: `packages/frontend/src/pages/Dashboard/index.tsx`_

- [x] 4. Checkpoint - 数据可视化验证 ✅
  - 确保所有图表正常显示
  - 验证数据准确性
  - 测试时间范围切换
  - 询问用户是否有问题


### Day 3: 商务绩效深度分析

- [x] 5. 实现商务对比分析 ✅
  - [x] 5.1 创建 StaffComparisonChart 组件 ✅
    - 支持选择2-3个商务进行对比
    - 多维度对比（建联数、成交数、GMV、ROI、效率）
    - 显示优势和劣势分析
    - _需求: FR-1.2_
  
  - [x] 5.2 创建后端 API `/reports/staff/comparison` ✅
    - 查询多个商务的绩效数据
    - 计算各维度对比
    - 生成优劣势分析
    - _需求: FR-1.2_
  
  - [x] 5.3 集成到 Dashboard 或新建分析页面 ✅
    - 添加商务选择器
    - 显示对比图表
    - 显示分析结论
    - _需求: FR-1.2_

- [x] 6. 实现商务工作质量评分
  - [x] 6.1 创建 StaffQualityScore 组件
    - 显示综合评分
    - 显示各维度评分（跟进频率、转化率、ROI、效率）
    - 显示评分趋势图
    - 显示改进建议
    - _需求: FR-1.2_
  
  - [x] 6.2 创建后端 API `/reports/staff/:staffId/quality-score`
    - 计算综合评分算法
    - 计算各维度评分
    - 生成评分趋势数据
    - 生成改进建议
    - _需求: FR-1.2_
  
  - [x] 6.3 集成到商务详情页面
    - 在 StaffDetailModal 中添加质量评分标签页
    - 显示评分和建议
    - _需求: FR-1.2_

- [x] 7. 实现商务工作日历 ✅
  - [x] 7.1 创建 StaffWorkCalendar 组件 ✅
    - 日历视图显示工作安排
    - 标注重要节点（截止日期、排期日期）
    - 显示工作负载热力图
    - _需求: FR-1.2_
  
  - [x] 7.2 创建后端 API `/reports/staff/:staffId/calendar` ✅
    - 查询商务的合作日程
    - 统计每日工作负载
    - 返回日历事件数据
    - _需求: FR-1.2_
  
  - [x] 7.3 集成到商务详情页面 ✅
    - 在 StaffDetailModal 中添加工作日历标签页
    - 支持日期点击查看详情
    - _需求: FR-1.2_

- [x] 8. Checkpoint - 绩效分析验证 ✅
  - 确保对比分析功能正常
  - 验证评分算法准确性
  - 测试日历显示
  - 询问用户是否有问题
  - **前端修复**: 修复了质量评分和工作日历的加载失败问题
    - 添加了 `getStaffQualityScore` API 服务函数
    - 重构了 `StaffQualityScore` 组件使用统一的 API 服务
    - 修复了 `StaffWorkCalendar` 组件的响应数据处理
    - 修复了 Badge 组件的类型错误
    - 详见: `前端加载失败问题修复报告.md`


### Day 4: 快捷操作和智能提醒

- [x] 9. 实现快捷操作面板
  - [x] 9.1 创建 QuickActionsPanel 组件 ✅
    - 一键查看超期合作
    - 一键查看待签收样品
    - 一键查看待录入结果
    - 一键导出报表
    - _需求: FR-1.3_
  
  - [x] 9.2 创建后端 API `/reports/dashboard/daily-summary` ✅
    - 统计超期合作数量
    - 统计待签收样品数量
    - 统计待录入结果数量
    - 返回快捷操作数据
    - _需求: FR-1.3_
  
  - [x] 9.3 集成到 Dashboard 页面 ✅
    - 在顶部添加快捷操作面板
    - 点击跳转到对应页面并自动筛选
    - _需求: FR-1.3_

- [x] 10. 实现智能提醒系统
  - [x] 10.1 创建 SmartNotifications 组件
    - 显示每日工作摘要
    - 显示异常预警
    - 显示重要节点提醒
    - 支持标记已读
    - _需求: FR-1.3_
  
  - [x] 10.2 创建后端 API `/reports/dashboard/alerts`
    - 生成每日工作摘要
    - 检测异常情况（超期、低转化率等）
    - 生成重要节点提醒
    - _需求: FR-1.3_
  
  - [x] 10.3 集成到 Dashboard 页面
    - 在右侧添加提醒面板
    - 支持实时更新（轮询或 WebSocket）
    - _需求: FR-1.3_

- [x] 11. 实现自定义看板
  - [x] 11.1 创建 CustomizableDashboard 组件
    - 支持拖拽调整卡片顺序
    - 支持隐藏/显示卡片
    - 支持保存布局设置
    - _需求: FR-1.3_
  
  - [x] 11.2 创建后端 API `POST /users/dashboard-layout`
    - 保存用户的看板布局配置
    - 加载用户的看板布局配置
    - _需求: FR-1.3_
  
  - [x] 11.3 集成到 Dashboard 页面
    - 添加"自定义布局"按钮
    - 实现拖拽功能（使用 react-dnd）
    - 自动保存布局变更
    - _需求: FR-1.3_

- [x] 12. Checkpoint - 快捷操作验证
  - 确保快捷操作正常工作
  - 验证提醒数据准确性
  - 测试自定义看板功能
  - 询问用户是否有问题


### Day 5: ⭐ 商务权限管理（重点功能）

- [x] 13. 数据库迁移 - 添加权限字段
  - [ ] 13.1 创建 Prisma 迁移
    - 在 User 模型添加 `permissions` 字段（Json 类型）
    - 在 User 模型添加 `preferences` 字段（Json 类型）
    - 运行迁移命令
    - _需求: FR-1.4_
  
  - [x] 13.2 初始化现有商务的默认权限
    - 编写数据迁移脚本
    - 为所有现有商务设置"基础商务"权限
    - 验证迁移成功
    - _需求: FR-1.4_

- [x] 14. 后端权限系统实现
  - [x] 14.1 创建权限类型定义
    - 定义 StaffPermissions 接口
    - 定义权限模板常量
    - _需求: FR-1.4_
  
  - [x] 14.2 实现权限验证中间件
    - 创建 `checkPermission` 中间件
    - 创建 `filterByPermission` 中间件
    - 实现权限检查逻辑
    - _需求: FR-1.4_
  
  - [x] 14.3 创建权限管理 API
    - `GET /api/staff/:staffId/permissions` - 获取商务权限
    - `PUT /api/staff/:staffId/permissions` - 更新商务权限
    - `GET /api/staff/permission-templates` - 获取权限模板
    - _需求: FR-1.4_
  
  - [x] 14.4 应用权限验证到现有路由
    - 达人管理路由（`/api/influencers`）
    - 样品管理路由（`/api/samples`）
    - 合作管理路由（`/api/collaborations`）
    - 报表路由（`/api/reports`）
    - _需求: FR-1.4_

- [x] 15. 前端权限系统实现
  - [x] 15.1 创建 usePermissions Hook
    - 实现权限检查逻辑
    - 处理工厂老板特殊情况（拥有所有权限）
    - 返回权限检查函数
    - _需求: FR-1.4_
  
  - [x] 15.2 创建权限管理组件
    - StaffPermissionsModal - 权限设置弹窗
    - PermissionTemplateSelector - 模板选择器
    - PermissionCheckbox - 权限复选框组
    - _需求: FR-1.4_
  
  - [x] 15.3 更新团队管理页面
    - 在操作列添加"权限设置"按钮
    - 显示当前权限模板标签
    - 集成 StaffPermissionsModal
    - _需求: FR-1.4_
  
  - [x] 15.4 应用权限到各个页面
    - 达人管理页面 - 根据权限显示/隐藏功能
    - 样品管理页面 - 根据权限显示/隐藏功能
    - 合作管道页面 - 根据权限显示/隐藏功能
    - 报表页面 - 根据权限显示/隐藏数据
    - Dashboard - 根据权限显示/隐藏内容
    - _需求: FR-1.4_
  
  - [x] 15.5 添加权限提示信息
    - 在受限页面顶部显示提示
    - 在禁用按钮上显示 Tooltip
    - _需求: FR-1.4_

- [x] 16. Checkpoint - 权限管理验证
  - 测试基础商务权限（只能看自己的数据）
  - 测试高级商务权限（可以管理样品）
  - 测试团队主管权限（可以看所有数据）
  - 测试权限修改立即生效
  - 测试前后端权限验证一致性
  - 询问用户是否有问题


### Day 6: 移动端适配和报表导出

- [ ] 17. 移动端响应式优化
  - [ ] 17.1 优化 Dashboard 页面移动端布局
    - 使用 Ant Design 响应式栅格
    - 卡片在小屏幕上单列显示
    - 图表在移动端自适应
    - _需求: FR-1.5_
  
  - [ ] 17.2 优化表格在移动端的显示
    - 表格转为卡片式展示
    - 添加横向滚动
    - 优化触摸交互
    - _需求: FR-1.5_
  
  - [ ] 17.3 添加移动端专属功能
    - 下拉刷新
    - 手势操作
    - 触摸优化（最小触摸目标 44px）
    - _需求: FR-1.5_

- [ ] 18. 报表导出增强
  - [ ] 18.1 实现 PDF 导出
    - 使用 jsPDF 生成 PDF
    - 支持导出 Dashboard 数据
    - 支持导出图表
    - _需求: FR-1.6_
  
  - [ ] 18.2 实现图片导出
    - 使用 html2canvas 生成图片
    - 支持导出单个图表
    - 支持导出整个 Dashboard
    - _需求: FR-1.6_
  
  - [ ] 18.3 实现自定义导出
    - 创建导出配置界面
    - 支持选择导出内容
    - 支持选择时间范围
    - 支持选择数据维度
    - _需求: FR-1.6_
  
  - [ ]* 18.4 实现定时导出（可选）
    - 创建定时任务配置界面
    - 后端实现定时任务
    - 支持邮件发送报表
    - _需求: FR-1.6_

- [ ] 19. Checkpoint - 移动端和导出验证
  - 在手机上测试 Dashboard 显示
  - 测试 PDF 导出功能
  - 测试图片导出功能
  - 测试自定义导出功能
  - 询问用户是否有问题

---

## 🎯 第二周：商务人员端优化（5天）

### Day 1: 达人管理优化

- [x] 20. 实现达人快速筛选
  - [x] 20.1 创建 QuickFilters 组件
    - 显示已保存的筛选条件
    - 支持快速应用筛选
    - 支持保存新筛选条件
    - 支持删除筛选条件
    - _需求: FR-2.1_
  
  - [x] 20.2 实现智能推荐
    - 基于历史合作推荐达人
    - 基于 ROI 推荐达人
    - 基于最近联系推荐达人
    - _需求: FR-2.1_
  
  - [x] 20.3 实现批量操作
    - 批量打标签
    - 批量导出
    - 批量移动到分组
    - _需求: FR-2.1_

- [x] 21. 实现达人详情增强 ✅
  - [x] 21.1 创建 InfluencerDetailPanel 组件 ✅
    - 显示基本信息
    - 显示合作历史
    - 显示 ROI 数据
    - 显示最佳合作样品
    - 显示联系记录
    - _需求: FR-2.1_
    - _文件: `packages/frontend/src/pages/Influencers/InfluencerDetailPanel.tsx`_
  
  - [x] 21.2 创建后端 API ✅
    - `GET /api/influencers/:id/collaboration-history`
    - `GET /api/influencers/:id/roi-stats`
    - _需求: FR-2.1_
    - _文件: `packages/backend/src/services/influencer.service.ts`, `packages/backend/src/routes/influencer.routes.ts`_
    - **Bug Fix**: 修复了 500 错误 - 使用正确的 Prisma 关系路径 `dispatches.sample`
  
  - [x] 21.3 集成到达人管理页面 ✅
    - 点击达人卡片显示详情面板
    - 支持侧边栏或弹窗显示
    - _需求: FR-2.1_
    - _文件: `packages/frontend/src/pages/Influencers/index.tsx`_

- [x] 22. 实现达人分组管理 ✅
  - [x] 22.1 创建 InfluencerGroups 组件 ✅
    - 显示分组列表
    - 支持创建/编辑/删除分组
    - 支持拖拽移动达人到分组
    - 显示分组统计数据
    - _需求: FR-2.1_
  
  - [x] 22.2 创建后端 API ✅
    - `POST /api/influencers/groups` - 创建分组
    - `PUT /api/influencers/groups/:id` - 更新分组
    - `DELETE /api/influencers/groups/:id` - 删除分组
    - `PUT /api/influencers/:id/group` - 移动达人到分组
    - _需求: FR-2.1_
  
  - [x] 22.3 集成到达人管理页面 ✅
    - 在左侧添加分组面板
    - 支持按分组筛选达人
    - _需求: FR-2.1_

- [x] 23. Checkpoint - 达人管理验证
  - 测试快速筛选功能
  - 测试智能推荐
  - 测试批量操作
  - 测试达人详情显示
  - 测试分组管理
  - 询问用户是否有问题


### Day 2: 跟进流程优化

- [x] 24. 实现快速跟进
  - [x] 24.1 创建 QuickFollowUp 组件
    - 显示跟进模板列表
    - 支持选择模板快速填充
    - 支持语音输入（使用 react-speech-recognition）
    - 支持图片上传
    - 自动记录跟进时间
    - _需求: FR-2.2_
  
  - [x] 24.2 创建后端 API
    - `GET /api/collaborations/follow-up-templates` - 获取模板
    - `POST /api/collaborations/:id/follow-up/quick` - 快速跟进
    - _需求: FR-2.2_
  
  - [x] 24.3 集成到合作管道页面
    - 在合作卡片上添加"快速跟进"按钮
    - 点击弹出快速跟进弹窗
    - _需求: FR-2.2_

- [x] 25. 实现跟进提醒 ✅
  - [x] 25.1 创建 FollowUpReminder 组件 ✅
    - 显示需要跟进的合作列表
    - 智能提醒下次跟进时间
    - 显示跟进频率建议
    - 标注长时间未跟进的合作
    - 支持暂停提醒
    - _需求: FR-2.2_
    - _文件: `packages/frontend/src/components/dashboard/FollowUpReminder.tsx`_
  
  - [x] 25.2 实现智能提醒算法 ✅
    - 根据合作阶段建议跟进频率
    - 根据历史转化率调整提醒
    - 根据达人响应速度调整提醒
    - _需求: FR-2.2_
    - _文件: `packages/backend/src/services/collaboration.service.ts`_
  
  - [x] 25.3 集成到 Dashboard 或合作管道页面 ✅
    - 在顶部显示提醒面板
    - 支持一键跳转到合作详情
    - _需求: FR-2.2_
    - _文件: `packages/frontend/src/pages/Dashboard/index.tsx`_

- [x] 26. 实现跟进分析 ✅
  - [x] 26.1 创建 FollowUpAnalytics 组件 ✅
    - 显示跟进效果统计
    - 分析最佳跟进时间
    - 分析最佳跟进频率
    - 显示转化率趋势
    - _需求: FR-2.2_
    - _文件: `packages/frontend/src/components/charts/FollowUpAnalytics.tsx`_
  
  - [x] 26.2 创建后端 API ✅
    - `GET /api/collaborations/follow-up-analytics`
    - 统计跟进数据
    - 分析时间和频率对转化率的影响
    - _需求: FR-2.2_
    - _文件: `packages/backend/src/services/collaboration.service.ts`, `packages/backend/src/routes/collaboration.routes.ts`_
  
  - [x] 26.3 集成到报表页面或新建分析页面 ✅
    - 创建独立的跟进分析页面 `/app/follow-up-analytics`
    - 添加到侧边栏菜单（工厂老板和商务人员都可访问）
    - 显示跟进分析图表
    - 提供优化建议
    - _需求: FR-2.2_
    - _文件: `packages/frontend/src/pages/FollowUpAnalytics/index.tsx`, `packages/frontend/src/routes/index.tsx`, `packages/frontend/src/layouts/MainLayout.tsx`_

- [x] 27. Checkpoint - 跟进流程验证
  - 测试快速跟进功能
  - 测试语音输入
  - 测试跟进提醒
  - 测试跟进分析
  - 询问用户是否有问题


### Day 3: 数据录入优化

- [x] 28. 实现智能表单
  - [x] 28.1 创建 SmartForm 组件
    - 自动填充历史数据
    - 智能推荐样品
    - 智能推荐报价
    - 表单数据缓存（使用 localforage）
    - _需求: FR-2.3_
  
  - [x] 28.2 创建后端 API
    - `GET /api/collaborations/suggestions` - 获取智能建议
    - 基于历史数据推荐样品
    - 基于达人类型推荐报价
    - _需求: FR-2.3_
  
  - [x] 28.3 集成到合作创建/编辑页面
    - 替换现有表单为智能表单
    - 添加建议提示
    - 实现自动保存草稿
    - _需求: FR-2.3_

- [x] 29. 实现批量录入
  - [x] 29.1 创建 BatchOperations 组件
    - 支持批量寄样
    - 支持批量更新状态
    - 支持批量设置截止日期
    - 显示操作进度
    - _需求: FR-2.3_
  
  - [x] 29.2 创建后端 API
    - `POST /api/collaborations/batch-update`
    - 支持批量操作
    - 返回成功/失败统计
    - _需求: FR-2.3_
  
  - [x] 29.3 集成到合作管道页面
    - 添加批量操作按钮
    - 支持多选合作
    - 显示操作结果
    - _需求: FR-2.3_

- [x] 30. 实现数据验证
  - [x] 30.1 创建 FormValidator 组件
    - 实时数据验证
    - 重复数据检测
    - 异常数据提醒
    - 显示验证错误和警告
    - _需求: FR-2.3_
  
  - [x] 30.2 创建后端 API
    - `POST /api/collaborations/validate`
    - 验证数据完整性
    - 检测重复数据
    - 检测异常数据
    - _需求: FR-2.3_
  
  - [x] 30.3 集成到所有表单
    - 在表单提交前验证
    - 显示验证结果
    - 阻止无效数据提交
    - _需求: FR-2.3_

- [x] 31. Checkpoint - 数据录入验证
  - 测试智能表单自动填充
  - 测试智能推荐
  - 测试批量操作
  - 测试数据验证
  - 测试表单缓存
  - 询问用户是否有问题


### Day 4: 工作台优化

- [x] 32. 实现今日工作清单
  - [x] 32.1 创建 TodayTodoList 组件
    - 显示今日待办事项
    - 显示今日目标
    - 显示今日进度
    - 支持快速完成待办
    - 支持暂停待办
    - _需求: FR-2.4_
  
  - [x] 32.2 创建后端 API
    - `GET /api/reports/my-dashboard/today-todos`
    - 生成今日待办列表
    - 统计待办完成情况
    - _需求: FR-2.4_
  
  - [x] 32.3 集成到商务 Dashboard 页面
    - 在顶部显示今日清单
    - 支持快速操作
    - _需求: FR-2.4_

- [x] 33. 实现工作统计
  - [x] 33.1 创建 WorkStats 组件
    - 显示今日/本周/本月统计
    - 显示目标完成度
    - 显示排名变化
    - 显示效率分析
    - 显示趋势图
    - _需求: FR-2.4_
  
  - [x] 33.2 创建后端 API
    - `GET /api/reports/my-dashboard/work-stats`
    - 统计工作数据
    - 计算目标完成度
    - 计算排名变化
    - _需求: FR-2.4_
  
  - [x] 33.3 集成到商务 Dashboard 页面
    - 显示统计卡片
    - 支持时间范围切换
    - _需求: FR-2.4_

- [x] 34. 实现快捷入口
  - [x] 34.1 创建 QuickActions 组件
    - 快速添加达人
    - 快速创建合作
    - 快速寄样
    - 快速跟进
    - _需求: FR-2.4_
  
  - [x] 34.2 集成到商务 Dashboard 页面
    - 在顶部或侧边显示快捷入口
    - 点击打开对应的创建弹窗
    - _需求: FR-2.4_

- [x] 35. Checkpoint - 工作台验证
  - 测试今日清单功能
  - 测试工作统计
  - 测试快捷入口
  - 验证数据准确性
  - 询问用户是否有问题


### Day 5: 移动端专属功能

- [ ] 36. 实现移动端快捷操作
  - [ ] 36.1 创建扫码添加达人功能
    - 使用摄像头扫描二维码
    - 解析达人信息
    - 快速添加到系统
    - _需求: FR-2.5_
  
  - [ ] 36.2 创建语音记录跟进功能
    - 使用语音识别 API
    - 转换语音为文字
    - 保存跟进记录
    - _需求: FR-2.5_
  
  - [ ] 36.3 创建拍照上传样品功能
    - 使用摄像头拍照
    - 压缩图片
    - 上传到服务器
    - _需求: FR-2.5_
  
  - [ ]* 36.4 创建位置签到功能（可选）
    - 获取地理位置
    - 记录签到时间和地点
    - 显示签到历史
    - _需求: FR-2.5_

- [ ] 37. 实现离线功能
  - [ ] 37.1 实现离线存储
    - 使用 localforage 存储数据
    - 缓存达人信息
    - 缓存合作信息
    - _需求: FR-2.5_
  
  - [ ] 37.2 实现离线记录
    - 离线状态下记录跟进
    - 离线状态下记录操作
    - 存储到本地队列
    - _需求: FR-2.5_
  
  - [ ] 37.3 实现数据同步
    - 检测网络状态
    - 自动同步离线数据
    - 处理同步冲突
    - 显示同步状态
    - _需求: FR-2.5_

- [ ]* 38. 实现消息推送（可选）
  - [ ]* 38.1 实现推送通知
    - 重要提醒推送
    - 工作进度推送
    - 排名变化推送
    - _需求: FR-2.5_
  
  - [ ]* 38.2 配置推送服务
    - 集成推送服务（如 Firebase）
    - 配置推送权限
    - 处理推送点击
    - _需求: FR-2.5_

- [ ] 39. Checkpoint - 移动端功能验证
  - 在手机上测试扫码功能
  - 测试语音记录
  - 测试拍照上传
  - 测试离线功能
  - 测试数据同步
  - 询问用户是否有问题

---

## 🧪 最终测试和优化

- [ ] 40. 综合测试
  - [ ] 40.1 功能测试
    - 测试所有新增功能
    - 测试权限管理完整流程
    - 测试移动端适配
    - _需求: 所有_
  
  - [ ] 40.2 性能测试
    - 测试页面加载速度
    - 测试 API 响应时间
    - 测试大数据量场景
    - _需求: NFR-1_
  
  - [ ] 40.3 兼容性测试
    - 测试不同浏览器
    - 测试不同设备
    - 测试不同屏幕尺寸
    - _需求: NFR-3_
  
  - [ ] 40.4 安全测试
    - 测试权限验证
    - 测试数据隔离
    - 测试 API 安全
    - _需求: NFR-2_

- [ ] 41. 性能优化
  - [ ] 41.1 前端优化
    - 代码分割
    - 图片懒加载
    - 组件懒加载
    - 缓存优化
    - _需求: NFR-1_
  
  - [ ] 41.2 后端优化
    - 数据库查询优化
    - 添加索引
    - 实现缓存
    - API 响应优化
    - _需求: NFR-1_

- [ ] 42. 文档和培训
  - [ ] 42.1 编写用户文档
    - 工厂老板端使用指南
    - 商务人员端使用指南
    - 权限管理指南
    - _需求: 所有_
  
  - [ ] 42.2 编写技术文档
    - API 文档
    - 组件文档
    - 部署文档
    - _需求: NFR-4_
  
  - [ ]* 42.3 用户培训（可选）
    - 准备培训材料
    - 进行用户培训
    - 收集用户反馈
    - _需求: 所有_

- [ ] 43. 最终验收
  - 确保所有功能正常工作
  - 确保性能达标
  - 确保安全性达标
  - 用户最终确认

---

## 📊 任务统计

**总任务数**: 43个主任务，约150个子任务  
**预计工作量**: 7-11天  
**可选任务**: 4个（标记为 `*`）

**优先级分布**:
- 高优先级（必须完成）: 39个任务
- 中优先级（建议完成）: 0个任务
- 低优先级（可选）: 4个任务

**依赖关系**:
- Day 5 的权限管理任务是核心，必须优先完成
- 移动端功能可以并行开发
- 最终测试依赖所有功能完成

---

## 📝 注意事项

1. **增量交付**: 每完成一个 Day 的任务，都要进行 Checkpoint 验证
2. **用户反馈**: 在每个 Checkpoint 询问用户意见，及时调整
3. **权限优先**: Day 5 的权限管理是核心功能，必须确保质量
4. **测试覆盖**: 每个功能都要有对应的测试
5. **文档同步**: 开发过程中同步更新文档

---

**文档状态**: ✅ 已完成  
**准备开始**: 等待用户确认后开始实施

