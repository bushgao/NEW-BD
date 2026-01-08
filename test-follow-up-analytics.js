const axios = require('axios');

// 测试跟进分析 API
async function testFollowUpAnalytics() {
  console.log('=== 测试跟进分析 API ===\n');

  // 1. 先登录获取 token
  console.log('1. 登录获取 token...');
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'ceshi001@gmail.com',
      password: 'password123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token.accessToken;
      console.log('✅ 登录成功');
      console.log(`Token: ${token.substring(0, 20)}...`);

      // 2. 测试跟进分析 API
      console.log('\n2. 测试跟进分析 API...');
      try {
        const analyticsResponse = await axios.get(
          'http://localhost:3000/api/collaborations/follow-up-analytics',
          {
            params: { period: 'month' },
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (analyticsResponse.data.success) {
          console.log('✅ 跟进分析 API 调用成功');
          console.log('\n数据概览:');
          const data = analyticsResponse.data.data;
          console.log(`- 跟进效果评分: ${data.effectivenessScore}/100`);
          console.log(`- 总跟进次数: ${data.totalFollowUps}`);
          console.log(`- 成功转化: ${data.successfulConversions}`);
          console.log(`- 转化率: ${data.conversionRate.toFixed(2)}%`);
          console.log(`- 最佳跟进时间: ${data.bestTime}`);
          console.log(`- 最佳跟进频率: ${data.bestFrequency}`);
          console.log(`\n优化建议:`);
          data.suggestions.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s}`);
          });
        } else {
          console.log('❌ API 返回失败:', analyticsResponse.data.error);
        }
      } catch (error) {
        console.log('❌ 跟进分析 API 调用失败');
        if (error.response) {
          console.log(`状态码: ${error.response.status}`);
          console.log(`错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
          console.log(`错误: ${error.message}`);
        }
      }
    } else {
      console.log('❌ 登录失败:', loginResponse.data.error);
    }
  } catch (error) {
    console.log('❌ 登录请求失败');
    if (error.response) {
      console.log(`状态码: ${error.response.status}`);
      console.log(`错误信息: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`错误: ${error.message}`);
    }
  }
}

testFollowUpAnalytics();
