// 测试智能建议 API
// 在项目根目录运行: node test-suggestions-api.js

const http = require('http');

// 配置
const API_BASE = 'http://localhost:3000';
const TOKEN = 'YOUR_TOKEN_HERE'; // 替换为实际的 token

// 测试函数
async function testSuggestionsAPI() {
  console.log('=== 测试智能建议 API ===\n');

  // 1. 先获取达人列表
  console.log('1. 获取达人列表...');
  try {
    const influencers = await makeRequest('/api/influencers?page=1&pageSize=10');
    
    if (!influencers.data || influencers.data.length === 0) {
      console.log('❌ 没有达人数据，请先创建达人');
      return;
    }
    
    const influencerId = influencers.data[0].id;
    console.log(`✅ 找到达人: ${influencers.data[0].nickname} (ID: ${influencerId})\n`);

    // 2. 测试样品建议
    console.log('2. 测试样品建议...');
    try {
      const sampleSuggestions = await makeRequest(
        `/api/collaborations/suggestions?influencerId=${influencerId}&type=sample`
      );
      console.log('✅ 样品建议:', JSON.stringify(sampleSuggestions, null, 2));
    } catch (error) {
      console.log('❌ 样品建议失败:', error.message);
    }

    // 3. 测试报价建议
    console.log('\n3. 测试报价建议...');
    try {
      const priceSuggestions = await makeRequest(
        `/api/collaborations/suggestions?influencerId=${influencerId}&type=price`
      );
      console.log('✅ 报价建议:', JSON.stringify(priceSuggestions, null, 2));
    } catch (error) {
      console.log('❌ 报价建议失败:', error.message);
    }

    // 4. 测试排期建议
    console.log('\n4. 测试排期建议...');
    try {
      const scheduleSuggestions = await makeRequest(
        `/api/collaborations/suggestions?influencerId=${influencerId}&type=schedule`
      );
      console.log('✅ 排期建议:', JSON.stringify(scheduleSuggestions, null, 2));
    } catch (error) {
      console.log('❌ 排期建议失败:', error.message);
    }

  } catch (error) {
    console.log('❌ 获取达人列表失败:', error.message);
  }

  console.log('\n=== 测试完成 ===');
}

// HTTP 请求辅助函数
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error?.message || data}`));
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// 运行测试
if (TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ 请先设置 TOKEN 变量');
  console.log('1. 登录系统');
  console.log('2. 打开浏览器控制台');
  console.log('3. 运行: localStorage.getItem("token")');
  console.log('4. 复制 token 并替换此文件中的 YOUR_TOKEN_HERE');
} else {
  testSuggestionsAPI();
}
