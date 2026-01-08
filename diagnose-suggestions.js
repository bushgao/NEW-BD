// 诊断脚本：检查智能建议功能
console.log('='.repeat(60));
console.log('🔍 智能建议功能诊断');
console.log('='.repeat(60));

// 1. 检查 Token
const token = localStorage.getItem('token');
console.log('\n1️⃣ Token 检查:');
if (token) {
    console.log('✅ Token 存在:', token.substring(0, 30) + '...');
} else {
    console.log('❌ Token 不存在，请先登录');
}

// 2. 检查用户信息
const userStr = localStorage.getItem('user');
console.log('\n2️⃣ 用户信息检查:');
if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('✅ 用户信息:', {
            id: user.id,
            name: user.name,
            role: user.role,
            factoryId: user.factoryId
        });
    } catch (e) {
        console.log('❌ 用户信息解析失败');
    }
} else {
    console.log('❌ 用户信息不存在');
}

// 3. 测试 API 连接
console.log('\n3️⃣ 测试后端 API 连接:');
fetch('http://localhost:3001/api/collaborations/suggestions?influencerId=test-id&type=sample', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('📡 响应状态:', response.status, response.statusText);
    return response.json();
})
.then(data => {
    console.log('📡 响应数据:', data);
    if (data.success) {
        console.log('✅ API 正常工作');
        console.log('建议数量:', data.data.suggestions?.length || 0);
    } else {
        console.log('❌ API 返回错误:', data.error);
    }
})
.catch(error => {
    console.log('❌ API 请求失败:', error.message);
});

// 4. 检查前端代码
console.log('\n4️⃣ 检查前端代码状态:');
console.log('提示：请打开 CreateCollaborationModal 并选择一个达人');
console.log('然后查看控制台是否有以下日志：');
console.log('  - handleInfluencerChange: 达人选择变化');
console.log('  - loadSuggestions: 开始加载建议');
console.log('  - loadSuggestions: API 响应');

// 5. 检查是否有测试建议
console.log('\n5️⃣ 测试建议检查:');
console.log('如果选择达人后没有看到建议卡片，可能的原因：');
console.log('  1. 前端代码未更新（需要刷新浏览器 Ctrl+F5）');
console.log('  2. React 组件未重新渲染');
console.log('  3. suggestions 状态未正确更新');

console.log('\n' + '='.repeat(60));
console.log('💡 下一步操作：');
console.log('1. 在浏览器中打开 http://localhost:5173');
console.log('2. 登录系统');
console.log('3. 打开控制台（F12）');
console.log('4. 粘贴并运行此脚本');
console.log('5. 打开"新建合作"对话框');
console.log('6. 选择一个达人');
console.log('7. 观察控制台日志和页面上的建议卡片');
console.log('='.repeat(60));
