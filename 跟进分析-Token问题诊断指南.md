# 跟进分析 - Token 问题诊断指南

## 问题现象
跟进分析页面显示"加载失败"，Network 标签显示请求头为 `Authorization: Bearer null`

## 根本原因
Token 的 `accessToken` 属性为 `null`，导致 API 请求无法通过认证。

---

## 诊断步骤

### 方法 1：使用诊断工具（推荐）

1. **打开诊断页面**
   - 在浏览器中打开：`http://localhost:5173/check-localstorage.html`
   - 或者直接双击打开项目根目录的 `check-localstorage.html` 文件

2. **查看诊断结果**
   - 页面会自动检查 LocalStorage 中的认证信息
   - 重点关注 "Token 信息" 部分
   - 查看 `accessToken` 是否存在且不为 null

3. **根据结果采取行动**
   - ✅ 如果 accessToken 存在：问题可能在其他地方，继续方法 2
   - ❌ 如果 accessToken 为 null：点击"清除认证信息"按钮，然后重新登录

---

### 方法 2：查看浏览器控制台日志

1. **刷新页面**
   - 按 `F5` 或 `Ctrl+R` 刷新浏览器页面
   - 这会触发新的调试日志

2. **打开控制台**
   - 按 `F12` 打开开发者工具
   - 切换到 "Console" (控制台) 标签

3. **查找关键日志**
   查找以下日志信息：

   ```
   [FollowUpAnalytics] Auth state check:
   ```
   这会显示：
   - `isAuthenticated`: 是否已认证
   - `hasUser`: 是否有用户信息
   - `hasToken`: 是否有 token 对象
   - `tokenDetails`: token 的详细信息
     - `hasAccessToken`: 是否有 accessToken
     - `accessTokenPreview`: accessToken 的前 20 个字符

   ```
   [API Interceptor] Full auth state:
   ```
   这会显示 API 拦截器看到的认证状态

4. **分析日志**
   - 如果 `hasAccessToken: false` 或 `accessTokenPreview: 'NULL or EMPTY'`
     → Token 确实为 null，需要重新登录
   
   - 如果 `hasAccessToken: true` 但请求仍然失败
     → 可能是 token 已过期或无效，需要重新登录

---

## 解决方案

### 方案 A：清除并重新登录（推荐）

1. **清除认证信息**
   - 使用诊断工具的"清除认证信息"按钮
   - 或者在浏览器控制台执行：
     ```javascript
     localStorage.removeItem('auth-storage');
     ```

2. **刷新页面**
   - 按 `F5` 刷新页面

3. **重新登录**
   - 使用正确的账号密码登录
   - 确保看到"登录成功"提示

4. **验证**
   - 登录后，再次访问跟进分析页面
   - 查看控制台日志，确认 `hasAccessToken: true`

---

### 方案 B：检查登录响应

如果重新登录后问题仍然存在：

1. **打开 Network 标签**
   - 按 `F12` → Network 标签
   - 勾选 "Preserve log"

2. **执行登录**
   - 退出登录
   - 重新登录

3. **查找登录请求**
   - 在 Network 列表中找到 `/api/auth/login` 请求
   - 点击查看响应内容

4. **检查响应结构**
   响应应该包含：
   ```json
   {
     "success": true,
     "data": {
       "user": { ... },
       "tokens": {
         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
         "expiresIn": 604800
       }
     }
   }
   ```

5. **如果 tokens 结构不正确**
   - 这是后端问题，需要检查后端代码
   - 确保后端 `generateTokens()` 函数正常工作

---

## 技术细节

### Token 存储结构

LocalStorage 中的 `auth-storage` 键应该包含：

```json
{
  "state": {
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "role": "..."
    },
    "token": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 604800
    },
    "isAuthenticated": true,
    "isLoading": false
  },
  "version": 0
}
```

### API 拦截器逻辑

```typescript
// 从 auth store 获取 token
const token = useAuthStore.getState().token;

// 检查 token 和 accessToken 是否存在
if (token?.accessToken) {
  // 设置 Authorization 头
  config.headers.Authorization = `Bearer ${token.accessToken}`;
}
```

### 为什么会出现 null？

可能的原因：
1. **登录响应异常**：后端返回的 tokens 对象不完整
2. **LocalStorage 损坏**：浏览器存储被意外修改
3. **Token 过期处理**：刷新 token 失败后未正确清理
4. **并发问题**：多个标签页同时操作导致状态不一致

---

## 已添加的调试功能

### 1. 组件级别检查
在 `FollowUpAnalytics.tsx` 中，请求前会检查：
- 是否已认证
- Token 是否存在
- accessToken 是否有效

如果检查失败，会直接显示错误而不发送请求。

### 2. API 拦截器日志
在 `api.ts` 中，每次请求都会记录：
- 完整的认证状态
- Token 结构
- accessToken 预览

### 3. 诊断工具
`check-localstorage.html` 提供可视化的诊断界面。

---

## 下一步

1. **立即操作**：
   - 刷新浏览器页面（F5）
   - 打开控制台查看日志
   - 截图发送日志内容

2. **如果日志显示 accessToken 为 null**：
   - 清除 LocalStorage
   - 重新登录
   - 再次测试

3. **如果问题仍然存在**：
   - 使用诊断工具检查 LocalStorage
   - 检查登录响应的 Network 请求
   - 提供完整的日志和截图

---

## 文件修改记录

### 修改的文件：
1. `packages/frontend/src/services/api.ts`
   - 增强了 API 拦截器的调试日志
   - 添加了详细的 token 状态检查

2. `packages/frontend/src/components/charts/FollowUpAnalytics.tsx`
   - 添加了请求前的认证状态检查
   - 增强了错误日志

3. `check-localstorage.html` (新文件)
   - 可视化诊断工具
   - 可以查看和清除 LocalStorage

### 服务状态：
- ✅ 后端服务运行中 (Process ID: 7)
- ✅ 前端服务运行中 (Process ID: 16)
- ✅ API 路由已正确配置
- ✅ 后端服务功能正常（返回 401 是因为 token 为 null）

---

## 预期结果

修复后，控制台应该显示：

```
[FollowUpAnalytics] Auth state check: {
  isAuthenticated: true,
  hasUser: true,
  hasToken: true,
  tokenDetails: {
    hasAccessToken: true,
    hasRefreshToken: true,
    accessTokenPreview: "eyJhbGciOiJIUzI1NiIsI..."
  }
}

[API Interceptor] Full auth state: {
  isAuthenticated: true,
  hasUser: true,
  hasToken: true,
  tokenStructure: {
    hasAccessToken: true,
    hasRefreshToken: true,
    accessTokenPreview: "eyJhbGciOiJIUzI1NiIsI..."
  }
}

[API Interceptor] ✅ Authorization header set successfully

[FollowUpAnalytics] 收到响应: { success: true, data: {...} }
```

页面应该正常显示跟进分析数据。
