/**
 * 测试达人快速筛选功能
 * 
 * 测试内容：
 * 1. 保存筛选条件
 * 2. 获取已保存的筛选条件
 * 3. 删除筛选条件
 * 4. 切换收藏状态
 * 5. 获取智能推荐
 * 6. 批量打标签
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号（商务人员）
const TEST_USER = {
  email: '商务测试001@test.com',
  password: 'Test123456',
};

let authToken = '';
let savedFilterId = '';

// 登录
async function login() {
  console.log('\n=== 1. 登录测试账号 ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    console.log('✅ 登录成功');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 保存筛选条件
async function saveFilter() {
  console.log('\n=== 2. 保存筛选条件 ===');
  try {
    const filterData = {
      name: '高粉丝抖音达人',
      filter: {
        platform: 'DOUYIN',
        category: '美妆',
      },
    };

    const response = await axios.post(
      `${API_BASE_URL}/users/saved-filters`,
      filterData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    savedFilterId = response.data.data.filter.id;
    console.log('✅ 筛选条件保存成功');
    console.log('筛选ID:', savedFilterId);
    console.log('筛选名称:', response.data.data.filter.name);
    return true;
  } catch (error) {
    console.error('❌ 保存筛选条件失败:', error.response?.data || error.message);
    return false;
  }
}

// 获取已保存的筛选条件
async function getSavedFilters() {
  console.log('\n=== 3. 获取已保存的筛选条件 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/users/saved-filters`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const filters = response.data.data.savedFilters;
    console.log('✅ 获取成功');
    console.log(`共有 ${filters.length} 个已保存的筛选条件`);
    filters.forEach((filter, index) => {
      console.log(`  ${index + 1}. ${filter.name} (收藏: ${filter.isFavorite ? '是' : '否'})`);
    });
    return true;
  } catch (error) {
    console.error('❌ 获取筛选条件失败:', error.response?.data || error.message);
    return false;
  }
}

// 切换收藏状态
async function toggleFavorite() {
  console.log('\n=== 4. 切换收藏状态 ===');
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/saved-filters/${savedFilterId}/favorite`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ 收藏状态切换成功');
    console.log('消息:', response.data.data.message);
    return true;
  } catch (error) {
    console.error('❌ 切换收藏状态失败:', error.response?.data || error.message);
    return false;
  }
}

// 获取智能推荐
async function getRecommendations() {
  console.log('\n=== 5. 获取智能推荐 ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/influencers/recommendations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const recommendations = response.data.data.recommendations;
    console.log('✅ 获取成功');
    console.log(`共有 ${recommendations.length} 个推荐达人`);
    recommendations.slice(0, 3).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec.nickname} - ${rec.details}`);
    });
    return true;
  } catch (error) {
    console.error('❌ 获取智能推荐失败:', error.response?.data || error.message);
    return false;
  }
}

// 批量打标签（需要先获取一些达人ID）
async function batchAddTags() {
  console.log('\n=== 6. 批量打标签 ===');
  try {
    // 先获取一些达人
    const influencersResponse = await axios.get(`${API_BASE_URL}/influencers?pageSize=3`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const influencers = influencersResponse.data.data.data;
    if (influencers.length === 0) {
      console.log('⚠️  没有达人可以测试批量操作');
      return true;
    }

    const influencerIds = influencers.map(inf => inf.id);
    console.log(`选中 ${influencerIds.length} 个达人进行批量打标签`);

    const response = await axios.post(
      `${API_BASE_URL}/influencers/batch/tags`,
      {
        influencerIds,
        tags: ['测试标签', '快速筛选测试'],
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ 批量打标签成功');
    console.log('消息:', response.data.data.message);
    return true;
  } catch (error) {
    console.error('❌ 批量打标签失败:', error.response?.data || error.message);
    return false;
  }
}

// 删除筛选条件
async function deleteFilter() {
  console.log('\n=== 7. 删除筛选条件 ===');
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/users/saved-filters/${savedFilterId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✅ 删除成功');
    console.log('消息:', response.data.data.message);
    return true;
  } catch (error) {
    console.error('❌ 删除筛选条件失败:', error.response?.data || error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('========================================');
  console.log('   达人快速筛选功能测试');
  console.log('========================================');

  const results = {
    login: await login(),
    saveFilter: false,
    getSavedFilters: false,
    toggleFavorite: false,
    getRecommendations: false,
    batchAddTags: false,
    deleteFilter: false,
  };

  if (results.login) {
    results.saveFilter = await saveFilter();
    results.getSavedFilters = await getSavedFilters();
    
    if (savedFilterId) {
      results.toggleFavorite = await toggleFavorite();
    }
    
    results.getRecommendations = await getRecommendations();
    results.batchAddTags = await batchAddTags();
    
    if (savedFilterId) {
      results.deleteFilter = await deleteFilter();
    }
  }

  // 打印测试结果
  console.log('\n========================================');
  console.log('   测试结果汇总');
  console.log('========================================');
  
  const tests = [
    { name: '登录', result: results.login },
    { name: '保存筛选条件', result: results.saveFilter },
    { name: '获取筛选条件', result: results.getSavedFilters },
    { name: '切换收藏状态', result: results.toggleFavorite },
    { name: '获取智能推荐', result: results.getRecommendations },
    { name: '批量打标签', result: results.batchAddTags },
    { name: '删除筛选条件', result: results.deleteFilter },
  ];

  tests.forEach(test => {
    const status = test.result ? '✅ 通过' : '❌ 失败';
    console.log(`${status} - ${test.name}`);
  });

  const passedCount = tests.filter(t => t.result).length;
  const totalCount = tests.length;
  
  console.log('\n========================================');
  console.log(`总计: ${passedCount}/${totalCount} 测试通过`);
  console.log('========================================\n');
}

// 执行测试
runTests().catch(console.error);
