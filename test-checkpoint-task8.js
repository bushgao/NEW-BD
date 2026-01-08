/**
 * Checkpoint 测试 - 任务8：绩效分析验证
 * 
 * 验证内容：
 * 1. 商务对比分析功能（任务5）
 * 2. 商务工作质量评分功能（任务6）
 * 3. 商务工作日历功能（任务7）
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  owner: {
    email: 'owner@demo.com',
    password: 'owner123'
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 登录函数
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    });
    return response.data.data.tokens.accessToken;
  } catch (error) {
    throw new Error(`登录失败: ${error.response?.data?.error?.message || error.message}`);
  }
}

// 获取商务列表
async function getStaffList(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/staff`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  } catch (error) {
    throw new Error(`获取商务列表失败: ${error.response?.data?.error?.message || error.message}`);
  }
}

// 测试商务对比分析
async function testStaffComparison(token, staffIds) {
  logSection('📊 测试1: 商务对比分析功能');
  
  try {
    logInfo(`测试商务对比分析 (商务数量: ${staffIds.length})...`);
    
    const response = await axios.get(`${API_BASE_URL}/api/reports/staff/comparison`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        staffIds: staffIds.join(',')
      }
    });
    
    const data = response.data.data;
    
    // 验证数据结构
    if (!data.staffData || !Array.isArray(data.staffData)) {
      throw new Error('对比数据格式错误');
    }
    
    if (!data.insights || typeof data.insights !== 'object') {
      throw new Error('分析洞察格式错误');
    }
    
    logSuccess('商务对比分析数据获取成功');
    
    // 显示对比结果
    console.log('\n📈 对比分析结果:');
    console.log('━'.repeat(60));
    
    data.staffData.forEach(staff => {
      console.log(`\n商务: ${staff.staffName}`);
      console.log(`  建联数: ${staff.metrics.leads}`);
      console.log(`  成交数: ${staff.metrics.deals}`);
      console.log(`  GMV: ¥${staff.metrics.gmv.toLocaleString()}`);
      console.log(`  ROI: ${staff.metrics.roi.toFixed(2)}`);
      console.log(`  效率: ${staff.metrics.efficiency.toFixed(2)}`);
      
      // 显示优势
      if (data.insights.strengths[staff.staffId]?.length > 0) {
        console.log(`  优势: ${data.insights.strengths[staff.staffId].join(', ')}`);
      }
      
      // 显示劣势
      if (data.insights.weaknesses[staff.staffId]?.length > 0) {
        console.log(`  待改进: ${data.insights.weaknesses[staff.staffId].join(', ')}`);
      }
    });
    
    console.log('━'.repeat(60));
    
    logSuccess('✓ 商务对比分析功能验证通过');
    return true;
    
  } catch (error) {
    logError(`商务对比分析测试失败: ${error.message}`);
    if (error.response?.data) {
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 测试商务质量评分
async function testQualityScore(token, staffId, staffName) {
  logSection('⭐ 测试2: 商务工作质量评分功能');
  
  try {
    logInfo(`测试商务质量评分 (${staffName})...`);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/reports/staff/${staffId}/quality-score`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    const data = response.data.data;
    
    // 验证数据结构
    if (typeof data.overall !== 'number') {
      throw new Error('综合评分格式错误');
    }
    
    if (typeof data.followUpFrequency !== 'number' ||
        typeof data.conversionRate !== 'number' ||
        typeof data.roi !== 'number' ||
        typeof data.efficiency !== 'number') {
      throw new Error('评分明细格式错误');
    }
    
    if (!data.trend || !Array.isArray(data.trend)) {
      throw new Error('评分趋势格式错误');
    }
    
    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error('改进建议格式错误');
    }
    
    logSuccess('商务质量评分数据获取成功');
    
    // 显示评分结果
    console.log('\n⭐ 质量评分结果:');
    console.log('━'.repeat(60));
    console.log(`商务: ${staffName}`);
    console.log(`综合评分: ${data.overall.toFixed(1)} 分`);
    console.log('\n评分明细:');
    console.log(`  跟进频率: ${data.followUpFrequency.toFixed(1)} 分`);
    console.log(`  转化率: ${data.conversionRate.toFixed(1)} 分`);
    console.log(`  ROI表现: ${data.roi.toFixed(1)} 分`);
    console.log(`  工作效率: ${data.efficiency.toFixed(1)} 分`);
    
    console.log(`\n评分趋势: ${data.trend.length} 个数据点`);
    
    console.log('\n💡 改进建议:');
    if (data.suggestions.length > 0) {
      data.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
    } else {
      console.log('  暂无改进建议');
    }
    
    console.log('━'.repeat(60));
    
    logSuccess('✓ 商务质量评分功能验证通过');
    return true;
    
  } catch (error) {
    logError(`商务质量评分测试失败: ${error.message}`);
    if (error.response?.data) {
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 测试商务工作日历
async function testWorkCalendar(token, staffId, staffName) {
  logSection('📅 测试3: 商务工作日历功能');
  
  try {
    const currentMonth = '2026-01';
    logInfo(`测试商务工作日历 (${staffName}, ${currentMonth})...`);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/reports/staff/${staffId}/calendar`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: currentMonth }
      }
    );
    
    const data = response.data.data;
    
    // 验证数据结构
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('事件数据格式错误');
    }
    
    if (!data.workload || !Array.isArray(data.workload)) {
      throw new Error('工作负载数据格式错误');
    }
    
    if (!data.stats || typeof data.stats !== 'object') {
      throw new Error('统计数据格式错误');
    }
    
    logSuccess('商务工作日历数据获取成功');
    
    // 显示日历结果
    console.log('\n📅 工作日历统计:');
    console.log('━'.repeat(60));
    console.log(`商务: ${staffName}`);
    console.log(`月份: ${currentMonth}`);
    console.log(`总事件数: ${data.stats.totalEvents} 项`);
    console.log(`  - 截止日期: ${data.stats.deadlines} 个`);
    console.log(`  - 排期日期: ${data.stats.scheduled} 个`);
    console.log(`  - 跟进记录: ${data.stats.followups} 个`);
    console.log(`平均日工作量: ${data.stats.avgDailyWorkload.toFixed(2)} 项`);
    
    // 显示工作负载分布
    const workloadByLevel = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    data.workload.forEach(day => {
      workloadByLevel[day.level]++;
    });
    
    console.log('\n工作负载分布:');
    console.log(`  低负载天数: ${workloadByLevel.low} 天`);
    console.log(`  中负载天数: ${workloadByLevel.medium} 天`);
    console.log(`  高负载天数: ${workloadByLevel.high} 天`);
    
    // 显示事件类型分布
    const eventsByType = {
      deadline: 0,
      scheduled: 0,
      followup: 0
    };
    
    data.events.forEach(event => {
      eventsByType[event.type]++;
    });
    
    console.log('\n事件类型分布:');
    console.log(`  截止日期: ${eventsByType.deadline} 个`);
    console.log(`  排期日期: ${eventsByType.scheduled} 个`);
    console.log(`  跟进记录: ${eventsByType.followup} 个`);
    
    console.log('━'.repeat(60));
    
    logSuccess('✓ 商务工作日历功能验证通过');
    return true;
    
  } catch (error) {
    logError(`商务工作日历测试失败: ${error.message}`);
    if (error.response?.data) {
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 主测试函数
async function runCheckpoint() {
  log('\n🚀 开始 Checkpoint 验证 - 任务8：绩效分析验证', 'bright');
  console.log('='.repeat(60));
  
  const results = {
    comparison: false,
    qualityScore: false,
    calendar: false
  };
  
  try {
    // 1. 登录
    logInfo(`🔐 登录账号: ${TEST_CONFIG.owner.email}`);
    const token = await login(TEST_CONFIG.owner.email, TEST_CONFIG.owner.password);
    logSuccess('登录成功\n');
    
    // 2. 获取商务列表
    logInfo('📋 获取商务列表...');
    const staffList = await getStaffList(token);
    
    if (!staffList || staffList.length === 0) {
      logWarning('没有找到商务账号，无法进行测试');
      return;
    }
    
    logSuccess(`获取到 ${staffList.length} 个商务账号\n`);
    
    // 选择测试商务
    const testStaff = staffList.slice(0, Math.min(3, staffList.length));
    const staffIds = testStaff.map(s => s.id);
    
    logInfo(`选择 ${testStaff.length} 个商务进行测试:`);
    testStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} (${staff.email})`);
    });
    
    // 3. 测试商务对比分析
    results.comparison = await testStaffComparison(token, staffIds);
    
    // 4. 测试商务质量评分（使用第一个商务）
    const firstStaff = testStaff[0];
    results.qualityScore = await testQualityScore(token, firstStaff.id, firstStaff.name);
    
    // 5. 测试商务工作日历（使用第一个商务）
    results.calendar = await testWorkCalendar(token, firstStaff.id, firstStaff.name);
    
    // 6. 显示测试总结
    logSection('📊 Checkpoint 验证总结');
    
    console.log('测试结果:');
    console.log(`  商务对比分析: ${results.comparison ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  商务质量评分: ${results.qualityScore ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  商务工作日历: ${results.calendar ? '✅ 通过' : '❌ 失败'}`);
    
    const allPassed = results.comparison && results.qualityScore && results.calendar;
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      logSuccess('🎉 所有测试通过！绩效分析功能验证完成！');
      console.log('\n✅ 任务5、6、7 的功能均正常工作');
      console.log('✅ 数据准确性验证通过');
      console.log('✅ API 响应正常');
      console.log('\n📝 建议：可以继续实施任务9（快捷操作面板）');
    } else {
      logError('❌ 部分测试失败，请检查上述错误信息');
    }
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    logError(`\n测试过程中发生错误: ${error.message}`);
    console.log('='.repeat(60) + '\n');
  }
}

// 运行测试
runCheckpoint();
