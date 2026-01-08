// 测试智能建议功能
// 在浏览器控制台运行此脚本

console.log('=== 测试智能建议功能 ===');

// 1. 检查 API 是否可访问
async function testSuggestionsAPI() {
  console.log('\n1. 测试建议 API...');
  
  try {
    // 获取第一个达人的 ID（需要先获取达人列表）
    const influencersResponse = await fetch('http://localhost:3000/api/influencers?page=1&pageSize=10', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!influencersResponse.ok) {
      console.error('❌ 获取达人列表失败:', influencersResponse.status);
      return;
    }
    
    const influencersData = await influencersResponse.json();
    console.log('✅ 达人列表:', influencersData);
    
    if (!influencersData.data || influencersData.data.length === 0) {
      console.warn('⚠️ 没有达人数据');
      return;
    }
    
    const influencerId = influencersData.data[0].id;
    console.log('使用达人 ID:', influencerId);
    
    // 测试样品建议
    console.log('\n测试样品建议...');
    const sampleResponse = await fetch(
      `http://localhost:3000/api/collaborations/suggestions?influencerId=${influencerId}&type=sample`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!sampleResponse.ok) {
      console.error('❌ 样品建议 API 失败:', sampleResponse.status);
      const errorText = await sampleResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const sampleData = await sampleResponse.json();
      console.log('✅ 样品建议:', sampleData);
    }
    
    // 测试报价建议
    console.log('\n测试报价建议...');
    const priceResponse = await fetch(
      `http://localhost:3000/api/collaborations/suggestions?influencerId=${influencerId}&type=price`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!priceResponse.ok) {
      console.error('❌ 报价建议 API 失败:', priceResponse.status);
      const errorText = await priceResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const priceData = await priceResponse.json();
      console.log('✅ 报价建议:', priceData);
    }
    
    // 测试排期建议
    console.log('\n测试排期建议...');
    const scheduleResponse = await fetch(
      `http://localhost:3000/api/collaborations/suggestions?influencerId=${influencerId}&type=schedule`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!scheduleResponse.ok) {
      console.error('❌ 排期建议 API 失败:', scheduleResponse.status);
      const errorText = await scheduleResponse.text();
      console.error('错误详情:', errorText);
    } else {
      const scheduleData = await scheduleResponse.json();
      console.log('✅ 排期建议:', scheduleData);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 2. 检查前端服务函数
function checkFrontendService() {
  console.log('\n2. 检查前端服务函数...');
  
  // 检查是否导入了 getCollaborationSuggestions
  if (typeof window !== 'undefined') {
    console.log('⚠️ 需要在 React 应用中检查服务函数');
    console.log('请在 CreateCollaborationModal 组件中添加 console.log 来调试');
  }
}

// 3. 检查组件状态
function checkComponentState() {
  console.log('\n3. 检查组件状态...');
  console.log('请在 CreateCollaborationModal 组件的以下位置添加 console.log:');
  console.log('- handleInfluencerChange 函数开始');
  console.log('- loadSuggestions 函数开始和结束');
  console.log('- suggestions state 变化时');
}

// 运行测试
console.log('开始测试...\n');
testSuggestionsAPI();
checkFrontendService();
checkComponentState();

console.log('\n=== 测试完成 ===');
console.log('如果 API 测试失败，请检查:');
console.log('1. 后端服务是否运行在 http://localhost:3000');
console.log('2. 是否已登录（localStorage 中有 token）');
console.log('3. 数据库中是否有达人数据');
console.log('4. 后端路由是否正确配置');
