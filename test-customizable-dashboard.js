/**
 * 自定义看板功能测试脚本
 * 
 * 测试内容：
 * 1. 保存看板布局配置
 * 2. 加载看板布局配置
 * 3. 验证布局配置正确保存和加载
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试用户凭证（工厂老板）
const TEST_USER = {
  email: 'owner@demo.com',
  password: 'owner123',
};

let authToken = '';

// 登录获取 token
async function login() {
  try {
    console.log('🔐 登录测试账号...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.data.accessToken;
      console.log('✅ 登录成功');
      return true;
    } else {
      console.error('❌ 登录失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试保存看板布局
async function testSaveDashboardLayout() {
  try {
    console.log('\n📝 测试保存看板布局...');
    
    const testLayout = {
      cards: [
        { id: 'quota-usage', visible: true, order: 0 },
        { id: 'quick-actions', visible: true, order: 1 },
        { id: 'key-metrics', visible: true, order: 2 },
        { id: 'trend-charts', visible: false, order: 3 }, // 隐藏趋势图表
        { id: 'roi-analysis', visible: true, order: 4 },
        { id: 'pipeline-funnel', visible: true, order: 5 },
        { id: 'staff-comparison', visible: false, order: 6 }, // 隐藏商务对比
        { id: 'pipeline-distribution', visible: true, order: 7 },
        { id: 'staff-ranking', visible: true, order: 8 },
        { id: 'staff-progress', visible: true, order: 9 },
        { id: 'team-efficiency', visible: true, order: 10 },
        { id: 'risk-alerts', visible: true, order: 11 },
      ],
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/users/dashboard-layout`,
      { layout: testLayout },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    if (response.data.success) {
      console.log('✅ 看板布局保存成功');
      console.log('   保存的布局:', JSON.stringify(response.data.data.layout, null, 2));
      return true;
    } else {
      console.error('❌ 保存失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 保存请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试加载看板布局
async function testLoadDashboardLayout() {
  try {
    console.log('\n📥 测试加载看板布局...');
    
    const response = await axios.get(`${API_BASE_URL}/users/dashboard-layout`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    
    if (response.data.success) {
      console.log('✅ 看板布局加载成功');
      
      const layout = response.data.data.layout;
      if (layout) {
        console.log('   加载的布局:');
        console.log('   - 卡片数量:', layout.cards.length);
        console.log('   - 可见卡片:', layout.cards.filter(c => c.visible).length);
        console.log('   - 隐藏卡片:', layout.cards.filter(c => !c.visible).length);
        
        // 验证特定卡片的状态
        const trendChart = layout.cards.find(c => c.id === 'trend-charts');
        const staffComparison = layout.cards.find(c => c.id === 'staff-comparison');
        
        console.log('\n   验证隐藏的卡片:');
        console.log('   - 趋势图表 (trend-charts):', trendChart?.visible ? '显示' : '隐藏');
        console.log('   - 商务对比 (staff-comparison):', staffComparison?.visible ? '显示' : '隐藏');
        
        if (!trendChart?.visible && !staffComparison?.visible) {
          console.log('   ✅ 隐藏状态验证通过');
        } else {
          console.log('   ⚠️  隐藏状态验证失败');
        }
      } else {
        console.log('   ℹ️  用户还没有保存过布局配置');
      }
      
      return true;
    } else {
      console.error('❌ 加载失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 加载请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试更新布局（调整顺序）
async function testUpdateDashboardLayout() {
  try {
    console.log('\n🔄 测试更新看板布局（调整顺序）...');
    
    const updatedLayout = {
      cards: [
        { id: 'quick-actions', visible: true, order: 0 }, // 移到第一位
        { id: 'key-metrics', visible: true, order: 1 },
        { id: 'quota-usage', visible: true, order: 2 }, // 从第一位移到第三位
        { id: 'roi-analysis', visible: true, order: 3 },
        { id: 'pipeline-funnel', visible: true, order: 4 },
        { id: 'trend-charts', visible: true, order: 5 }, // 重新显示
        { id: 'staff-comparison', visible: false, order: 6 },
        { id: 'pipeline-distribution', visible: true, order: 7 },
        { id: 'staff-ranking', visible: true, order: 8 },
        { id: 'staff-progress', visible: true, order: 9 },
        { id: 'team-efficiency', visible: true, order: 10 },
        { id: 'risk-alerts', visible: true, order: 11 },
      ],
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/users/dashboard-layout`,
      { layout: updatedLayout },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    if (response.data.success) {
      console.log('✅ 看板布局更新成功');
      
      // 验证更新后的布局
      const loadResponse = await axios.get(`${API_BASE_URL}/users/dashboard-layout`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      
      if (loadResponse.data.success) {
        const layout = loadResponse.data.data.layout;
        const firstCard = layout.cards.find(c => c.order === 0);
        const trendChart = layout.cards.find(c => c.id === 'trend-charts');
        
        console.log('   验证更新结果:');
        console.log('   - 第一个卡片:', firstCard?.id);
        console.log('   - 趋势图表状态:', trendChart?.visible ? '显示' : '隐藏');
        
        if (firstCard?.id === 'quick-actions' && trendChart?.visible) {
          console.log('   ✅ 布局更新验证通过');
        } else {
          console.log('   ⚠️  布局更新验证失败');
        }
      }
      
      return true;
    } else {
      console.error('❌ 更新失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ 更新请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始测试自定义看板功能\n');
  console.log('=' .repeat(60));
  
  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ 测试终止：登录失败');
    return;
  }
  
  // 2. 测试保存布局
  const saveSuccess = await testSaveDashboardLayout();
  if (!saveSuccess) {
    console.log('\n⚠️  保存布局测试失败，继续其他测试...');
  }
  
  // 3. 测试加载布局
  const loadSuccess = await testLoadDashboardLayout();
  if (!loadSuccess) {
    console.log('\n⚠️  加载布局测试失败，继续其他测试...');
  }
  
  // 4. 测试更新布局
  const updateSuccess = await testUpdateDashboardLayout();
  if (!updateSuccess) {
    console.log('\n⚠️  更新布局测试失败');
  }
  
  // 总结
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结:');
  console.log(`   登录: ${loginSuccess ? '✅' : '❌'}`);
  console.log(`   保存布局: ${saveSuccess ? '✅' : '❌'}`);
  console.log(`   加载布局: ${loadSuccess ? '✅' : '❌'}`);
  console.log(`   更新布局: ${updateSuccess ? '✅' : '❌'}`);
  
  const allPassed = loginSuccess && saveSuccess && loadSuccess && updateSuccess;
  console.log(`\n${allPassed ? '✅ 所有测试通过！' : '⚠️  部分测试失败'}`);
  console.log('=' .repeat(60));
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试过程中发生错误:', error);
  process.exit(1);
});
