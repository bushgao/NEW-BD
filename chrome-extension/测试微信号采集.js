// 在达人详情页控制台运行此脚本，测试微信号采集

console.log('=== 🧪 测试微信号采集 ===\n');

// 模拟 clickEyeIcon 函数
async function testClickEyeIcon() {
  try {
    console.log('1️⃣ 正在查找所有眼睛图标...');
    
    const eyeIcons = [];
    
    // 策略1：查找所有16x16的小图标
    const allImages = document.querySelectorAll('img');
    console.log(`   找到 ${allImages.length} 个图片元素`);
    
    for (const img of allImages) {
      const rect = img.getBoundingClientRect();
      // 查找16x16或接近的小图标
      if (rect.width >= 14 && rect.width <= 20 && rect.height >= 14 && rect.height <= 20) {
        // 检查是否在联系方式区域附近
        const parent = img.closest('[class*="contact"], [class*="info"], [class*="detail"]');
        if (parent || img.src.includes('elabpic.com')) {
          eyeIcons.push(img);
          console.log(`   ✅ 找到眼睛图标 (16x16):`, {
            src: img.src.substring(0, 60),
            width: rect.width,
            height: rect.height
          });
        }
      }
    }
    
    // 策略2：查找联系方式字段附近的所有可点击元素
    const keywords = ['手机号', '微信号'];
    for (const keyword of keywords) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.includes(keyword)) {
          let parent = node.parentElement;
          for (let i = 0; i < 3 && parent; i++) {
            // 查找附近的小图标
            const nearbyImages = parent.querySelectorAll('img');
            for (const img of nearbyImages) {
              const rect = img.getBoundingClientRect();
              if (rect.width > 10 && rect.width < 30 && rect.height > 10 && rect.height < 30) {
                // 避免重复添加
                if (!eyeIcons.includes(img)) {
                  eyeIcons.push(img);
                  console.log(`   ✅ 找到眼睛图标 (${keyword}附近):`, {
                    src: img.src.substring(0, 60),
                    width: rect.width,
                    height: rect.height
                  });
                }
              }
            }
            parent = parent.parentElement;
          }
        }
      }
    }
    
    if (eyeIcons.length > 0) {
      console.log(`\n2️⃣ 共找到 ${eyeIcons.length} 个眼睛图标，开始点击...\n`);
      
      // 点击所有找到的眼睛图标
      for (let i = 0; i < eyeIcons.length; i++) {
        const eyeIcon = eyeIcons[i];
        const clickTarget = eyeIcon.tagName === 'IMG' ? eyeIcon.parentElement : eyeIcon;
        clickTarget.click();
        console.log(`   ✅ 已点击第 ${i + 1} 个眼睛图标`);
        
        // 每次点击后等待 500ms
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 最后再等待 1.5 秒让所有联系方式显示
      console.log('\n   ⏳ 等待 1.5 秒让联系方式显示...\n');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } else {
      console.log('   ❌ 未找到眼睛图标');
      return false;
    }
  } catch (error) {
    console.error('   ❌ 点击眼睛图标失败:', error);
    return false;
  }
}

// 测试提取联系方式
function testExtractContact() {
  console.log('3️⃣ 正在提取联系方式...\n');
  
  const allText = document.body.innerText;
  
  let phone = '';
  let wechat = '';
  
  // 提取手机号
  const phoneMatch = allText.match(/达人手机号[：:]\s*([^\n]+)/);
  if (phoneMatch) {
    phone = phoneMatch[1].trim();
    console.log('   ✅ 手机号:', phone);
  } else {
    console.log('   ❌ 未找到手机号');
  }
  
  // 提取微信号
  const wechatMatch = allText.match(/达人微信号[：:]\s*([^\n]+)/);
  if (wechatMatch) {
    wechat = wechatMatch[1].trim();
    console.log('   ✅ 微信号:', wechat);
  } else {
    console.log('   ❌ 未找到微信号');
  }
  
  // 检查是否还是星号
  if (phone && phone.includes('*')) {
    console.log('   ⚠️  手机号仍然是星号，可能需要再次点击眼睛图标');
  }
  
  if (wechat && wechat.includes('*')) {
    console.log('   ⚠️  微信号仍然是星号，可能需要再次点击眼睛图标');
  }
  
  return { phone, wechat };
}

// 执行测试
(async function() {
  // 先点击眼睛图标
  await testClickEyeIcon();
  
  // 然后提取联系方式
  const result = testExtractContact();
  
  console.log('\n=== 📊 测试结果 ===');
  console.log('手机号:', result.phone || '未采集到');
  console.log('微信号:', result.wechat || '未采集到');
  console.log('\n=== 🧪 测试完成 ===');
})();
