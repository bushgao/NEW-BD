const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 使用你的实际token
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkNTlkMDVkOC00MDY1LTRiYjYtOTBlNi03MTk0YzFjYTk2NDAiLCJlbWFpbCI6InBpbnBhaTAwMUBnbWFpbC5jb20iLCJyb2xlIjoiQlJBTkQiLCJpYXQiOjE3NjgwMzAxMzMsImV4cCI6MTc2ODYzNDkzM30.WzmdrilnyG787Glm9BJkRlqqTw7AL76lNUNBb8OmElE';

async function testAPI(endpoint, description) {
  console.log(`\n========== 测试: ${description} ==========`);
  console.log(`请求: GET ${endpoint}`);
  
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('✅ 成功');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ 失败');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
  }
}

async function runTests() {
  console.log('开始测试 Dashboard APIs...\n');
  
  // 测试所有可能失败的API
  await testAPI('/reports/dashboard?period=month', 'Dashboard 主数据');
  await testAPI('/reports/dashboard/trends?period=month&dataType=gmv', 'GMV 趋势');
  await testAPI('/reports/dashboard/trends?period=month&dataType=cost', 'Cost 趋势');
  await testAPI('/reports/dashboard/trends?period=month&dataType=roi', 'ROI 趋势');
  await testAPI('/reports/dashboard/roi-analysis', 'ROI 分析');
  await testAPI('/reports/dashboard/pipeline-funnel', '管道漏斗');
  await testAPI('/reports/dashboard/daily-summary', '每日摘要');
  
  console.log('\n========== 测试完成 ==========\n');
}

runTests();
