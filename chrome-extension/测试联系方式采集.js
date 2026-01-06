// 在抖音达人详情页的浏览器控制台中运行此脚本
// 用于测试联系方式采集功能

(async function testContactInfo() {
  console.log('=== 开始测试联系方式采集 ===');
  
  // 1. 检查当前页面 URL
  console.log('当前页面:', window.location.href);
  
  // 2. 提取 ewid
  const urlParams = new URLSearchParams(window.location.search);
  const ewid = urlParams.get('ewid');
  
  if (!ewid) {
    console.error('❌ 未找到 ewid 参数！');
    console.log('请确保在达人详情页（URL 包含 ewid 参数）');
    return;
  }
  
  console.log('✅ 找到 ewid:', ewid);
  
  // 3. 构建 API URL
  const apiUrl = `https://buyin.jinritemai.com/api/contact/contact_info?ewid=${ewid}`;
  console.log('API URL:', apiUrl);
  
  // 4. 发送请求
  console.log('正在请求联系方式...');
  try {
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
      return;
    }
    
    const data = await response.json();
    console.log('✅ API 响应:', data);
    
    // 5. 解析联系方式
    if (data.code === 0 && data.data && data.data.contact_info) {
      const contactValue = data.data.contact_info.contact_value || '';
      console.log('📞 联系方式:', contactValue);
      
      // 6. 分类逻辑测试
      const hasSpecialChars = /[()+-]/.test(contactValue);
      const isAllDigits = /^\d+$/.test(contactValue);
      const hasLetters = /[a-zA-Z]/.test(contactValue);
      
      console.log('分类分析:');
      console.log('  - 包含特殊字符:', hasSpecialChars);
      console.log('  - 纯数字:', isAllDigits);
      console.log('  - 包含字母:', hasLetters);
      console.log('  - 长度:', contactValue.length);
      
      let result;
      if (hasSpecialChars || (isAllDigits && contactValue.length >= 11)) {
        result = { phone: contactValue, wechat: '' };
        console.log('✅ 分类为: 手机号');
      } else if (hasLetters) {
        result = { phone: '', wechat: contactValue };
        console.log('✅ 分类为: 微信号');
      } else {
        result = { phone: contactValue, wechat: '' };
        console.log('⚠️ 无法明确分类，默认为: 手机号');
      }
      
      console.log('最终结果:', result);
      
      // 7. 显示完整的达人信息（模拟插件采集）
      console.log('\n=== 模拟完整采集数据 ===');
      const mockData = {
        nickname: '测试达人',
        platform: 'DOUYIN',
        platformId: ewid,
        phone: result.phone,
        wechat: result.wechat,
        followers: '10000',
        categories: ['美妆'],
        tags: ['测试'],
        notes: '通过测试脚本采集'
      };
      console.log(mockData);
      
    } else {
      console.error('❌ 响应数据格式不正确');
      console.log('data.code:', data.code);
      console.log('data.data:', data.data);
    }
    
  } catch (error) {
    console.error('❌ 请求失败:', error);
  }
  
  console.log('\n=== 测试完成 ===');
})();
