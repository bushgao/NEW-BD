// 在达人详情页控制台运行此脚本，诊断采集失败的原因

(async function debugCollectionFailure() {
  console.log('=== 开始诊断采集失败问题 ===\n');
  
  // 1. 检查页面 URL
  console.log('1. 检查页面 URL');
  console.log('当前 URL:', window.location.href);
  const urlParams = new URLSearchParams(window.location.search);
  const ewid = urlParams.get('ewid');
  console.log('ewid 参数:', ewid || '❌ 未找到');
  
  if (!ewid) {
    console.error('❌ 错误：URL 中没有 ewid 参数');
    console.log('请确保在达人详情页（URL 应包含 ?ewid=xxx）');
    return;
  }
  console.log('✅ ewid 检查通过\n');
  
  // 2. 检查扩展是否加载
  console.log('2. 检查 Chrome 扩展');
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome 扩展 API 可用');
    console.log('扩展 ID:', chrome.runtime.id);
  } else {
    console.error('❌ Chrome 扩展 API 不可用');
    console.log('请检查扩展是否已安装并启用');
    return;
  }
  console.log('');
  
  // 3. 检查按钮是否存在
  console.log('3. 检查采集按钮');
  const button = document.getElementById('zilo-collect-btn');
  if (button) {
    console.log('✅ 找到采集按钮');
    console.log('按钮文本:', button.textContent);
    console.log('按钮状态:', button.disabled ? '禁用' : '启用');
  } else {
    console.error('❌ 未找到采集按钮');
    console.log('按钮 ID: zilo-collect-btn');
    console.log('可能原因：');
    console.log('  1. 扩展未正确加载');
    console.log('  2. content.js 未注入');
    console.log('  3. 页面 URL 不匹配');
  }
  console.log('');
  
  // 4. 测试联系方式 API
  console.log('4. 测试联系方式 API');
  const apiUrl = `https://buyin.jinritemai.com/api/contact/contact_info?ewid=${ewid}`;
  console.log('API URL:', apiUrl);
  
  try {
    console.log('正在请求...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('响应状态:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ API 请求失败');
      if (response.status === 401 || response.status === 403) {
        console.log('可能原因：登录已过期或没有权限');
        console.log('解决方法：重新登录抖音精选联盟');
      }
      return;
    }
    
    const data = await response.json();
    console.log('✅ API 响应成功');
    console.log('响应数据:', data);
    
    if (data.code === 0 && data.data && data.data.contact_info) {
      const contactValue = data.data.contact_info.contact_value || '';
      console.log('✅ 获取到联系方式:', contactValue);
      
      // 测试分类逻辑
      const hasSpecialChars = /[()+-]/.test(contactValue);
      const isAllDigits = /^\d+$/.test(contactValue);
      const hasLetters = /[a-zA-Z]/.test(contactValue);
      
      console.log('\n分类分析:');
      console.log('  包含特殊字符:', hasSpecialChars);
      console.log('  纯数字:', isAllDigits);
      console.log('  包含字母:', hasLetters);
      console.log('  长度:', contactValue.length);
      
      if (hasSpecialChars || (isAllDigits && contactValue.length >= 11)) {
        console.log('  → 分类为: 手机号');
      } else if (hasLetters) {
        console.log('  → 分类为: 微信号');
      } else {
        console.log('  → 分类为: 手机号 (默认)');
      }
    } else {
      console.error('❌ 响应数据格式不正确');
      console.log('data.code:', data.code);
      console.log('data.data:', data.data);
    }
  } catch (error) {
    console.error('❌ API 请求异常:', error);
    console.log('错误详情:', error.message);
  }
  console.log('');
  
  // 5. 测试达人信息提取
  console.log('5. 测试达人信息提取');
  
  // 昵称
  const nicknameSelectors = [
    'span.auxo-dorami-atom-text',
    'span[class*="atom-text"]',
    'h1', 'h2', 'h3',
  ];
  
  let nickname = '';
  for (const selector of nicknameSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text && text.length > 1 && text.length < 50 && !text.includes('抖音号')) {
        nickname = text;
        console.log('✅ 找到昵称:', nickname, '(选择器:', selector + ')');
        break;
      }
    }
  }
  
  if (!nickname) {
    console.error('❌ 未找到昵称');
    console.log('尝试的选择器:', nicknameSelectors);
  }
  
  // 粉丝数
  const allText = document.body.innerText;
  const matchesWithWan = allText.match(/(\d+\.?\d*[万wW])/g);
  if (matchesWithWan && matchesWithWan.length > 0) {
    console.log('✅ 找到粉丝数:', matchesWithWan[0]);
  } else {
    console.log('⚠️ 未找到粉丝数（带万）');
  }
  console.log('');
  
  // 6. 检查后端连接
  console.log('6. 检查后端连接');
  console.log('正在检查后端服务...');
  
  try {
    const healthResponse = await fetch('http://localhost:3000/health');
    if (healthResponse.ok) {
      console.log('✅ 后端服务正常运行');
    } else {
      console.error('❌ 后端服务响应异常');
    }
  } catch (error) {
    console.error('❌ 无法连接后端服务');
    console.log('请确保后端服务正在运行: npm run dev');
  }
  console.log('');
  
  // 7. 检查扩展配置
  console.log('7. 检查扩展配置');
  try {
    chrome.runtime.sendMessage({ action: 'getConfig' }, (config) => {
      if (chrome.runtime.lastError) {
        console.error('❌ 无法获取扩展配置:', chrome.runtime.lastError);
        return;
      }
      
      console.log('扩展配置:');
      console.log('  API URL:', config.apiUrl);
      console.log('  Token:', config.token ? '已配置 (' + config.token.substring(0, 20) + '...)' : '❌ 未配置');
      
      if (!config.token) {
        console.error('❌ 未配置登录令牌');
        console.log('解决方法：');
        console.log('  1. 点击扩展图标');
        console.log('  2. 输入 API URL 和登录令牌');
        console.log('  3. 点击保存');
      }
    });
  } catch (error) {
    console.error('❌ 检查配置失败:', error);
  }
  
  console.log('\n=== 诊断完成 ===');
  console.log('\n如果所有检查都通过，但仍然采集失败，请：');
  console.log('1. 查看浏览器控制台的完整错误信息');
  console.log('2. 查看扩展的 Service Worker 日志（chrome://extensions/ → 检查视图）');
  console.log('3. 确认后端服务日志是否有错误');
})();
