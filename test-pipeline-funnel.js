/**
 * 管道漏斗图功能测试脚本
 * 
 * 测试内容：
 * 1. 测试管道漏斗 API 端点
 * 2. 验证数据结构
 * 3. 验证转化率计算
 * 4. 验证数据完整性
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号
const OWNER_CREDENTIALS = {
  email: 'owner@demo.com',
  password: 'owner123',
};

let ownerToken = '';

// 辅助函数：登录
async function login(credentials) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
    if (response.data.success) {
      console.log(`✅ 登录成功: ${credentials.email}`);
      return response.data.data.token;
    } else {
      console.error(`❌ 登录失败: ${response.data.error?.message}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ 登录请求失败:`, error.response?.data || error.message);
    return null;
  }
}

// 测试1: 获取管道漏斗数据
async function testGetPipelineFunnel() {
  console.log('\n========== 测试1: 获取管道漏斗数据 ==========');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/reports/dashboard/pipeline-funnel`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }
    );
    
    if (response.data.success) {
      console.log('✅ API 调用成功');
      
      const data = response.data.data;
      console.log('\n📊 管道漏斗数据:');
      console.log(`总合作数: ${data.totalCount}`);
      console.log(`总转化率: ${data.overallConversionRate.toFixed(2)}%`);
      
      console.log('\n各阶段数据:');
      data.stages.forEach((stage, index) => {
        console.log(`\n${index + 1}. ${stage.stageName} (${stage.stage})`);
        console.log(`   数量: ${stage.count}`);
        if (stage.conversionRate > 0) {
          console.log(`   转化率: ${stage.conversionRate.toFixed(2)}%`);
        }
        if (stage.dropRate > 0) {
          console.log(`   流失率: ${stage.dropRate.toFixed(2)}%`);
        }
      });
      
      return data;
    } else {
      console.error('❌ API 返回失败:', response.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ API 请求失败:', error.response?.data || error.message);
    return null;
  }
}

// 测试2: 验证数据结构
async function testDataStructure(data) {
  console.log('\n========== 测试2: 验证数据结构 ==========');
  
  let passed = true;
  
  // 验证必需字段
  if (!data.stages || !Array.isArray(data.stages)) {
    console.error('❌ stages 字段缺失或不是数组');
    passed = false;
  } else {
    console.log('✅ stages 字段存在且为数组');
  }
  
  if (typeof data.totalCount !== 'number') {
    console.error('❌ totalCount 字段缺失或不是数字');
    passed = false;
  } else {
    console.log('✅ totalCount 字段存在且为数字');
  }
  
  if (typeof data.overallConversionRate !== 'number') {
    console.error('❌ overallConversionRate 字段缺失或不是数字');
    passed = false;
  } else {
    console.log('✅ overallConversionRate 字段存在且为数字');
  }
  
  // 验证阶段数据结构
  if (data.stages && data.stages.length > 0) {
    const stage = data.stages[0];
    const requiredFields = ['stage', 'stageName', 'count', 'conversionRate', 'dropRate'];
    
    requiredFields.forEach(field => {
      if (!(field in stage)) {
        console.error(`❌ 阶段数据缺少 ${field} 字段`);
        passed = false;
      }
    });
    
    if (passed) {
      console.log('✅ 阶段数据结构完整');
    }
  }
  
  // 验证阶段顺序
  const expectedStages = [
    'LEAD',
    'CONTACTED',
    'QUOTED',
    'SAMPLED',
    'SCHEDULED',
    'PUBLISHED'
  ];
  
  if (data.stages.length === expectedStages.length) {
    let orderCorrect = true;
    data.stages.forEach((stage, index) => {
      if (stage.stage !== expectedStages[index]) {
        console.error(`❌ 阶段顺序错误: 期望 ${expectedStages[index]}, 实际 ${stage.stage}`);
        orderCorrect = false;
      }
    });
    
    if (orderCorrect) {
      console.log('✅ 阶段顺序正确');
    }
  } else {
    console.error(`❌ 阶段数量错误: 期望 ${expectedStages.length}, 实际 ${data.stages.length}`);
    passed = false;
  }
  
  return passed;
}

// 测试3: 验证转化率计算
async function testConversionRateCalculation(data) {
  console.log('\n========== 测试3: 验证转化率计算 ==========');
  
  let passed = true;
  
  // 验证每个阶段的转化率
  for (let i = 1; i < data.stages.length; i++) {
    const currentStage = data.stages[i];
    const previousStage = data.stages[i - 1];
    
    if (previousStage.count > 0) {
      const expectedConversionRate = (currentStage.count / previousStage.count) * 100;
      const expectedDropRate = 100 - expectedConversionRate;
      
      // 允许小数点误差
      const conversionRateDiff = Math.abs(currentStage.conversionRate - expectedConversionRate);
      const dropRateDiff = Math.abs(currentStage.dropRate - expectedDropRate);
      
      if (conversionRateDiff > 0.1) {
        console.error(`❌ ${currentStage.stageName} 转化率计算错误:`);
        console.error(`   期望: ${expectedConversionRate.toFixed(2)}%`);
        console.error(`   实际: ${currentStage.conversionRate.toFixed(2)}%`);
        passed = false;
      }
      
      if (dropRateDiff > 0.1) {
        console.error(`❌ ${currentStage.stageName} 流失率计算错误:`);
        console.error(`   期望: ${expectedDropRate.toFixed(2)}%`);
        console.error(`   实际: ${currentStage.dropRate.toFixed(2)}%`);
        passed = false;
      }
    }
  }
  
  if (passed) {
    console.log('✅ 所有阶段的转化率和流失率计算正确');
  }
  
  // 验证总转化率
  const firstStageCount = data.stages[0].count;
  const lastStageCount = data.stages[data.stages.length - 1].count;
  
  if (firstStageCount > 0) {
    const expectedOverallRate = (lastStageCount / firstStageCount) * 100;
    const overallRateDiff = Math.abs(data.overallConversionRate - expectedOverallRate);
    
    if (overallRateDiff > 0.1) {
      console.error(`❌ 总转化率计算错误:`);
      console.error(`   期望: ${expectedOverallRate.toFixed(2)}%`);
      console.error(`   实际: ${data.overallConversionRate.toFixed(2)}%`);
      passed = false;
    } else {
      console.log('✅ 总转化率计算正确');
    }
  }
  
  return passed;
}

// 测试4: 验证数据完整性
async function testDataIntegrity(data) {
  console.log('\n========== 测试4: 验证数据完整性 ==========');
  
  let passed = true;
  
  // 验证数量非负
  data.stages.forEach(stage => {
    if (stage.count < 0) {
      console.error(`❌ ${stage.stageName} 数量为负数: ${stage.count}`);
      passed = false;
    }
  });
  
  if (passed) {
    console.log('✅ 所有阶段数量非负');
  }
  
  // 验证转化率范围 (0-100)
  data.stages.forEach(stage => {
    if (stage.conversionRate < 0 || stage.conversionRate > 100) {
      console.error(`❌ ${stage.stageName} 转化率超出范围: ${stage.conversionRate}%`);
      passed = false;
    }
    if (stage.dropRate < 0 || stage.dropRate > 100) {
      console.error(`❌ ${stage.stageName} 流失率超出范围: ${stage.dropRate}%`);
      passed = false;
    }
  });
  
  if (passed) {
    console.log('✅ 所有转化率和流失率在有效范围内');
  }
  
  // 验证漏斗特性（后续阶段数量应该小于等于前一阶段）
  for (let i = 1; i < data.stages.length; i++) {
    if (data.stages[i].count > data.stages[i - 1].count) {
      console.warn(`⚠️  ${data.stages[i].stageName} 数量 (${data.stages[i].count}) 大于 ${data.stages[i - 1].stageName} (${data.stages[i - 1].count})`);
      console.warn('   这可能表示数据异常或阶段定义有问题');
    }
  }
  
  return passed;
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始测试管道漏斗图功能\n');
  
  // 登录
  ownerToken = await login(OWNER_CREDENTIALS);
  if (!ownerToken) {
    console.error('\n❌ 登录失败，无法继续测试');
    return;
  }
  
  // 测试1: 获取数据
  const data = await testGetPipelineFunnel();
  if (!data) {
    console.error('\n❌ 无法获取数据，测试终止');
    return;
  }
  
  // 测试2: 验证数据结构
  const structureValid = await testDataStructure(data);
  
  // 测试3: 验证转化率计算
  const calculationValid = await testConversionRateCalculation(data);
  
  // 测试4: 验证数据完整性
  const integrityValid = await testDataIntegrity(data);
  
  // 总结
  console.log('\n========== 测试总结 ==========');
  const allPassed = structureValid && calculationValid && integrityValid;
  
  if (allPassed) {
    console.log('✅ 所有测试通过！');
    console.log('\n📝 建议：');
    console.log('1. 在浏览器中访问 Dashboard 查看漏斗图显示');
    console.log('2. 测试点击漏斗图阶段跳转到合作管道页面');
    console.log('3. 验证图表在不同数据量下的显示效果');
  } else {
    console.log('❌ 部分测试失败，请检查上述错误');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
