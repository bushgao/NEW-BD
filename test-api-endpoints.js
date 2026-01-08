// 测试平台管理API端点
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// 测试用的token（需要平台管理员账号）
// 注意：实际测试时需要先登录获取真实token
let adminToken = '';

async function login() {
  console.log('🔐 登录获取管理员token...');
  try {
    // 尝试使用种子数据中的平台管理员账号
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });
    
    adminToken = response.data.token;
    console.log('✅ 登录成功！');
    return true;
  } catch (error) {
    console.log('⚠️  使用默认管理员账号登录失败，尝试其他账号...');
    
    // 尝试其他可能的管理员账号
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'platform@admin.com',
        password: 'admin123',
      });
      adminToken = response.data.token;
      console.log('✅ 登录成功！');
      return true;
    } catch (err) {
      console.log('❌ 登录失败，请确保有平台管理员账号');
      console.log('提示：可以在数据库中创建一个 PLATFORM_ADMIN 角色的用户');
      return false;
    }
  }
}

async function testPlatformInfluencersAPI() {
  console.log('\n🧪 测试平台达人管理API...\n');

  try {
    // 1. 测试获取达人列表
    console.log('1️⃣ 测试 GET /api/platform/influencers');
    try {
      const response = await axios.get(`${API_BASE}/platform/influencers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: {
          page: 1,
          limit: 10,
        },
      });
      
      console.log('✅ API响应成功');
      console.log(`   总数: ${response.data.total}`);
      console.log(`   当前页: ${response.data.page}/${response.data.totalPages}`);
      console.log(`   达人数: ${response.data.influencers.length}`);
      
      if (response.data.influencers.length > 0) {
        const sample = response.data.influencers[0];
        console.log('   示例达人:', {
          nickname: sample.nickname,
          sourceType: sample.sourceType,
          verificationStatus: sample.verificationStatus,
          factoryName: sample.factoryName,
        });
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.response?.data?.message || error.message);
    }

    // 2. 测试获取统计数据
    console.log('\n2️⃣ 测试 GET /api/platform/influencers-stats');
    try {
      const response = await axios.get(`${API_BASE}/platform/influencers-stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      console.log('✅ API响应成功');
      console.log('   统计数据:', {
        总数: response.data.total,
        未认证: response.data.byVerificationStatus.UNVERIFIED,
        已认证: response.data.byVerificationStatus.VERIFIED,
        认证失败: response.data.byVerificationStatus.REJECTED,
      });
      console.log('   来源分布:', response.data.bySourceType);
      console.log('   平台分布:', response.data.byPlatform);
    } catch (error) {
      console.log('❌ 请求失败:', error.response?.data?.message || error.message);
    }

    // 3. 测试获取达人详情（如果有达人的话）
    console.log('\n3️⃣ 测试 GET /api/platform/influencers/:id');
    try {
      // 先获取一个达人ID
      const listResponse = await axios.get(`${API_BASE}/platform/influencers`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, limit: 1 },
      });
      
      if (listResponse.data.influencers.length > 0) {
        const influencerId = listResponse.data.influencers[0].id;
        
        const response = await axios.get(`${API_BASE}/platform/influencers/${influencerId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        
        console.log('✅ API响应成功');
        console.log('   达人详情:', {
          nickname: response.data.nickname,
          platform: response.data.platform,
          sourceType: response.data.sourceType,
          verificationStatus: response.data.verificationStatus,
          factoryName: response.data.factory?.name,
          creatorName: response.data.creator?.name || '无',
        });
      } else {
        console.log('⚠️  没有达人数据，跳过详情测试');
      }
    } catch (error) {
      console.log('❌ 请求失败:', error.response?.data?.message || error.message);
    }

    console.log('\n✅ API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  }
}

async function testWithoutAuth() {
  console.log('\n4️⃣ 测试权限控制（无token访问）');
  try {
    await axios.get(`${API_BASE}/platform/influencers`);
    console.log('❌ 权限控制失败：应该拒绝无token访问');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ 权限控制正常：正确拒绝了无token访问');
    } else {
      console.log('⚠️  返回了非预期的错误:', error.response?.status);
    }
  }
}

async function runTests() {
  console.log('🚀 开始测试平台管理端达人管理API\n');
  console.log('=' .repeat(50));
  
  // 先测试权限控制
  await testWithoutAuth();
  
  // 登录
  const loginSuccess = await login();
  
  if (loginSuccess) {
    // 测试API
    await testPlatformInfluencersAPI();
  } else {
    console.log('\n⚠️  无法获取管理员token，跳过需要认证的测试');
    console.log('提示：请确保数据库中有平台管理员账号');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 测试完成！\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 测试失败:', error);
    process.exit(1);
  });
