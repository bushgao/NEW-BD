/**
 * 智能提醒系统测试脚本
 * 
 * 测试内容：
 * 1. 获取智能提醒列表
 * 2. 验证提醒类型和优先级
 * 3. 测试标记已读功能
 * 4. 测试全部标记已读功能
 */

const API_BASE_URL = 'http://localhost:3001/api';

// 测试用的 token（需要替换为实际的工厂老板 token）
const FACTORY_OWNER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTRzNGRxZGswMDAwMTJwZGZqNGRxZGsiLCJlbWFpbCI6ImZhY3RvcnlAZXhhbXBsZS5jb20iLCJyb2xlIjoiRkFDVE9SWV9PV05FUiIsImZhY3RvcnlJZCI6ImNtNHM0ZHFkazAwMDAxMnBkZmo0ZHFkayIsImlhdCI6MTczNjI0MDAwMCwiZXhwIjoxNzM2MzI2NDAwfQ.example';

async function testSmartNotifications() {
  console.log('='.repeat(60));
  console.log('智能提醒系统测试');
  console.log('='.repeat(60));

  try {
    // 测试 1: 获取智能提醒列表
    console.log('\n📋 测试 1: 获取智能提醒列表');
    console.log('-'.repeat(60));
    
    const alertsResponse = await fetch(`${API_BASE_URL}/reports/dashboard/alerts`, {
      headers: {
        'Authorization': `Bearer ${FACTORY_OWNER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!alertsResponse.ok) {
      throw new Error(`获取提醒失败: ${alertsResponse.status} ${alertsResponse.statusText}`);
    }

    const alertsData = await alertsResponse.json();
    console.log('✅ 成功获取智能提醒');
    console.log(`   未读数量: ${alertsData.data.unreadCount}`);
    console.log(`   提醒总数: ${alertsData.data.alerts.length}`);

    // 显示提醒详情
    if (alertsData.data.alerts.length > 0) {
      console.log('\n提醒列表:');
      alertsData.data.alerts.forEach((alert, index) => {
        console.log(`\n${index + 1}. ${alert.title}`);
        console.log(`   类型: ${alert.type}`);
        console.log(`   优先级: ${alert.priority}`);
        console.log(`   描述: ${alert.description}`);
        console.log(`   已读: ${alert.read ? '是' : '否'}`);
        if (alert.actionUrl) {
          console.log(`   操作: ${alert.actionLabel} (${alert.actionUrl})`);
        }
      });

      // 测试 2: 标记单个提醒为已读
      if (alertsData.data.alerts.length > 0 && !alertsData.data.alerts[0].read) {
        console.log('\n📝 测试 2: 标记单个提醒为已读');
        console.log('-'.repeat(60));
        
        const firstAlertId = alertsData.data.alerts[0].id;
        const markReadResponse = await fetch(
          `${API_BASE_URL}/reports/dashboard/alerts/${firstAlertId}/read`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${FACTORY_OWNER_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!markReadResponse.ok) {
          throw new Error(`标记已读失败: ${markReadResponse.status}`);
        }

        const markReadData = await markReadResponse.json();
        console.log('✅ 成功标记提醒为已读');
        console.log(`   提醒ID: ${firstAlertId}`);
        console.log(`   消息: ${markReadData.message}`);
      }

      // 测试 3: 全部标记为已读
      console.log('\n📝 测试 3: 全部标记为已读');
      console.log('-'.repeat(60));
      
      const markAllReadResponse = await fetch(
        `${API_BASE_URL}/reports/dashboard/alerts/read-all`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${FACTORY_OWNER_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!markAllReadResponse.ok) {
        throw new Error(`全部标记已读失败: ${markAllReadResponse.status}`);
      }

      const markAllReadData = await markAllReadResponse.json();
      console.log('✅ 成功全部标记为已读');
      console.log(`   消息: ${markAllReadData.message}`);
    } else {
      console.log('\n⚠️  当前没有提醒');
    }

    // 测试 4: 验证提醒类型分布
    console.log('\n📊 测试 4: 提醒类型分布');
    console.log('-'.repeat(60));
    
    const typeCount = {
      summary: 0,
      warning: 0,
      reminder: 0,
    };

    const priorityCount = {
      high: 0,
      medium: 0,
      low: 0,
    };

    alertsData.data.alerts.forEach(alert => {
      typeCount[alert.type]++;
      priorityCount[alert.priority]++;
    });

    console.log('类型分布:');
    console.log(`   工作摘要: ${typeCount.summary}`);
    console.log(`   异常预警: ${typeCount.warning}`);
    console.log(`   重要提醒: ${typeCount.reminder}`);

    console.log('\n优先级分布:');
    console.log(`   高优先级: ${priorityCount.high}`);
    console.log(`   中优先级: ${priorityCount.medium}`);
    console.log(`   低优先级: ${priorityCount.low}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 所有测试通过！');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('\n错误堆栈:', error.stack);
    }
    process.exit(1);
  }
}

// 运行测试
testSmartNotifications();
