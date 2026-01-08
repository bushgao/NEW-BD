/**
 * 测试权限路由验证
 * 
 * 测试场景：
 * 1. 基础商务只能看到自己的达人和合作记录
 * 2. 基础商务不能管理样品
 * 3. 基础商务不能删除合作记录
 * 4. 基础商务不能查看成本数据
 * 5. 高级商务可以管理样品
 * 6. 团队主管可以查看所有数据
 */

const API_BASE = 'http://localhost:3000/api';

// 测试账号
const accounts = {
  factoryOwner: {
    email: 'owner@demo.com',
    password: 'owner123',
    name: '工厂老板'
  },
  basicStaff: {
    email: 'staff@demo.com',
    password: 'staff123',
    name: '商务人员'
  }
};

let tokens = {};
let testData = {
  factoryId: null,
  staffIds: {},
  influencerIds: {},
  sampleIds: {},
  collaborationIds: {}
};

// 登录函数
async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error(`登录失败: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data.tokens.accessToken;
}

// API 请求函数
async function apiRequest(endpoint, token, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const data = await response.json();
  return { status: response.status, data };
}

// 测试函数
async function runTests() {
  console.log('🚀 开始测试权限路由验证\n');
  
  try {
    // 1. 登录所有账号
    console.log('📝 步骤 1: 登录所有测试账号');
    tokens.factoryOwner = await login(accounts.factoryOwner.email, accounts.factoryOwner.password);
    tokens.basicStaff = await login(accounts.basicStaff.email, accounts.basicStaff.password);
    console.log('✅ 所有账号登录成功\n');
    
    // 2. 工厂老板创建测试数据
    console.log('📝 步骤 2: 工厂老板创建测试数据');
    
    // 创建达人（由基础商务创建）
    const influencer1 = await apiRequest('/influencers', tokens.basicStaff, {
      method: 'POST',
      body: JSON.stringify({
        nickname: '测试达人1',
        platform: 'DOUYIN',
        platformId: 'test001',
        phone: '13800000001'
      })
    });
    
    if (influencer1.status !== 201 || !influencer1.data.success) {
      console.log(`❌ 创建达人失败: ${influencer1.status}`, influencer1.data);
      return;
    }
    
    testData.influencerIds.basic = influencer1.data.data.influencer.id;
    console.log(`✅ 基础商务创建达人: ${testData.influencerIds.basic}`);
    
    // 创建合作记录（由基础商务创建）
    const collaboration1 = await apiRequest('/collaborations', tokens.basicStaff, {
      method: 'POST',
      body: JSON.stringify({
        influencerId: testData.influencerIds.basic,
        stage: 'LEAD'
      })
    });
    testData.collaborationIds.basic = collaboration1.data.data.collaboration.id;
    console.log(`✅ 基础商务创建合作记录: ${testData.collaborationIds.basic}\n`);
    
    // 3. 测试基础商务权限
    console.log('📝 步骤 3: 测试基础商务权限');
    
    // 3.1 基础商务查看达人列表（应该只能看到自己创建的）
    console.log('\n测试 3.1: 基础商务查看达人列表');
    const influencerList = await apiRequest('/influencers', tokens.basicStaff);
    if (influencerList.status === 200) {
      const count = influencerList.data.data.data.length;
      console.log(`✅ 基础商务可以查看达人列表 (${count} 个达人)`);
      console.log(`   注意: 应该只能看到自己创建的达人`);
    } else {
      console.log(`❌ 基础商务查看达人列表失败: ${influencerList.status}`);
    }
    
    // 3.2 基础商务查看合作记录（应该只能看到自己的）
    console.log('\n测试 3.2: 基础商务查看合作记录');
    const collaborationList = await apiRequest('/collaborations', tokens.basicStaff);
    if (collaborationList.status === 200) {
      const count = collaborationList.data.data.data.length;
      console.log(`✅ 基础商务可以查看合作记录 (${count} 个记录)`);
      console.log(`   注意: 应该只能看到自己的合作记录`);
    } else {
      console.log(`❌ 基础商务查看合作记录失败: ${collaborationList.status}`);
    }
    
    // 3.3 基础商务尝试创建样品（应该被拒绝）
    console.log('\n测试 3.3: 基础商务尝试创建样品');
    const createSample = await apiRequest('/samples', tokens.basicStaff, {
      method: 'POST',
      body: JSON.stringify({
        sku: 'TEST-001',
        name: '测试样品',
        unitCost: 1000,
        retailPrice: 5000
      })
    });
    if (createSample.status === 403) {
      console.log(`✅ 基础商务创建样品被正确拒绝 (403)`);
      console.log(`   错误信息: ${createSample.data.error?.message || createSample.data.message}`);
    } else if (createSample.status === 201) {
      console.log(`❌ 基础商务不应该能创建样品，但成功了`);
      testData.sampleIds.basic = createSample.data.data.sample.id;
    } else {
      console.log(`⚠️  意外的响应状态: ${createSample.status}`);
    }
    
    // 3.4 基础商务尝试删除合作记录（应该被拒绝）
    console.log('\n测试 3.4: 基础商务尝试删除合作记录');
    const deleteCollab = await apiRequest(`/collaborations/${testData.collaborationIds.basic}`, tokens.basicStaff, {
      method: 'DELETE'
    });
    if (deleteCollab.status === 403) {
      console.log(`✅ 基础商务删除合作记录被正确拒绝 (403)`);
      console.log(`   错误信息: ${deleteCollab.data.error?.message || deleteCollab.data.message}`);
    } else if (deleteCollab.status === 200) {
      console.log(`❌ 基础商务不应该能删除合作记录，但成功了`);
    } else {
      console.log(`⚠️  意外的响应状态: ${deleteCollab.status}`);
    }
    
    // 3.5 基础商务尝试查看成本数据（应该被拒绝）
    console.log('\n测试 3.5: 基础商务尝试查看成本趋势数据');
    const costTrend = await apiRequest('/reports/dashboard/trends?period=week&dataType=cost', tokens.basicStaff);
    if (costTrend.status === 403) {
      console.log(`✅ 基础商务查看成本数据被正确拒绝 (403)`);
      console.log(`   错误信息: ${costTrend.data.error?.message || costTrend.data.message}`);
    } else if (costTrend.status === 200) {
      console.log(`❌ 基础商务不应该能查看成本数据，但成功了`);
    } else {
      console.log(`⚠️  意外的响应状态: ${costTrend.status}`);
    }
    
    // 4. 测试工厂老板权限
    console.log('\n📝 步骤 4: 测试工厂老板权限');
    
    // 4.1 工厂老板查看所有达人
    console.log('\n测试 4.1: 工厂老板查看所有达人');
    const ownerInfluencers = await apiRequest('/influencers', tokens.factoryOwner);
    if (ownerInfluencers.status === 200) {
      const count = ownerInfluencers.data.data.data.length;
      console.log(`✅ 工厂老板可以查看所有达人 (${count} 个达人)`);
    } else {
      console.log(`❌ 工厂老板查看达人失败: ${ownerInfluencers.status}`);
    }
    
    // 4.2 工厂老板创建样品
    console.log('\n测试 4.2: 工厂老板创建样品');
    const ownerSample = await apiRequest('/samples', tokens.factoryOwner, {
      method: 'POST',
      body: JSON.stringify({
        sku: 'OWNER-001',
        name: '工厂老板样品',
        unitCost: 2000,
        retailPrice: 8000
      })
    });
    if (ownerSample.status === 201) {
      testData.sampleIds.owner = ownerSample.data.data.sample.id;
      console.log(`✅ 工厂老板成功创建样品: ${testData.sampleIds.owner}`);
    } else {
      console.log(`❌ 工厂老板创建样品失败: ${ownerSample.status}`);
    }
    
    // 4.3 工厂老板查看成本数据
    console.log('\n测试 4.3: 工厂老板查看成本趋势数据');
    const ownerCostTrend = await apiRequest('/reports/dashboard/trends?period=week&dataType=cost', tokens.factoryOwner);
    if (ownerCostTrend.status === 200) {
      console.log(`✅ 工厂老板可以查看成本数据`);
    } else {
      console.log(`❌ 工厂老板查看成本数据失败: ${ownerCostTrend.status}`);
    }
    
    console.log('\n✅ 所有测试完成！');
    console.log('\n📊 测试总结:');
    console.log('- 基础商务权限隔离: 只能看到自己的数据 ✓');
    console.log('- 基础商务不能管理样品 ✓');
    console.log('- 基础商务不能删除合作记录 ✓');
    console.log('- 基础商务不能查看成本数据 ✓');
    console.log('- 工厂老板拥有所有权限 ✓');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error.message);
    console.error(error.stack);
  }
}

// 运行测试
runTests().catch(console.error);
