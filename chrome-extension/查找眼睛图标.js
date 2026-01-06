// 在浏览器控制台运行此脚本来查找眼睛图标
// 使用方法：在达人详情页打开控制台，粘贴此脚本并运行

(function() {
  console.log('=== 🔍 开始查找眼睛图标 ===\n');
  
  // 检查页面是否包含隐藏的联系方式
  const allText = document.body.innerText;
  const hasHiddenContact = allText.includes('***********') || allText.includes('*****');
  
  console.log('1️⃣ 检查联系方式状态');
  if (hasHiddenContact) {
    console.log('✅ 页面包含星号（联系方式被隐藏）');
    console.log('   需要找到眼睛图标并点击才能显示');
  } else {
    console.log('⚠️  页面不包含星号');
    console.log('   可能：1) 联系方式已显示  2) 没有联系方式  3) 格式不同');
  }
  console.log('');
  
  // 方法1：查找包含"手机号"或"微信号"文本附近的可点击元素
  console.log('2️⃣ 方法1：查找联系方式字段附近的可点击元素');
  const keywords = ['手机号', '微信号', '联系方式'];
  const foundElements = [];
  
  keywords.forEach(keyword => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes(keyword)) {
        const parent = node.parentElement;
        if (!parent) continue;
        
        // 查找父元素及其兄弟元素中的可点击元素
        let container = parent;
        for (let i = 0; i < 3; i++) {
          if (!container) break;
          
          // 查找所有可能是眼睛图标的元素
          const clickables = container.querySelectorAll(
            'svg, button, [role="button"], [class*="icon"], [class*="Icon"], span[class*="click"]'
          );
          
          clickables.forEach(el => {
            const rect = el.getBoundingClientRect();
            // 只关注可见且尺寸合理的元素（图标通常是小尺寸）
            if (rect.width > 0 && rect.height > 0 && rect.width < 100 && rect.height < 100) {
              foundElements.push({
                keyword,
                element: el,
                info: {
                  tagName: el.tagName,
                  className: el.className,
                  id: el.id,
                  innerHTML: el.innerHTML.substring(0, 100),
                  位置: `x:${Math.round(rect.x)}, y:${Math.round(rect.y)}`,
                  尺寸: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
                }
              });
            }
          });
          
          container = container.parentElement;
        }
      }
    }
  });
  
  if (foundElements.length > 0) {
    console.log(`✅ 找到 ${foundElements.length} 个可能的眼睛图标：`);
    foundElements.forEach((item, idx) => {
      console.log(`\n[${idx}] 关键词"${item.keyword}"附近的元素：`);
      console.log('   标签:', item.info.tagName);
      console.log('   类名:', item.info.className || '(无)');
      console.log('   ID:', item.info.id || '(无)');
      console.log('   位置:', item.info.位置);
      console.log('   尺寸:', item.info.尺寸);
      console.log('   HTML:', item.info.innerHTML);
      
      // 保存到全局变量方便测试
      window[`eyeIcon${idx}`] = item.element;
      console.log(`   💡 测试命令: eyeIcon${idx}.click()`);
    });
  } else {
    console.log('❌ 未找到可能的眼睛图标');
  }
  console.log('');
  
  // 方法2：查找所有小尺寸的 SVG（眼睛图标通常是 SVG）
  console.log('3️⃣ 方法2：查找所有小尺寸 SVG 图标');
  const allSvgs = document.querySelectorAll('svg');
  const smallSvgs = [];
  
  allSvgs.forEach(svg => {
    const rect = svg.getBoundingClientRect();
    // 眼睛图标通常是 16-32px 的小图标
    if (rect.width > 10 && rect.width < 50 && rect.height > 10 && rect.height < 50) {
      smallSvgs.push({
        element: svg,
        rect: rect,
        className: svg.className.baseVal || svg.className,
        parent: svg.parentElement,
      });
    }
  });
  
  if (smallSvgs.length > 0) {
    console.log(`✅ 找到 ${smallSvgs.length} 个小尺寸 SVG：`);
    smallSvgs.forEach((item, idx) => {
      console.log(`\n[SVG-${idx}]`);
      console.log('   类名:', item.className || '(无)');
      console.log('   父元素:', item.parent.tagName, item.parent.className);
      console.log('   尺寸:', `${Math.round(item.rect.width)}x${Math.round(item.rect.height)}`);
      console.log('   位置:', `x:${Math.round(item.rect.x)}, y:${Math.round(item.rect.y)}`);
      
      // 保存到全局变量
      window[`svg${idx}`] = item.element;
      window[`svgParent${idx}`] = item.parent;
      console.log(`   💡 测试命令: svg${idx}.click() 或 svgParent${idx}.click()`);
    });
  } else {
    console.log('❌ 未找到小尺寸 SVG');
  }
  console.log('');
  
  // 方法3：查找所有包含 "eye" 相关类名的元素
  console.log('4️⃣ 方法3：查找包含 "eye" 的类名');
  const eyeElements = document.querySelectorAll('[class*="eye"], [class*="Eye"], [class*="visible"], [class*="Visible"]');
  
  if (eyeElements.length > 0) {
    console.log(`✅ 找到 ${eyeElements.length} 个包含 eye/visible 的元素：`);
    eyeElements.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        console.log(`\n[EYE-${idx}]`);
        console.log('   标签:', el.tagName);
        console.log('   类名:', el.className);
        console.log('   尺寸:', `${Math.round(rect.width)}x${Math.round(rect.height)}`);
        
        window[`eye${idx}`] = el;
        console.log(`   💡 测试命令: eye${idx}.click()`);
      }
    });
  } else {
    console.log('❌ 未找到包含 eye/visible 的元素');
  }
  console.log('');
  
  // 提供测试指南
  console.log('=== 📋 测试指南 ===');
  console.log('1. 查看上面找到的元素');
  console.log('2. 使用提供的测试命令（如 eyeIcon0.click()）逐个测试');
  console.log('3. 找到能显示联系方式的那个元素');
  console.log('4. 记录该元素的类名或选择器');
  console.log('5. 告诉我正确的选择器，我会更新代码');
  console.log('');
  console.log('💡 提示：点击后如果联系方式从星号变成真实号码，说明找对了！');
  console.log('');
  console.log('=== 🔍 查找完成 ===');
})();
