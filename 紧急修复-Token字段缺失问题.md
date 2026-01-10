# 紧急修复 - Token字段缺失问题

## 🔴 问题根源

### 发现的问题

页面显示多个 "试图获取数据失败" 错误，所有Dashboard API返回400错误：

```json
{
  "success": false,
  "error": {
    "code": "NO_FACTORY",
    "message": "用户未关联工厂"
  }
}
```

### 根本原因

**旧的JWT Token缺少 `factoryId` 字段！**

#### Token结构对比

**旧Token (当前使用的)**:
```json
{
  "userId": "d59d05d8-4065-4bb6-90e6-7194c1ca9640",
  "email": "pinpai001@gmail.com",
  "role": "BRAND",
  "iat": 1768030133,
  "exp": 1768634933
  // ❌ 缺少 factoryId 字段！
}
```

**新Token (应该有的)**:
```json
{
  "userId": "d59d05d8-4065-4bb6-90e6-7194c1ca9640",
  "email": "pinpai001@gmail.com",
  "role": "BRAND",
  "factoryId": "xxx-xxx-xxx",  // ✅ 包含 factoryId
  "iat": 1768030133,
  "exp": 1768634933
}
```

#### 为什么会这样？

1. **代码已更新** - `auth.service.ts` 中的 `generateTokens` 函数已经包含了 `factoryId`
2. **Token未更新** - 用户使用的是旧token，在代码更新之前生成的
3. **后端依赖factoryId** - 所有Dashboard API都需要 `req.user.factoryId`

## ✅ 解决方案

### 方案1: 重新登录 (推荐)

**步骤**:
1. 退出登录
2. 清除浏览器缓存和LocalStorage
3. 重新登录

**操作**:
```
1. 打开 http://localhost:5173/
2. 点击右上角用户头像 → 退出登录
3. 按 F12 打开开发者工具
4. 切换到 Application 标签
5. 左侧选择 Local Storage → http://localhost:5173
6. 删除所有存储项
7. 刷新页面
8. 重新登录
```

### 方案2: 使用清除脚本

创建一个HTML文件来清除token：

```html
<!DOCTYPE html>
<html>
<head>
  <title>清除Token</title>
</head>
<body>
  <h1>清除旧Token</h1>
  <button onclick="clearToken()">点击清除</button>
  <div id="result"></div>
  
  <script>
    function clearToken() {
      // 清除所有localStorage
      localStorage.clear();
      
      // 清除所有sessionStorage
      sessionStorage.clear();
      
      // 清除所有cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      document.getElementById('result').innerHTML = '<p style="color: green;">✅ Token已清除！请刷新页面并重新登录。</p>';
      
      // 3秒后自动跳转到登录页
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  </script>
</body>
</html>
```

## 🔍 技术细节

### Token生成代码 (已修复)

**文件**: `packages/backend/src/services/auth.service.ts`

```typescript
function generateTokens(user: UserWithoutPassword): AuthToken {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    factoryId: user.factoryId || undefined,  // ✅ 已包含
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseExpiresIn(JWT_EXPIRES_IN),
  });

  // ...
}
```

### API验证代码

**文件**: `packages/backend/src/routes/report.routes.ts`

```typescript
router.get('/dashboard/pipeline-funnel', async (req, res) => {
  const factoryId = req.user!.factoryId;  // 这里需要factoryId
  
  if (!factoryId) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
    });
    return;
  }
  
  // ...
});
```

## 📊 影响范围

### 受影响的API

所有需要 `factoryId` 的API都会失败：

- ❌ `/api/reports/dashboard` - Dashboard主数据
- ❌ `/api/reports/dashboard/trends` - 趋势数据
- ❌ `/api/reports/dashboard/roi-analysis` - ROI分析
- ❌ `/api/reports/dashboard/pipeline-funnel` - 管道漏斗
- ❌ `/api/reports/dashboard/daily-summary` - 每日摘要
- ❌ `/api/reports/staff-performance` - 商务绩效
- ❌ 其他所有工厂相关的API

### 受影响的页面

- ❌ Dashboard (工作台)
- ❌ Pipeline (合作管道)
- ❌ Influencers (达人管理)
- ❌ Samples (样品管理)
- ❌ Reports (报表)
- ❌ Team (团队管理)

**基本上所有页面都无法正常工作！**

## 🛠️ 预防措施

### 1. Token版本控制

在Token中添加版本号：

```typescript
const payload: TokenPayload = {
  version: 2,  // Token版本
  userId: user.id,
  email: user.email,
  role: user.role,
  factoryId: user.factoryId,
};
```

### 2. 自动Token刷新

当检测到Token缺少必要字段时，自动触发刷新：

```typescript
// 前端代码
if (user && !user.factoryId && user.role !== 'PLATFORM_ADMIN') {
  // 自动刷新token
  await refreshToken();
}
```

### 3. 后端兼容性处理

在后端添加兼容性代码：

```typescript
router.get('/dashboard', async (req, res) => {
  let factoryId = req.user!.factoryId;
  
  // 如果token中没有factoryId，从数据库查询
  if (!factoryId && req.user!.role === 'BRAND') {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { factoryId: true }
    });
    factoryId = user?.factoryId;
  }
  
  if (!factoryId) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_FACTORY', message: '用户未关联工厂' },
    });
  }
  
  // ...
});
```

## 📝 测试验证

### 测试步骤

1. **清除旧Token**
   ```bash
   # 打开浏览器开发者工具
   # Application → Local Storage → 清除所有
   ```

2. **重新登录**
   ```
   邮箱: pinpai001@gmail.com
   密码: (你的密码)
   ```

3. **验证新Token**
   ```bash
   # 在开发者工具 Console 中执行
   const token = localStorage.getItem('auth-storage');
   const parsed = JSON.parse(token);
   console.log('Token payload:', parsed.state.token);
   ```

4. **测试API**
   ```bash
   node test-dashboard-apis.js
   ```

### 预期结果

所有API应该返回 200 状态码和正确的数据：

```json
{
  "success": true,
  "data": {
    // 正确的数据
  }
}
```

## 🎯 立即行动

### 用户需要做的

1. **退出登录**
2. **清除浏览器缓存**
3. **重新登录**

### 开发者需要做的

1. ✅ 确认Token生成代码包含factoryId (已完成)
2. ⚠️ 考虑添加后端兼容性处理
3. ⚠️ 考虑添加Token版本控制
4. ⚠️ 添加前端自动刷新机制

## 📚 相关文档

- [快速启动指南-2026-01-10.md](./快速启动指南-2026-01-10.md)
- [问题诊断与修复总结-2026-01-10.md](./问题诊断与修复总结-2026-01-10.md)

---

**修复时间**: 2026-01-10 16:00

**严重程度**: 🔴 高 - 影响所有功能

**修复方式**: 重新登录获取新Token

**预计修复时间**: 2分钟
