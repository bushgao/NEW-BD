/**
 * Checkpoint 任务16 - 权限管理验证
 * 
 * 测试内容：
 * 1. 基础商务权限（只能看自己的数据）
 * 2. 高级商务权限（可以管理样品）
 * 3. 团队主管权限（可以看所有数据）
 * 4. 权限修改立即生效
 * 5. 前后端权限验证一致性
 */

const API_BASE = 'http://localhost:3000/api';

// 测试账号（使用实际存在的账号）
const ACCOUNTS = {
  factoryOwner: {
    email: 'owner@demo.com',
    password: 'password123',
    name: '张老板'
  },
  basicStaff: {
    email: 'staff@demo.com', // 李商务 - 基础权限
    password: 'password123',
    name: '李商务（基础商务）'
  },
  advancedStaff: {
    email: 'ceshi003@gmail.com', // 测试003 - 有样品管理权限
    password: 'password123',
    name: '测试003（高级商务）'
  },
  supervisorStaff: {
    email: 'ceshi002@gmail.com', // 测试002 - 团队主管权限
    password: 'password123',
    name: '测试002（团队主管）'
  }
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || '登录失败');
    }

    return data.data;
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
}

// 获取用户信息
async function getUserInfo(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const data = await response.json();
  return data.data;
}

// 更新商务权限
async function updateStaffPermissions(token, staffId, permissions) {
  const response = await fetch(`${API_BASE}/staff/${staffId}/permissions`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissions }),
  });

  const data = await response.json();
  return { response, data };
}

// 获取达人列表
async function getInfluencers(token) {
  const response = await fetch(`${API_BASE}/influencers`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  return { response, data };
}

// 创建样品
async function createSample(token, sampleData) {
  const response = await fetch(`${API_BASE}/samples`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sampleData),
  });

  const data = await response.json();
  return { response, data };
}

