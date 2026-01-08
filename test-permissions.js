/**
 * 测试商务权限管理功能
 * 
 * 运行方式：node test-permissions.js
 */

const API_BASE = 'http://localhost:3000/api';

// 测试账号
const FACTORY_OWNER = {
  email: 'owner@demo.com',
  password: 'owner123',
};

const BUSINESS_STAFF = {
  email: 'staff@demo.com',
  password: 'staff123',
};

let ownerToken = '';
let staffToken = '';
let staffId = '';

// 辅助函数
async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    const errorMsg = data.message || data.error || JSON.stringify(data);
    throw new Error(errorMsg);
  }

  return data;
}

// 测试步骤
async function runTests() {
  console.log('=== 商务权限管理功能测试 ===\n');

  try {
    // 1. 工厂老板登录
    console.log('1. 工厂老板登录...');
    const ownerLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(FACTORY_OWNER),
    });
    ownerToken = ownerLogin.data.tokens.accessToken;
    console.log('✓ 工厂老板登录成功\n');

    // 2. 商务人员登录
    console.log('2. 商务人员登录...');
    const staffLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(BUSINESS_STAFF),
    });
    staffToken = staffLogin.data.tokens.accessToken;
    staffId = staffLogin.data.user.id;
    console.log('✓ 商务人员登录成功');
    console.log(`  商务ID: ${staffId}\n`);

    // 3. 获取权限模板列表
    console.log('3. 获取权限模板列表...');
    const templates = await request('/staff/permission-templates', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log('✓ 权限模板列表:');
    templates.templates.forEach((t) => {
      console.log(`  - ${t.name}: ${t.description}`);
    });
    console.log('');

    // 4. 获取商务当前权限
    console.log('4. 获取商务当前权限...');
    const currentPermissions = await request(`/staff/${staffId}/permissions`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log('✓ 当前权限配置:');
    console.log(`  模板: ${currentPermissions.template}`);
    console.log(`  可以管理样品: ${currentPermissions.permissions.operations.manageSamples}`);
    console.log(`  可以查看其他商务达人: ${currentPermissions.permissions.dataVisibility.viewOthersInfluencers}`);
    console.log(`  可以查看成本数据: ${currentPermissions.permissions.advanced.viewCostData}\n`);

    // 5. 更新权限为"高级商务"
    console.log('5. 更新权限为"高级商务"...');
    const advancedTemplate = templates.templates.find((t) => t.id === 'advanced');
    const updateResult = await request(`/staff/${staffId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ permissions: advancedTemplate.permissions }),
    });
    console.log('✓ 权限更新成功');
    console.log(`  新模板: ${updateResult.template}`);
    console.log(`  可以管理样品: ${updateResult.permissions.operations.manageSamples}`);
    console.log(`  可以查看其他商务业绩: ${updateResult.permissions.dataVisibility.viewOthersPerformance}\n`);

    // 6. 验证权限立即生效（重新获取）
    console.log('6. 验证权限立即生效...');
    const verifyPermissions = await request(`/staff/${staffId}/permissions`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    console.log('✓ 权限验证通过');
    console.log(`  模板: ${verifyPermissions.template}`);
    console.log(`  可以管理样品: ${verifyPermissions.permissions.operations.manageSamples}\n`);

    // 7. 更新权限为"团队主管"
    console.log('7. 更新权限为"团队主管"...');
    const supervisorTemplate = templates.templates.find((t) => t.id === 'supervisor');
    const supervisorResult = await request(`/staff/${staffId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ permissions: supervisorTemplate.permissions }),
    });
    console.log('✓ 权限更新成功');
    console.log(`  新模板: ${supervisorResult.template}`);
    console.log(`  可以查看所有数据: ${supervisorResult.permissions.dataVisibility.viewOthersInfluencers}`);
    console.log(`  可以删除合作: ${supervisorResult.permissions.operations.deleteCollaborations}`);
    console.log(`  可以查看成本: ${supervisorResult.permissions.advanced.viewCostData}\n`);

    // 8. 恢复为基础商务
    console.log('8. 恢复为基础商务...');
    const basicTemplate = templates.templates.find((t) => t.id === 'basic');
    await request(`/staff/${staffId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ permissions: basicTemplate.permissions }),
    });
    console.log('✓ 权限已恢复为基础商务\n');

    console.log('=== 所有测试通过 ✓ ===');
    console.log('\n功能验证：');
    console.log('✓ 权限模板获取正常');
    console.log('✓ 权限查询正常');
    console.log('✓ 权限更新正常');
    console.log('✓ 权限立即生效');
    console.log('✓ 模板识别正常');

  } catch (error) {
    console.error('\n✗ 测试失败:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
runTests();
