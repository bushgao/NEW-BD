// 调试认证问题
const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:3000/api';

async function debugAuth() {
  console.log('🔍 调试认证问题\n');

  try {
    // 1. 登录
    console.log('1️⃣ 登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });

    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data?.tokens?.accessToken;
    
    if (!token) {
      console.log('❌ 未获取到token');
      console.log('完整响应:', loginResponse.data);
      return;
    }
    
    console.log('✅ 登录成功');
    console.log('Token:', token.substring(0, 50) + '...');

    // 2. 解码token查看payload
    console.log('\n2️⃣ 解码token...');
    const decoded = jwt.decode(token);
    console.log('Token Payload:', JSON.stringify(decoded, null, 2));

    // 3. 测试API调用
    console.log('\n3️⃣ 测试API调用...');
    try {
      const response = await axios.get(`${API_BASE}/platform/influencers`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: 1,
          limit: 10,
        },
      });
      console.log('✅ API调用成功');
      console.log('响应:', response.data);
    } catch (error) {
      console.log('❌ API调用失败');
      console.log('状态码:', error.response?.status);
      console.log('错误信息:', error.response?.data);
      console.log('请求头:', error.config?.headers);
    }

    // 4. 测试其他平台API
    console.log('\n4️⃣ 测试其他平台API（工厂列表）...');
    try {
      const response = await axios.get(`${API_BASE}/platform/factories`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ 工厂列表API调用成功');
      console.log('工厂数量:', response.data.data?.factories?.length || 0);
    } catch (error) {
      console.log('❌ 工厂列表API调用失败');
      console.log('状态码:', error.response?.status);
      console.log('错误信息:', error.response?.data);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

debugAuth()
  .then(() => {
    console.log('\n✅ 调试完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 调试失败:', error);
    process.exit(1);
  });
