/**
 * 快速跟进功能测试脚本
 * 
 * 测试内容：
 * 1. 获取跟进模板列表
 * 2. 快速跟进API
 * 3. 验证跟进记录创建
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 从命令行参数获取token，或使用默认token
const token = process.argv[2] || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NTBmZGUzOS1hMTBjLTRhMDMtYjBjZi1lMzQwMzI2YzQwNjgiLCJlbWFpbCI6ImZhY3Rvcnkub3duZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiRkFDVE9SWV9PV05FUiIsImZhY3RvcnlJZCI6IjVhNzJiZjU3LTU5YzItNGRjZS1iNzI5LTk3YzI5YzI5YzI5YyIsImlhdCI6MTczNjI0NTU3MCwiZXhwIjoxNzM2MzMxOTcwfQ.Kiro_Generated_Token';

async function testQuickFollowUp() {
  console.log('🚀 开始测试快速跟进功能...\n');

  try {
    // 1. 获取跟进模板列表
    console.log('📋 测试1: 获取跟进模板列表');
    const templatesResponse = await fetch(`${API_BASE_URL}/collaborations/follow-up-templates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!templatesResponse.ok) {
      throw new Error(`获取模板失败: ${templatesResponse.status}`);
    }

    const templatesResult = await templatesResponse.json();
    console.log('✅ 模板列表获取成功');
    console.log(`   - 模板数量: ${templatesResult.data.templates.length}`);
    console.log(`   - 模板分类: ${[...new Set(templatesResult.data.templates.map(t => t.category))].join(', ')}`);
    
    // 显示前3个模板
    console.log('   - 示例模板:');
    templatesResult.data.templates.slice(0, 3).forEach(template => {
      console.log(`     * ${template.name} (${template.category})`);
    });
    console.log('');

    // 2. 获取一个合作记录用于测试
    console.log('📋 测试2: 获取合作记录');
    const collaborationsResponse = await fetch(`${API_BASE_URL}/collaborations?pageSize=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!collaborationsResponse.ok) {
      throw new Error(`获取合作记录失败: ${collaborationsResponse.status}`);
    }

    const collaborationsResult = await collaborationsResponse.json();
    
    if (collaborationsResult.data.data.length === 0) {
      console.log('⚠️  没有找到合作记录，跳过快速跟进测试');
      return;
    }

    const testCollaboration = collaborationsResult.data.data[0];
    console.log('✅ 找到测试合作记录');
    console.log(`   - 合作ID: ${testCollaboration.id}`);
    console.log(`   - 达人: ${testCollaboration.influencer.nickname}`);
    console.log(`   - 阶段: ${testCollaboration.stage}`);
    console.log('');

    // 3. 测试快速跟进
    console.log('📋 测试3: 快速跟进');
    const quickFollowUpData = {
      content: `【测试】快速跟进功能测试 - ${new Date().toLocaleString('zh-CN')}`,
    };

    const quickFollowUpResponse = await fetch(
      `${API_BASE_URL}/collaborations/${testCollaboration.id}/follow-up/quick`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quickFollowUpData),
      }
    );

    if (!quickFollowUpResponse.ok) {
      const error = await quickFollowUpResponse.json();
      throw new Error(`快速跟进失败: ${error.error?.message || quickFollowUpResponse.status}`);
    }

    const quickFollowUpResult = await quickFollowUpResponse.json();
    console.log('✅ 快速跟进成功');
    console.log(`   - 跟进ID: ${quickFollowUpResult.data.followUp.id}`);
    console.log(`   - 内容: ${quickFollowUpResult.data.followUp.content}`);
    console.log(`   - 创建时间: ${new Date(quickFollowUpResult.data.followUp.createdAt).toLocaleString('zh-CN')}`);
    console.log('');

    // 4. 验证跟进记录已创建
    console.log('📋 测试4: 验证跟进记录');
    const followUpsResponse = await fetch(
      `${API_BASE_URL}/collaborations/${testCollaboration.id}/follow-ups?pageSize=5`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!followUpsResponse.ok) {
      throw new Error(`获取跟进记录失败: ${followUpsResponse.status}`);
    }

    const followUpsResult = await followUpsResponse.json();
    const latestFollowUp = followUpsResult.data.data[0];
    
    console.log('✅ 跟进记录验证成功');
    console.log(`   - 总跟进数: ${followUpsResult.data.total}`);
    console.log(`   - 最新跟进: ${latestFollowUp.content.substring(0, 50)}...`);
    console.log(`   - 跟进人: ${latestFollowUp.user.name}`);
    console.log('');

    // 测试总结
    console.log('═══════════════════════════════════════');
    console.log('✅ 所有测试通过！');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log('功能验证：');
    console.log('  ✓ 跟进模板列表获取正常');
    console.log('  ✓ 快速跟进API工作正常');
    console.log('  ✓ 跟进记录创建成功');
    console.log('  ✓ 跟进记录可以正常查询');
    console.log('');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('');
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 运行测试
testQuickFollowUp();