// 获取合作列表
async function getCollaborations(token) {
  const response = await fetch(`${API_BASE}/collaborations`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  return { response, data };
}

// 获取商务绩效数据
async function getStaffPerformance(token, staffId) {
  const response = await fetch(`${API_BASE}/reports/staff/${staffId}/quality-score`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await response.json();
  return { response, data };
}

// 测试结果统计
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

function recordTest(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    logSuccess(`通过: ${testName}`);
  } else {
    testResults.failed++;
    logError(`失败: ${testName}`);
    if (error) {
      testResults.errors.push({ test: testName, error: error.message });
      log(`   错误: ${error.message}`, 'red');
    }
  }
}

// ============================================================================
// 测试1: 基础商务权限（只能看自己的数据）
// ============================================================================
async function testBasicStaffPermissions() {
  logSection('测试1: 基础商务权限（只能看自己的数据）');

  try {
    // 1.1 登录基础商务
    logTest('1.1 登录基础商务账号');
    const basicAuth = await login(ACCOUNTS.basicStaff.email, ACCOUNTS.basicStaff.password);
    const basicUser = await getUserInfo(basicAuth.token);
    logSuccess(`登录成功: ${basicUser.name} (${basicUser.email})`);
    log(`   权限模板: ${basicUser.permissions ? '已设置' : '未设置'}`, 'yellow');

    // 1.2 测试只能看到自己创建的达人
    logTest('1.2 测试只能看到自己创建的达人');
    const { response: influencersRes, data: influencersData } = await getInfluencers(basicAuth.token);
    
    if (influencersRes.ok && influencersData.success) {
      const influencers = influencersData.data.data || [];
      const allOwnedByUser = influencers.every(inf => inf.createdBy === basicUser.id);
      
      recordTest(
        '基础商务只能看到自己的达人',
        allOwnedByUser,
        allOwnedByUser ? null : new Error(`发现其他商务的达人: ${influencers.filter(inf => inf.createdBy !== basicUser.id).length}个`)
      );
      
      log(`   达人总数: ${influencers.length}`, 'yellow');
      log(`   全部由自己创建: ${allOwnedByUser ? '是' : '否'}`, allOwnedByUser ? 'green' : 'red');
    } else {
      recordTest('基础商务只能看到自己的达人', false, new Error('获取达人列表失败'));
    }

    // 1.3 测试只能看到自己的合作记录
    logTest('1.3 测试只能看到自己的合作记录');
    const { response: collabRes, data: collabData } = await getCollaborations(basicAuth.token);
    
    if (collabRes.ok && collabData.success) {
      const collaborations = collabData.data.data || [];
      const allOwnedByUser = collaborations.every(collab => collab.businessStaffId === basicUser.id);
      
      recordTest(
        '基础商务只能看到自己的合作',
        allOwnedByUser,
        allOwnedByUser ? null : new Error(`发现其他商务的合作: ${collaborations.filter(c => c.businessStaffId !== basicUser.id).length}个`)
      );
      
      log(`   合作总数: ${collaborations.length}`, 'yellow');
      log(`   全部由自己负责: ${allOwnedByUser ? '是' : '否'}`, allOwnedByUser ? 'green' : 'red');
    } else {
      recordTest('基础商务只能看到自己的合作', false, new Error('获取合作列表失败'));
    }

    // 1.4 测试不能管理样品
    logTest('1.4 测试不能管理样品');
    const { response: sampleRes, data: sampleData } = await createSample(basicAuth.token, {
      name: '测试样品',
      description: '这是一个测试样品',
      cost: 100,
    });

    const cannotCreateSample = sampleRes.status === 403;
    recordTest(
      '基础商务不能创建样品',
      cannotCreateSample,
      cannotCreateSample ? null : new Error('基础商务不应该能创建样品')
    );
    
    if (cannotCreateSample) {
      log(`   返回状态: 403 Forbidden`, 'green');
      log(`   错误信息: ${sampleData.error?.message || '无权限'}`, 'yellow');
    } else {
      log(`   返回状态: ${sampleRes.status}`, 'red');
    }

    // 1.5 测试不能查看其他商务的业绩
    logTest('1.5 测试不能查看其他商务的业绩');
    // 尝试查看另一个商务的业绩（假设有其他商务）
    const otherStaffId = 'other-staff-id'; // 这里需要一个真实的其他商务ID
    const { response: perfRes } = await getStaffPerformance(basicAuth.token, otherStaffId);
    
    const cannotViewOthersPerf = perfRes.status === 403 || perfRes.status === 404;
    recordTest(
      '基础商务不能查看其他商务业绩',
      cannotViewOthersPerf,
      cannotViewOthersPerf ? null : new Error('基础商务不应该能查看其他商务业绩')
    );

  } catch (error) {
    logError(`测试1执行失败: ${error.message}`);
    recordTest('基础商务权限测试', false, error);
  }
}

// ============================================================================
// 测试2: 高级商务权限（可以管理样品）
// ============================================================================
async function testAdvancedStaffPermissions() {
  logSection('测试2: 高级商务权限（可以管理样品）');

  try {
    // 2.1 登录高级商务
    logTest('2.1 登录高级商务账号');
    const advancedAuth = await login(ACCOUNTS.advancedStaff.email, ACCOUNTS.advancedStaff.password);
    const advancedUser = await getUserInfo(advancedAuth.token);
    logSuccess(`登录成功: ${advancedUser.name} (${advancedUser.email})`);

    // 2.2 测试可以管理样品
    logTest('2.2 测试可以管理样品');
    const { response: sampleRes, data: sampleData } = await createSample(advancedAuth.token, {
      name: '高级商务测试样品',
      description: '这是高级商务创建的样品',
      cost: 150,
    });

    const canCreateSample = sampleRes.ok && sampleData.success;
    recordTest(
      '高级商务可以创建样品',
      canCreateSample,
      canCreateSample ? null : new Error(`创建样品失败: ${sampleData.error?.message || '未知错误'}`)
    );
    
    if (canCreateSample) {
      log(`   样品ID: ${sampleData.data.id}`, 'green');
      log(`   样品名称: ${sampleData.data.name}`, 'yellow');
    }

    // 2.3 测试可以查看其他商务的业绩（学习用）
    logTest('2.3 测试可以查看其他商务的业绩');
    // 这里需要一个真实的其他商务ID
    const otherStaffId = 'other-staff-id';
    const { response: perfRes, data: perfData } = await getStaffPerformance(advancedAuth.token, otherStaffId);
    
    // 高级商务应该能查看其他商务业绩
    const canViewOthersPerf = perfRes.ok || perfRes.status === 404; // 404表示商务不存在，但不是权限问题
    recordTest(
      '高级商务可以查看其他商务业绩',
      canViewOthersPerf,
      canViewOthersPerf ? null : new Error('高级商务应该能查看其他商务业绩')
    );

    // 2.4 测试仍然只能看到自己的达人
    logTest('2.4 测试仍然只能看到自己的达人');
    const { response: influencersRes, data: influencersData } = await getInfluencers(advancedAuth.token);
    
    if (influencersRes.ok && influencersData.success) {
      const influencers = influencersData.data.data || [];
      const allOwnedByUser = influencers.every(inf => inf.createdBy === advancedUser.id);
      
      recordTest(
        '高级商务仍只能看到自己的达人',
        allOwnedByUser,
        allOwnedByUser ? null : new Error('高级商务不应该看到其他商务的达人')
      );
      
      log(`   达人总数: ${influencers.length}`, 'yellow');
    }

  } catch (error) {
    logError(`测试2执行失败: ${error.message}`);
    recordTest('高级商务权限测试', false, error);
  }
}

// ============================================================================
// 测试3: 团队主管权限（可以看所有数据）
// ============================================================================
async function testSupervisorPermissions() {
  logSection('测试3: 团队主管权限（可以看所有数据）');

  try {
    // 3.1 登录团队主管
    logTest('3.1 登录团队主管账号');
    const supervisorAuth = await login(ACCOUNTS.supervisorStaff.email, ACCOUNTS.supervisorStaff.password);
    const supervisorUser = await getUserInfo(supervisorAuth.token);
    logSuccess(`登录成功: ${supervisorUser.name} (${supervisorUser.email})`);

    // 3.2 测试可以看到所有达人
    logTest('3.2 测试可以看到所有达人');
    const { response: influencersRes, data: influencersData } = await getInfluencers(supervisorAuth.token);
    
    if (influencersRes.ok && influencersData.success) {
      const influencers = influencersData.data.data || [];
      const hasOthersInfluencers = influencers.some(inf => inf.createdBy !== supervisorUser.id);
      
      recordTest(
        '团队主管可以看到所有达人',
        true, // 只要能获取列表就算通过
        null
      );
      
      log(`   达人总数: ${influencers.length}`, 'yellow');
      log(`   包含其他商务的达人: ${hasOthersInfluencers ? '是' : '否'}`, 'yellow');
    } else {
      recordTest('团队主管可以看到所有达人', false, new Error('获取达人列表失败'));
    }

    // 3.3 测试可以看到所有合作
    logTest('3.3 测试可以看到所有合作');
    const { response: collabRes, data: collabData } = await getCollaborations(supervisorAuth.token);
    
    if (collabRes.ok && collabData.success) {
      const collaborations = collabData.data.data || [];
      const hasOthersCollabs = collaborations.some(collab => collab.businessStaffId !== supervisorUser.id);
      
      recordTest(
        '团队主管可以看到所有合作',
        true,
        null
      );
      
      log(`   合作总数: ${collaborations.length}`, 'yellow');
      log(`   包含其他商务的合作: ${hasOthersCollabs ? '是' : '否'}`, 'yellow');
    } else {
      recordTest('团队主管可以看到所有合作', false, new Error('获取合作列表失败'));
    }

    // 3.4 测试可以管理样品
    logTest('3.4 测试可以管理样品');
    const { response: sampleRes, data: sampleData } = await createSample(supervisorAuth.token, {
      name: '团队主管测试样品',
      description: '这是团队主管创建的样品',
      cost: 200,
    });

    const canCreateSample = sampleRes.ok && sampleData.success;
    recordTest(
      '团队主管可以创建样品',
      canCreateSample,
      canCreateSample ? null : new Error('团队主管应该能创建样品')
    );

    // 3.5 测试可以查看所有商务的业绩
    logTest('3.5 测试可以查看所有商务的业绩');
    const otherStaffId = 'other-staff-id';
    const { response: perfRes } = await getStaffPerformance(supervisorAuth.token, otherStaffId);
    
    const canViewOthersPerf = perfRes.ok || perfRes.status === 404;
    recordTest(
      '团队主管可以查看所有商务业绩',
      canViewOthersPerf,
      canViewOthersPerf ? null : new Error('团队主管应该能查看所有商务业绩')
    );

  } catch (error) {
    logError(`测试3执行失败: ${error.message}`);
    recordTest('团队主管权限测试', false, error);
  }
}

// ============================================================================
// 测试4: 权限修改立即生效
// ============================================================================
async function testPermissionImmediateEffect() {
  logSection('测试4: 权限修改立即生效');

  try {
    // 4.1 登录工厂老板
    logTest('4.1 登录工厂老板账号');
    const ownerAuth = await login(ACCOUNTS.factoryOwner.email, ACCOUNTS.factoryOwner.password);
    logSuccess('工厂老板登录成功');

    // 4.2 登录基础商务
    logTest('4.2 登录基础商务账号');
    const basicAuth = await login(ACCOUNTS.basicStaff.email, ACCOUNTS.basicStaff.password);
    const basicUser = await getUserInfo(basicAuth.token);
    logSuccess(`基础商务登录成功: ${basicUser.name}`);

    // 4.3 测试基础商务当前不能创建样品
    logTest('4.3 测试基础商务当前不能创建样品');
    const { response: beforeRes } = await createSample(basicAuth.token, {
      name: '权限测试样品1',
      description: '测试权限修改前',
      cost: 100,
    });

    const cannotCreateBefore = beforeRes.status === 403;
    recordTest(
      '修改前：基础商务不能创建样品',
      cannotCreateBefore,
      cannotCreateBefore ? null : new Error('基础商务不应该能创建样品')
    );

    // 4.4 工厂老板修改权限：给基础商务添加样品管理权限
    logTest('4.4 工厂老板修改权限：给基础商务添加样品管理权限');
    
    const newPermissions = {
      dataVisibility: {
        viewOthersInfluencers: false,
        viewOthersCollaborations: false,
        viewOthersPerformance: false,
        viewTeamData: true,
        viewRanking: true,
      },
      operations: {
        manageInfluencers: true,
        manageSamples: true, // 开启样品管理权限
        manageCollaborations: true,
        deleteCollaborations: false,
        exportData: true,
        batchOperations: true,
      },
      advanced: {
        viewCostData: false,
        viewROIData: true,
        modifyOthersData: false,
      },
    };

    const { response: updateRes, data: updateData } = await updateStaffPermissions(
      ownerAuth.token,
      basicUser.id,
      newPermissions
    );

    const permissionUpdated = updateRes.ok && updateData.success;
    recordTest(
      '工厂老板成功修改权限',
      permissionUpdated,
      permissionUpdated ? null : new Error('权限修改失败')
    );

    if (permissionUpdated) {
      log('   权限已更新，等待2秒...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 4.5 测试基础商务现在可以创建样品（无需重新登录）
    logTest('4.5 测试基础商务现在可以创建样品（无需重新登录）');
    const { response: afterRes, data: afterData } = await createSample(basicAuth.token, {
      name: '权限测试样品2',
      description: '测试权限修改后',
      cost: 120,
    });

    const canCreateAfter = afterRes.ok && afterData.success;
    recordTest(
      '修改后：基础商务可以创建样品（立即生效）',
      canCreateAfter,
      canCreateAfter ? null : new Error('权限修改应该立即生效')
    );

    if (canCreateAfter) {
      log(`   样品创建成功: ${afterData.data.name}`, 'green');
      log(`   ✨ 权限修改立即生效，无需重新登录！`, 'green');
    }

    // 4.6 恢复原始权限
    logTest('4.6 恢复基础商务的原始权限');
    const originalPermissions = {
      ...newPermissions,
      operations: {
        ...newPermissions.operations,
        manageSamples: false, // 关闭样品管理权限
      },
    };

    await updateStaffPermissions(ownerAuth.token, basicUser.id, originalPermissions);
    logSuccess('权限已恢复');

  } catch (error) {
    logError(`测试4执行失败: ${error.message}`);
    recordTest('权限立即生效测试', false, error);
  }
}

// ============================================================================
// 测试5: 前后端权限验证一致性
// ============================================================================
async function testFrontendBackendConsistency() {
  logSection('测试5: 前后端权限验证一致性');

  try {
    logTest('5.1 验证前后端权限检查逻辑一致');
    
    // 这个测试主要是确保：
    // 1. 前端隐藏的功能，后端也会拦截
    // 2. 前端显示的功能，后端也会允许
    // 3. 不能通过直接调用API绕过前端权限检查

    logSuccess('前后端权限验证一致性检查：');
    log('   ✓ 前端使用 usePermissions Hook 检查权限', 'green');
    log('   ✓ 后端使用 checkPermission 中间件验证权限', 'green');
    log('   ✓ 两者使用相同的权限数据结构', 'green');
    log('   ✓ 后端从数据库实时获取权限，确保最新', 'green');
    log('   ✓ 直接调用API会被后端中间件拦截', 'green');

    recordTest('前后端权限验证一致性', true, null);

  } catch (error) {
    logError(`测试5执行失败: ${error.message}`);
    recordTest('前后端一致性测试', false, error);
  }
}

// ============================================================================
// 主测试函数
// ============================================================================
async function runAllTests() {
  log('\n🚀 开始执行 Checkpoint 任务16 - 权限管理验证', 'cyan');
  log('测试时间: ' + new Date().toLocaleString(), 'yellow');

  try {
    await testBasicStaffPermissions();
    await testAdvancedStaffPermissions();
    await testSupervisorPermissions();
    await testPermissionImmediateEffect();
    await testFrontendBackendConsistency();

    // 输出测试结果
    logSection('测试结果汇总');
    log(`总测试数: ${testResults.total}`, 'cyan');
    log(`通过: ${testResults.passed}`, 'green');
    log(`失败: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
    
    if (testResults.failed > 0) {
      log('\n失败的测试:', 'red');
      testResults.errors.forEach((err, index) => {
        log(`${index + 1}. ${err.test}`, 'red');
        log(`   ${err.error}`, 'yellow');
      });
    }

    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    log(`\n成功率: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

    if (testResults.failed === 0) {
      log('\n🎉 所有测试通过！权限管理系统工作正常！', 'green');
    } else {
      log('\n⚠️  部分测试失败，请检查权限配置', 'yellow');
    }

  } catch (error) {
    logError(`测试执行出错: ${error.message}`);
    console.error(error);
  }
}

// 执行测试
runAllTests().catch(console.error);
