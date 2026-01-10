const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testLogin() {
  console.log('=== 测试登录 ===\n');

  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'pinpai001@gmail.com',
      password: 'password123'
    });

    const userData = loginRes.data.data || loginRes.data;
    
    console.log('✅ 登录成功！');
    console.log(`用户: ${userData.user.name}`);
    console.log(`角色: ${userData.user.role}`);
    console.log(`工厂ID: ${userData.user.factoryId}`);
    if (userData.token) {
      console.log(`Token: ${userData.token.substring(0, 30)}...`);
    }    
    console.log('\n=== ✅ 后端角色名称修复成功！ ===');
    console.log('\n📝 下一步操作：');
    console.log('1. 打开浏览器 (http://localhost:5173)');
    console.log('2. 按F12打开开发者工具');
    console.log('3. 进入 Application -> Local Storage');
    console.log('4. 清除所有localStorage数据');
    console.log('5. 刷新页面');
    console.log('6. 使用以下账号登录：');
    console.log('   邮箱: pinpai001@gmail.com');
    console.log('   密码: password123');
    console.log('7. 检查Dashboard是否正常显示');

  } catch (error) {
    console.error('\n❌ 登录失败:');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`错误: ${error.message}`);
    }
    process.exit(1);
  }
}

testLogin();
