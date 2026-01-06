# 🎯 超简单 - 更新插件 Token

## 问题
插件还在使用张老板的 Token，所以数据会进入张老板账号。

## 解决方案（3步，10秒完成）

### 步骤1：复制 Token（3秒）

在前端页面（localhost:5173）按 F12，粘贴这段代码：

```javascript
navigator.clipboard.writeText(JSON.parse(localStorage.getItem('auth-storage')).state.token.accessToken);console.log('✅ Token已复制！');
```

看到"✅ Token已复制！"就成功了。

### 步骤2：打开插件设置（2秒）

1. 点击 Chrome 工具栏的插件图标（Zilo图标）
2. 点击"设置"按钮（齿轮图标⚙️）

### 步骤3：粘贴并保存（5秒）

1. 在"登录令牌"输入框中按 **Ctrl+V** 粘贴
2. 点击"保存"按钮
3. 看到"配置已保存"提示

## 完成！

现在采集的数据会进入测试002账号了！

---

**测试方法：**
1. 打开达人详情页
2. 点击"添加到 Zilo"按钮
3. 回到前端查看达人列表
4. 应该能看到新采集的达人 ✅
