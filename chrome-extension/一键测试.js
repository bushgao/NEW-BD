// 🔍 一键测试脚本 - 在 Zilo 系统控制台运行

(async function() {
  console.log('='.repeat(50));
  console.log('🔍 Zilo 插件 Token 诊断');
  console.log('='.repeat(50));
  
  // 1. 检查 Token
  const token = localStorage.getItem('token');
  console.log('\n📋 步骤 1: 检查 Token');
  console.log('Token 存在:', token ? '✅ 是' : '❌ 否');
  console.log('Token 长度:', token ? token.length : 0);
  
  if (!token) {
    console.log('\n❌ 问题：Token 为空');
    console.log('💡 解决方案：');
    console.log('   1. 请先登录系统（owner@demo.com / owner123）');
    console.log('   2. 登录成功后重新运行此脚本');
    return;
  }
  
  console.log('Token 前 30 字符:', token.substring(0, 30) + '...');
  
  // 2. 解析 Token
  console.log('\n📋 步骤 2: 解析 Token');
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token 格式错误');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('✅ Token 解析成功');
    console.log('用户信息:');
    console.log('  - 用户 ID:', payload.userId);
    console.log('  - 邮箱:', payload.email);
    console.log('  - 角色:', payload.role);
    console.log('  - 工厂 ID:', payload.factoryId || '无');
    
    // 检查角色
    if (payload.role !== 'FACTORY_OWNER' && payload.role !== 'BUSINESS_STAFF') {
      console.log('\n⚠️  警告：当前角色无权限添加达人');
      console.log('   需要角色：FACTORY_OWNER 或 BUSINESS_STAFF');
      console.log('   当前角色:', payload.role);
    }
  } catch (error) {
    console.log('❌ Token 解析失败:', error.message);
    return;
  }
  
  // 3. 测试 API
  console.log('\n📋 步骤 3: 测试 API 连接');
  const apiUrl = 'http://localhost:3000/api';
  
  try {
    const response = await fetch(`${apiUrl}/influencers?page=1&pageSize=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API 连接成功');
      console.log('响应状态:', response.status);
      console.log('达人总数:', data.data?.total || 0);
    } else {
      console.log('❌ API 请求失败');
      console.log('状态码:', response.status);
      console.log('错误信息:', data.error?.message || JSON.stringify(data));
    }
  } catch (error) {
    console.log('❌ API 连接失败:', error.message);
    console.log('💡 请确保后端服务正在运行：http://localhost:3000');
    return;
  }
  
  // 4. 配置插件
  console.log('\n📋 步骤 4: 配置插件');
  console.log('请按以下步骤操作：');
  console.log('1. 打开 chrome://extensions/');
  console.log('2. 找到 "Zilo 达人采集助手"');
  console.log('3. 点击插件图标，在弹出窗口中：');
  console.log('   - API 地址: http://localhost:3000/api');
  console.log('   - Token: 运行下面的命令复制');
  console.log('4. 点击"保存配置"');
  
  console.log('\n📋 复制 Token 到剪贴板：');
  console.log('运行以下命令：');
  console.log('copy(localStorage.getItem("token"))');
  
  // 自动复制
  try {
    copy(token);
    console.log('✅ Token 已自动复制到剪贴板！');
    console.log('   现在可以直接粘贴到插件配置中');
  } catch (error) {
    console.log('⚠️  自动复制失败，请手动运行：copy(localStorage.getItem("token"))');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ 诊断完成！');
  console.log('='.repeat(50));
  
})();
