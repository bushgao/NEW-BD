/**
 * 测试脚本 - 达人分组管理功能
 * 对应任务 22 和 Checkpoint 23
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号 - 工厂老板
const FACTORY_OWNER = {
  email: 'owner@demo.com',
  password: 'owner123'
};

// 测试账号 - 商务人员
const STAFF_USER = {
  email: 'staff@demo.com',
  password: 'staff123'
};

let factoryOwnerToken = '';
let staffUserToken = '';
let testGroupId = null;
let testInfluencerId = null;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
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
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logTest(testName) {
  log(`\n📋 测试: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 登录函数
async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    // 检查响应结构
    if (response.data.data && response.data.data.tokens && response.data.data.tokens.accessToken) {
      return response.data.data.tokens.accessToken;
    } else if (response.data.data && response.data.data.token) {
      return response.data.data.token;
    } else if (response.data.token) {
      return response.data.token;
    } else {
      throw new Error('登录响应中没有找到 token');
    }
  } catch (error) {
    throw new Error(`登录失败: ${error.response?.data?.message || error.message}`);
  }
}

// 测试 1: 创建分组
async function testCreateGroup() {
  logTest('创建达人分组');
  
  try {
    // 使用时间戳确保名称唯一
    const timestamp = Date.now();
    const response = await axios.post(
      `${API_BASE_URL}/influencers/groups`,
      {
        name: `测试分组_${timestamp}`,
        description: '这是一个测试分组',
        color: '#1890ff'
      },
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    const group = response.data.data;
    testGroupId = group.id;
    logSuccess(`创建分组成功: ${group.name} (ID: ${testGroupId})`);
    console.log('   分组信息:', JSON.stringify(group, null, 2));
    return true;
  } catch (error) {
    logError(`创建分组失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 2: 获取分组列表
async function testGetGroups() {
  logTest('获取分组列表');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/influencers/groups`,
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    const groups = response.data.data;
    logSuccess(`获取到 ${groups.length} 个分组`);
    groups.forEach(group => {
      console.log(`   - ${group.name} (${group.influencerCount || 0} 个达人)`);
    });
    return true;
  } catch (error) {
    logError(`获取分组列表失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 3: 获取分组统计
async function testGetGroupStats() {
  logTest('获取分组统计数据');
  
  if (!testGroupId) {
    logWarning('跳过测试 - 没有测试分组ID');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/influencers/groups/${testGroupId}/stats`,
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    const stats = response.data.data;
    logSuccess('获取分组统计成功');
    console.log('   统计数据:', JSON.stringify(stats, null, 2));
    return true;
  } catch (error) {
    logError(`获取分组统计失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 4: 获取达人列表（用于后续测试）
async function getTestInfluencer() {
  logTest('获取测试达人');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/influencers?page=1&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    if (response.data.data && response.data.data.length > 0) {
      testInfluencerId = response.data.data[0].id;
      logSuccess(`找到测试达人: ${response.data.data[0].name} (ID: ${testInfluencerId})`);
      return true;
    } else {
      logWarning('没有找到达人，请先添加达人数据');
      return false;
    }
  } catch (error) {
    logError(`获取达人失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 5: 移动达人到分组
async function testMoveInfluencerToGroup() {
  logTest('移动达人到分组');
  
  if (!testGroupId || !testInfluencerId) {
    logWarning('跳过测试 - 缺少测试分组ID或达人ID');
    return false;
  }
  
  try {
    const response = await axios.put(
      `${API_BASE_URL}/influencers/${testInfluencerId}/group`,
      { groupId: testGroupId },
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    const influencer = response.data.data;
    logSuccess(`成功将达人移动到分组 ${testGroupId}`);
    console.log('   更新后的达人信息:', JSON.stringify(influencer, null, 2));
    return true;
  } catch (error) {
    logError(`移动达人失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 6: 按分组筛选达人
async function testFilterInfluencersByGroup() {
  logTest('按分组筛选达人');
  
  if (!testGroupId) {
    logWarning('跳过测试 - 没有测试分组ID');
    return false;
  }
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/influencers?groupId=${testGroupId}`,
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    const data = response.data.data || response.data;
    const total = data.total || 0;
    const influencers = data.data || data;
    
    logSuccess(`分组中有 ${total} 个达人`);
    if (influencers && influencers.length > 0) {
      influencers.forEach(influencer => {
        console.log(`   - ${influencer.name} (${influencer.platform})`);
      });
    }
    return true;
  } catch (error) {
    logError(`筛选达人失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 7: 更新分组
async function testUpdateGroup() {
  logTest('更新分组信息');
  
  if (!testGroupId) {
    logWarning('跳过测试 - 没有测试分组ID');
    return false;
  }
  
  try {
    const response = await axios.put(
      `${API_BASE_URL}/influencers/groups/${testGroupId}`,
      {
        name: '测试分组A（已更新）',
        description: '更新后的描述',
        color: '#52c41a'
      },
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    const group = response.data.data;
    logSuccess('更新分组成功');
    console.log('   更新后的分组:', JSON.stringify(group, null, 2));
    return true;
  } catch (error) {
    logError(`更新分组失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 8: 商务人员权限测试
async function testStaffPermissions() {
  logTest('测试商务人员权限');
  
  try {
    // 商务人员应该能看到分组列表
    const response = await axios.get(
      `${API_BASE_URL}/influencers/groups`,
      {
        headers: { Authorization: `Bearer ${staffUserToken}` }
      }
    );
    
    const groups = response.data.data;
    logSuccess(`商务人员可以查看分组列表 (${groups.length} 个分组)`);
    
    // 商务人员应该能按分组筛选达人
    if (testGroupId) {
      const filterResponse = await axios.get(
        `${API_BASE_URL}/influencers?groupId=${testGroupId}`,
        {
          headers: { Authorization: `Bearer ${staffUserToken}` }
        }
      );
      logSuccess(`商务人员可以按分组筛选达人 (${filterResponse.data.total} 个)`);
    }
    
    return true;
  } catch (error) {
    logError(`商务人员权限测试失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 测试 9: 删除分组
async function testDeleteGroup() {
  logTest('删除分组');
  
  if (!testGroupId) {
    logWarning('跳过测试 - 没有测试分组ID');
    return false;
  }
  
  try {
    await axios.delete(
      `${API_BASE_URL}/influencers/groups/${testGroupId}`,
      {
        headers: { Authorization: `Bearer ${factoryOwnerToken}` }
      }
    );
    
    logSuccess('删除分组成功');
    
    // 验证达人的 groupId 已被清除
    if (testInfluencerId) {
      const influencerResponse = await axios.get(
        `${API_BASE_URL}/influencers/${testInfluencerId}`,
        {
          headers: { Authorization: `Bearer ${factoryOwnerToken}` }
        }
      );
      
      if (influencerResponse.data.groupId === null) {
        logSuccess('达人的分组关联已正确清除');
      } else {
        logWarning('达人的分组关联未清除');
      }
    }
    
    return true;
  } catch (error) {
    logError(`删除分组失败: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// 主测试流程
async function runTests() {
  logSection('🧪 达人分组管理功能测试');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  try {
    // 登录
    logSection('1. 用户登录');
    try {
      factoryOwnerToken = await login(FACTORY_OWNER);
      logSuccess('工厂老板登录成功');
      
      staffUserToken = await login(STAFF_USER);
      logSuccess('商务人员登录成功');
    } catch (error) {
      logError(error.message);
      process.exit(1);
    }
    
    // 运行测试
    logSection('2. 功能测试');
    
    const tests = [
      { name: '创建分组', fn: testCreateGroup },
      { name: '获取分组列表', fn: testGetGroups },
      { name: '获取分组统计', fn: testGetGroupStats },
      { name: '获取测试达人', fn: getTestInfluencer },
      { name: '移动达人到分组', fn: testMoveInfluencerToGroup },
      { name: '按分组筛选达人', fn: testFilterInfluencersByGroup },
      { name: '更新分组', fn: testUpdateGroup },
      { name: '商务人员权限', fn: testStaffPermissions },
      { name: '删除分组', fn: testDeleteGroup }
    ];
    
    for (const test of tests) {
      results.total++;
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
    
    // 测试总结
    logSection('📊 测试总结');
    console.log(`总测试数: ${results.total}`);
    logSuccess(`通过: ${results.passed}`);
    if (results.failed > 0) {
      logError(`失败: ${results.failed}`);
    }
    console.log(`通过率: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    if (results.failed === 0) {
      logSection('✅ 所有测试通过！');
      log('\n任务 22 - 达人分组管理功能验证完成！', 'green');
    } else {
      logSection('⚠️  部分测试失败');
      log('\n请检查失败的测试项', 'yellow');
    }
    
  } catch (error) {
    logError(`测试过程出错: ${error.message}`);
    console.error(error);
  }
}

// 运行测试
runTests();
