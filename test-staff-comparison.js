/**
 * 测试商务对比分析功能
 * 
 * 测试步骤:
 * 1. 工厂老板登录
 * 2. 获取商务列表
 * 3. 选择2-3个商务进行对比
 * 4. 验证对比数据和优劣势分析
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号
const OWNER_CREDENTIALS = {
  email: 'owner@demo.com',
  password: 'owner123',
};

let ownerToken = '';

// 登录函数
async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    if (response.data.success) {
      console.log(`✅ 登录成功: ${credentials.email}`);
      return response.data.data.token;
    } else {
      console.error(`❌ 登录失败: ${response.data.error?.message}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ 登录请求失败:`, error.response?.data || error.message);
    return null;
  }
}

// 获取工厂看板数据（包含商务列表）
async function getFactoryDashboard(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { period: 'month' },
    });
    
    if (response.data.success) {
      console.log('✅ 获取工厂看板数据成功');
      return response.data.data;
    } else {
      console.error('❌ 获取工厂看板数据失败:', response.data.error?.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取工厂看板数据请求失败:', error.response?.data || error.message);
    return null;
  }
}

// 获取商务对比分析数据
async function getStaffComparison(token, staffIds) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports/staff/comparison`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { staffIds: staffIds.join(',') },
    });
    
    if (response.data.success) {
      console.log('✅ 获取商务对比数据成功');
      return response.data.data;
    } else {
      console.error('❌ 获取商务对比数据失败:', response.data.error?.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 获取商务对比数据请求失败:', error.response?.data || error.message);
    return null;
  }
}

// 主测试流程
async function runTests() {
  console.log('========================================');
  console.log('开始测试商务对比分析功能');
  console.log('========================================\n');

  // 1. 工厂老板登录
  console.log('步骤 1: 工厂老板登录');
  ownerToken = await login(OWNER_CREDENTIALS);
  if (!ownerToken) {
    console.error('❌ 测试终止：工厂老板登录失败');
    return;
  }
  console.log('');

  // 2. 获取工厂看板数据（包含商务列表）
  console.log('步骤 2: 获取工厂看板数据');
  const dashboard = await getFactoryDashboard(ownerToken);
  if (!dashboard || !dashboard.staffRanking || dashboard.staffRanking.length === 0) {
    console.error('❌ 测试终止：没有商务数据');
    return;
  }
  
  console.log(`📊 商务排行榜:`);
  dashboard.staffRanking.forEach((staff, index) => {
    console.log(`   ${index + 1}. ${staff.staffName} - 成交: ${staff.closedDeals}单, GMV: ¥${(staff.totalGmv / 100).toFixed(2)}`);
  });
  console.log('');

  // 3. 选择前2个商务进行对比
  console.log('步骤 3: 选择商务进行对比');
  const staffIds = dashboard.staffRanking.slice(0, Math.min(2, dashboard.staffRanking.length)).map(s => s.staffId);
  console.log(`选择的商务ID: ${staffIds.join(', ')}`);
  console.log('');

  // 4. 获取商务对比数据
  console.log('步骤 4: 获取商务对比数据');
  const comparison = await getStaffComparison(ownerToken, staffIds);
  if (!comparison) {
    console.error('❌ 测试终止：获取对比数据失败');
    return;
  }
  console.log('');

  // 5. 验证对比数据
  console.log('步骤 5: 验证对比数据');
  console.log('========================================');
  console.log('📊 商务对比分析结果');
  console.log('========================================\n');

  comparison.staffData.forEach((staff, index) => {
    console.log(`${index + 1}. ${staff.staffName}`);
    console.log('   原始指标:');
    console.log(`      - 建联数: ${staff.metrics.leads}`);
    console.log(`      - 成交数: ${staff.metrics.deals}`);
    console.log(`      - GMV: ¥${staff.metrics.gmv.toFixed(2)}`);
    console.log(`      - ROI: ${staff.metrics.roi.toFixed(2)}`);
    console.log(`      - 效率分数: ${staff.metrics.efficiency.toFixed(2)}`);
    console.log('   归一化指标 (0-100):');
    console.log(`      - 建联数: ${staff.normalizedMetrics.leads.toFixed(2)}`);
    console.log(`      - 成交数: ${staff.normalizedMetrics.deals.toFixed(2)}`);
    console.log(`      - GMV: ${staff.normalizedMetrics.gmv.toFixed(2)}`);
    console.log(`      - ROI: ${staff.normalizedMetrics.roi.toFixed(2)}`);
    console.log(`      - 效率: ${staff.normalizedMetrics.efficiency.toFixed(2)}`);
    
    // 优势
    if (comparison.insights.strengths[staff.staffId]?.length > 0) {
      console.log(`   ✅ 优势: ${comparison.insights.strengths[staff.staffId].join(', ')}`);
    }
    
    // 劣势
    if (comparison.insights.weaknesses[staff.staffId]?.length > 0) {
      console.log(`   ⚠️  待提升: ${comparison.insights.weaknesses[staff.staffId].join(', ')}`);
    }
    
    console.log('');
  });

  // 6. 测试边界情况
  console.log('步骤 6: 测试边界情况');
  console.log('========================================');
  
  // 测试只选择1个商务（应该失败）
  console.log('测试 6.1: 只选择1个商务（应该失败）');
  const singleStaffResult = await getStaffComparison(ownerToken, [staffIds[0]]);
  if (!singleStaffResult) {
    console.log('✅ 正确拒绝了只选择1个商务的请求');
  } else {
    console.log('❌ 错误：应该拒绝只选择1个商务的请求');
  }
  console.log('');

  // 测试选择超过3个商务（如果有足够的商务）
  if (dashboard.staffRanking.length >= 4) {
    console.log('测试 6.2: 选择超过3个商务（应该失败）');
    const tooManyStaffIds = dashboard.staffRanking.slice(0, 4).map(s => s.staffId);
    const tooManyResult = await getStaffComparison(ownerToken, tooManyStaffIds);
    if (!tooManyResult) {
      console.log('✅ 正确拒绝了选择超过3个商务的请求');
    } else {
      console.log('❌ 错误：应该拒绝选择超过3个商务的请求');
    }
    console.log('');
  }

  console.log('========================================');
  console.log('✅ 商务对比分析功能测试完成');
  console.log('========================================');
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
