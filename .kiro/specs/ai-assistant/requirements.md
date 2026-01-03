# Requirements Document - AI 数据助手

## Introduction

本文档定义了基于 Gemini AI 的智能数据助手功能需求。该功能将集成到系统的 Dashboard 主页中，为用户提供智能数据分析、趋势预测和决策建议。

## Glossary

- **AI_Assistant**: AI 数据助手，基于 Google Gemini API 的智能对话系统
- **Dashboard**: 系统主页，展示关键业务指标和数据
- **Gemini_API**: Google 提供的生成式 AI API 服务
- **Context_Data**: 上下文数据，包括用户当前查看的业务数据
- **Quick_Question**: 快捷问题，预设的常用问题模板
- **Daily_Summary**: 每日数据摘要，AI 自动生成的数据总结

## Requirements

### Requirement 1: AI 对话界面

**User Story:** 作为系统用户，我想在 Dashboard 上与 AI 助手对话，以便快速了解业务数据和获取分析建议。

#### Acceptance Criteria

1. WHEN 用户访问 Dashboard 页面 THEN THE System SHALL 在页面右侧显示 AI 助手卡片
2. WHEN 用户在输入框输入问题并提交 THEN THE System SHALL 调用 Gemini API 并返回 AI 回答
3. WHEN AI 正在处理请求 THEN THE System SHALL 显示加载动画和"AI 正在思考..."提示
4. WHEN AI 返回回答 THEN THE System SHALL 以对话气泡形式展示回答内容
5. WHEN 对话历史超过 10 条 THEN THE System SHALL 自动滚动到最新消息
6. WHEN 用户点击清空按钮 THEN THE System SHALL 清除当前对话历史

### Requirement 2: 上下文数据集成

**User Story:** 作为系统用户，我希望 AI 能够理解当前页面的业务数据，以便提供准确的分析和建议。

#### Acceptance Criteria

1. WHEN AI 处理用户问题 THEN THE System SHALL 将当前 Dashboard 的业务数据作为上下文发送给 AI
2. WHEN 用户是工厂老板角色 THEN THE System SHALL 包含工厂维度的数据（总成本、ROI、合作数量等）
3. WHEN 用户是商务人员角色 THEN THE System SHALL 包含个人维度的数据（负责的合作、跟进记录等）
4. WHEN 数据包含敏感信息 THEN THE System SHALL 在发送前进行脱敏处理
5. WHEN 上下文数据超过 API 限制 THEN THE System SHALL 智能截取最相关的数据

### Requirement 3: 快捷问题模板

**User Story:** 作为系统用户，我想使用预设的快捷问题，以便快速获取常见问题的答案。

#### Acceptance Criteria

1. WHEN 用户打开 AI 助手 THEN THE System SHALL 显示 4-6 个快捷问题按钮
2. WHEN 用户点击快捷问题 THEN THE System SHALL 自动填充问题并发送给 AI
3. WHEN 用户角色是工厂老板 THEN THE System SHALL 显示工厂相关的快捷问题（如"本月成本分析"）
4. WHEN 用户角色是商务人员 THEN THE System SHALL 显示商务相关的快捷问题（如"我的待跟进合作"）
5. WHEN 快捷问题被使用 THEN THE System SHALL 记录使用频率并动态调整显示顺序

### Requirement 4: 智能数据分析

**User Story:** 作为系统用户，我希望 AI 能够分析数据趋势并提供洞察，以便做出更好的业务决策。

#### Acceptance Criteria

1. WHEN 用户询问趋势问题 THEN THE AI SHALL 分析历史数据并识别上升/下降趋势
2. WHEN 用户询问对比问题 THEN THE AI SHALL 对比不同时间段或不同维度的数据
3. WHEN 用户询问原因问题 THEN THE AI SHALL 基于数据关联分析可能的原因
4. WHEN 用户询问预测问题 THEN THE AI SHALL 基于历史趋势提供合理的预测
5. WHEN AI 发现异常数据 THEN THE AI SHALL 主动提醒用户注意

### Requirement 5: 智能建议生成

**User Story:** 作为系统用户，我希望 AI 能够基于数据提供可执行的建议，以便优化业务流程。

#### Acceptance Criteria

1. WHEN AI 分析数据后 THEN THE AI SHALL 提供 2-3 条具体的优化建议
2. WHEN 建议涉及具体操作 THEN THE AI SHALL 说明操作步骤和预期效果
3. WHEN 建议涉及风险 THEN THE AI SHALL 明确指出潜在风险
4. WHEN 用户询问"如何改进" THEN THE AI SHALL 基于当前数据提供针对性建议
5. WHEN 建议被采纳 THEN THE System SHALL 允许用户标记建议为"已采纳"

