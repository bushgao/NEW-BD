# 工厂老板 Dashboard 问题排查指南

## 问题描述

工厂老板登录后，Dashboard 显示错误。

## 已验证的内容

### 1. 后端 API ✅
- 登录 API 正常工作
- Dashboard API 返回正确的数据结构
- 所有必需字段都存在

### 2. 数据结构 ✅
```json
{
  "metrics": {
    "totalSampleCost": 0,
    "totalCollaborationCost": 0,
    "totalGmv": 0,
    "overallRoi": 0,
    "periodComparison": {
      "sampleCostChange": 0,
      "gmvChange": 0,
      "roiChange": 0
    }
  },
  "pipelineDistribution": { ... },
  "pendingItems": { ... },
  "staffRanking": [ ... ],
  "staffProgress": [ ... ],
  "teamEfficiency": { ... },
  "recentTeamActivities": [ ... ],
  "riskAlerts": { ... }
}
```

### 3. 前端代码 ✅
- TypeScript 编译无错误
- 所有 `factoryDashboard` 访问都使用了可选链 `?.`
- 组件逻辑正确

## 可能的问题原因

### 1. 浏览器缓存问题
**症状**: 页面显示旧版本的代码或数据

**解决方案**:
1. 清除浏览器缓存
2. 硬刷新页面（Ctrl + Shift + R 或 Cmd + Shift + R）
3. 清除 localStorage：
   ```javascript
   // 在浏览器控制台执行
   localStorage.clear();
   location.reload();
   ```

### 2. 前端状态问题
**症状**: 用户信息或认证状态不正确

**解决方案**:
1. 退出登录
2. 清除浏览器缓存和 localStorage
3. 重新登录

### 3. HMR (Hot Module Replacement) 问题
**症状**: 前端代码更新后没有正确重新加载

**解决方案**:
1. 停止前端服务
2. 清除 node_modules/.vite 缓存
3. 重启前端服务

### 4. API 请求失败
**症状**: 网络请求返回错误

**解决方案**:
1. 检查浏览器控制台的 Network 标签
2. 查看是否有 API 请求失败
3. 检查后端服务是否正常运行

## 排查步骤

### 步骤 1: 检查浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 查看是否有 JavaScript 错误
4. 截图或复制错误信息

### 步骤 2: 检查网络请求
1. 切换到 Network 标签
2. 刷新页面
3. 查看 `/api/reports/dashboard` 请求
4. 检查请求状态码和响应数据

### 步骤 3: 检查用户状态
1. 在浏览器控制台执行：
   ```javascript
   JSON.parse(localStorage.getItem('auth-storage'))
   ```
2. 检查用户角色是否为 `FACTORY_OWNER`
3. 检查 `factory` 字段是否存在

### 步骤 4: 清除缓存并重新登录
1. 清除浏览器缓存
2. 清除 localStorage
3. 退出登录
4. 重新登录

### 步骤 5: 重启服务
如果以上步骤都无效，尝试重启服务：

```bash
# 停止前端服务
# 在前端终端按 Ctrl+C

# 清除缓存
cd packages/frontend
rm -rf node_modules/.vite

# 重启前端服务
npm run dev
```

## 测试账号

**工厂老板**:
- 邮箱: `owner@demo.com`
- 密码: `owner123`
- 工厂: 示例工厂
- 套餐: 专业版

## 预期显示内容

工厂老板 Dashboard 应该显示：

1. **工厂状态横幅**（如果状态不是 APPROVED）
2. **标题和周期切换**
   - 欢迎信息
   - 当前套餐
   - 周期选择（本周/本月）

3. **配额使用情况**
   - 商务账号配额：2/10
   - 达人数量配额：3/500

4. **关键指标卡片**
   - 寄样成本
   - 合作成本
   - 总GMV
   - 整体ROI

5. **合作管道分布**
   - 各阶段合作数量的圆形进度图

6. **待办事项**
   - 超期合作
   - 待签收样品
   - 待录入结果

7. **商务排行榜**
   - 商务人员排名
   - 成交数量
   - 总GMV

8. **商务团队工作进展**
   - 今日跟进
   - 本周跟进
   - 活跃合作
   - 卡住合作
   - 平均成交天数

9. **团队效率指标**
   - 各阶段平均天数

10. **风险预警**
    - 长期卡住的合作
    - 工作量不均衡
    - 成本异常

11. **最近团队动态**
    - 时间线显示最近的团队活动

## 常见错误及解决方案

### 错误 1: "Cannot read property 'metrics' of null"
**原因**: `factoryDashboard` 为 null 时尝试访问属性

**解决方案**: 
- 代码已使用可选链 `?.` 处理
- 如果仍然出现，检查是否有遗漏的地方

### 错误 2: "Network Error"
**原因**: 无法连接到后端 API

**解决方案**:
- 检查后端服务是否运行（http://localhost:3000）
- 检查数据库是否运行
- 检查防火墙设置

### 错误 3: "401 Unauthorized"
**原因**: 认证令牌无效或过期

**解决方案**:
- 退出登录
- 清除 localStorage
- 重新登录

### 错误 4: 页面空白但无错误
**原因**: 可能是 CSS 或布局问题

**解决方案**:
- 检查浏览器缩放比例
- 检查是否有 CSS 冲突
- 尝试不同的浏览器

## 需要提供的信息

如果问题仍然存在，请提供以下信息：

1. **浏览器控制台截图**
   - Console 标签的错误信息
   - Network 标签的 API 请求详情

2. **页面显示截图**
   - 当前页面的显示状态

3. **localStorage 内容**
   ```javascript
   JSON.parse(localStorage.getItem('auth-storage'))
   ```

4. **API 响应**
   - `/api/reports/dashboard?period=month` 的响应数据

5. **浏览器信息**
   - 浏览器类型和版本
   - 操作系统

## 快速修复命令

如果需要完全重置环境：

```bash
# 1. 停止所有服务
# 前端和后端终端都按 Ctrl+C

# 2. 清除前端缓存
cd packages/frontend
rm -rf node_modules/.vite
rm -rf dist

# 3. 重启后端
cd ../backend
npm run dev

# 4. 重启前端（新终端）
cd ../frontend
npm run dev

# 5. 清除浏览器数据
# 在浏览器控制台执行：
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## 联系支持

如果以上所有步骤都无法解决问题，请提供：
- 完整的错误信息
- 浏览器控制台截图
- 网络请求详情
- 用户状态信息

我们将进一步协助排查问题。
