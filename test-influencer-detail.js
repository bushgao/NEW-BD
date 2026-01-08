/**
 * 达人详情增强功能测试脚本
 * 
 * 测试内容：
 * 1. 后端API - 获取达人合作历史
 * 2. 后端API - 获取达人ROI统计
 * 3. 前端组件 - InfluencerDetailPanel
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户登录凭证
const TEST_USERS = {
  factoryOwner: {
    email: 'factory@test.com',
    password: 'password123',
    name: '工厂老板测试'
  },
  businessStaff: {
    email: 'staff@test.com',
    password: 'password123',
    name: '商务测试001'
  }
};

let authToken = '';
let testInfluencerId = '';

// 辅助函数：登录
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success) {
      console.log(`✅ 登录成功: ${email}`);
      return response.data.data.token;
    } else {
      console.error(`❌ 登录失败: ${email}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ 登录错误: ${error.response?.data?.error?.message || error.message}`);
    return null;
  }
}

// 辅助函数：获取第一个达人ID
async function getFirstInfluencer(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/influencers`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, pageSize: 1 }
    });
    
    if (response.data.success && response.data.data.data.length > 0) {
      const influencer = response.data.data.data[0];
      console.log(`✅ 获取到测试达人: ${influencer.nickname} (${influencer.id})`);
      return influencer.id;
    } else {
      console.error('❌ 没有找到达人数据');
      return null;
    }
  } catch (error) {
    console.error(`❌ 获取达人列表错误: ${error.response?.data?.error?.message || error.message}`);
    return null;
  }
}

// 测试1: 获取达人合作历史
async function testCollaborationHistory(token, influencerId) {
  console.log('\n📋 测试1: 获取达人合作历史');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/influencers/${influencerId}/collaboration-history`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      const history = response.data.data;
      console.log(`✅ API调用成功`);
      console.log(`📊 合作记录数量: ${history.length}`);
      
      if (history.length > 0) {
        console.log('\n最近的合作记录:');
        const recent = history[0];
        console.log(`  - 阶段: ${recent.stage}`);
        console.log(`  - 样品: ${recent.sampleName}`);
        console.log(`  - 商务: ${recent.businessStaffName}`);
        console.log(`  - 创建时间: ${new Date(recent.createdAt).toLocaleDateString('zh-CN')}`);
        
        if (recent.result) {
          console.log(`  - GMV: ¥${recent.result.salesGmv.toFixed(2)}`);
          console.log(`  - 成本: ¥${recent.result.cost.toFixed(2)}`);
          console.log(`  - ROI: ${recent.result.roi.toFixed(1)}%`);
        }
      } else {
        console.log('ℹ️  该达人暂无合作记录');
      }
      
      return true;
    } else {
      console.error('❌ API返回失败');
      return false;
    }
  } catch (error) {
    console.error(`❌ 测试失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试2: 获取达人ROI统计
async function testROIStats(token, influencerId) {
  console.log('\n📊 测试2: 获取达人ROI统计');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/influencers/${influencerId}/roi-stats`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.success) {
      const stats = response.data.data;
      console.log(`✅ API调用成功`);
      console.log('\n统计数据:');
      console.log(`  - 平均ROI: ${stats.avgROI.toFixed(1)}%`);
      console.log(`  - 总GMV: ¥${stats.totalGMV.toFixed(2)}`);
      console.log(`  - 总成本: ¥${stats.totalCost.toFixed(2)}`);
      console.log(`  - 合作次数: ${stats.collaborationCount}`);
      console.log(`  - 成功率: ${stats.successRate.toFixed(1)}%`);
      
      if (stats.bestSample) {
        console.log('\n最佳合作样品:');
        console.log(`  - 样品名称: ${stats.bestSample.name}`);
        console.log(`  - ROI: ${stats.bestSample.roi.toFixed(1)}%`);
        console.log(`  - GMV: ¥${stats.bestSample.gmv.toFixed(2)}`);
      } else {
        console.log('\nℹ️  暂无最佳合作样品数据');
      }
      
      return true;
    } else {
      console.error('❌ API返回失败');
      return false;
    }
  } catch (error) {
    console.error(`❌ 测试失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试3: 验证前端组件文件
async function testFrontendComponent() {
  console.log('\n🎨 测试3: 验证前端组件');
  console.log('='.repeat(50));
  
  const fs = require('fs');
  const path = require('path');
  
  const componentPath = path.join(__dirname, 'packages/frontend/src/pages/Influencers/InfluencerDetailPanel.tsx');
  const indexPath = path.join(__dirname, 'packages/frontend/src/pages/Influencers/index.tsx');
  const servicePath = path.join(__dirname, 'packages/frontend/src/services/influencer.service.ts');
  
  let allPassed = true;
  
  // 检查组件文件
  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf-8');
    console.log('✅ InfluencerDetailPanel.tsx 文件存在');
    
    // 检查关键功能
    const checks = [
      { name: '基本信息展示', pattern: /renderBasicInfo/ },
      { name: 'ROI统计展示', pattern: /renderROIStats/ },
      { name: '合作历史展示', pattern: /renderCollaborationHistory/ },
      { name: '联系记录展示', pattern: /renderContactHistory/ },
      { name: 'Drawer组件', pattern: /<Drawer/ },
      { name: 'Tabs组件', pattern: /<Tabs/ },
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name} - 未找到`);
        allPassed = false;
      }
    });
  } else {
    console.error('❌ InfluencerDetailPanel.tsx 文件不存在');
    allPassed = false;
  }
  
  // 检查集成
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    console.log('\n✅ index.tsx 文件存在');
    
    const integrationChecks = [
      { name: '导入InfluencerDetailPanel', pattern: /import.*InfluencerDetailPanel/ },
      { name: 'detailPanelVisible状态', pattern: /detailPanelVisible/ },
      { name: 'detailInfluencer状态', pattern: /detailInfluencer/ },
      { name: 'handleViewInfluencer函数', pattern: /handleViewInfluencer/ },
      { name: '渲染InfluencerDetailPanel', pattern: /<InfluencerDetailPanel/ },
    ];
    
    integrationChecks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name} - 未找到`);
        allPassed = false;
      }
    });
  } else {
    console.error('❌ index.tsx 文件不存在');
    allPassed = false;
  }
  
  // 检查服务方法
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf-8');
    console.log('\n✅ influencer.service.ts 文件存在');
    
    const serviceChecks = [
      { name: 'getInfluencerCollaborationHistory', pattern: /getInfluencerCollaborationHistory/ },
      { name: 'getInfluencerROIStats', pattern: /getInfluencerROIStats/ },
    ];
    
    serviceChecks.forEach(check => {
      if (check.pattern.test(content)) {
        console.log(`  ✅ ${check.name}`);
      } else {
        console.log(`  ❌ ${check.name} - 未找到`);
        allPassed = false;
      }
    });
  } else {
    console.error('❌ influencer.service.ts 文件不存在');
    allPassed = false;
  }
  
  return allPassed;
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试达人详情增强功能');
  console.log('='.repeat(50));
  
  const results = {
    collaborationHistory: false,
    roiStats: false,
    frontendComponent: false
  };
  
  // 测试前端组件（不需要登录）
  results.frontendComponent = await testFrontendComponent();
  
  // 登录获取token
  console.log('\n🔐 登录测试账号');
  console.log('='.repeat(50));
  authToken = await login(TEST_USERS.factoryOwner.email, TEST_USERS.factoryOwner.password);
  
  if (!authToken) {
    console.error('\n❌ 无法获取认证token，跳过API测试');
    console.log('\n💡 提示: 请确保后端服务正在运行，并且测试账号已创建');
  } else {
    // 获取测试达人ID
    testInfluencerId = await getFirstInfluencer(authToken);
    
    if (!testInfluencerId) {
      console.error('\n❌ 无法获取测试达人ID，跳过API测试');
      console.log('\n💡 提示: 请确保数据库中有达人数据');
    } else {
      // 运行API测试
      results.collaborationHistory = await testCollaborationHistory(authToken, testInfluencerId);
      results.roiStats = await testROIStats(authToken, testInfluencerId);
    }
  }
  
  // 输出测试总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试总结');
  console.log('='.repeat(50));
  
  const testItems = [
    { name: '前端组件验证', result: results.frontendComponent },
    { name: '合作历史API', result: results.collaborationHistory },
    { name: 'ROI统计API', result: results.roiStats },
  ];
  
  testItems.forEach(item => {
    const status = item.result ? '✅ 通过' : '❌ 失败';
    console.log(`${status} - ${item.name}`);
  });
  
  const passedCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.values(results).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`总计: ${passedCount}/${totalCount} 项测试通过`);
  
  if (passedCount === totalCount) {
    console.log('🎉 所有测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查上述错误信息');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试过程中发生错误:', error);
  process.exit(1);
});