### Requirement 6: 每日数据摘要

**User Story:** 作为系统用户，我希望每天自动获得数据摘要，以便快速了解业务状况。

#### Acceptance Criteria

1. WHEN 用户首次打开 Dashboard THEN THE System SHALL 显示当日的 AI 生成摘要
2. WHEN 生成每日摘要 THEN THE AI SHALL 包含关键指标变化、重要事件和待办提醒
3. WHEN 摘要内容较长 THEN THE System SHALL 支持展开/收起功能
4. WHEN 用户点击摘要中的数据 THEN THE System SHALL 跳转到相关详情页面
5. WHEN 摘要生成失败 THEN THE System SHALL 显示默认的数据概览

### Requirement 7: API 配置和管理

**User Story:** 作为系统管理员，我需要配置和管理 Gemini API，以便控制 AI 功能的使用。

#### Acceptance Criteria

1. WHEN 系统启动 THEN THE System SHALL 从环境变量读取 Gemini API Key
2. WHEN API Key 未配置 THEN THE System SHALL 禁用 AI 助手功能并显示配置提示
3. WHEN API 调用失败 THEN THE System SHALL 显示友好的错误提示并记录日志
4. WHEN API 达到速率限制 THEN THE System SHALL 提示用户稍后再试
5. WHEN API 返回错误 THEN THE System SHALL 降级到基础数据展示模式

### Requirement 8: 对话历史管理

**User Story:** 作为系统用户，我希望能够查看和管理对话历史，以便回顾之前的分析结果。

#### Acceptance Criteria

1. WHEN 用户与 AI 对话 THEN THE System SHALL 在浏览器本地存储对话历史
2. WHEN 用户刷新页面 THEN THE System SHALL 恢复最近的对话历史（最多 20 条）
3. WHEN 用户点击"导出对话" THEN THE System SHALL 将对话历史导出为文本文件
4. WHEN 用户点击"清空历史" THEN THE System SHALL 清除本地存储的对话记录
5. WHEN 对话历史超过 50 条 THEN THE System SHALL 自动删除最早的记录

### Requirement 9: 响应式设计

**User Story:** 作为移动设备用户，我希望 AI 助手在小屏幕上也能正常使用，以便随时随地访问。

#### Acceptance Criteria

1. WHEN 屏幕宽度小于 768px THEN THE System SHALL 将 AI 助手改为浮动按钮
2. WHEN 用户点击浮动按钮 THEN THE System SHALL 以全屏模态框展示 AI 助手
3. WHEN 在移动设备上输入 THEN THE System SHALL 优化输入框和键盘体验
4. WHEN 在移动设备上查看对话 THEN THE System SHALL 优化对话气泡的显示
5. WHEN 用户关闭模态框 THEN THE System SHALL 保持对话状态不丢失

### Requirement 10: 多语言支持

**User Story:** 作为系统用户，我希望 AI 能够理解中文问题并用中文回答，以便更自然地交流。

#### Acceptance Criteria

1. WHEN 用户用中文提问 THEN THE AI SHALL 用中文回答
2. WHEN 用户用英文提问 THEN THE AI SHALL 用英文回答
3. WHEN AI 回答包含专业术语 THEN THE AI SHALL 使用行业标准的中文术语
4. WHEN AI 回答包含数字 THEN THE AI SHALL 使用中文数字格式（如"1,234.56"）
5. WHEN AI 回答包含日期 THEN THE AI SHALL 使用中文日期格式（如"2024年1月3日"）

## Technical Constraints

- 使用 Google Gemini API (gemini-pro 模型)
- API Key 通过环境变量配置
- 对话历史存储在浏览器 localStorage
- 单次请求上下文不超过 30,000 tokens
- API 调用超时时间设置为 30 秒
- 前端使用 React + TypeScript
- 后端使用 Node.js + Express

## Security Requirements

- API Key 必须存储在后端环境变量中，不得暴露给前端
- 所有 AI 请求必须经过用户身份验证
- 敏感数据（如具体金额、个人信息）在发送给 AI 前必须脱敏
- 对话历史不得包含敏感信息
- API 调用必须有速率限制保护

## Performance Requirements

- AI 响应时间应在 5 秒内（90% 的情况）
- Dashboard 加载时间不应因 AI 功能增加超过 500ms
- 对话历史加载应在 100ms 内完成
- 快捷问题点击响应应在 50ms 内
- 每日摘要生成应在后台异步完成，不阻塞页面加载
