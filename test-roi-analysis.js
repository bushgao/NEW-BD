/**
 * ROI 分析图表功能测试脚本
 * 
 * 测试内容：
 * 1. 测试 ROI 分析 API 端点
 * 2. 验证数据结构
 * 3. 验证数据计算逻辑
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号
const OWNER_CREDENTIALS = {
  email: 'owner@test.com',
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

// 测试1: 获取 ROI 分析数据
async function testGetRoiAnalysis() {
  console.log('\n📊 测试1: 获取 ROI 分析数据');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/roi-analysis`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ API 调用成功');
      
      // 验证数据结构
      console.log('\n📋 数据结构验证:');
      console.log(`  - byStaff: ${Array.isArray(data.byStaff) ? '✅' : '❌'} (${data.byStaff?.length || 0} 个商务)`);
      console.log(`  - costBreakdown: ${data.costBreakdown ? '✅' : '❌'}`);
      console.log(`  - costVsRevenue: ${Array.isArray(data.costVsRevenue) ? '✅' : '❌'} (${data.costVsRevenue?.length || 0} 个数据点)`);
      
      // 显示商务 ROI 数据
      if (data.byStaff && data.byStaff.length > 0) {
        console.log('\n👥 商务 ROI 排名:');
        data.byStaff.forEach((staff, index) => {
          console.log(`  ${index + 1}. ${staff.staffName}`);
          console.log(`     - 合作数: ${staff.collaborationCount}`);
          console.log(`     - 总GMV: ¥${(staff.totalGmv / 100).toFixed(2)}`);
          console.log(`     - 总成本: ¥${(staff.totalCost / 100).toFixed(2)}`);
          console.log(`     - ROI: ${staff.roi.toFixed(2)}`);
        });
      } else {
        console.log('\n⚠️  暂无商务数据');
      }
      
      // 显示成本构成
      if (data.costBreakdown) {
        console.log('\n💰 成本构成分析:');
        const total = data.costBreakdown.sampleCost + 
                     data.costBreakdown.collaborationCost + 
                     data.costBreakdown.otherCost;
        
        if (total > 0) {
          console.log(`  - 样品成本: ¥${(data.costBreakdown.sampleCost / 100).toFixed(2)} (${((data.costBreakdown.sampleCost / total) * 100).toFixed(1)}%)`);
          console.log(`  - 合作成本: ¥${(data.costBreakdown.collaborationCost / 100).toFixed(2)} (${((data.costBreakdown.collaborationCost / total) * 100).toFixed(1)}%)`);
          console.log(`  - 其他成本: ¥${(data.costBreakdown.otherCost / 100).toFixed(2)} (${((data.costBreakdown.otherCost / total) * 100).toFixed(1)}%)`);
          console.log(`  - 总成本: ¥${(total / 100).toFixed(2)}`);
        } else {
          console.log('  ⚠️  暂无成本数据');
        }
      }
      
      // 显示散点图数据
      if (data.costVsRevenue && data.costVsRevenue.length > 0) {
        console.log('\n📈 成本-收益散点图数据:');
        data.costVsRevenue.forEach((point) => {
          const status = point.roi >= 1 ? '✅ 盈利' : '❌ 亏损';
          console.log(`  - ${point.name}: 成本 ¥${(point.cost / 100).toFixed(2)}, 收益 ¥${(point.revenue / 100).toFixed(2)}, ROI ${point.roi.toFixed(2)} ${status}`);
        });
      }
      
      return true;
    } else {
      console.error('❌ API 返回失败:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试2: 验证数据一致性
async function testDataConsistency() {
  console.log('\n🔍 测试2: 验证数据一致性');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/roi-analysis`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    if (response.data.success) {
      const data = response.data.data;
      
      // 验证 byStaff 和 costVsRevenue 数据一致性
      console.log('\n📊 验证商务数据一致性:');
      
      if (data.byStaff.length === data.costVsRevenue.length) {
        console.log(`✅ 商务数量一致: ${data.byStaff.length} 个`);
      } else {
        console.log(`❌ 商务数量不一致: byStaff=${data.byStaff.length}, costVsRevenue=${data.costVsRevenue.length}`);
      }
      
      // 验证每个商务的数据
      let allMatch = true;
      for (const staff of data.byStaff) {
        const scatterPoint = data.costVsRevenue.find(p => p.name === staff.staffName);
        if (scatterPoint) {
          const costMatch = staff.totalCost === scatterPoint.cost;
          const revenueMatch = staff.totalGmv === scatterPoint.revenue;
          const roiMatch = Math.abs(staff.roi - scatterPoint.roi) < 0.01;
          
          if (costMatch && revenueMatch && roiMatch) {
            console.log(`  ✅ ${staff.staffName}: 数据一致`);
          } else {
            console.log(`  ❌ ${staff.staffName}: 数据不一致`);
            if (!costMatch) console.log(`     成本: ${staff.totalCost} vs ${scatterPoint.cost}`);
            if (!revenueMatch) console.log(`     收益: ${staff.totalGmv} vs ${scatterPoint.revenue}`);
            if (!roiMatch) console.log(`     ROI: ${staff.roi} vs ${scatterPoint.roi}`);
            allMatch = false;
          }
        } else {
          console.log(`  ❌ ${staff.staffName}: 在散点图数据中未找到`);
          allMatch = false;
        }
      }
      
      return allMatch;
    } else {
      console.error('❌ API 返回失败:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试3: 验证 ROI 计算
async function testRoiCalculation() {
  console.log('\n🧮 测试3: 验证 ROI 计算');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/roi-analysis`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    if (response.data.success) {
      const data = response.data.data;
      
      console.log('\n📐 验证 ROI 计算公式 (ROI = GMV / 成本):');
      
      let allCorrect = true;
      for (const staff of data.byStaff) {
        const expectedRoi = staff.totalCost > 0 ? staff.totalGmv / staff.totalCost : 0;
        const actualRoi = staff.roi;
        const diff = Math.abs(expectedRoi - actualRoi);
        
        if (diff < 0.0001) {
          console.log(`  ✅ ${staff.staffName}: ROI 计算正确 (${actualRoi.toFixed(4)})`);
        } else {
          console.log(`  ❌ ${staff.staffName}: ROI 计算错误`);
          console.log(`     期望: ${expectedRoi.toFixed(4)}, 实际: ${actualRoi.toFixed(4)}, 差异: ${diff.toFixed(4)}`);
          allCorrect = false;
        }
      }
      
      return allCorrect;
    } else {
      console.error('❌ API 返回失败:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始测试 ROI 分析图表功能');
  console.log('='.repeat(50));

  // 登录
  console.log('\n🔐 步骤1: 登录工厂老板账号');
  ownerToken = await login(OWNER_CREDENTIALS);
  if (!ownerToken) {
    console.error('\n❌ 登录失败，无法继续测试');
    process.exit(1);
  }

  // 运行测试
  const results = {
    test1: await testGetRoiAnalysis(),
    test2: await testDataConsistency(),
    test3: await testRoiCalculation(),
  };

  // 汇总结果
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(50));
  console.log(`测试1 - 获取 ROI 分析数据: ${results.test1 ? '✅ 通过' : '❌ 失败'}`);
  console.log(`测试2 - 验证数据一致性: ${results.test2 ? '✅ 通过' : '❌ 失败'}`);
  console.log(`测试3 - 验证 ROI 计算: ${results.test3 ? '✅ 通过' : '❌ 失败'}`);

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ 所有测试通过！ROI 分析图表功能正常工作');
  } else {
    console.log('❌ 部分测试失败，请检查上述错误信息');
  }
  console.log('='.repeat(50));

  process.exit(allPassed ? 0 : 1);
}

// 运行测试
runTests().catch(error => {
  console.error('❌ 测试过程中发生错误:', error);
  process.exit(1);
});
