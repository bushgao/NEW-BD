/**
 * 快捷操作面板功能测试脚本
 * 测试 Day 4 任务 9 - 快捷操作面板
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// 测试账号
const FACTORY_OWNER = {
  email: 'owner@demo.com',
  password: 'owner123',
};

let ownerToken = '';

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

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// 登录函数
async function login(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    if (response.data.success) {
      logSuccess(`登录成功: ${email}`);
      return response.data.data.token;
    } else {
      logError(`登录失败: ${response.data.error?.message}`);
      return null;
    }
  } catch (error) {
    logError(`登录失败: ${error.response?.data?.error?.message || error.message}`);
    return null;
  }
}

// 测试获取每日摘要数据
async function testGetDailySummary() {
  logSection('测试 1: 获取每日摘要数据');

  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/daily-summary`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    if (response.data.success) {
      const data = response.data.data;
      logSuccess('成功获取每日摘要数据');
      
      logInfo(`超期合作数量: ${data.overdueCollaborations}`);
      logInfo(`待签收样品数量: ${data.pendingSamples}`);
      logInfo(`待录入结果数量: ${data.pendingResults}`);
      logInfo(`预警数量: ${data.alerts.length}`);
      logInfo(`亮点数量: ${data.highlights.length}`);
      
      // 显示预警信息
      if (data.alerts.length > 0) {
        console.log('\n预警信息:');
        data.alerts.forEach((alert, index) => {
          const severityColor = alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue';
          log(`  ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.title}`, severityColor);
          log(`     ${alert.description}`, 'reset');
        });
      }
      
      // 显示亮点信息
      if (data.highlights.length > 0) {
        console.log('\n亮点信息:');
        data.highlights.forEach((highlight, index) => {
          log(`  ${index + 1}. ${highlight}`, 'green');
        });
      }
      
      return true;
    } else {
      logError(`获取失败: ${response.data.error?.message}`);
      return false;
    }
  } catch (error) {
    logError(`获取失败: ${error.response?.data?.error?.message || error.message}`);
    if (error.response?.data) {
      console.log('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// 测试数据结构
async function testDataStructure() {
  logSection('测试 2: 验证数据结构');

  try {
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/daily-summary`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    if (response.data.success) {
      const data = response.data.data;
      
      // 验证必需字段
      const requiredFields = [
        'overdueCollaborations',
        'pendingSamples',
        'pendingResults',
        'alerts',
        'highlights',
      ];
      
      let allFieldsPresent = true;
      requiredFields.forEach(field => {
        if (data[field] === undefined) {
          logError(`缺少必需字段: ${field}`);
          allFieldsPresent = false;
        } else {
          logSuccess(`字段存在: ${field}`);
        }
      });
      
      // 验证数据类型
      if (typeof data.overdueCollaborations !== 'number') {
        logError('overdueCollaborations 应该是数字类型');
        allFieldsPresent = false;
      }
      
      if (typeof data.pendingSamples !== 'number') {
        logError('pendingSamples 应该是数字类型');
        allFieldsPresent = false;
      }
      
      if (typeof data.pendingResults !== 'number') {
        logError('pendingResults 应该是数字类型');
        allFieldsPresent = false;
      }
      
      if (!Array.isArray(data.alerts)) {
        logError('alerts 应该是数组类型');
        allFieldsPresent = false;
      }
      
      if (!Array.isArray(data.highlights)) {
        logError('highlights 应该是数组类型');
        allFieldsPresent = false;
      }
      
      // 验证 alert 对象结构
      if (data.alerts.length > 0) {
        const alert = data.alerts[0];
        const alertFields = ['id', 'type', 'title', 'description', 'severity', 'createdAt'];
        alertFields.forEach(field => {
          if (alert[field] === undefined) {
            logError(`Alert 对象缺少字段: ${field}`);
            allFieldsPresent = false;
          }
        });
      }
      
      if (allFieldsPresent) {
        logSuccess('所有数据结构验证通过');
      }
      
      return allFieldsPresent;
    } else {
      logError(`获取失败: ${response.data.error?.message}`);
      return false;
    }
  } catch (error) {
    logError(`验证失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 测试权限控制
async function testPermissions() {
  logSection('测试 3: 权限控制');

  try {
    // 尝试不带 token 访问
    logInfo('测试未授权访问...');
    try {
      await axios.get(`${API_BASE_URL}/reports/dashboard/daily-summary`);
      logError('应该拒绝未授权访问');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        logSuccess('正确拒绝未授权访问');
      } else {
        logError(`意外的错误状态: ${error.response?.status}`);
        return false;
      }
    }
    
    // 工厂老板访问
    logInfo('测试工厂老板访问...');
    const response = await axios.get(`${API_BASE_URL}/reports/dashboard/daily-summary`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    
    if (response.data.success) {
      logSuccess('工厂老板可以访问每日摘要');
      return true;
    } else {
      logError('工厂老板访问失败');
      return false;
    }
  } catch (error) {
    logError(`权限测试失败: ${error.response?.data?.error?.message || error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'cyan');
    log('║         快捷操作面板功能测试 - Day 4 任务 9              ║', 'cyan');
    log('╚════════════════════════════════════════════════════════════╝', 'cyan');

    // 登录
    logSection('准备测试环境');
    ownerToken = await login(FACTORY_OWNER.email, FACTORY_OWNER.password);
    
    if (!ownerToken) {
      logError('无法登录，测试终止');
      process.exit(1);
    }

    // 运行测试
    const results = {
      dailySummary: await testGetDailySummary(),
      dataStructure: await testDataStructure(),
      permissions: await testPermissions(),
    };

    // 测试总结
    logSection('测试总结');
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r).length;
    const failedTests = totalTests - passedTests;

    console.log('\n测试结果:');
    Object.entries(results).forEach(([name, passed]) => {
      const status = passed ? '✓ 通过' : '✗ 失败';
      const color = passed ? 'green' : 'red';
      log(`  ${name}: ${status}`, color);
    });

    console.log('\n统计:');
    log(`  总测试数: ${totalTests}`, 'blue');
    log(`  通过: ${passedTests}`, 'green');
    log(`  失败: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`  成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 
        failedTests > 0 ? 'yellow' : 'green');

    if (failedTests === 0) {
      console.log('\n');
      log('╔════════════════════════════════════════════════════════════╗', 'green');
      log('║                  🎉 所有测试通过！                        ║', 'green');
      log('╚════════════════════════════════════════════════════════════╝', 'green');
      console.log('\n');
    } else {
      console.log('\n');
      log('╔════════════════════════════════════════════════════════════╗', 'red');
      log('║                  ⚠️  部分测试失败                         ║', 'red');
      log('╚════════════════════════════════════════════════════════════╝', 'red');
      console.log('\n');
    }

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    logError(`测试执行失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
runTests();
