# Implementation Plan: UI 视觉风格升级

## Overview

本实施计划将系统地升级整个应用的 UI 视觉风格，参考 Sugar CRM 的现代化设计。我们将采用渐进式迁移策略，确保在升级过程中系统保持可用。

## Tasks

- [x] 1. 建立设计系统基础
  - [x] 1.1 创建设计令牌配置文件
    - 创建 `theme/tokens.ts` 定义颜色、字体、间距等
    - 创建 `theme/index.ts` 导出主题配置
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 配置 Tailwind CSS
    - 更新 `tailwind.config.js` 使用设计令牌
    - 添加自定义工具类
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 创建主题 Provider
    - 实现 ThemeContext 和 ThemeProvider
    - 实现主题切换逻辑
    - 实现主题持久化（localStorage）
    - _Requirements: 10.1, 10.4_

- [x] 2. 创建基础组件库
  - [x] 2.1 实现 Card 组件
    - 创建 `components/ui/Card.tsx`
    - 支持不同 variant 和 padding
    - 实现悬停效果
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 实现 Avatar 组件
    - 创建 `components/ui/Avatar.tsx`
    - 实现彩色圆圈装饰
    - 支持不同尺寸和状态
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.3 实现 AvatarGroup 组件
    - 创建 `components/ui/AvatarGroup.tsx`
    - 实现重叠布局
    - 支持显示更多数量
    - _Requirements: 3.4_

  - [x] 2.4 实现 Button 组件
    - 创建 `components/ui/Button.tsx`
    - 支持不同 variant 和 size
    - 实现加载和禁用状态
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.5 实现 Input 组件
    - 创建 `components/ui/Input.tsx`
    - 实现聚焦和错误状态
    - 支持前缀和后缀图标
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.6 实现 Badge 组件
    - 创建 `components/ui/Badge.tsx`
    - 支持不同颜色变体
    - 支持不同尺寸
    - _Requirements: 6.4_

- [ ] 3. 升级 Dashboard 页面
  - [ ] 3.1 重构统计卡片
    - 使用新的 Card 组件
    - 优化图标和数值展示
    - 添加悬停效果
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 优化图表组件
    - 更新图表配色方案
    - 添加圆角和渐变效果
    - 优化悬停提示
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 3.3 实现响应式布局
    - 优化移动端显示
    - 调整卡片间距和大小
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 4. 升级 Pipeline 页面
  - [ ] 4.1 重构管道列布局
    - 使用浅色背景区分列
    - 优化列标题样式
    - _Requirements: 6.1_

  - [ ] 4.2 重构合作卡片
    - 使用新的 Card 组件
    - 添加 AvatarGroup 显示团队成员
    - 优化状态标签样式
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ] 4.3 优化拖拽交互
    - 添加拖拽预览效果
    - 优化目标位置提示
    - _Requirements: 6.5_

  - [ ] 4.4 添加加载动画
    - 实现骨架屏
    - 添加卡片加载动画
    - _Requirements: 9.1_

- [ ] 5. 升级 Influencers 页面
  - [ ] 5.1 重构达人列表
    - 使用新的 Card 组件展示达人
    - 添加 Avatar 组件
    - 优化标签显示
    - _Requirements: 2.1, 3.1, 3.2_

  - [ ] 5.2 优化筛选和搜索
    - 使用新的 Input 组件
    - 优化筛选器样式
    - _Requirements: 5.1, 5.2_

  - [ ] 5.3 优化模态框
    - 更新模态框样式
    - 优化表单布局
    - _Requirements: 2.1, 5.1_

- [ ] 6. 升级 Samples 页面
  - [ ] 6.1 重构样品列表
    - 使用新的 Card 组件
    - 优化状态显示
    - _Requirements: 2.1, 6.4_

  - [ ] 6.2 优化样品报表
    - 更新图表样式
    - 优化数据展示
    - _Requirements: 7.1, 7.2_

