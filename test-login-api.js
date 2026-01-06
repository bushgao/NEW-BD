const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'staff@demo.com',
        password: 'staff123'
      })
    });

    const data = await response.json();
    
    console.log('=== 登录响应 ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n=== 用户角色 ===');
    console.log('user.role:', data.data?.user?.role);
    console.log('typeof user.role:', typeof data.data?.user?.role);
    console.log('================');
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
