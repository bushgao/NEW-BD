const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testUserAPIStructure() {
  try {
    console.log('=== 测试用户API数据结构 ===\n');

    // 1. 登录
    console.log('1. 登录...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.tokens.accessToken;
    console.log('✓ 登录成功\n');

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. 获取用户列表并查看数据结构
    console.log('2. 获取用户列表...');
    const usersRes = await axios.get(`${BASE_URL}/platform/users`, {
      params: { page: 1, pageSize: 10 },
      ...config
    });

    console.log('完整响应结构:');
    console.log(JSON.stringify(usersRes.data, null, 2));

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testUserAPIStructure();
