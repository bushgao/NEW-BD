# 🔄 自动同步 Token 方案

## 🎯 问题根源

Chrome 插件的 `content.js` 运行在**抖音页面**上，无法访问**前端页面（localhost:5173）**的 localStorage。

这导致：
- ❌ `getTokenFromPage()` 读取的是抖音的 localStorage（没有我们的 token）
- ❌ 插件始终使用配置的 token（张老板的）
- ❌ 切换账号后数据还是进入张老板账号

## ✅ 解决方案：使用 Chrome Storage 同步

### 方案概述

1. **前端页面**：登录后，将 token 保存到 Chrome Storage
2. **Chrome 插件**：从 Chrome Storage 读取最新的 token
3. **自动同步**：前端登录/退出时自动更新 Chrome Storage

### 实现步骤

#### 步骤1：创建前端同步脚本

在前端页面注入一个脚本，监听登录状态变化，自动同步 token 到 Chrome Storage。

文件：`packages/frontend/public/chrome-sync.js`

```javascript
// 监听 localStorage 变化，自动同步 token 到 Chrome Storage
(function() {
  'use strict';
  
  // 检查是否安装了 Zilo Chrome 插件
  function checkExtension() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.sendMessage;
  }
  
  // 同步 token 到 Chrome Storage
  function syncToken() {
    if (!checkExtension()) {
      console.log('[Zilo Sync] Chrome 插件未安装');
      return;
    }
    
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        if (authData && authData.state && authData.state.token) {
          const token = authData.state.token.accessToken;
          const user = authData.state.user;
          
          // 发送消息到 Chrome 插件
          chrome.runtime.sendMessage(
            'YOUR_EXTENSION_ID', // 需要替换为实际的插件 ID
            {
              action: 'syncToken',
              token: token,
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log('[Zilo Sync] 同步失败:', chrome.runtime.lastError.message);
              } else {
                console.log('[Zilo Sync] Token 已同步到插件');
              }
            }
          );
        }
      }
    } catch (error) {
      console.error('[Zilo Sync] 同步失败:', error);
    }
  }
  
  // 监听 storage 事件
  window.addEventListener('storage', (e) => {
    if (e.key === 'auth-storage') {
      console.log('[Zilo Sync] 检测到登录状态变化');
      syncToken();
    }
  });
  
  // 页面加载时同步一次
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncToken);
  } else {
    syncToken();
  }
  
  console.log('[Zilo Sync] 自动同步已启动');
})();
```

#### 步骤2：修改 background.js

添加接收前端同步消息的处理：

```javascript
// 在 background.js 中添加

// 监听来自前端页面的同步消息
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('[Zilo Background] 收到外部消息:', request);
  
  if (request.action === 'syncToken') {
    // 保存 token 到 Chrome Storage
    chrome.storage.sync.set({
      token: request.token,
      currentUser: request.user,
      lastSync: Date.now(),
    }, () => {
      console.log('[Zilo Background] Token 已同步:', request.user.name);
      sendResponse({ success: true });
    });
    return true;
  }
  
  return false;
});
```

#### 步骤3：修改 manifest.json

添加 `externally_connectable` 配置，允许前端页面与插件通信：

```json
{
  "manifest_version": 3,
  "name": "Zilo - 达人采集助手",
  "version": "1.0.0",
  "description": "快速采集抖音达人信息到 Zilo 系统",
  
  "externally_connectable": {
    "matches": [
      "http://localhost:5173/*",
      "https://zilohq.com/*"
    ]
  },
  
  // ... 其他配置
}
```

## 🚫 方案问题

这个方案有一个**致命问题**：

**Chrome 插件的 `externally_connectable` 只能在插件安装时配置，无法动态获取插件 ID。**

这意味着：
- ❌ 前端页面需要知道插件的 ID
- ❌ 每个用户的插件 ID 都不同（开发模式）
- ❌ 需要发布到 Chrome Web Store 才能有固定 ID

## 💡 更简单的方案：手动同步

既然自动同步有技术限制，我们提供一个**一键同步**的方案：

### 方案：在前端页面添加"同步到插件"按钮

1. **前端页面**：添加一个按钮，点击后显示当前 token
2. **用户操作**：复制 token，粘贴到插件设置
3. **插件使用**：使用最新的 token 采集数据

这个方案：
- ✅ 简单可靠
- ✅ 不需要复杂的跨域通信
- ✅ 用户可以清楚知道使用的是哪个账号
- ✅ 10秒内完成切换

## 🎯 推荐方案：优化手动同步体验

### 1. 在前端添加"获取插件 Token"功能

在用户设置页面添加：

```tsx
// 在前端页面添加
<Button onClick={() => {
  const authStorage = localStorage.getItem('auth-storage');
  const authData = JSON.parse(authStorage);
  const token = authData.state.token.accessToken;
  
  // 复制到剪贴板
  navigator.clipboard.writeText(token);
  
  // 显示提示
  message.success('Token 已复制！请粘贴到 Chrome 插件设置中');
}}>
  📋 复制 Token 到插件
</Button>
```

### 2. 在插件设置中添加"当前用户"显示

修改 popup.html，显示当前使用的是哪个账号的 token：

```html
<div class="current-user">
  <label>当前账号：</label>
  <span id="currentUser">未配置</span>
</div>
```

### 3. 提供快速测试脚本

创建一个脚本，可以快速验证 token 是否正确：

```javascript
// 测试 token 是否有效
async function testToken(token) {
  const response = await fetch('http://localhost:3000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const user = await response.json();
    console.log('✅ Token 有效，当前用户:', user.name);
    return user;
  } else {
    console.log('❌ Token 无效或已过期');
    return null;
  }
}
```

## 📝 总结

由于技术限制，**自动同步方案不可行**。

**推荐使用优化的手动同步方案**：
1. 前端提供"一键复制 Token"按钮
2. 插件显示当前使用的账号
3. 提供快速测试工具

这样用户切换账号时：
1. 点击"复制 Token"（1秒）
2. 打开插件设置（1秒）
3. 粘贴并保存（2秒）

总共只需要 **4秒钟**！

---

**更新时间**: 2026年1月6日
**状态**: ✅ 技术方案已确认
**推荐**: 优化手动同步方案
