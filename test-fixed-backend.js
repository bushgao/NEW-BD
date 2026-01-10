const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testBackend() {
  console.log('=== 测试后端修复 ===\n');

  try {
    // 1. 测试登录
    console.log('1. 测试登录 (pinpai001@gmail.com)...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'pinpai001@gmail.com',
      password: 'password123'
    });

    console.log('✓ 登录成功!');
    const userData = loginRes.data.data || loginRes.data;
    console.log(`  - 用户: ${userData.user.name}`);
    console.log(`  - 角色: ${userData.user.role}`);
    console.log(`  - Token: ${userData.token.substring(0, 20)}...`);

    const token = userData.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 2. 测试Dashboard API
    console.log('\n2. 测试Dashboard API...');
    const dashboardRes = await axios.get(`${API_BASE}/reports/dashboard`, { headers });

    console.log('✓ Dashboard API成功!');
    console.log(`  - 总达人数: ${dashboardRes.data.metrics.totalInfluencers}`);
    console.log(`  - 总合作数: ${dashboardRes.data.metrics.totalCollaborations}`);
    console.log(`  - 成交数: ${dashboardRes.data.metrics.closedDeals}`);
    console.log(`  - 总GMV: ¥${dashboardRes.data.metrics.totalGmv}`);

    // 3. 测试达人列表API
    console.log('\n3. 测试达人列表API...');
    const influencersRes = await axios.get(`${API_BASE}/influencers?page=1&pageSize=10`, { headers });

    console.log('✓ 达人列表API成功!');
    console.log(`  - 总数: ${influencersRes.data.total}`);
    console.log(`  - 当前页: ${influencersRes.data.data.length} 条`);

    // 4. 测试合作列表API
    console.log('\n4. 测试合作列表API...');
    const collabsRes = await axios.get(`${API_BASE}/collaborations?page=1&pageSize=10`, { headers });

    console.log('✓ 合作列表API成功!');
    console.log(`  - 总数: ${collabsRes.data.total}`);
    console.log(`  - 当前页: ${collabsRes.data.data.length} 条`);

    console.log('\n=== ✅ 所有测试通过！后端修复成功！ ===');
    console.log('\n📝 下一步：');
    console.log('1. 打开浏览器访问前端');
    console.log('2. 清除浏览器localStorage (F12 -> Application -> Local Storage -> Clear All)');
    console.log('3. 使用 pinpai001@gmail.com / password123 登录');
    console.log('4. 检查Dashboard是否正常显示数据');

  } catch (error) {
    console.error('\n❌ 测试失败:');
    if (error.response) {
      console.error(`  - 状态码: ${error.response.status}`);
      console.error(`  - 错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  - 错误: ${error.message}`);
    }
    process.exit(1);
  }
}

testBackend();
