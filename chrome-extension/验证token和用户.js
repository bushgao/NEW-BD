// 🔍 验证 Token 和用户信息
// 在前端页面（localhost:5173）控制台运行

(async function() {
  console.log('='.repeat(60));
  console.log('🔍 开始验证 Token 和用户信息');
  console.log('='.repeat(60));
  
  try {
    // 1. 检查 localStorage
    console.log('\n📦 步骤1：检查 localStorage');
    const authStorage = localStorage.getItem('auth-storage');
    
    if (!authStorage) {
      console.error('❌ 未找到 auth-storage，请先登录！');
      return;
    }
    
    const authData = JSON.parse(authStorage);
    const token = authData.state.token.accessToken;
    const user = authData.state.user;
    
    console.log('✅ localStorage 数据正常');
    console.log('   用户ID:', user.id);
    console.log('   用户名:', user.name);
    console.log('   邮箱:', user.email);
    console.log('   角色:', user.role);
    console.log('   工厂ID:', user.factoryId);
    console.log('   Token (前20字符):', token.substring(0, 20) + '...');
    
    // 2. 验证 Token 是否有效
    console.log('\n🔐 步骤2：验证 Token 是否有效');
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Token 验证失败！');
      console.error('   状态码:', response.status);
      const error = await response.json();
      console.error('   错误信息:', error);
      return;
    }
    
    const currentUser = await response.json();
    console.log('✅ Token 验证成功！');
    console.log('   后端返回用户:', currentUser.name);
    console.log('   后端返回邮箱:', currentUser.email);
    console.log('   后端返回角色:', currentUser.role);
    
    // 3. 检查插件配置
    console.log('\n🔌 步骤3：检查 Chrome 插件配置');
    
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('⚠️  无法访问 Chrome Storage（可能不在插件环境中）');
      console.log('   请在达人详情页的控制台运行此脚本');
    } else {
      chrome.storage.sync.get(['token', 'apiUrl'], (result) => {
        console.log('   插件配置的 API:', result.apiUrl || '未配置');
        
        if (result.token) {
          console.log('   插件配置的 Token (前20字符):', result.token.substring(0, 20) + '...');
          
          // 比较 Token
          if (result.token === token) {
            console.log('✅ 插件 Token 与当前登录用户一致！');
          } else {
            console.error('❌ 插件 Token 与当前登录用户不一致！');
            console.error('   这就是为什么数据会进入错误账号的原因！');
            console.log('\n💡 解决方案：');
            console.log('   1. 复制当前 Token（已自动复制到剪贴板）');
            console.log('   2. 打开插件设置');
            console.log('   3. 粘贴新 Token');
            console.log('   4. 保存');
            
            // 自动复制正确的 Token
            navigator.clipboard.writeText(token);
          }
        } else {
          console.warn('⚠️  插件未配置 Token');
          console.log('   Token 已复制到剪贴板，请粘贴到插件设置中');
          navigator.clipboard.writeText(token);
        }
      });
    }
    
    // 4. 测试采集 API
    console.log('\n🧪 步骤4：测试采集 API');
    const testData = {
      nickname: '测试达人_' + Date.now(),
      platform: 'DOUYIN',
      platformId: 'test_' + Date.now(),
      followers: '10000',
      categories: ['测试'],
      tags: ['测试标签'],
      notes: '这是一个测试采集'
    };
    
    console.log('   发送测试请求...');
    const testResponse = await fetch('http://localhost:3000/api/influencers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ 测试采集成功！');
      console.log('   达人ID:', result.data.id);
      console.log('   达人昵称:', result.data.nickname);
      console.log('   所属工厂:', result.data.factoryId);
      console.log('   创建者:', result.data.createdBy);
      
      // 验证是否添加到正确的账号
      if (result.data.factoryId === user.factoryId) {
        console.log('✅ 数据已添加到正确的工厂！');
      } else {
        console.error('❌ 数据添加到了错误的工厂！');
        console.error('   期望工厂ID:', user.factoryId);
        console.error('   实际工厂ID:', result.data.factoryId);
      }
    } else {
      console.error('❌ 测试采集失败！');
      const error = await testResponse.json();
      console.error('   错误信息:', error);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ 验证完成！');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error);
  }
})();
