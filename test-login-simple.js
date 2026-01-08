/**
 * 简单的登录测试
 */

const API_BASE = 'http://localhost:3000/api';

async function testLogin(email, password) {
  console.log(`\n测试登录: ${email}`);
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    console.log(`状态: ${response.status}`);
    console.log(`响应:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ 登录成功');
      return data.data;
    } else {
      console.log('❌ 登录失败');
      return null;
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== 测试登录 ===\n');
  
  // 测试不同的密码
  const passwords = ['password123', 'Password123', '123456', 'demo123'];
  
  for (const password of passwords) {
    const result = await testLogin('owner@demo.com', password);
    if (result) {
      console.log(`\n✅ 找到正确密码: ${password}`);
      break;
    }
  }
}

main().catch(console.error);
