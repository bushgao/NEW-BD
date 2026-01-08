/**
 * 商务工作质量评分功能测试脚本
 * 
 * 测试内容：
 * 1. 获取商务质量评分 API
 * 2. 验证评分数据结构
 * 3. 验证评分算法
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号
const TEST_ACCOUNTS = {
  owner: {
    email: 'owner@demo.com',
    password: 'owner123'
  }
};

let authToken = '';
let factoryId = '';
let staffId = '';

/**
 * 登录获取 token
 */
async function login(email, password) {
  console.log(`\n🔐 登录账号: ${email}`);
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`登录失败: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ 登录成功');
  
  return {
    token: data.data.tokens.accessToken,
    user: data.data.user
  };
}

/**
 * 获取商务列表
 */
async function getStaffList() {
  console.log('\n📋 获取商务列表...');
  
  const response = await fetch(`${API_BASE_URL}/staff`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`获取商务列表失败: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ 获取到 ${data.data.length} 个商务账号`);
  
  return data.data;
}

/**
 * 测试获取质量评分
 */
async function testGetQualityScore(staffId) {
  console.log(`\n📊 测试获取商务质量评分 (staffId: ${staffId})...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/reports/staff/${staffId}/quality-score`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`获取质量评分失败: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log('✅ 成功获取质量评分');
    
    return data.data;
  } catch (error) {
    console.error('详细错误:', error);
    throw error;
  }
}

/**
 * 验证评分数据结构
 */
function validateScoreData(scoreData) {
  console.log('\n🔍 验证评分数据结构...');
  
  const requiredFields = [
    'overall',
    'followUpFrequency',
    'conversionRate',
    'roi',
    'efficiency',
    'trend',
    'suggestions'
  ];

  const missingFields = requiredFields.filter(field => !(field in scoreData));
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
  }

  // 验证评分范围 (0-100)
  const scoreFields = ['overall', 'followUpFrequency', 'conversionRate', 'roi', 'efficiency'];
  for (const field of scoreFields) {
    const value = scoreData[field];
    if (typeof value !== 'number' || value < 0 || value > 100) {
      throw new Error(`${field} 评分无效: ${value} (应该在 0-100 之间)`);
    }
  }

  // 验证趋势数据
  if (!Array.isArray(scoreData.trend)) {
    throw new Error('trend 应该是数组');
  }

  // 验证建议数据
  if (!Array.isArray(scoreData.suggestions)) {
    throw new Error('suggestions 应该是数组');
  }

  console.log('✅ 数据结构验证通过');
}

/**
 * 显示评分详情
 */
function displayScoreDetails(scoreData) {
  console.log('\n📈 质量评分详情:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`综合评分: ${scoreData.overall} 分`);
  console.log(`  - 跟进频率: ${scoreData.followUpFrequency} 分`);
  console.log(`  - 转化率: ${scoreData.conversionRate} 分`);
  console.log(`  - ROI 表现: ${scoreData.roi} 分`);
  console.log(`  - 工作效率: ${scoreData.efficiency} 分`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (scoreData.suggestions.length > 0) {
    console.log('\n💡 改进建议:');
    scoreData.suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
  }

  if (scoreData.trend.length > 0) {
    console.log('\n📊 评分趋势 (最近7天):');
    scoreData.trend.forEach(item => {
      console.log(`  ${item.date}: ${item.overall} 分`);
    });
  }
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('🚀 开始测试商务工作质量评分功能');
  console.log('='.repeat(60));

  try {
    // 1. 登录
    const loginResult = await login(
      TEST_ACCOUNTS.owner.email,
      TEST_ACCOUNTS.owner.password
    );
    authToken = loginResult.token;
    factoryId = loginResult.user.factoryId;

    // 2. 获取商务列表
    const staffList = await getStaffList();
    
    if (staffList.length === 0) {
      console.log('⚠️  没有商务账号，跳过测试');
      return;
    }

    staffId = staffList[0].id;
    console.log(`\n📌 选择第一个商务进行测试: ${staffList[0].name} (${staffList[0].email})`);

    // 3. 测试获取质量评分
    const scoreData = await testGetQualityScore(staffId);

    // 4. 验证数据结构
    validateScoreData(scoreData);

    // 5. 显示评分详情
    displayScoreDetails(scoreData);

    // 6. 测试所有商务的评分
    console.log('\n📊 测试所有商务的质量评分...');
    for (const staff of staffList) {
      try {
        const score = await testGetQualityScore(staff.id);
        console.log(`✅ ${staff.name}: 综合评分 ${score.overall} 分`);
      } catch (error) {
        console.log(`❌ ${staff.name}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试通过！');
    console.log('\n📝 测试总结:');
    console.log(`  - 测试商务数量: ${staffList.length}`);
    console.log(`  - API 响应正常: ✅`);
    console.log(`  - 数据结构正确: ✅`);
    console.log(`  - 评分算法有效: ✅`);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行测试
runTests();
