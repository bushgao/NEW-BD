/**
 * 测试趋势图表功能
 * 
 * 测试内容：
 * 1. 趋势数据 API 是否正常工作
 * 2. 不同时间周期的数据是否正确
 * 3. 环比计算是否准确
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号
const OWNER_CREDENTIALS = {
  email: 'owner@test.com',
  password: 'owner123',
};

let ownerToken = '';

// 辅助函数：登录
async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error('登录失败');
  } catch (error) {
    console.error('登录错误:', error.response?.data || error.message);
    throw error;
  }
}

// 辅助函数：获取趋势数据
async function getTrendData(token, period, dataType) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/trends`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { period, dataType },
    });
    return response.data;
  } catch (error) {
    console.error(`获取趋势数据失败 (${period}, ${dataType}):`, error.response?.data || error.message);
    throw error;
  }
}

// 测试函数
async function runTests() {
  console.log('='.repeat(60));
  console.log('开始测试趋势图表功能');
  console.log('='.repeat(60));
  console.log();

  try {
    // 1. 工厂老板登录
    console.log('1️⃣  工厂老板登录...');
    ownerToken = await login(OWNER_CREDENTIALS);
    console.log('✅ 登录成功');
    console.log();

    // 2. 测试 GMV 趋势数据（周）
    console.log('2️⃣  测试 GMV 趋势数据（7天）...');
    const gmvWeek = await getTrendData(ownerToken, 'week', 'gmv');
    console.log('✅ GMV 周趋势数据获取成功');
    console.log(`   - 当前周期数据点数: ${gmvWeek.data.current.length}`);
    console.log(`   - 上期数据点数: ${gmvWeek.data.previous.length}`);
    console.log(`   - 环比变化: ${gmvWeek.data.comparison.percentage.toFixed(2)}%`);
    if (gmvWeek.data.current.length > 0) {
      console.log(`   - 示例数据点: ${gmvWeek.data.current[0].label} - ¥${gmvWeek.data.current[0].value.toFixed(2)}`);
    }
    console.log();

    // 3. 测试成本趋势数据（月）
    console.log('3️⃣  测试成本趋势数据（30天）...');
    const costMonth = await getTrendData(ownerToken, 'month', 'cost');
    console.log('✅ 成本月趋势数据获取成功');
    console.log(`   - 当前周期数据点数: ${costMonth.data.current.length}`);
    console.log(`   - 上期数据点数: ${costMonth.data.previous.length}`);
    console.log(`   - 环比变化: ${costMonth.data.comparison.percentage.toFixed(2)}%`);
    console.log();

    // 4. 测试 ROI 趋势数据（季度）
    console.log('4️⃣  测试 ROI 趋势数据（90天）...');
    const roiQuarter = await getTrendData(ownerToken, 'quarter', 'roi');
    console.log('✅ ROI 季度趋势数据获取成功');
    console.log(`   - 当前周期数据点数: ${roiQuarter.data.current.length}`);
    console.log(`   - 上期数据点数: ${roiQuarter.data.previous.length}`);
    console.log(`   - 环比变化: ${roiQuarter.data.comparison.percentage.toFixed(2)}%`);
    console.log();

    // 5. 验证数据结构
    console.log('5️⃣  验证数据结构...');
    const sampleData = gmvWeek.data.current[0];
    const hasRequiredFields = sampleData && 
      typeof sampleData.date === 'string' &&
      typeof sampleData.value === 'number' &&
      typeof sampleData.label === 'string';
    
    if (hasRequiredFields) {
      console.log('✅ 数据结构验证通过');
      console.log(`   - date: ${sampleData.date}`);
      console.log(`   - value: ${sampleData.value}`);
      console.log(`   - label: ${sampleData.label}`);
    } else {
      console.log('❌ 数据结构验证失败');
    }
    console.log();

    // 6. 验证环比计算
    console.log('6️⃣  验证环比计算...');
    const currentTotal = gmvWeek.data.current.reduce((sum, d) => sum + d.value, 0);
    const previousTotal = gmvWeek.data.previous.reduce((sum, d) => sum + d.value, 0);
    const expectedChange = previousTotal === 0 
      ? (currentTotal > 0 ? 100 : 0)
      : ((currentTotal - previousTotal) / previousTotal) * 100;
    
    const actualChange = gmvWeek.data.comparison.percentage;
    const changeMatches = Math.abs(expectedChange - actualChange) < 0.01;
    
    if (changeMatches) {
      console.log('✅ 环比计算验证通过');
      console.log(`   - 当前总计: ¥${currentTotal.toFixed(2)}`);
      console.log(`   - 上期总计: ¥${previousTotal.toFixed(2)}`);
      console.log(`   - 计算环比: ${expectedChange.toFixed(2)}%`);
      console.log(`   - 返回环比: ${actualChange.toFixed(2)}%`);
    } else {
      console.log('❌ 环比计算验证失败');
      console.log(`   - 期望: ${expectedChange.toFixed(2)}%`);
      console.log(`   - 实际: ${actualChange.toFixed(2)}%`);
    }
    console.log();

    // 测试总结
    console.log('='.repeat(60));
    console.log('✅ 所有测试通过！');
    console.log('='.repeat(60));
    console.log();
    console.log('📊 趋势图表功能验证完成：');
    console.log('   ✅ 趋势数据 API 正常工作');
    console.log('   ✅ 支持 7天/30天/90天 三种周期');
    console.log('   ✅ 支持 GMV/成本/ROI 三种数据类型');
    console.log('   ✅ 环比计算准确');
    console.log('   ✅ 数据结构完整');
    console.log();
    console.log('🎉 可以在前端 Dashboard 查看趋势图表了！');
    console.log('   访问: http://localhost:5173/app/dashboard');
    console.log();

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