- [ ] 7. 升级 Results 页面
  - [ ] 7.1 重构结果列表
    - 使用新的 Card 组件
    - 优化数据展示
    - _Requirements: 2.1_

  - [ ] 7.2 优化 ROI 报表
    - 更新图表样式
    - 添加交互效果
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 8. 升级 Reports 页面
  - [ ] 8.1 重构报表卡片
    - 使用新的 Card 组件
    - 优化图表展示
    - _Requirements: 2.1, 7.1_

  - [ ] 8.2 优化数据可视化
    - 更新所有图表样式
    - 添加交互效果
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. 升级 Admin 页面
  - [ ] 9.1 重构工厂列表
    - 优化表格样式
    - 添加卡片视图选项
    - _Requirements: 2.1_

  - [ ] 9.2 优化统计卡片
    - 使用新的 Card 组件
    - 优化数据展示
    - _Requirements: 2.1_

- [ ] 10. 升级达人门户页面
  - [ ] 10.1 重构达人仪表盘
    - 使用新的 Card 组件
    - 优化数据展示
    - _Requirements: 2.1_

  - [ ] 10.2 优化合作列表
    - 使用新的 Card 组件
    - 添加状态标签
    - _Requirements: 2.1, 6.4_

  - [ ] 10.3 优化样品列表
    - 使用新的 Card 组件
    - 优化状态显示
    - _Requirements: 2.1_

- [ ] 11. 全局组件升级
  - [ ] 11.1 升级导航栏
    - 优化样式和间距
    - 添加悬停效果
    - _Requirements: 4.3_

  - [ ] 11.2 升级侧边栏
    - 优化菜单项样式
    - 添加图标和动画
    - _Requirements: 4.3, 9.2_

  - [ ] 11.3 升级通知组件
    - 使用新的 Card 组件
    - 优化样式和动画
    - _Requirements: 2.1, 9.2_

- [ ] 12. 动画和过渡效果
  - [ ] 12.1 添加页面切换动画
    - 实现淡入淡出效果
    - 优化路由切换
    - _Requirements: 9.2_

  - [ ] 12.2 添加组件动画
    - 实现展开/收起动画
    - 添加悬停动画
    - _Requirements: 9.3, 9.4_

  - [ ] 12.3 实现加载状态
    - 创建骨架屏组件
    - 添加加载动画
    - _Requirements: 9.1_

- [ ] 13. 响应式优化
  - [ ] 13.1 优化移动端布局
    - 调整所有页面的移动端显示
    - 优化触摸交互
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 13.2 优化平板端布局
    - 调整中等屏幕的显示
    - 优化间距和大小
    - _Requirements: 8.1_

- [ ] 14. 暗色模式支持（可选）
  - [ ] 14.1 实现暗色主题
    - 定义暗色设计令牌
    - 实现主题切换
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 14.2 优化暗色模式
    - 调整所有组件的暗色样式
    - 优化对比度
    - _Requirements: 10.2, 10.3_

- [ ] 15. 测试和优化
  - [ ] 15.1 视觉回归测试
    - 截图对比测试
    - 跨浏览器测试
    - _Requirements: All_

  - [ ] 15.2 性能优化
    - 优化组件渲染性能
    - 优化动画性能
    - _Requirements: 9.4_

  - [ ] 15.3 无障碍测试
    - 键盘导航测试
    - 屏幕阅读器测试
    - _Requirements: 9.5_

- [ ] 16. 文档和交付
  - [ ] 16.1 编写组件文档
    - 创建 Storybook 文档
    - 编写使用指南
    - _Requirements: All_

  - [ ] 16.2 创建设计规范文档
    - 整理设计令牌文档
    - 创建组件使用示例
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Notes

- 采用渐进式迁移策略，确保系统在升级过程中保持可用
- 优先升级高频使用的页面（Dashboard、Pipeline）
- 每完成一个页面的升级，进行测试和验证
- 保持与现有功能的兼容性
- 注意性能优化，避免过度使用动画和效果
