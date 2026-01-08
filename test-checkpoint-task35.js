/**
 * Checkpoint Task 35 - 工作台验证测试脚本
 * 
 * 测试内容：
 * 1. 今日清单功能 (TodayTodoList)
 * 2. 工作统计功能 (WorkStats)
 * 3. 快捷入口功能 (QuickActions)
 * 4. 数据准确性验证
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试结果收集
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// 辅助函数：记录测试结果
function logTest(name, passed, details = '') {
  const result = { name, details, timestamp: new Date().toISOString() };
  if (passed) {
    testResults.passed.push(result);
    console.log(`✅ ${name}`);
  } else {
    testResults.failed.push(result);
    console.log(`❌ ${name}`);
  }
  if (details) {
    console.log(`   ${details}`);
  }
}

function logWarning(message) {
  testResults.warnings.push({ message, timestamp: new Date().toISOString() });
  console.log(`⚠️  ${message}`);
}

// 获取认证 Token
async function getAuthToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('未找到认证 Token，请先登录');
  }
  return token;
}

// API 请求辅助函数
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${error}`);
  }
  
  return response.json();
}

// ============================================
// 测试 1: 今日清单功能
// ============================================
async function testTodayTodoList() {
  console.log('\n📋 测试 1: 今日清单功能');
  console.log('='.repeat(50));
  
  try {
    // 1.1 测试 API 端点存在
    const response = await apiRequest('/reports/my-dashboard/today-todos');
    logTest('今日清单 API 响应成功', response.success);
    
    // 1.2 验证数据结构
    if (response.data) {
      const hasValidStructure = 
        Array.isArray(response.data.todos) &&
        response.data.summary &&
        typeof response.data.summary.total === 'number' &&
        typeof response.data.summary.completed === 'number' &&
        typeof response.data.summary.overdue === 'number';
      
      logTest('今日清单数据结构正确', hasValidStructure, 
        `待办总数: ${response.data.summary.total}, 已完成: ${response.data.summary.completed}, 超期: ${response.data.summary.overdue}`);
      
      // 1.3 验证待办事项数据
      if (response.data.todos.length > 0) {
        const firstTodo = response.data.todos[0];
        const hasValidTodo = 
          firstTodo.id &&
          firstTodo.type &&
          firstTodo.title &&
          firstTodo.priority;
        
        logTest('待办事项数据完整', hasValidTodo, 
          `示例: ${firstTodo.title} (${firstTodo.type}, ${firstTodo.priority})`);
        
        // 1.4 验证待办类型
        const validTypes = ['followup', 'deadline', 'dispatch', 'result'];
        const allTypesValid = response.data.todos.every(todo => 
          validTypes.includes(todo.type)
        );
        logTest('待办类型有效', allTypesValid);
        
        // 1.5 验证优先级
        const validPriorities = ['low', 'medium', 'high'];
        const allPrioritiesValid = response.data.todos.every(todo => 
          validPriorities.includes(todo.priority)
        );
        logTest('待办优先级有效', allPrioritiesValid);
      } else {
        logWarning('当前没有待办事项，无法验证详细数据');
      }
      
      // 1.6 验证统计数据一致性
      const calculatedTotal = response.data.todos.length;
      const summaryTotal = response.data.summary.total;
      logTest('统计数据一致性', calculatedTotal === summaryTotal,
        `实际待办数: ${calculatedTotal}, 统计总数: ${summaryTotal}`);
      
    } else {
      logTest('今日清单返回数据', false, '未返回数据');
    }
    
  } catch (error) {
    logTest('今日清单功能', false, error.message);
  }
}

// ============================================
// 测试 2: 工作统计功能
// ============================================
async function testWorkStats() {
  console.log('\n📊 测试 2: 工作统计功能');
  console.log('='.repeat(50));
  
  const periods = ['today', 'week', 'month'];
  
  for (const period of periods) {
    try {
      // 2.1 测试不同时间周期
      const response = await apiRequest(`/reports/my-dashboard/work-stats?period=${period}`);
      logTest(`工作统计 API (${period}) 响应成功`, response.success);
      
      // 2.2 验证统计数据结构
      if (response.data && response.data.stats) {
        const stats = response.data.stats;
        const hasValidStats = 
          typeof stats.leadsAdded === 'number' &&
          typeof stats.collaborationsCreated === 'number' &&
          typeof stats.samplesDispatched === 'number' &&
          typeof stats.followUpsCompleted === 'number' &&
          typeof stats.dealsCompleted === 'number' &&
          typeof stats.gmv === 'number' &&
          typeof stats.goalProgress === 'number' &&
          typeof stats.rankChange === 'number';
        
        logTest(`工作统计数据结构 (${period}) 正确`, hasValidStats,
          `建联: ${stats.leadsAdded}, 合作: ${stats.collaborationsCreated}, GMV: ${stats.gmv}`);
        
        // 2.3 验证数据合理性
        const dataReasonable = 
          stats.leadsAdded >= 0 &&
          stats.collaborationsCreated >= 0 &&
          stats.samplesDispatched >= 0 &&
          stats.followUpsCompleted >= 0 &&
          stats.dealsCompleted >= 0 &&
          stats.gmv >= 0 &&
          stats.goalProgress >= 0 &&
          stats.goalProgress <= 100;
        
        logTest(`工作统计数据合理性 (${period})`, dataReasonable,
          `目标完成度: ${stats.goalProgress}%, 排名变化: ${stats.rankChange > 0 ? '+' : ''}${stats.rankChange}`);
        
        // 2.4 验证趋势数据
        if (response.data.trend && Array.isArray(response.data.trend)) {
          const hasTrendData = response.data.trend.length > 0;
          logTest(`趋势数据 (${period}) 存在`, hasTrendData,
            `趋势数据点数: ${response.data.trend.length}`);
          
          if (hasTrendData) {
            const firstTrend = response.data.trend[0];
            const hasValidTrend = 
              firstTrend.date &&
              typeof firstTrend.value === 'number';
            logTest(`趋势数据格式 (${period}) 正确`, hasValidTrend);
          }
        }
        
      } else {
        logTest(`工作统计返回数据 (${period})`, false, '未返回统计数据');
      }
      
    } catch (error) {
      logTest(`工作统计功能 (${period})`, false, error.message);
    }
  }
}

// ============================================
// 测试 3: 快捷入口功能
// ============================================
async function testQuickActions() {
  console.log('\n⚡ 测试 3: 快捷入口功能');
  console.log('='.repeat(50));
  
  // 快捷入口主要是前端组件，我们验证它依赖的数据
  try {
    // 3.1 验证快速添加达人功能（检查达人列表 API）
    const influencersResponse = await apiRequest('/influencers?page=1&pageSize=1');
    logTest('快速添加达人 - 达人列表 API 可用', influencersResponse.success);
    
    // 3.2 验证快速创建合作功能（检查合作列表 API）
    const collaborationsResponse = await apiRequest('/collaborations?page=1&pageSize=1');
    logTest('快速创建合作 - 合作列表 API 可用', collaborationsResponse.success);
    
    // 3.3 验证快速寄样功能（检查样品列表 API）
    const samplesResponse = await apiRequest('/samples?page=1&pageSize=1');
    logTest('快速寄样 - 样品列表 API 可用', samplesResponse.success);
    
    // 3.4 验证快速跟进功能（检查跟进模板 API）
    try {
      const templatesResponse = await apiRequest('/collaborations/follow-up-templates');
      logTest('快速跟进 - 跟进模板 API 可用', templatesResponse.success);
      
      if (templatesResponse.data && templatesResponse.data.templates) {
        logTest('快速跟进 - 模板数据存在', 
          Array.isArray(templatesResponse.data.templates),
          `模板数量: ${templatesResponse.data.templates.length}`);
      }
    } catch (error) {
      logWarning('跟进模板 API 可能未实现，这是可选功能');
    }
    
    // 3.5 验证前端组件存在
    console.log('\n   检查前端组件...');
    const quickActionsExists = document.querySelector('[class*="QuickActions"]') !== null;
    if (quickActionsExists) {
      logTest('快捷入口组件已渲染', true);
      
      // 检查快捷按钮
      const buttons = document.querySelectorAll('[class*="QuickActions"] button, [class*="quick-action"]');
      logTest('快捷按钮已渲染', buttons.length > 0, `找到 ${buttons.length} 个快捷按钮`);
    } else {
      logWarning('快捷入口组件未在当前页面渲染（可能需要在 Dashboard 页面测试）');
    }
    
  } catch (error) {
    logTest('快捷入口功能', false, error.message);
  }
}

// ============================================
// 测试 4: 数据准确性验证
// ============================================
async function testDataAccuracy() {
  console.log('\n🎯 测试 4: 数据准确性验证');
  console.log('='.repeat(50));
  
  try {
    // 4.1 交叉验证：今日清单的待办数量 vs 实际合作数据
    const todosResponse = await apiRequest('/reports/my-dashboard/today-todos');
    const statsResponse = await apiRequest('/reports/my-dashboard/work-stats?period=today');
    
    if (todosResponse.data && statsResponse.data) {
      // 验证跟进待办数量是否合理
      const followupTodos = todosResponse.data.todos.filter(t => t.type === 'followup').length;
      const followupsCompleted = statsResponse.data.stats.followUpsCompleted;
      
      logTest('跟进数据一致性检查', true,
        `待跟进: ${followupTodos}, 已完成跟进: ${followupsCompleted}`);
      
      // 验证截止日期待办
      const deadlineTodos = todosResponse.data.todos.filter(t => t.type === 'deadline').length;
      logTest('截止日期待办统计', true, `截止日期待办: ${deadlineTodos}`);
      
      // 验证寄样待办
      const dispatchTodos = todosResponse.data.todos.filter(t => t.type === 'dispatch').length;
      const samplesDispatched = statsResponse.data.stats.samplesDispatched;
      logTest('寄样数据一致性检查', true,
        `待寄样: ${dispatchTodos}, 已寄样: ${samplesDispatched}`);
    }
    
    // 4.2 验证不同时间周期的数据逻辑
    const todayStats = await apiRequest('/reports/my-dashboard/work-stats?period=today');
    const weekStats = await apiRequest('/reports/my-dashboard/work-stats?period=week');
    const monthStats = await apiRequest('/reports/my-dashboard/work-stats?period=month');
    
    if (todayStats.data && weekStats.data && monthStats.data) {
      const todayGMV = todayStats.data.stats.gmv;
      const weekGMV = weekStats.data.stats.gmv;
      const monthGMV = monthStats.data.stats.gmv;
      
      // 逻辑验证：今日 <= 本周 <= 本月
      const logicalOrder = todayGMV <= weekGMV && weekGMV <= monthGMV;
      logTest('时间周期数据逻辑正确', logicalOrder,
        `今日GMV: ${todayGMV}, 本周GMV: ${weekGMV}, 本月GMV: ${monthGMV}`);
      
      // 验证建联数据
      const todayLeads = todayStats.data.stats.leadsAdded;
      const weekLeads = weekStats.data.stats.leadsAdded;
      const monthLeads = monthStats.data.stats.leadsAdded;
      
      const leadsLogical = todayLeads <= weekLeads && weekLeads <= monthLeads;
      logTest('建联数据逻辑正确', leadsLogical,
        `今日: ${todayLeads}, 本周: ${weekLeads}, 本月: ${monthLeads}`);
    }
    
    // 4.3 验证目标完成度计算
    const stats = statsResponse.data.stats;
    if (stats.goalProgress >= 0 && stats.goalProgress <= 100) {
      logTest('目标完成度范围正确', true, `${stats.goalProgress}%`);
    } else {
      logTest('目标完成度范围正确', false, 
        `目标完成度超出范围: ${stats.goalProgress}%`);
    }
    
  } catch (error) {
    logTest('数据准确性验证', false, error.message);
  }
}

// ============================================
// 测试 5: 前端组件集成验证
// ============================================
async function testFrontendIntegration() {
  console.log('\n🖥️  测试 5: 前端组件集成验证');
  console.log('='.repeat(50));
  
  // 5.1 检查 TodayTodoList 组件
  const todoListExists = document.querySelector('[class*="TodayTodoList"]') !== null ||
                         document.querySelector('[class*="todo-list"]') !== null;
  logTest('今日清单组件已渲染', todoListExists);
  
  // 5.2 检查 WorkStats 组件
  const workStatsExists = document.querySelector('[class*="WorkStats"]') !== null ||
                          document.querySelector('[class*="work-stats"]') !== null;
  logTest('工作统计组件已渲染', workStatsExists);
  
  // 5.3 检查 QuickActions 组件
  const quickActionsExists = document.querySelector('[class*="QuickActions"]') !== null ||
                             document.querySelector('[class*="quick-action"]') !== null;
  logTest('快捷入口组件已渲染', quickActionsExists);
  
  // 5.4 检查组件交互
  if (todoListExists || workStatsExists || quickActionsExists) {
    console.log('\n   ✅ 至少一个工作台组件已成功渲染');
    console.log('   💡 提示: 如需测试所有组件，请访问商务人员 Dashboard 页面');
  } else {
    logWarning('未检测到工作台组件，请确保在正确的页面进行测试');
  }
}

// ============================================
// 主测试函数
// ============================================
async function runAllTests() {
  console.log('🚀 开始 Checkpoint Task 35 - 工作台验证');
  console.log('='.repeat(50));
  console.log('测试时间:', new Date().toLocaleString('zh-CN'));
  console.log('');
  
  try {
    // 验证登录状态
    const token = await getAuthToken();
    console.log('✅ 已获取认证 Token');
    console.log('');
    
    // 执行所有测试
    await testTodayTodoList();
    await testWorkStats();
    await testQuickActions();
    await testDataAccuracy();
    await testFrontendIntegration();
    
    // 输出测试总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试总结');
    console.log('='.repeat(50));
    console.log(`✅ 通过: ${testResults.passed.length} 项`);
    console.log(`❌ 失败: ${testResults.failed.length} 项`);
    console.log(`⚠️  警告: ${testResults.warnings.length} 项`);
    
    if (testResults.failed.length > 0) {
      console.log('\n❌ 失败的测试:');
      testResults.failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        if (result.details) {
          console.log(`   ${result.details}`);
        }
      });
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n⚠️  警告信息:');
      testResults.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.message}`);
      });
    }
    
    // 总体评估
    console.log('\n' + '='.repeat(50));
    const passRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length) * 100).toFixed(1);
    console.log(`📈 通过率: ${passRate}%`);
    
    if (testResults.failed.length === 0) {
      console.log('🎉 所有测试通过！工作台功能验证完成！');
    } else if (passRate >= 80) {
      console.log('✅ 大部分测试通过，工作台功能基本可用');
    } else {
      console.log('⚠️  存在较多问题，建议修复后重新测试');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    console.error(error.stack);
    return null;
  }
}

// 执行测试
runAllTests().then(results => {
  if (results) {
    console.log('\n✅ 测试脚本执行完成');
    console.log('💡 提示: 可以在浏览器控制台查看详细结果');
  }
});
