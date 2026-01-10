const axios = require('axios');

// 从后端日志中看到的token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 需要完整的token

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

async function testAllAPIs() {
  console.log('\n=== 测试所有Dashboard API ===\n');

  const tests = [
    { name: 'Dashboard概览', url: '/reports/dashboard' },
    { name: 'ROI分析', url: '/reports/dashboard/roi-analysis' },
    { name: '管道漏斗', url: '/reports/dashboard/pipeline-funnel' },
    { name: '趋势数据', url: '/reports/dashboard/trends?period=week&dataType=gmv' },
    { name: '每日摘要', url: '/reports/dashboard/daily-summary' },
    { name: '智能提醒', url: '/reports/dashboard/alerts' },
    { name: '达人列表', url: '/influencers' },
    { name: '合作列表', url: '/collaborations' },
    { name: '样品列表', url: '/samples' },
    { name: '通知数量', url: '/notifications/unread-count' },
  ];

  for (const test of tests) {
    try {
      const response = await api.get(test.url);
      console.log(`✅ ${test.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.response?.status || 'ERROR'}`);
      if (error.response?.data) {
        console.log(`   错误信息:`, JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

testAllAPIs().catch(console.error);
