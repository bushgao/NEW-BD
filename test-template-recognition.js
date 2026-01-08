/**
 * 测试权限模板识别功能
 * 验证保存模板后重新打开是否正确识别
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

let factoryToken = '';
let staffId = '';

// 工具函数
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `请求失败: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`请求失败: ${url}`);
    console.error(`错误详情:`, error);
    throw error;
  }
}

// 测试步骤
async function runTests() {
  console.log('=== 权限模板识别测试 ===\n');

  try {
    // 1. 工厂老板登录
    console.log('1. 工厂老板登录...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(FACTORY_OWNER),
    });
    factoryToken = loginRes.data.tokens.accessToken;
    console.log('✓ 工厂老板登录成功\n');

    // 2. 商务人员登录获取ID
    console.log('2. 获取商务人员ID...');
    const staffLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(BUSINESS_STAFF),
    });
    staffId = staffLoginRes.data.user.id;
    console.log(`✓ 商务ID: ${staffId}\n`);

    // 3. 测试每个模板
    const templates = ['basic', 'advanced', 'supervisor'];

    for (const templateId of templates) {
      console.log(`--- 测试模板: ${templateId} ---`);

      // 3.1 获取模板权限
      const templatesRes = await request('/staff/permission-templates', {
        headers: { Authorization: `Bearer ${factoryToken}` },
      });
      const template = templatesRes.templates.find((t) => t.id === templateId);

      if (!template) {
        throw new Error(`模板 ${templateId} 不存在`);
      }

      console.log(`  模板名称: ${template.name}`);
      console.log(`  模板描述: ${template.description}`);

      // 3.2 应用模板权限
      console.log(`  应用模板权限...`);
      const updateRes = await request(`/staff/${staffId}/permissions`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${factoryToken}` },
        body: JSON.stringify({ permissions: template.permissions }),
      });

      console.log(`  ✓ 权限更新成功，返回模板: ${updateRes.template}`);

      if (updateRes.template !== templateId) {
        throw new Error(
          `❌ 模板识别错误！期望: ${templateId}, 实际: ${updateRes.template}`
        );
      }

      // 3.3 重新获取权限，验证模板识别
      console.log(`  重新获取权限...`);
      const getRes = await request(`/staff/${staffId}/permissions`, {
        headers: { Authorization: `Bearer ${factoryToken}` },
      });

      console.log(`  ✓ 获取权限成功，识别模板: ${getRes.template}`);

      if (getRes.template !== templateId) {
        throw new Error(
          `❌ 模板识别错误！期望: ${templateId}, 实际: ${getRes.template}`
        );
      }

      console.log(`  ✓ 模板 ${templateId} 识别正确\n`);
    }

    // 4. 测试自定义权限
    console.log('--- 测试自定义权限 ---');
    const customPermissions = {
      dataVisibility: {
        viewOthersInfluencers: true, // 修改一个字段
        viewOthersCollaborations: false,
        viewOthersPerformance: false,
        viewTeamData: true,
        viewRanking: true,
      },
      operations: {
        manageInfluencers: true,
        manageSamples: false,
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

    console.log('  应用自定义权限...');
    const customUpdateRes = await request(`/staff/${staffId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${factoryToken}` },
      body: JSON.stringify({ permissions: customPermissions }),
    });

    console.log(`  ✓ 权限更新成功，返回模板: ${customUpdateRes.template}`);

    if (customUpdateRes.template !== 'custom') {
      throw new Error(
        `❌ 自定义权限识别错误！期望: custom, 实际: ${customUpdateRes.template}`
      );
    }

    console.log('  ✓ 自定义权限识别正确\n');

    // 5. 测试边界情况：字段顺序不同
    console.log('--- 测试字段顺序不同的情况 ---');
    const basicPermissionsReordered = {
      // 故意改变字段顺序
      operations: {
        batchOperations: true,
        exportData: true,
        deleteCollaborations: false,
        manageCollaborations: true,
        manageSamples: false,
        manageInfluencers: true,
      },
      advanced: {
        modifyOthersData: false,
        viewROIData: true,
        viewCostData: false,
      },
      dataVisibility: {
        viewRanking: true,
        viewTeamData: true,
        viewOthersPerformance: false,
        viewOthersCollaborations: false,
        viewOthersInfluencers: false,
      },
    };

    console.log('  应用字段顺序不同的基础商务权限...');
    const reorderedUpdateRes = await request(`/staff/${staffId}/permissions`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${factoryToken}` },
      body: JSON.stringify({ permissions: basicPermissionsReordered }),
    });

    console.log(`  ✓ 权限更新成功，返回模板: ${reorderedUpdateRes.template}`);

    if (reorderedUpdateRes.template !== 'basic') {
      throw new Error(
        `❌ 字段顺序不同时模板识别错误！期望: basic, 实际: ${reorderedUpdateRes.template}`
      );
    }

    console.log('  ✓ 字段顺序不同时仍能正确识别模板\n');

    console.log('=== 所有测试通过 ✓ ===\n');
    console.log('功能验证：');
    console.log('✓ 基础商务模板识别正确');
    console.log('✓ 高级商务模板识别正确');
    console.log('✓ 团队主管模板识别正确');
    console.log('✓ 自定义权限识别正确');
    console.log('✓ 字段顺序不影响模板识别');
    console.log('✓ 保存后重新打开能正确显示模板');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runTests();
