/**
 * 平台管理端功能 - 综合测试脚本
 * 
 * 测试所有已完成的功能：
 * - 阶段1：菜单导航（前端测试）
 * - 阶段2：工厂管理增强（API测试）
 * - 阶段3：用户管理（API测试）
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3000/api';
let adminToken = '';

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

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message = '') {
  results.total++;
  if (passed) {
    results.passed++;
    log(`✅ ${name}`, 'green');
  } else {
    results.failed++;
    log(`❌ ${name}`, 'red');
    if (message) log(`   ${message}`, 'yellow');
  }
  results.tests.push({ name, passed, message });
}

async function test() {
  try {
    // ========================================
    // 登录获取Token
    // ========================================
    section('1. 登录测试');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (loginResponse.data.success) {
      adminToken = loginResponse.data.data.tokens.accessToken;
      recordTest('平台管理员登录', true);
    } else {
      recordTest('平台管理员登录', false, '登录失败');
      return;
    }

    // ========================================
    // 阶段2：工厂管理增强测试
    // ========================================
    section('2. 阶段2：工厂管理增强测试');

    // 2.1 获取工厂列表
    const factoriesResponse = await axios.get(`${API_BASE}/platform/factories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { page: 1, pageSize: 10 },
    });

    if (factoriesResponse.data.success && factoriesResponse.data.data.data.length > 0) {
      const factory = factoriesResponse.data.data.data[0];
      recordTest('获取工厂列表', true);

      // 2.2 获取工厂的商务列表
      const staffResponse = await axios.get(
        `${API_BASE}/platform/factories/${factory.id}/staff`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (staffResponse.data.success) {
        const staffList = staffResponse.data.data;
        recordTest('获取工厂商务列表', true);
        log(`   工厂"${factory.name}"有 ${staffList.length} 个商务`, 'blue');

        if (staffList.length > 0) {
          const staff = staffList[0];

          // 2.3 获取商务工作统计
          const statsResponse = await axios.get(
            `${API_BASE}/platform/staff/${staff.id}/stats`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );

          if (statsResponse.data.success) {
            const stats = statsResponse.data.data;
            recordTest('获取商务工作统计', true);
            log(`   商务"${staff.name}"统计:`, 'blue');
            log(`   - 添加达人: ${stats.influencersAdded}个`, 'blue');
            log(`   - 创建合作: ${stats.collaborationsCreated}个`, 'blue');
            log(`   - 完成合作: ${stats.collaborationsCompleted}个`, 'blue');
            log(`   - 成功率: ${stats.successRate}%`, 'blue');
          } else {
            recordTest('获取商务工作统计', false);
          }

          // 2.4 获取商务的达人列表
          const influencersResponse = await axios.get(
            `${API_BASE}/platform/staff/${staff.id}/influencers`,
            {
              headers: { Authorization: `Bearer ${adminToken}` },
              params: { page: 1, pageSize: 10 },
            }
          );

          if (influencersResponse.data.success) {
            const influencers = influencersResponse.data.data;
            recordTest('获取商务达人列表', true);
            log(`   商务"${staff.name}"添加了 ${influencers.total} 个达人`, 'blue');
          } else {
            recordTest('获取商务达人列表', false);
          }

          // 2.5 获取商务的合作列表
          const collaborationsResponse = await axios.get(
            `${API_BASE}/platform/staff/${staff.id}/collaborations`,
            {
              headers: { Authorization: `Bearer ${adminToken}` },
              params: { page: 1, pageSize: 10 },
            }
          );

          if (collaborationsResponse.data.success) {
            const collaborations = collaborationsResponse.data.data;
            recordTest('获取商务合作列表', true);
            log(`   商务"${staff.name}"创建了 ${collaborations.total} 个合作`, 'blue');
          } else {
            recordTest('获取商务合作列表', false);
          }
        } else {
          log('   该工厂暂无商务人员', 'yellow');
        }
      } else {
        recordTest('获取工厂商务列表', false);
      }
    } else {
      recordTest('获取工厂列表', false, '没有工厂数据');
    }

    // ========================================
    // 阶段3：用户管理测试
    // ========================================
    section('3. 阶段3：用户管理测试');

    // 3.1 获取用户列表
    const usersResponse = await axios.get(`${API_BASE}/platform/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { page: 1, pageSize: 10 },
    });

    if (usersResponse.data.success) {
      const users = usersResponse.data.data;
      recordTest('获取用户列表', true);
      log(`   共有 ${users.total} 个用户`, 'blue');

      // 3.2 测试搜索功能
      const searchResponse = await axios.get(`${API_BASE}/platform/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, pageSize: 10, search: '商务' },
      });

      if (searchResponse.data.success) {
        recordTest('用户搜索功能', true);
        log(`   搜索"商务"找到 ${searchResponse.data.data.total} 个结果`, 'blue');
      } else {
        recordTest('用户搜索功能', false);
      }

      // 3.3 测试角色筛选
      const roleFilterResponse = await axios.get(`${API_BASE}/platform/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, pageSize: 10, role: 'BUSINESS_STAFF' },
      });

      if (roleFilterResponse.data.success) {
        recordTest('用户角色筛选', true);
        log(`   筛选"商务人员"找到 ${roleFilterResponse.data.data.total} 个结果`, 'blue');
      } else {
        recordTest('用户角色筛选', false);
      }

      // 3.4 测试状态筛选
      const statusFilterResponse = await axios.get(`${API_BASE}/platform/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { page: 1, pageSize: 10, isActive: true },
      });

      if (statusFilterResponse.data.success) {
        recordTest('用户状态筛选', true);
        log(`   筛选"启用"找到 ${statusFilterResponse.data.data.total} 个结果`, 'blue');
      } else {
        recordTest('用户状态筛选', false);
      }

      // 3.5 获取用户详情
      if (users.users && users.users.length > 0) {
        const user = users.users.find(u => u.role === 'BUSINESS_STAFF');
        if (user) {
          const userDetailResponse = await axios.get(
            `${API_BASE}/platform/users/${user.id}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );

          if (userDetailResponse.data.success) {
            recordTest('获取用户详情', true);
            const detail = userDetailResponse.data.data;
            log(`   用户"${detail.name}"详情:`, 'blue');
            log(`   - 邮箱: ${detail.email}`, 'blue');
            log(`   - 角色: ${detail.role}`, 'blue');
            log(`   - 状态: ${detail.isActive ? '启用' : '禁用'}`, 'blue');
            log(`   - 最后登录: ${detail.lastLoginAt || '从未登录'}`, 'blue');
          } else {
            recordTest('获取用户详情', false);
          }
        }
      }
    } else {
      recordTest('获取用户列表', false);
    }

    // ========================================
    // 登录追踪测试
    // ========================================
    section('4. 登录追踪测试');

    // 使用商务账号登录
    const staffLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'staff@demo.com',
      password: 'staff123',
    });

    if (staffLoginResponse.data.success) {
      const staffToken = staffLoginResponse.data.data.tokens.accessToken;
      
      // 获取当前用户信息
      const meResponse = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });

      if (meResponse.data.success) {
        const currentUser = meResponse.data.data.user;
        if (currentUser.lastLoginAt) {
          recordTest('登录时间追踪', true);
          log(`   最后登录时间: ${currentUser.lastLoginAt}`, 'blue');
        } else {
          recordTest('登录时间追踪', false, 'lastLoginAt字段为空');
        }
      } else {
        recordTest('登录时间追踪', false, '获取用户信息失败');
      }
    } else {
      recordTest('登录时间追踪', false, '商务账号登录失败');
    }

    // ========================================
    // 测试总结
    // ========================================
    section('测试总结');

    log(`总测试数: ${results.total}`, 'cyan');
    log(`通过: ${results.passed}`, 'green');
    log(`失败: ${results.failed}`, 'red');
    log(`通过率: ${((results.passed / results.total) * 100).toFixed(2)}%`, 'cyan');

    if (results.failed > 0) {
      console.log('\n失败的测试:');
      results.tests
        .filter(t => !t.passed)
        .forEach(t => {
          log(`  ❌ ${t.name}`, 'red');
          if (t.message) log(`     ${t.message}`, 'yellow');
        });
    }

    // 保存测试报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        passRate: ((results.passed / results.total) * 100).toFixed(2) + '%',
      },
      tests: results.tests,
    };

    fs.writeFileSync('test-report.json', JSON.stringify(report, null, 2));
    log('\n测试报告已保存到: test-report.json', 'cyan');

    if (results.failed === 0) {
      log('\n🎉 所有测试通过！', 'green');
    } else {
      log('\n⚠️  部分测试失败，请检查问题', 'yellow');
    }

  } catch (error) {
    log('\n❌ 测试执行失败:', 'red');
    console.error(error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
test();
