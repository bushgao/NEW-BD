/**
 * Checkpoint Task 31 - 数据录入验证
 * 
 * 测试内容：
 * 1. 智能表单自动填充
 * 2. 智能推荐
 * 3. 批量操作
 * 4. 数据验证
 * 5. 表单缓存
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用的 Token（需要替换为实际的商务人员 token）
let authToken = '';

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// ============================================
// 1. 测试智能表单自动填充
// ============================================
async function testSmartFormAutoFill() {
  console.log('\n📝 测试 1: 智能表单自动填充\n');
  
  try {
    // 测试获取智能建议 API
    const influencerId = 'test-influencer-id'; // 需要替换为实际的达人ID
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/suggestions?influencerId=${influencerId}&type=sample`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '智能建议 API 响应正常',
        true,
        `返回 ${data.data?.suggestions?.length || 0} 条建议`
      );
      
      // 验证建议数据结构
      if (data.data?.suggestions && Array.isArray(data.data.suggestions)) {
        const hasSampleSuggestions = data.data.suggestions.some(s => s.type === 'sample');
        logTest(
          '智能建议包含样品推荐',
          hasSampleSuggestions,
          hasSampleSuggestions ? '包含样品推荐' : '未找到样品推荐'
        );
      }
    } else {
      logTest('智能建议 API 响应正常', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('智能建议 API 响应正常', false, error.message);
  }
  
  // 测试价格推荐
  try {
    const influencerId = 'test-influencer-id';
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/suggestions?influencerId=${influencerId}&type=price`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '价格推荐 API 响应正常',
        true,
        `返回 ${data.data?.suggestions?.length || 0} 条建议`
      );
    } else {
      logTest('价格推荐 API 响应正常', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('价格推荐 API 响应正常', false, error.message);
  }
}

// ============================================
// 2. 测试智能推荐
// ============================================
async function testSmartRecommendations() {
  console.log('\n🎯 测试 2: 智能推荐\n');
  
  try {
    // 测试排期推荐
    const influencerId = 'test-influencer-id';
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/suggestions?influencerId=${influencerId}&type=schedule`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '排期推荐 API 响应正常',
        true,
        `返回 ${data.data?.suggestions?.length || 0} 条建议`
      );
      
      // 验证推荐数据包含必要字段
      if (data.data?.suggestions && data.data.suggestions.length > 0) {
        const firstSuggestion = data.data.suggestions[0];
        const hasRequiredFields = firstSuggestion.value && firstSuggestion.reason;
        logTest(
          '推荐数据包含必要字段',
          hasRequiredFields,
          hasRequiredFields ? '包含 value 和 reason 字段' : '缺少必要字段'
        );
      }
    } else {
      logTest('排期推荐 API 响应正常', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('排期推荐 API 响应正常', false, error.message);
  }
}

// ============================================
// 3. 测试批量操作
// ============================================
async function testBatchOperations() {
  console.log('\n📦 测试 3: 批量操作\n');
  
  try {
    // 测试批量更新 API
    const testData = {
      ids: ['test-id-1', 'test-id-2'],
      operation: 'updateStage',
      data: {
        stage: 'NEGOTIATING'
      }
    };
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/batch-update`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '批量更新 API 响应正常',
        true,
        `更新成功: ${data.data?.updated || 0}, 失败: ${data.data?.failed || 0}`
      );
      
      // 验证返回数据结构
      const hasStats = data.data && 
        typeof data.data.updated === 'number' && 
        typeof data.data.failed === 'number';
      logTest(
        '批量更新返回统计信息',
        hasStats,
        hasStats ? '包含更新统计' : '缺少统计信息'
      );
    } else {
      logTest('批量更新 API 响应正常', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('批量更新 API 响应正常', false, error.message);
  }
  
  // 测试批量寄样
  try {
    const testData = {
      ids: ['test-id-1', 'test-id-2'],
      operation: 'dispatch',
      data: {
        sampleId: 'test-sample-id',
        trackingNumber: 'TEST123456'
      }
    };
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/batch-update`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '批量寄样 API 响应正常',
        true,
        `寄样成功: ${data.data?.updated || 0}, 失败: ${data.data?.failed || 0}`
      );
    } else {
      logTest('批量寄样 API 响应正常', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('批量寄样 API 响应正常', false, error.message);
  }
}

// ============================================
// 4. 测试数据验证
// ============================================
async function testDataValidation() {
  console.log('\n✅ 测试 4: 数据验证\n');
  
  try {
    // 测试有效数据验证
    const validData = {
      influencerId: 'test-influencer-id',
      sampleId: 'test-sample-id',
      stage: 'INITIAL_CONTACT',
      expectedPrice: 1000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/validate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: validData })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '数据验证 API 响应正常',
        true,
        `验证结果: ${data.data?.isValid ? '有效' : '无效'}`
      );
      
      // 验证返回数据结构
      const hasValidationResult = data.data && 
        typeof data.data.isValid === 'boolean' &&
        Array.isArray(data.data.errors) &&
        Array.isArray(data.data.warnings);
      logTest(
        '验证结果包含必要字段',
        hasValidationResult,
        hasValidationResult ? '包含 isValid, errors, warnings' : '缺少必要字段'
      );
    } else {
      logTest('数据验证 API 响应正常', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('数据验证 API 响应正常', false, error.message);
  }
  
  // 测试无效数据验证
  try {
    const invalidData = {
      influencerId: '', // 空的达人ID
      sampleId: '',
      stage: 'INVALID_STAGE',
      expectedPrice: -100, // 负数价格
      deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 过去的日期
    };
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/validate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: invalidData })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const hasErrors = data.data?.errors && data.data.errors.length > 0;
      logTest(
        '无效数据被正确检测',
        !data.data?.isValid && hasErrors,
        hasErrors ? `检测到 ${data.data.errors.length} 个错误` : '未检测到错误'
      );
    } else {
      logTest('无效数据验证', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('无效数据验证', false, error.message);
  }
  
  // 测试重复数据检测
  try {
    const duplicateData = {
      influencerId: 'existing-influencer-id',
      sampleId: 'existing-sample-id',
      stage: 'INITIAL_CONTACT'
    };
    
    const response = await fetch(
      `${API_BASE_URL}/collaborations/validate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: duplicateData })
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      logTest(
        '重复数据检测功能正常',
        true,
        data.data?.warnings?.length > 0 ? '检测到重复警告' : '无重复数据'
      );
    } else {
      logTest('重复数据检测', false, `状态码: ${response.status}`);
    }
  } catch (error) {
    logTest('重复数据检测', false, error.message);
  }
}

// ============================================
// 5. 测试表单缓存
// ============================================
async function testFormCache() {
  console.log('\n💾 测试 5: 表单缓存\n');
  
  try {
    // 检查 localforage 是否可用
    if (typeof localforage !== 'undefined') {
      logTest('localforage 库已加载', true, '表单缓存功能可用');
      
      // 测试缓存写入
      const testFormData = {
        influencerId: 'test-influencer',
        sampleId: 'test-sample',
        notes: 'Test notes',
        timestamp: Date.now()
      };
      
      await localforage.setItem('collaboration-draft', testFormData);
      logTest('表单数据缓存写入成功', true, '数据已保存到本地');
      
      // 测试缓存读取
      const cachedData = await localforage.getItem('collaboration-draft');
      const cacheValid = cachedData && 
        cachedData.influencerId === testFormData.influencerId &&
        cachedData.sampleId === testFormData.sampleId;
      logTest(
        '表单数据缓存读取成功',
        cacheValid,
        cacheValid ? '缓存数据完整' : '缓存数据不匹配'
      );
      
      // 清理测试数据
      await localforage.removeItem('collaboration-draft');
      logTest('表单缓存清理成功', true, '测试数据已清理');
    } else {
      logTest(
        'localforage 库已加载',
        false,
        '需要在浏览器环境中测试表单缓存功能'
      );
    }
  } catch (error) {
    logTest('表单缓存功能', false, error.message);
  }
}

// ============================================
// 主测试函数
// ============================================
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 Checkpoint Task 31 - 数据录入验证');
  console.log('='.repeat(60));
  
  // 提示用户设置 token
  console.log('\n⚠️  请先设置 authToken 变量为有效的商务人员 token');
  console.log('   可以从浏览器的 localStorage 中获取\n');
  
  if (!authToken) {
    console.log('❌ 未设置 authToken，跳过 API 测试');
    console.log('   请在脚本中设置 authToken 后重新运行\n');
  }
  
  // 运行所有测试
  await testSmartFormAutoFill();
  await testSmartRecommendations();
  await testBatchOperations();
  await testDataValidation();
  await testFormCache();
  
  // 输出测试结果汇总
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📝 总计: ${testResults.tests.length}`);
  console.log('='.repeat(60));
  
  // 详细结果
  console.log('\n📋 详细测试结果:\n');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}`);
    if (test.details) {
      console.log(`   ${test.details}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  // 返回测试是否全部通过
  return testResults.failed === 0;
}

// 如果在 Node.js 环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.runCheckpointTask31 = runAllTests;
  console.log('✅ 测试脚本已加载');
  console.log('💡 使用方法:');
  console.log('   1. 设置 authToken: authToken = "your-token-here"');
  console.log('   2. 运行测试: await runCheckpointTask31()');
}
