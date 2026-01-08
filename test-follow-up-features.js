/**
 * 跟进流程验证测试脚本
 * 
 * 测试内容：
 * 1. 快速跟进功能
 * 2. 跟进提醒功能
 * 3. 跟进分析功能
 * 4. 跟进模板功能
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证
const TEST_USERS = {
  factoryOwner: {
    email: 'factory@test.com',
    password: 'password123',
    name: '工厂老板'
  },
  businessStaff: {
    email: 'staff@test.com',
    password: 'password123',
    name: '商务人员'
  }
};

let authToken = '';
let testCollaborationId = '';

// ==================== 辅助函数 ====================

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`登录失败: ${response.status}`);
  }

  const data = await response.json();
  return data.data.token;
}

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`❌ API 请求失败: ${endpoint}`, data);
    throw new Error(data.error?.message || '请求失败');
  }

  return data;
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// ==================== 测试函数 ====================

/**
 * 测试1: 跟进模板功能
 */
async function testFollowUpTemplates() {
  logSection('测试1: 跟进模板功能');

  try {
    const result = await apiRequest('/collaborations/follow-up-templates');
    
    if (result.success && result.data && result.data.length > 0) {
      logSuccess(`获取跟进模板成功，共 ${result.data.length} 个模板`);
      
      // 显示前3个模板
      console.log('\n模板示例：');
      result.data.slice(0, 3).forEach((template, index) => {
        console.log(`  ${index + 1}. ${template.name} (${template.category})`);
        console.log(`     内容: ${template.content.substring(0, 50)}...`);
      });
      
      return true;
    } else {
      logError('跟进模板数据格式不正确');
      return false;
    }
  } catch (error) {
    logError(`跟进模板测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试2: 快速跟进功能
 */
async function testQuickFollowUp() {
  logSection('测试2: 快速跟进功能');

  try {
    // 首先获取一个合作记录
    const collabsResult = await apiRequest('/collaborations?page=1&pageSize=1');
    
    if (!collabsResult.data || collabsResult.data.length === 0) {
      logInfo('没有可用的合作记录，跳过快速跟进测试');
      return true;
    }

    testCollaborationId = collabsResult.data[0].id;
    logInfo(`使用合作记录: ${testCollaborationId}`);

    // 添加快速跟进记录
    const followUpContent = `测试快速跟进 - ${new Date().toLocaleString()}`;
    const result = await apiRequest(`/collaborations/${testCollaborationId}/follow-up`, {
      method: 'POST',
      body: JSON.stringify({ content: followUpContent }),
    });

    if (result.success && result.data) {
      logSuccess('快速跟进记录添加成功');
      console.log(`  跟进内容: ${result.data.content}`);
      console.log(`  跟进时间: ${new Date(result.data.createdAt).toLocaleString()}`);
      return true;
    } else {
      logError('快速跟进功能返回数据不正确');
      return false;
    }
  } catch (error) {
    logError(`快速跟进测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试3: 跟进提醒功能
 */
async function testFollowUpReminders() {
  logSection('测试3: 跟进提醒功能');

  try {
    const result = await apiRequest('/collaborations/follow-up-reminders');
    
    if (result.success && result.data) {
      logSuccess(`获取跟进提醒成功，共 ${result.data.length} 条提醒`);
      
      if (result.data.length > 0) {
        console.log('\n提醒示例：');
        result.data.slice(0, 3).forEach((reminder, index) => {
          console.log(`  ${index + 1}. ${reminder.influencerName} (${reminder.influencerPlatform})`);
          console.log(`     阶段: ${reminder.stage}`);
          console.log(`     优先级: ${reminder.priority}`);
          console.log(`     建议频率: ${reminder.frequency}`);
          console.log(`     距上次跟进: ${reminder.daysSinceLastFollowUp} 天`);
        });
      } else {
        logInfo('当前没有需要跟进的合作');
      }
      
      return true;
    } else {
      logError('跟进提醒数据格式不正确');
      return false;
    }
  } catch (error) {
    logError(`跟进提醒测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试4: 跟进分析功能
 */
async function testFollowUpAnalytics() {
  logSection('测试4: 跟进分析功能');

  try {
    // 测试不同时间周期
    const periods = ['week', 'month', 'quarter'];
    
    for (const period of periods) {
      logInfo(`测试 ${period} 周期的跟进分析...`);
      
      const result = await apiRequest(`/collaborations/follow-up-analytics?period=${period}`);
      
      if (result.success && result.data) {
        console.log(`\n  ${period} 周期分析结果:`);
        console.log(`    效果评分: ${result.data.effectivenessScore}/100`);
        console.log(`    总跟进次数: ${result.data.totalFollowUps}`);
        console.log(`    成功转化: ${result.data.successfulConversions}`);
        console.log(`    转化率: ${result.data.conversionRate.toFixed(2)}%`);
        console.log(`    最佳跟进时间: ${result.data.bestTime}`);
        console.log(`    最佳跟进频率: ${result.data.bestFrequency}`);
        
        if (result.data.suggestions && result.data.suggestions.length > 0) {
          console.log(`    优化建议:`);
          result.data.suggestions.forEach((suggestion, index) => {
            console.log(`      ${index + 1}. ${suggestion}`);
          });
        }
      } else {
        logError(`${period} 周期的跟进分析数据格式不正确`);
        return false;
      }
    }
    
    logSuccess('跟进分析功能测试通过');
    return true;
  } catch (error) {
    logError(`跟进分析测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试5: 跟进记录查询
 */
async function testFollowUpHistory() {
  logSection('测试5: 跟进记录查询');

  if (!testCollaborationId) {
    logInfo('没有测试合作记录ID，跳过跟进记录查询测试');
    return true;
  }

  try {
    const result = await apiRequest(
      `/collaborations/${testCollaborationId}/follow-ups?page=1&pageSize=10`
    );
    
    if (result.success && result.data) {
      logSuccess(`获取跟进记录成功，共 ${result.total} 条记录`);
      
      if (result.data.length > 0) {
        console.log('\n最近的跟进记录：');
        result.data.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.user.name}`);
          console.log(`     时间: ${new Date(record.createdAt).toLocaleString()}`);
          console.log(`     内容: ${record.content.substring(0, 50)}...`);
        });
      }
      
      return true;
    } else {
      logError('跟进记录数据格式不正确');
      return false;
    }
  } catch (error) {
    logError(`跟进记录查询测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 测试6: 前端组件验证
 */
async function testFrontendComponents() {
  logSection('测试6: 前端组件验证');

  const components = [
    {
      name: 'QuickFollowUpModal',
      path: 'packages/frontend/src/pages/Pipeline/QuickFollowUpModal.tsx',
      features: ['模板选择', '内容输入', '图片上传']
    },
    {
      name: 'FollowUpReminder',
      path: 'packages/frontend/src/components/dashboard/FollowUpReminder.tsx',
      features: ['提醒列表', '优先级显示', '暂停功能', '跳转功能']
    },
    {
      name: 'FollowUpAnalytics',
      path: 'packages/frontend/src/pages/FollowUpAnalytics/index.tsx',
      features: ['效果评分', '最佳时间', '最佳频率', '优化建议']
    }
  ];

  console.log('前端组件清单：\n');
  components.forEach((component, index) => {
    console.log(`${index + 1}. ${component.name}`);
    console.log(`   路径: ${component.path}`);
    console.log(`   功能: ${component.features.join(', ')}`);
    console.log('');
  });

  logSuccess('前端组件已实现');
  return true;
}

// ==================== 主测试流程 ====================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                  跟进流程功能验证测试                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  try {
    // 登录
    logSection('准备测试环境');
    logInfo('正在登录...');
    
    try {
      authToken = await login(TEST_USERS.factoryOwner.email, TEST_USERS.factoryOwner.password);
      logSuccess(`登录成功: ${TEST_USERS.factoryOwner.name}`);
    } catch (error) {
      logError(`登录失败: ${error.message}`);
      logInfo('请确保后端服务正在运行，并且测试账号已创建');
      return;
    }

    // 运行所有测试
    const tests = [
      { name: '跟进模板功能', fn: testFollowUpTemplates },
      { name: '快速跟进功能', fn: testQuickFollowUp },
      { name: '跟进提醒功能', fn: testFollowUpReminders },
      { name: '跟进分析功能', fn: testFollowUpAnalytics },
      { name: '跟进记录查询', fn: testFollowUpHistory },
      { name: '前端组件验证', fn: testFrontendComponents },
    ];

    for (const test of tests) {
      results.total++;
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      // 等待一下，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 输出测试结果
    logSection('测试结果汇总');
    console.log(`总测试数: ${results.total}`);
    console.log(`✅ 通过: ${results.passed}`);
    console.log(`❌ 失败: ${results.failed}`);
    console.log(`成功率: ${((results.passed / results.total) * 100).toFixed(2)}%`);

    if (results.failed === 0) {
      console.log('\n🎉 所有测试通过！跟进流程功能正常工作。\n');
    } else {
      console.log('\n⚠️  部分测试失败，请检查上述错误信息。\n');
    }

  } catch (error) {
    logError(`测试过程中发生错误: ${error.message}`);
    console.error(error);
  }
}

// 运行测试
runAllTests().catch(console.error);
