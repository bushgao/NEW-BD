// 测试商务列表API
const axios = require('axios');

async function testStaffAPI() {
  try {
    // 1. 先登录获取token
    console.log('1. 登录平台管理员账号...');
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('登录响应:', JSON.stringify(loginRes.data, null, 2));
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ 登录成功，获取到token');
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'undefined');
    
    // 2. 获取工厂列表
    console.log('\n2. 获取工厂列表...');
    const factoriesRes = await axios.get('http://localhost:3000/api/platform/factories', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 10 }
    });
    
    const factories = factoriesRes.data.data.data;
    console.log(`✅ 获取到 ${factories.length} 个工厂`);
    
    if (factories.length === 0) {
      console.log('❌ 没有工厂数据，无法测试');
      return;
    }
    
    // 3. 测试第一个工厂的商务列表
    const firstFactory = factories[0];
    console.log(`\n3. 测试工厂: ${firstFactory.name} (ID: ${firstFactory.id})`);
    console.log(`   商务数量: ${firstFactory._count?.staff || 0}`);
    
    console.log('\n4. 获取商务列表...');
    const staffRes = await axios.get(
      `http://localhost:3000/api/platform/factories/${firstFactory.id}/staff`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    const staff = staffRes.data.data;
    console.log(`✅ 成功获取商务列表，共 ${staff.length} 个商务`);
    
    if (staff.length > 0) {
      console.log('\n商务列表:');
      staff.forEach((s, index) => {
        console.log(`  ${index + 1}. ${s.name} (${s.email})`);
        console.log(`     - 添加达人: ${s._count?.influencers || 0}`);
        console.log(`     - 创建合作: ${s._count?.collaborations || 0}`);
      });
      
      // 5. 测试第一个商务的详细统计
      const firstStaff = staff[0];
      console.log(`\n5. 测试商务详情: ${firstStaff.name} (ID: ${firstStaff.id})`);
      
      const statsRes = await axios.get(
        `http://localhost:3000/api/platform/staff/${firstStaff.id}/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const stats = statsRes.data.data;
      console.log('✅ 成功获取商务统计:');
      console.log(`   - 所属工厂: ${stats.factoryName}`);
      console.log(`   - 添加达人: ${stats.influencersAdded}`);
      console.log(`   - 创建合作: ${stats.collaborationsCreated}`);
      console.log(`   - 完成合作: ${stats.collaborationsCompleted}`);
      console.log(`   - 成功率: ${stats.successRate}%`);
    } else {
      console.log('⚠️  该工厂没有商务账号');
    }
    
    console.log('\n✅ 所有API测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
      console.error('请求URL:', error.config.url);
      console.error('请求方法:', error.config.method);
      if (error.config.headers.Authorization) {
        console.error('Token前10个字符:', error.config.headers.Authorization.substring(0, 20) + '...');
      }
    } else {
      console.error('错误:', error.message);
      console.error('完整错误:', error);
    }
  }
}

testStaffAPI();
