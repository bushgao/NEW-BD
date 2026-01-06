// 在达人详情页控制台运行此脚本，检查 token 获取

console.clear();
console.log('%c🔍 调试 Token 获取', 'font-size: 20px; color: #1890ff; font-weight: bold');
console.log('');

// 1. 检查 localStorage
console.log('%c1️⃣ 检查 localStorage', 'font-size: 16px; color: #52c41a; font-weight: bold');

try {
  const authStorage = localStorage.getItem('auth-storage');
  console.log('auth-storage 原始数据:', authStorage);
  
  if (authStorage) {
    const authData = JSON.parse(authStorage);
    console.log('auth-storage 解析后:', authData);
    
    if (authData && authData.state) {
      console.log('state:', authData.state);
      
      if (authData.state.token) {
        console.log('%c✅ Token 存在', 'color: #52c41a; font-weight: bold');
        console.log('accessToken:', authData.state.token.accessToken);
        console.log('Token 前10个字符:', authData.state.token.accessToken.substring(0, 10) + '...');
      } else {
        console.log('%c❌ Token 不存在', 'color: #ff4d4f; font-weight: bold');
      }
      
      if (authData.state.user) {
        console.log('%c✅ 用户信息存在', 'color: #52c41a; font-weight: bold');
        console.log('用户名:', authData.state.user.name);
        console.log('邮箱:', authData.state.user.email);
        console.log('角色:', authData.state.user.role);
      } else {
        console.log('%c❌ 用户信息不存在', 'color: #ff4d4f; font-weight: bold');
      }
    } else {
      console.log('%c❌ state 不存在', 'color: #ff4d4f; font-weight: bold');
    }
  } else {
    console.log('%c❌ auth-storage 不存在', 'color: #ff4d4f; font-weight: bold');
    console.log('');
    console.log('💡 可能的原因:');
    console.log('1. 用户未登录');
    console.log('2. localStorage 被清除');
    console.log('3. 在错误的域名下运行');
  }
} catch (error) {
  console.log('%c❌ 读取 localStorage 失败', 'color: #ff4d4f; font-weight: bold');
  console.error('错误:', error);
}

// 2. 测试 getTokenFromPage 函数
console.log('');
console.log('%c2️⃣ 测试 getTokenFromPage 函数', 'font-size: 16px; color: #52c41a; font-weight: bold');

function getTokenFromPage() {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      if (authData && authData.state && authData.state.token) {
        return authData.state.token.accessToken;
      }
    }
  } catch (error) {
    console.error('[Zilo] 获取页面 token 失败:', error);
  }
  return null;
}

const token = getTokenFromPage();
if (token) {
  console.log('%c✅ 成功获取 Token', 'color: #52c41a; font-weight: bold');
  console.log('Token 前10个字符:', token.substring(0, 10) + '...');
  console.log('Token 长度:', token.length);
} else {
  console.log('%c❌ 获取 Token 失败', 'color: #ff4d4f; font-weight: bold');
}

// 3. 检查当前域名
console.log('');
console.log('%c3️⃣ 检查当前域名', 'font-size: 16px; color: #52c41a; font-weight: bold');
console.log('当前 URL:', window.location.href);
console.log('当前域名:', window.location.hostname);
console.log('当前协议:', window.location.protocol);

// 4. 检查所有 localStorage keys
console.log('');
console.log('%c4️⃣ 检查所有 localStorage keys', 'font-size: 16px; color: #52c41a; font-weight: bold');
const keys = Object.keys(localStorage);
console.log('localStorage 中的所有 keys:', keys);
keys.forEach(key => {
  console.log(`  - ${key}`);
});

console.log('');
console.log('%c✅ 调试完成', 'font-size: 16px; color: #52c41a; font-weight: bold');
