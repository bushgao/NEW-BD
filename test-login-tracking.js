/**
 * 测试登录时间追踪
 * 
 * 测试步骤：
 * 1. 使用测试账号登录
 * 2. 检查 lastLoginAt 字段是否更新
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testLoginTracking() {
  console.log('=== 测试登录时间追踪 ===\n');

  try {
    // 1. 登录测试账号
    console.log('1. 登录测试账号...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'staff@demo.com',
      password: 'staff123',
    });

    if (!loginResponse.data.success) {
      console.error('❌ 登录失败:', loginResponse.data.error);
      return;
    }

    console.log('✅ 登录成功');
    const token = loginResponse.data.data.tokens.accessToken;
    const user = loginResponse.data.data.user;
    
    console.log('\n用户信息:');
    console.log('- ID:', user.id);
    console.log('- 姓名:', user.name);
    console.log('- 邮箱:', user.email);

    // 2. 获取当前用户信息（包含 lastLoginAt）
    console.log('\n2. 获取用户详情...');
    const userResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.data.success) {
      console.error('❌ 获取用户信息失败:', userResponse.data.error);
      return;
    }

    const currentUser = userResponse.data.data.user;
    console.log('✅ 获取用户信息成功');
    console.log('\n完整用户对象:', JSON.stringify(currentUser, null, 2));
    console.log('\n最后登录时间:', currentUser.lastLoginAt || '未记录');

    // 3. 等待2秒后再次登录
    console.log('\n3. 等待2秒后再次登录...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const secondLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'staff@demo.com',
      password: 'staff123',
    });

    if (!secondLoginResponse.data.success) {
      console.error('❌ 第二次登录失败:', secondLoginResponse.data.error);
      return;
    }

    console.log('✅ 第二次登录成功');
    const newToken = secondLoginResponse.data.data.tokens.accessToken;

    // 4. 再次获取用户信息
    console.log('\n4. 获取更新后的用户信息...');
    const updatedUserResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });

    if (!updatedUserResponse.data.success) {
      console.error('❌ 获取更新后的用户信息失败:', updatedUserResponse.data.error);
      return;
    }

    const updatedUser = updatedUserResponse.data.data.user;
    console.log('✅ 获取更新后的用户信息成功');
    console.log('\n完整用户对象:', JSON.stringify(updatedUser, null, 2));
    console.log('\n更新后的最后登录时间:', updatedUser.lastLoginAt || '未记录');

    // 5. 比较两次登录时间
    if (currentUser.lastLoginAt && updatedUser.lastLoginAt) {
      const firstLogin = new Date(currentUser.lastLoginAt);
      const secondLogin = new Date(updatedUser.lastLoginAt);
      const diff = secondLogin - firstLogin;
      
      console.log('\n时间差:', Math.round(diff / 1000), '秒');
      
      if (diff > 0) {
        console.log('\n✅ 登录时间追踪正常工作！');
      } else {
        console.log('\n⚠️ 登录时间未更新');
      }
    } else {
      console.log('\n⚠️ lastLoginAt 字段为空');
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testLoginTracking();
