/**
 * 测试质量评分和工作日历API修复
 */

const API_BASE = 'http://localhost:3000/api';

async function testQualityCalendarFix() {
  console.log('='.repeat(60));
  console.log('测试质量评分和工作日历API修复');
  console.log('='.repeat(60));

  try {
    // 1. 登录获取token
    console.log('\n1. 登录获取token...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@demo.com',
        password: 'owner123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`登录失败: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.tokens.accessToken;
    console.log('✅ 登录成功');
    console.log('Token:', token.substring(0, 20) + '...');

    // 2. 获取商务列表
    console.log('\n2. 获取商务列表...');
    const staffResponse = await fetch(`${API_BASE}/staff`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!staffResponse.ok) {
      throw new Error(`获取商务列表失败: ${staffResponse.status}`);
    }

    const staffData = await staffResponse.json();
    console.log('商务响应结构:', JSON.stringify(staffData, null, 2).substring(0, 200));
    
    const staffList = staffData.data?.data || staffData.data || [];
    
    if (!staffList || staffList.length === 0) {
      console.log('⚠️  没有商务人员，跳过测试');
      return;
    }

    const testStaff = staffList[0];
    console.log('✅ 获取商务列表成功');
    console.log(`测试商务: ${testStaff.name} (${testStaff.id})`);

    // 3. 测试质量评分API
    console.log('\n3. 测试质量评分API...');
    const qualityResponse = await fetch(
      `${API_BASE}/reports/staff/${testStaff.id}/quality-score`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log(`状态码: ${qualityResponse.status}`);
    
    if (!qualityResponse.ok) {
      const errorText = await qualityResponse.text();
      console.log('❌ 质量评分API失败');
      console.log('错误响应:', errorText);
    } else {
      const qualityData = await qualityResponse.json();
      console.log('✅ 质量评分API成功');
      console.log('综合评分:', qualityData.data.overall);
      console.log('跟进频率:', qualityData.data.followUpFrequency);
      console.log('转化率:', qualityData.data.conversionRate);
      console.log('ROI:', qualityData.data.roi);
      console.log('效率:', qualityData.data.efficiency);
      console.log('建议数量:', qualityData.data.suggestions.length);
    }

    // 4. 测试工作日历API
    console.log('\n4. 测试工作日历API...');
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const calendarResponse = await fetch(
      `${API_BASE}/reports/staff/${testStaff.id}/calendar?month=${currentMonth}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    console.log(`状态码: ${calendarResponse.status}`);
    
    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.log('❌ 工作日历API失败');
      console.log('错误响应:', errorText);
    } else {
      const calendarData = await calendarResponse.json();
      console.log('✅ 工作日历API成功');
      console.log('总事件数:', calendarData.data.stats.totalEvents);
      console.log('截止日期:', calendarData.data.stats.deadlines);
      console.log('排期日期:', calendarData.data.stats.scheduled);
      console.log('跟进提醒:', calendarData.data.stats.followups);
      console.log('平均日工作量:', calendarData.data.stats.avgDailyWorkload.toFixed(2));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试完成');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error);
  }
}

// 运行测试
testQualityCalendarFix();
