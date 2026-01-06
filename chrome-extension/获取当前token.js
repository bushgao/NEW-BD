// 在前端页面（localhost:5173）控制台运行此脚本，获取当前登录用户的 token

console.clear();
console.log('%c📋 获取当前登录用户的 Token', 'font-size: 20px; color: #1890ff; font-weight: bold');
console.log('');

try {
  const authStorage = localStorage.getItem('auth-storage');
  
  if (!authStorage) {
    console.log('%c❌ 未找到登录信息', 'color: #ff4d4f; font-size: 16px; font-weight: bold');
    console.log('');
    console.log('请先登录系统！');
    throw new Error('未登录');
  }
  
  const authData = JSON.parse(authStorage);
  
  if (!authData || !authData.state || !authData.state.token) {
    console.log('%c❌ Token 不存在', 'color: #ff4d4f; font-size: 16px; font-weight: bold');
    throw new Error('Token 不存在');
  }
  
  const token = authData.state.token.accessToken;
  const user = authData.state.user;
  
  console.log('%c✅ 成功获取 Token', 'color: #52c41a; font-size: 18px; font-weight: bold');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('%c👤 当前登录用户', 'font-size: 16px; color: #1890ff; font-weight: bold');
  console.log('用户名:', user.name);
  console.log('邮箱:', user.email);
  console.log('角色:', user.role);
  console.log('');
  console.log('%c🔑 Token 信息', 'font-size: 16px; color: #1890ff; font-weight: bold');
  console.log('Token:', token);
  console.log('Token 长度:', token.length);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('%c📝 使用方法', 'font-size: 16px; color: #faad14; font-weight: bold');
  console.log('1. 复制上面的 Token');
  console.log('2. 打开 Chrome 插件');
  console.log('3. 点击"设置"按钮');
  console.log('4. 粘贴 Token 到"登录令牌"输入框');
  console.log('5. 点击"保存"');
  console.log('');
  console.log('%c💡 提示', 'font-size: 14px; color: #1890ff');
  console.log('每次切换账号后，需要重新获取并更新插件的 Token');
  
  // 自动复制到剪贴板
  navigator.clipboard.writeText(token).then(() => {
    console.log('');
    console.log('%c✅ Token 已自动复制到剪贴板！', 'color: #52c41a; font-size: 16px; font-weight: bold');
    console.log('现在可以直接粘贴到插件设置中');
  }).catch(() => {
    console.log('');
    console.log('%c⚠️  自动复制失败，请手动复制上面的 Token', 'color: #faad14; font-size: 14px');
  });
  
} catch (error) {
  console.error('获取 Token 失败:', error);
}
