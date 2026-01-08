// 调试 token 问题
const axios = require('axios');

async function debugToken() {
  console.log('=== 调试 Token 问题 ===\n');

  let token, user;

  // 1. 登录
  console.log('1. 尝试登录...');
  
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'owner@demo.com',
      password: 'password123'
    });

    if (loginRes.data.success) {
      token = loginRes.data.data.token.accessToken;
      user = loginRes.data.data.user;
      console.log('✅ 登录成功');
      console.log(`用户: ${user.name} (${user.email})`);
      console.log(`角色: ${user.role}`);
      console.log(`Token: ${token.substring(0, 30)}...`);
    } else {
      console.log('❌ 登录失败');
      return;
    }
  } catch (err) {
    console.log('❌ 登录失败:', err.response?.data || err.message);
    return;
  }
  // 2. 测试通知接口（已知可以工作）
  console.log('\n2. 测试通知接口...');
  try {
    const notifRes = await axios.get('http://localhost:3000/api/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 通知接口成功:', notifRes.data);
  } catch (err) {
    console.log('❌ 通知接口失败:', err.response?.status, err.response?.data);
  }

  // 3. 测试跟进分析接口
  console.log('\n3. 测试跟进分析接口...');
  try {
    const analyticsRes = await axios.get('http://localhost:3000/api/collaborations/follow-up-analytics', {
      params: { period: 'month' },
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ 跟进分析接口成功');
    console.log('数据:', JSON.stringify(analyticsRes.data, null, 2));
  } catch (err) {
    console.log('❌ 跟进分析接口失败');
    console.log('状态码:', err.response?.status);
    console.log('错误:', JSON.stringify(err.response?.data, null, 2));
    console.log('\n请求头:', err.config?.headers);
  }
}

debugToken().catch(console.error);
