# 🔑 获取 Token 并配置插件

## 问题原因

您看到的结果显示 **Token: null**，这说明您当前没有登录或 Token 已过期。这就是为什么插件提示"您没有权限执行此操作"。

---

## ✅ 解决步骤

### 第一步：登录 Zilo 系统

1. 打开新标签页，访问：**http://localhost:5173**
2. 使用工厂老板账号登录：
   ```
   邮箱：owner@demo.com
   密码：owner123
   ```

### 第二步：获取 Token

登录成功后，在 Zilo 系统页面：

1. 按 **F12** 打开开发者工具
2. 切换到 **Console（控制台）** 标签
3. 粘贴以下代码并回车：

```javascript
// 获取 Token
const token = localStorage.getItem('token');
console.log('=== Token 信息 ===');
console.log('Token:', token);
console.log('Token 长度:', token ? token.length : 0);
console.log('Token 前 20 个字符:', token ? token.substring(0, 20) + '...' : 'null');

// 复制到剪贴板
if (token) {
  copy(token);
  console.log('✅ Token 已复制到剪贴板！');
} else {
  console.log('❌ Token 为空，请先登录！');
}
```

4. 如果看到 **"✅ Token 已复制到剪贴板！"**，说明成功了

### 第三步：配置插件

1. 在浏览器地址栏输入：**chrome://extensions/**
2. 找到 **"Zilo 达人采集助手"**
3. 点击插件图标（或右上角的拼图图标 🧩）
4. 在弹出的窗口中：
   - **API 地址**：`http://localhost:3000/api`（默认已填写）
   - **Token**：粘贴刚才复制的 Token（Ctrl+V）
5. 点击 **"保存配置"**

### 第四步：测试插件

1. 访问抖音精选联盟达人详情页（任意达人）
2. 页面上应该会出现 **"添加到 Zilo"** 按钮
3. 点击按钮测试采集功能
4. 如果成功，会显示 **"达人采集成功！"**

---

## 🔍 验证 Token 是否有效

如果想验证 Token 是否有效，在控制台运行：

```javascript
// 测试 Token
const token = localStorage.getItem('token');
const apiUrl = 'http://localhost:3000/api';

fetch(`${apiUrl}/influencers?page=1&pageSize=1`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    console.log('✅ Token 有效！');
    console.log('用户信息:', data);
  } else {
    console.log('❌ Token 无效:', data.error);
  }
})
.catch(err => console.error('❌ 请求失败:', err));
```

---

## ⚠️ 常见问题

### 1. Token 还是 null？
- 确保已经成功登录（页面右上角显示用户名）
- 刷新页面后重试
- 清除浏览器缓存后重新登录

### 2. 插件配置后还是提示没有权限？
- 检查 Token 是否正确粘贴（没有多余空格）
- 在 chrome://extensions/ 页面点击插件的 **"重新加载"** 按钮
- 重新打开抖音精选联盟页面

### 3. 找不到插件图标？
- 点击浏览器右上角的拼图图标 🧩
- 找到 "Zilo 达人采集助手"
- 点击图钉 📌 固定到工具栏

---

## 📞 需要帮助？

如果按照上述步骤操作后仍有问题，请提供：
1. 控制台显示的 Token 长度（不要发送完整 Token）
2. 插件配置截图
3. 点击采集按钮后的错误信息

我会帮您进一步排查！
