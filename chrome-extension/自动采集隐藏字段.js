// 自动采集抖音达人的隐藏手机号和微信号
// 在抖音达人主页的控制台运行此脚本

(async function() {
  console.log('🚀 开始自动采集隐藏字段...\n');
  
  // 等待函数
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 1. 查找联系方式区域
  function findContactSection() {
    console.log('📍 步骤1: 查找联系方式区域');
    
    // 可能的选择器
    const selectors = [
      '[class*="contact"]',
      '[class*="info"]',
      '[class*="detail"]',
      'div:has-text("手机")',
      'div:has-text("微信")',
    ];
    
    // 查找包含联系方式的区域
    const allDivs = document.querySelectorAll('div');
    let contactSection = null;
    
    for (let div of allDivs) {
      const text = div.textContent;
      if ((text.includes('手机') || text.includes('微信')) && 
          text.length < 500 && 
          div.children.length < 20) {
        contactSection = div;
        console.log('✅ 找到联系方式区域:', div);
        break;
      }
    }
    
    return contactSection;
  }
  
  // 2. 在指定区域内查找眼睛图标
  function findEyeIconsInSection(section) {
    console.log('\n👁️ 步骤2: 查找眼睛图标');
    
    if (!section) {
      console.log('❌ 没有找到联系方式区域');
      return [];
    }
    
    // 查找所有可点击的元素
    const clickableElements = section.querySelectorAll('svg, i, span, button, [role="button"]');
    const eyeIcons = [];
    
    clickableElements.forEach(el => {
      // 检查元素的类名、父元素文本等
      const className = el.className || '';
      const parentText = el.parentElement?.textContent || '';
      
      // 判断是否是眼睛图标
      if (className.includes('eye') || 
          className.includes('show') || 
          className.includes('visibility') ||
          (el.tagName === 'svg' && parentText.includes('*'))) {
        eyeIcons.push(el);
        console.log('✅ 找到可能的眼睛图标:', el);
      }
    });
    
    // 如果没找到特定的眼睛图标，查找所有 SVG
    if (eyeIcons.length === 0) {
      const svgs = section.querySelectorAll('svg');
      svgs.forEach(svg => {
        const parent = svg.closest('div');
        if (parent && (parent.textContent.includes('*') || parent.textContent.includes('手机') || parent.textContent.includes('微信'))) {
          eyeIcons.push(svg);
          console.log('✅ 找到可能的图标 (SVG):', svg);
        }
      });
    }
    
    return eyeIcons;
  }
  
  // 3. 提取联系方式信息
  function extractContactInfo(section) {
    console.log('\n📱 步骤3: 提取联系方式');
    
    if (!section) return null;
    
    const result = {
      phone: null,
      wechat: null
    };
    
    // 查找手机号
    const phoneRegex = /1[3-9]\d{9}/;
    const wechatRegex = /[a-zA-Z0-9_-]{6,20}/;
    
    // 查找所有文本节点
    const walker = document.createTreeWalker(
      section,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      
      // 检查手机号
      if (text.includes('手机') || text.includes('电话')) {
        const phoneMatch = text.match(phoneRegex);
        if (phoneMatch) {
          result.phone = phoneMatch[0];
          console.log('✅ 找到手机号:', result.phone);
        } else if (text.includes('*')) {
          result.phone = text;
          console.log('⚠️ 手机号被遮挡:', text);
        }
      }
      
      // 检查微信号
      if (text.includes('微信') || text.includes('WeChat')) {
        const wechatMatch = text.match(wechatRegex);
        if (wechatMatch) {
          result.wechat = wechatMatch[0];
          console.log('✅ 找到微信号:', result.wechat);
        } else if (text.includes('*')) {
          result.wechat = text;
          console.log('⚠️ 微信号被遮挡:', text);
        }
      }
    }
    
    return result;
  }
  
  // 4. 尝试点击眼睛图标并重新提取
  async function clickAndExtract(icons, section) {
    console.log('\n🖱️ 步骤4: 尝试点击眼睛图标');
    
    if (icons.length === 0) {
      console.log('❌ 没有找到眼睛图标');
      return null;
    }
    
    const beforeInfo = extractContactInfo(section);
    console.log('点击前的信息:', beforeInfo);
    
    // 点击所有图标
    for (let i = 0; i < icons.length; i++) {
      console.log(`\n点击第 ${i + 1} 个图标...`);
      try {
        icons[i].click();
        await wait(500); // 等待内容加载
      } catch (e) {
        console.log('点击失败:', e.message);
      }
    }
    
    // 重新提取信息
    await wait(1000);
    const afterInfo = extractContactInfo(section);
    console.log('\n点击后的信息:', afterInfo);
    
    return afterInfo;
  }
  
  // 5. 主流程
  try {
    // 查找联系方式区域
    const contactSection = findContactSection();
    
    if (!contactSection) {
      console.log('\n❌ 未找到联系方式区域');
      console.log('💡 提示: 请确保你在抖音达人主页，并且页面已完全加载');
      return;
    }
    
    // 查找眼睛图标
    const eyeIcons = findEyeIconsInSection(contactSection);
    
    // 提取初始信息
    const initialInfo = extractContactInfo(contactSection);
    
    // 如果信息被遮挡，尝试点击眼睛图标
    if ((initialInfo.phone && initialInfo.phone.includes('*')) || 
        (initialInfo.wechat && initialInfo.wechat.includes('*')) ||
        eyeIcons.length > 0) {
      const finalInfo = await clickAndExtract(eyeIcons, contactSection);
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 最终采集结果:');
      console.log('='.repeat(50));
      console.log('手机号:', finalInfo?.phone || initialInfo.phone || '未找到');
      console.log('微信号:', finalInfo?.wechat || initialInfo.wechat || '未找到');
      console.log('='.repeat(50));
      
      return finalInfo || initialInfo;
    } else {
      console.log('\n' + '='.repeat(50));
      console.log('📊 采集结果:');
      console.log('='.repeat(50));
      console.log('手机号:', initialInfo.phone || '未找到');
      console.log('微信号:', initialInfo.wechat || '未找到');
      console.log('='.repeat(50));
      
      return initialInfo;
    }
    
  } catch (error) {
    console.error('❌ 采集过程出错:', error);
    console.log('\n💡 调试信息:');
    console.log('当前页面 URL:', window.location.href);
    console.log('页面标题:', document.title);
  }
})();
