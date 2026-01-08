/**
 * 测试达人详情功能 - 修复验证
 * 
 * 测试修复后的API是否正常工作
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试账号
const TEST_ACCOUNTS = {
  factoryOwner: {
    email: 'owner@demo.com',
    password: 'owner123',
    name: '工厂老板'
  }
};

let authToken = '';
let factoryId = '';

/**
 * 登录获取token
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password
    });
    
    if (!response.data || !response.data.token) {
      throw new Error('登录响应格式错误');
    }
    
    console.log(`✅ 登录成功: ${response.data.user?.name || '用户'}`);
    return {
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.error(`❌ 登录失败:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * 获取达人列表
 */
async function getInfluencers() {
  try {
    const response = await axios.get(`${API_BASE}/influencers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ 获取达人列表成功，共 ${response.data.length} 个达人`);
    return response.data;
  } catch (error) {
    console.error(`❌ 获取达人列表失败:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * 测试达人合作历史API
 */
async function testCollaborationHistory(influencerId) {
  try {
    console.log(`\n📋 测试合作历史 API...`);
    const response = await axios.get(
      `${API_BASE}/influencers/${influencerId}/collaboration-history`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`✅ 合作历史 API 成功`);
    console.log(`   - 合作记录数: ${response.data.length}`);
    
    if (response.data.length > 0) {
      const firstCollab = response.data[0];
      console.log(`   - 第一条记录:`);
      console.log(`     * 样品: ${firstCollab.sampleName}`);
      console.log(`     * 商务: ${firstCollab.businessStaffName}`);
      console.log(`     * 阶段: ${firstCollab.stage}`);
      if (firstCollab.result) {
        console.log(`     * GMV: ¥${(firstCollab.result.salesGmv / 100).toFixed(2)}`);
        console.log(`     * 成本: ¥${(firstCollab.result.cost / 100).toFixed(2)}`);
        console.log(`     * ROI: ${firstCollab.result.roi.toFixed(2)}%`);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ 合作历史 API 失败:`, error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error(`   服务器错误详情:`, error.response.data);
    }
    throw error;
  }
}

/**
 * 测试达人ROI统计API
 */
async function testROIStats(influencerId) {
  try {
    console.log(`\n📊 测试 ROI 统计 API...`);
    const response = await axios.get(
      `${API_BASE}/influencers/${influencerId}/roi-stats`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`✅ ROI 统计 API 成功`);
    console.log(`   - 平均ROI: ${response.data.avgROI.toFixed(2)}%`);
    console.log(`   - 总GMV: ¥${(response.data.totalGMV / 100).toFixed(2)}`);
    console.log(`   - 总成本: ¥${(response.data.totalCost / 100).toFixed(2)}`);
    console.log(`   - 合作次数: ${response.data.collaborationCount}`);
    console.log(`   - 成功率: ${response.data.successRate.toFixed(2)}%`);
    
    if (response.data.bestSample) {
      console.log(`   - 最佳样品: ${response.data.bestSample.name}`);
      console.log(`     * ROI: ${response.data.bestSample.roi.toFixed(2)}%`);
      console.log(`     * GMV: ¥${(response.data.bestSample.gmv / 100).toFixed(2)}`);
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ ROI 统计 API 失败:`, error.response?.data || error.message);
    if (error.response?.status === 500) {
      console.error(`   服务器错误详情:`, error.response.data);
    }
    throw error;
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('🧪 开始测试达人详情功能修复...\n');
  
  try {
    // 1. 登录
    console.log('1️⃣ 登录测试账号...');
    const loginResult = await login(
      TEST_ACCOUNTS.factoryOwner.email,
      TEST_ACCOUNTS.factoryOwner.password
    );
    authToken = loginResult.token;
    factoryId = loginResult.user.factoryId;
    
    // 2. 获取达人列表
    console.log('\n2️⃣ 获取达人列表...');
    const influencers = await getInfluencers();
    
    if (influencers.length === 0) {
      console.log('⚠️  没有达人数据，无法测试详情功能');
      return;
    }
    
    // 3. 测试第一个达人的详情API
    const testInfluencer = influencers[0];
    console.log(`\n3️⃣ 测试达人详情 API (${testInfluencer.nickname})...`);
    
    // 测试合作历史
    await testCollaborationHistory(testInfluencer.id);
    
    // 测试ROI统计
    await testROIStats(testInfluencer.id);
    
    console.log('\n✅ 所有测试通过！达人详情功能已修复。');
    
  } catch (error) {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }
}

// 运行测试
runTests();
