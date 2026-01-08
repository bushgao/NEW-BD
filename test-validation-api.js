/**
 * 测试数据验证 API
 * 
 * 使用方法:
 * 1. 确保后端服务正在运行
 * 2. 确保已登录并获取 token
 * 3. 运行: node test-validation-api.js
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 从 localStorage 获取 token（需要在浏览器中运行）
// 或者手动设置 token
const TOKEN = 'YOUR_TOKEN_HERE';

async function testValidation() {
  console.log('🧪 开始测试数据验证 API...\n');

  // 测试1: 验证合作记录 - 正常数据
  console.log('📝 测试1: 验证合作记录 - 正常数据');
  try {
    const response1 = await fetch(`${API_BASE_URL}/collaborations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        type: 'collaboration',
        data: {
          influencerId: 'test-uuid',
          stage: 'LEAD',
          quotedPrice: 1500,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    });

    const result1 = await response1.json();
    console.log('✅ 响应:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试2: 验证合作记录 - 异常报价
  console.log('📝 测试2: 验证合作记录 - 异常报价');
  try {
    const response2 = await fetch(`${API_BASE_URL}/collaborations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        type: 'collaboration',
        data: {
          influencerId: 'test-uuid',
          stage: 'LEAD',
          quotedPrice: 150000, // 异常高价
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    });

    const result2 = await response2.json();
    console.log('✅ 响应:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试3: 验证合作记录 - 过期截止日期
  console.log('📝 测试3: 验证合作记录 - 过期截止日期');
  try {
    const response3 = await fetch(`${API_BASE_URL}/collaborations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        type: 'collaboration',
        data: {
          influencerId: 'test-uuid',
          stage: 'LEAD',
          quotedPrice: 1500,
          deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 昨天
        },
      }),
    });

    const result3 = await response3.json();
    console.log('✅ 响应:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试4: 验证寄样记录
  console.log('📝 测试4: 验证寄样记录');
  try {
    const response4 = await fetch(`${API_BASE_URL}/collaborations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        type: 'dispatch',
        data: {
          sampleId: 'test-uuid',
          influencerId: 'test-uuid',
          quantity: 150, // 数量较多
        },
      }),
    });

    const result4 = await response4.json();
    console.log('✅ 响应:', JSON.stringify(result4, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  console.log('\n---\n');

  // 测试5: 验证结果记录 - 异常点赞率
  console.log('📝 测试5: 验证结果记录 - 异常点赞率');
  try {
    const response5 = await fetch(`${API_BASE_URL}/collaborations/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        type: 'result',
        data: {
          collaborationId: 'test-uuid',
          views: 10000,
          likes: 6000, // 点赞率 60%，异常高
          comments: 500,
          gmv: 5000,
        },
      }),
    });

    const result5 = await response5.json();
    console.log('✅ 响应:', JSON.stringify(result5, null, 2));
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }

  console.log('\n✅ 测试完成！');
}

// 如果在 Node.js 环境中运行
if (typeof window === 'undefined') {
  console.log('⚠️  请在浏览器控制台中运行此脚本，或手动设置 TOKEN');
  console.log('⚠️  或者使用 fetch polyfill (如 node-fetch)');
} else {
  testValidation();
}

// 导出供浏览器使用
if (typeof window !== 'undefined') {
  window.testValidation = testValidation;
}
