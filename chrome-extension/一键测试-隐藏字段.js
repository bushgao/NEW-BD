// 一键测试：采集隐藏的手机号和微信号
// 复制此代码到控制台运行

(async function() {
  console.log('🚀 开始测试...\n');
  
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 查找联系方式区域
  console.log('1️⃣ 查找联系方式区域...');
  let contactDiv = null;
  document.querySelectorAll('div').forEach(div => {
    const text = div.textContent;
    if ((text.includes('手机') || text.includes('微信')) && text.length < 500) {
      contactDiv = div;
      console.log('✅ 找到:', div);
      console.log('📝 内容:', text.substring(0, 200));
    }
  });
  
  if (!contactDiv) {
    console.log('❌ 未找到联系方式区域');
    return;
  }
  
  // 查找眼睛图标
  console.log('\n2️⃣ 查找眼睛图标...');
  const icons = contactDiv.querySelectorAll('svg, i, [role="button"]');
  console.log(`找到 ${icons.length} 个可点击元素`);
  
  // 记录点击前的内容
  const before = contactDiv.textContent;
  console.log('\n3️⃣ 点击前的内容:', before);
  
  // 点击所有图标
  console.log('\n4️⃣ 尝试点击图标...');
  for (let i = 0; i < icons.length; i++) {
    try {
      console.log(`点击第 ${i + 1} 个...`);
      icons[i].click();
      await wait(300);
    } catch (e) {
      console.log('点击失败');
    }
  }
  
  await wait(1000);
  
  // 查看点击后的内容
  const after = contactDiv.textContent;
  console.log('\n5️⃣ 点击后的内容:', after);
  
  // 提取手机号
  const phoneMatch = after.match(/1[3-9]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : '未找到';
  
  // 提取微信号
  const wechatMatch = after.match(/微信[：:]\s*([a-zA-Z0-9_-]{6,20})/);
  const wechat = wechatMatch ? wechatMatch[1] : '未找到';
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 采集结果:');
  console.log('='.repeat(50));
  console.log('📱 手机号:', phone);
  console.log('💬 微信号:', wechat);
  console.log('='.repeat(50));
  
  // 显示完整的 HTML 供分析
  console.log('\n📄 完整 HTML (供分析):');
  console.log(contactDiv.outerHTML);
  
})();
