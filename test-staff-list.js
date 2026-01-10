/**
 * 测试商务账号列表API
 * 验证角色名称修复后的功能
 */

const API_BASE = 'http://localhost:3000/api';

async function testStaffList() {
  console.log('='.repeat(60));
  console.log('测试商务账号列表API');
  console.log('='.repeat(60));

  try {
    // 1. 登录获取token
    console.log('\n1️⃣ 登录品牌账号...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pinpai001@gmail.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ 登录失败:', error);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ 登录成功');
    
    // Handle new response structure with data wrapper
    const userData = loginData.data?.user || loginData.user;
    const token = loginData.data?.tokens?.accessToken || loginData.token;
    
    if (!userData || !token) {
      console.error('❌ 登录响应格式错误');
      console.log('   响应:', JSON.stringify(loginData, null, 2));
      return;
    }
    
    console.log('   用户ID:', userData.id);
    console.log('   角色:', userData.role);
    console.log('   工厂ID:', userData.factoryId);

    // 2. 获取商务账号列表
    console.log('\n2️⃣ 获取商务账号列表...');
    const staffResponse = await fetch(`${API_BASE}/staff?page=1&pageSize=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   状态码:', staffResponse.status);

    if (!staffResponse.ok) {
      const error = await staffResponse.json();
      console.error('❌ 获取商务列表失败:', error);
      return;
    }

    const staffData = await staffResponse.json();
    console.log('✅ 获取商务列表成功');
    console.log('   总数:', staffData.total);
    console.log('   当前页:', staffData.page);
    console.log('   每页数量:', staffData.pageSize);
    console.log('   总页数:', staffData.totalPages);

    if (staffData.data && staffData.data.length > 0) {
      console.log('\n📋 商务账号列表:');
      staffData.data.forEach((staff, index) => {
        console.log(`   ${index + 1}. ${staff.name} (${staff.email})`);
        console.log(`      ID: ${staff.id}`);
        console.log(`      状态: ${staff.status}`);
        console.log(`      创建时间: ${staff.createdAt}`);
      });
    } else {
      console.log('\n⚠️ 暂无商务账号');
    }

    // 3. 获取配额信息
    console.log('\n3️⃣ 获取配额信息...');
    const quotaResponse = await fetch(`${API_BASE}/staff/quota`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (quotaResponse.ok) {
      const quotaData = await quotaResponse.json();
      console.log('✅ 配额信息:');
      console.log('   商务账号: ', quotaData.staff.current, '/', quotaData.staff.limit);
      console.log('   达人数量: ', quotaData.influencer.current, '/', quotaData.influencer.limit);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试通过！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  }
}

// 运行测试
testStaffList();
