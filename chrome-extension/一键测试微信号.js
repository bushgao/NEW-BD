// 🚀 一键测试微信号采集
// 复制此文件全部内容，在达人详情页控制台粘贴并回车

console.clear();
console.log('%c🚀 一键测试微信号采集', 'font-size: 20px; color: #1890ff; font-weight: bold');
console.log('');

(async function() {
  // 步骤1：查找眼睛图标
  console.log('%c📍 步骤1: 查找眼睛图标', 'font-size: 16px; color: #52c41a; font-weight: bold');
  
  const eyeIcons = [];
  const allImages = document.querySelectorAll('img');
  
  for (const img of allImages) {
    const rect = img.getBoundingClientRect();
    if (rect.width >= 14 && rect.width <= 20 && rect.height >= 14 && rect.height <= 20) {
      const parent = img.closest('[class*="contact"], [class*="info"], [class*="detail"]');
      if (parent || img.src.includes('elabpic.com')) {
        eyeIcons.push(img);
      }
    }
  }
  
  // 查找联系方式附近的图标
  const keywords = ['手机号', '微信号'];
  for (const keyword of keywords) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(keyword)) {
        let parent = node.parentElement;
        for (let i = 0; i < 3 && parent; i++) {
          const nearbyImages = parent.querySelectorAll('img');
          for (const img of nearbyImages) {
            const rect = img.getBoundingClientRect();
            if (rect.width > 10 && rect.width < 30 && rect.height > 10 && rect.height < 30) {
              if (!eyeIcons.includes(img)) {
                eyeIcons.push(img);
              }
            }
          }
          parent = parent.parentElement;
        }
      }
    }
  }
  
  console.log(`找到 ${eyeIcons.length} 个眼睛图标`);
  
  if (eyeIcons.length === 0) {
    console.log('%c❌ 没有找到眼睛图标！', 'color: #ff4d4f; font-weight: bold');
    console.log('可能原因：');
    console.log('1. 联系方式已经显示，不需要点击');
    console.log('2. 页面结构不同，需要调整查找逻辑');
    return;
  }
  
  // 步骤2：点击眼睛图标
  console.log('');
  console.log('%c📍 步骤2: 点击眼睛图标', 'font-size: 16px; color: #52c41a; font-weight: bold');
  
  for (let i = 0; i < eyeIcons.length; i++) {
    const eyeIcon = eyeIcons[i];
    const clickTarget = eyeIcon.tagName === 'IMG' ? eyeIcon.parentElement : eyeIcon;
    clickTarget.click();
    console.log(`✅ 已点击第 ${i + 1} 个眼睛图标`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('⏳ 等待内容加载...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 步骤3：提取联系方式
  console.log('');
  console.log('%c📍 步骤3: 提取联系方式', 'font-size: 16px; color: #52c41a; font-weight: bold');
  
  const allText = document.body.innerText;
  
  let phone = '';
  let wechat = '';
  
  const phoneMatch = allText.match(/达人手机号[：:]\s*([^\n]+)/);
  if (phoneMatch) {
    phone = phoneMatch[1].trim();
  }
  
  const wechatMatch = allText.match(/达人微信号[：:]\s*([^\n]+)/);
  if (wechatMatch) {
    wechat = wechatMatch[1].trim();
  }
  
  // 步骤4：显示结果
  console.log('');
  console.log('%c📊 测试结果', 'font-size: 18px; color: #1890ff; font-weight: bold');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (phone) {
    if (phone.includes('*')) {
      console.log('%c手机号: ' + phone + ' ⚠️  仍然是星号', 'color: #faad14; font-size: 14px');
    } else {
      console.log('%c手机号: ' + phone + ' ✅', 'color: #52c41a; font-size: 14px; font-weight: bold');
    }
  } else {
    console.log('%c手机号: 未采集到 ❌', 'color: #ff4d4f; font-size: 14px');
  }
  
  if (wechat) {
    if (wechat.includes('*')) {
      console.log('%c微信号: ' + wechat + ' ⚠️  仍然是星号', 'color: #faad14; font-size: 14px');
    } else {
      console.log('%c微信号: ' + wechat + ' ✅', 'color: #52c41a; font-size: 14px; font-weight: bold');
    }
  } else {
    console.log('%c微信号: 未采集到 ❌', 'color: #ff4d4f; font-size: 14px');
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 给出建议
  console.log('');
  if (phone && !phone.includes('*') && wechat && !wechat.includes('*')) {
    console.log('%c🎉 完美！两个联系方式都采集成功！', 'color: #52c41a; font-size: 16px; font-weight: bold');
    console.log('');
    console.log('现在可以点击"添加到 Zilo"按钮测试完整流程');
  } else if (phone.includes('*') || wechat.includes('*')) {
    console.log('%c💡 建议', 'color: #1890ff; font-size: 14px; font-weight: bold');
    console.log('联系方式仍然是星号，可能需要：');
    console.log('1. 手动点击眼睛图标，看是否能显示');
    console.log('2. 增加等待时间（页面加载慢）');
    console.log('3. 检查是否有多个眼睛图标没有被点击');
  } else {
    console.log('%c💡 建议', 'color: #1890ff; font-size: 14px; font-weight: bold');
    console.log('未找到联系方式，可能原因：');
    console.log('1. 该达人没有填写联系方式');
    console.log('2. 页面结构不同，需要调整提取逻辑');
    console.log('3. 需要先手动点击眼睛图标');
  }
  
  console.log('');
  console.log('%c✅ 测试完成', 'font-size: 16px; color: #52c41a; font-weight: bold');
})();
