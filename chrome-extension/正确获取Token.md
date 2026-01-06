# ✅ 正确获取 Token 的方法

## 🔍 问题原因

您之前运行 `localStorage.getItem('token')` 返回 null 是因为：

**Zilo 系统使用 zustand 的 persist 中间件，Token 保存在 `auth-storage` 这个 key 下，而不是直接保存为 `token`！**

---

## 🎯 正确的获取方法

### 方法 1：直接获取 accessToken（推荐）

在 Zilo 系统页面的控制台运行：

```javascript
// 获取完整的 auth 数据
const authData = JSON.parse(localStorage.getItem('auth-storage'));
const token = authData?.state?.token?.accessToken;

console.log('=== Token 信息 ===');
console.log('Token:', token);
console.log('Token 长度:', token ? token.length : 0);

// 自动复制到剪贴板
if (token) {
  copy(token);
  console.log('✅ Token 已复制到剪贴板！');
} else {
  console.log('❌ Token 为空，请先登录！');
}
```

### 方法 2：查看完整的认证数据

如果想查看完整的认证信息：

```javascript
const authData = JSON.parse(localStorage.getItem('auth-storage'));
console.log('完整认证数据:', authData);
console.log('用户信息:', authData?.state?.user);
console.log('Token 信息:', authData?.state?.token);
```

---

## 📝 操作步骤

### 1. 确保已登录

访问 http://localhost:5173，使用工厂老板账号登录：
```
邮箱：owner@demo.com
密码：owner123
```

### 2. 打开控制台

按 **F12** 打开开发者工具，切换到 **Console** 标签

### 3. 运行脚本

复制粘贴上面的"方法 1"脚本并回车

### 4. 看到结果

如果成功，您会看到：
```
=== Token 信息 ===
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Token 长度: 200+
✅ Token 已复制到剪贴板！
```

### 5. 配置插件

1. 打开 `chrome://extensions/`
2. 找到 "Zilo 达人采集助手"
3. 点击插件图标
4. 粘贴 Token（Ctrl+V）
5. 点击"保存配置"

---

## 🧪 验证 Token 是否有效

```javascript
const authData = JSON.parse(localStorage.getItem('auth-storage'));
const token = authData?.state?.token?.accessToken;
const apiUrl = 'http://localhost:3000/api';

if (!token) {
  console.log('❌ Token 为空，请先登录！');
} else {
  fetch(`${apiUrl}/influencers?page=1&pageSize=1`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Token 有效！');
      console.log('API 响应:', data);
    } else {
      console.log('❌ Token 无效:', data.error);
    }
  })
  .catch(err => console.error('❌ 请求失败:', err));
}
```

---

## ⚠️ 重要提示

1. **不要使用** `localStorage.getItem('token')` - 这个 key 不存在
2. **正确使用** `localStorage.getItem('auth-storage')` 然后解析 JSON
3. Token 在 `authData.state.token.accessToken` 路径下

---

## 🎉 下一步

获取 Token 后：
1. 配置到插件中
2. 访问抖音精选联盟达人详情页
3. 点击"添加到 Zilo"按钮测试

如果还有问题，请告诉我！
