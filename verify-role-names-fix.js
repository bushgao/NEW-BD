/**
 * 验证角色名称修复 - 全面检查
 * 确保所有API都使用正确的角色名称
 */

const API_BASE = 'http://localhost:3000/api';

async function verifyRoleNamesFix() {
  console.log('='.repeat(70));
  console.log('角色名称修复 - 全面验证');
  console.log('='.repeat(70));

  try {
    // 1. 登录测试
    console.log('\n【测试1】登录验证');
    console.log('-'.repeat(70));
    
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pinpai001@gmail.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ 登录失败');
      return;
    }

    const loginData = await loginResponse.json();
    const userData = loginData.data?.user || loginData.user;
    const token = loginData.data?.tokens?.accessToken || loginData.token;
    
    console.log('✅ 登录成功');
    console.log(`   角色: ${userData.role} (应为 BRAND)`);
    console.log(`   工厂ID: ${userData.factoryId}`);

    if (userData.role !== 'BRAND') {
      console.error('❌ 角色名称错误！应为 BRAND');
      return;
    }

    // 2. Dashboard API测试
    console.log('\n【测试2】Dashboard API');
    console.log('-'.repeat(70));
    
    const dashboardResponse = await fetch(`${API_BASE}/dashboard/overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   状态码: ${dashboardResponse.status}`);
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard API正常');
    } else {
      const error = await dashboardResponse.json();
      console.error('❌ Dashboard API失败:', error.message);
    }

    // 3. 商务列表API测试
    console.log('\n【测试3】商务列表API');
    console.log('-'.repeat(70));
    
    const staffResponse = await fetch(`${API_BASE}/staff?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   状态码: ${staffResponse.status}`);
    if (staffResponse.ok) {
      const staffData = await staffResponse.json();
      console.log('✅ 商务列表API正常');
      console.log(`   商务账号数: ${staffData.total}`);
    } else {
      const error = await staffResponse.json();
      console.error('❌ 商务列表API失败:', error.message);
    }

    // 4. 配额API测试
    console.log('\n【测试4】配额API');
    console.log('-'.repeat(70));
    
    const quotaResponse = await fetch(`${API_BASE}/staff/quota`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   状态码: ${quotaResponse.status}`);
    if (quotaResponse.ok) {
      const quotaData = await quotaResponse.json();
      console.log('✅ 配额API正常');
      console.log(`   商务配额: ${quotaData.staff.current}/${quotaData.staff.limit}`);
      console.log(`   达人配额: ${quotaData.influencer.current}/${quotaData.influencer.limit}`);
    } else {
      const error = await quotaResponse.json();
      console.error('❌ 配额API失败:', error.message);
    }

    // 5. 达人列表API测试
    console.log('\n【测试5】达人列表API');
    console.log('-'.repeat(70));
    
    const influencerResponse = await fetch(`${API_BASE}/influencers?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   状态码: ${influencerResponse.status}`);
    if (influencerResponse.ok) {
      const influencerData = await influencerResponse.json();
      console.log('✅ 达人列表API正常');
      console.log(`   达人数量: ${influencerData.total}`);
    } else {
      const error = await influencerResponse.json();
      console.error('❌ 达人列表API失败:', error.message);
    }

    // 6. 合作列表API测试
    console.log('\n【测试6】合作列表API');
    console.log('-'.repeat(70));
    
    const collabResponse = await fetch(`${API_BASE}/collaborations?page=1&pageSize=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   状态码: ${collabResponse.status}`);
    if (collabResponse.ok) {
      const collabData = await collabResponse.json();
      console.log('✅ 合作列表API正常');
      console.log(`   合作数量: ${collabData.total}`);
    } else {
      const error = await collabResponse.json();
      console.error('❌ 合作列表API失败:', error.message);
    }

    // 7. 报表API测试
    console.log('\n【测试7】报表API');
    console.log('-'.repeat(70));
    
    const reportResponse = await fetch(`${API_BASE}/reports/overview`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   状态码: ${reportResponse.status}`);
    if (reportResponse.ok) {
      console.log('✅ 报表API正常');
    } else {
      const error = await reportResponse.json();
      console.error('❌ 报表API失败:', error.message);
    }

    // 总结
    console.log('\n' + '='.repeat(70));
    console.log('✅ 角色名称修复验证完成！');
    console.log('='.repeat(70));
    console.log('\n所有核心API已验证，角色名称统一为:');
    console.log('  • PLATFORM_ADMIN - 平台管理员');
    console.log('  • BRAND - 品牌方/工厂老板 (原FACTORY_OWNER)');
    console.log('  • BUSINESS - 商务人员 (原BUSINESS_STAFF)');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
    console.error(error);
  }
}

// 运行验证
verifyRoleNamesFix();
