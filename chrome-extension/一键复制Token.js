// 🎯 一键复制 Token 到剪贴板
// 在前端页面（http://localhost:5173）的控制台运行

(function() {
  try {
    // 1. 从 localStorage 获取认证信息
    const authStorage = localStorage.getItem('auth-storage');
    
    if (!authStorage) {
      console.error('❌ 未找到登录信息，请先登录！');
      return;
    }
    
    const authData = JSON.parse(authStorage);
    
    if (!authData || !authData.state || !authData.state.token) {
      console.error('❌ 登录信息格式错误！');
      return;
    }
    
    const token = authData.state.token.accessToken;
    const user = authData.state.user;
    
    // 2. 显示当前用户信息
    console.log('✅ 当前登录用户:');
    console.log('   姓名:', user.name);
    console.log('   邮箱:', user.email);
    console.log('   角色:', user.role);
    console.log('   工厂:', user.factoryName || '无');
    console.log('');
    
    // 3. 复制 Token 到剪贴板
    navigator.clipboard.writeText(token).then(() => {
      console.log('✅ Token 已复制到剪贴板！');
      console.log('');
      console.log('📋 下一步操作：');
      console.log('   1. 点击 Chrome 插件图标');
      console.log('   2. 点击"设置"按钮（齿轮图标）');
      console.log('   3. 在"登录令牌"输入框中粘贴（Ctrl+V）');
      console.log('   4. 点击"保存"按钮');
      console.log('   5. 开始采集达人信息！');
      console.log('');
      console.log('🎉 完成！现在采集的数据会添加到', user.name, '的账号下');
    }).catch(err => {
      console.error('❌ 复制失败:', err);
      console.log('');
      console.log('📋 请手动复制以下 Token:');
      console.log(token);
    });
    
  } catch (error) {
    console.error('❌ 获取 Token 失败:', error);
  }
})();
