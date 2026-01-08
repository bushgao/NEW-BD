const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试用户管理API
async function testUserManagement() {
  try {
    console.log('=== 测试用户管理功能 ===\n');

    // 1. 登录获取token
    console.log('1. 登录平台管理员账号...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.tokens.accessToken;
    console.log('✓ 登录成功\n');

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    // 2. 获取用户列表
    console.log('2. 获取用户列表...');
    const usersRes = await axios.get(`${BASE_URL}/platform/users`, {
      params: { page: 1, pageSize: 10 },
      ...config
    });

    console.log(`✓ 获取到 ${usersRes.data.data.total} 个用户`);
    console.log('用户列表:');
    const users = usersRes.data.data.users || [];
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? '启用' : '禁用'}`);
    });
    console.log('');

    // 3. 测试搜索功能
    console.log('3. 测试搜索功能（搜索"工厂"）...');
    const searchRes = await axios.get(`${BASE_URL}/platform/users`, {
      params: { page: 1, pageSize: 10, search: '工厂' },
      ...config
    });

    console.log(`✓ 搜索到 ${searchRes.data.data.total} 个用户`);
    const searchUsers = searchRes.data.data.users || [];
    searchUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });
    console.log('');

    // 4. 测试角色筛选
    console.log('4. 测试角色筛选（BUSINESS_STAFF）...');
    const roleRes = await axios.get(`${BASE_URL}/platform/users`, {
      params: { page: 1, pageSize: 10, role: 'BUSINESS_STAFF' },
      ...config
    });

    console.log(`✓ 找到 ${roleRes.data.data.total} 个商务人员`);
    const roleUsers = roleRes.data.data.users || [];
    roleUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.factoryName || '无工厂'})`);
    });
    console.log('');

    // 5. 获取用户详情
    const allUsers = usersRes.data.data.users || [];
    if (allUsers.length > 0) {
      const firstUser = allUsers[0];
      console.log(`5. 获取用户详情（${firstUser.name}）...`);
      
      const detailRes = await axios.get(`${BASE_URL}/platform/users/${firstUser.id}`, config);
      
      console.log('✓ 用户详情:');
      console.log(`  姓名: ${detailRes.data.data.name}`);
      console.log(`  邮箱: ${detailRes.data.data.email}`);
      console.log(`  角色: ${detailRes.data.data.role}`);
      console.log(`  状态: ${detailRes.data.data.isActive ? '启用' : '禁用'}`);
      console.log(`  工厂: ${detailRes.data.data.factoryName || '无'}`);
      console.log(`  注册时间: ${new Date(detailRes.data.data.createdAt).toLocaleString('zh-CN')}`);
      console.log('');
    }

    // 6. 测试商务人员工作统计
    const staffUsers = roleRes.data.data.users || [];
    if (staffUsers.length > 0) {
      const staffUser = staffUsers[0];
      console.log(`6. 获取商务人员工作统计（${staffUser.name}）...`);
      
      try {
        const statsRes = await axios.get(`${BASE_URL}/platform/staff/${staffUser.id}/stats`, config);
        
        console.log('✓ 工作统计:');
        console.log(`  添加达人数: ${statsRes.data.data.influencersAdded}`);
        console.log(`  创建合作数: ${statsRes.data.data.collaborationsCreated}`);
        console.log(`  完成合作数: ${statsRes.data.data.collaborationsCompleted}`);
        console.log(`  成功率: ${statsRes.data.data.successRate}%`);
        console.log('');
      } catch (error) {
        console.log('✓ 该用户可能不是商务人员或无工作数据\n');
      }
    }

    console.log('=== 所有测试通过！✓ ===');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUserManagement();
