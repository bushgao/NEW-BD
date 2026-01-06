// 深度测试：查找如何显示隐藏的联系方式
// 在抖音达人主页控制台运行

(async function() {
  console.log('🔍 深度分析联系方式区域...\n');
  
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 1. 找到包含星号的元素
  console.log('1️⃣ 查找被遮挡的联系方式...');
  const maskedElements = [];
  
  document.querySelectorAll('*').forEach(el => {
    const text = el.textContent;
    if ((text.includes('达人手机号') || text.includes('达人微信号')) && 
        text.includes('*')) {
      maskedElements.push(el);
      console.log('找到被遮挡的元素:', el);
      console.log('  文本:', text.trim());
      console.log('  HTML:', el.outerHTML.substring(0, 300));
    }
  });
  
  if (maskedElements.length === 0) {
    console.log('❌ 未找到被遮挡的联系方式');
    return;
  }
  
  // 2. 分析每个被遮挡元素的结构
  console.log('\n2️⃣ 分析元素结构...');
  maskedElements.forEach((el, index) => {
    console.log(`\n--- 元素 ${index + 1} ---`);
    console.log('标签:', el.tagName);
    console.log('类名:', el.className);
    console.log('父元素:', el.parentElement);
    console.log('父元素类名:', el.parentElement?.className);
    
    // 查找附近的所有可点击元素
    const parent = el.closest('div[class*="contact"]') || el.parentElement;
    if (parent) {
      console.log('\n查找父容器中的所有交互元素:');
      
      // 查找所有可能的交互元素
      const interactiveElements = parent.querySelectorAll(
        'button, [role="button"], a, svg, i, span[class*="icon"], [onclick], [class*="click"]'
      );
      
      console.log(`找到 ${interactiveElements.length} 个交互元素:`);
      interactiveElements.forEach((interactive, i) => {
        console.log(`  ${i + 1}. ${interactive.tagName}`, {
          className: interactive.className,
          onclick: interactive.onclick,
          role: interactive.getAttribute('role'),
          html: interactive.outerHTML.substring(0, 150)
        });
      });
    }
  });
  
  // 3. 尝试查找事件监听器
  console.log('\n3️⃣ 检查事件监听器...');
  maskedElements.forEach((el, index) => {
    console.log(`\n元素 ${index + 1} 的事件:`);
    
    // 获取元素及其父元素
    const elements = [el, el.parentElement, el.parentElement?.parentElement];
    
    elements.forEach((elem, i) => {
      if (!elem) return;
      
      console.log(`  层级 ${i}:`, elem.tagName, elem.className);
      
      // 检查常见事件
      ['click', 'mouseenter', 'mouseover', 'focus'].forEach(eventType => {
        const handler = elem[`on${eventType}`];
        if (handler) {
          console.log(`    ✅ 有 ${eventType} 事件`);
        }
      });
    });
  });
  
  // 4. 尝试触发各种事件
  console.log('\n4️⃣ 尝试触发事件...');
  
  for (let i = 0; i < maskedElements.length; i++) {
    const el = maskedElements[i];
    console.log(`\n测试元素 ${i + 1}:`);
    
    const beforeText = el.textContent;
    console.log('触发前:', beforeText);
    
    // 尝试各种事件
    const events = ['click', 'mouseenter', 'mouseover', 'focus', 'mousedown'];
    
    for (const eventType of events) {
      try {
        // 在元素及其父元素上触发事件
        [el, el.parentElement, el.parentElement?.parentElement].forEach(target => {
          if (target) {
            const event = new MouseEvent(eventType, {
              bubbles: true,
              cancelable: true,
              view: window
            });
            target.dispatchEvent(event);
          }
        });
        
        await wait(300);
        
        const afterText = el.textContent;
        if (afterText !== beforeText && !afterText.includes('*')) {
          console.log(`  ✅ ${eventType} 事件有效！`);
          console.log('  触发后:', afterText);
          return; // 找到有效方法，停止测试
        }
      } catch (e) {
        console.log(`  ${eventType} 失败:`, e.message);
      }
    }
    
    console.log('  ❌ 所有事件都无效');
  }
  
  // 5. 检查是否需要特殊权限或登录
  console.log('\n5️⃣ 检查页面状态...');
  console.log('当前 URL:', window.location.href);
  console.log('是否登录:', document.cookie.includes('sessionid') || document.cookie.includes('token'));
  
  // 6. 查找可能的 API 调用
  console.log('\n6️⃣ 监听网络请求...');
  console.log('💡 提示: 请手动点击页面上的眼睛图标（如果有），然后观察 Network 标签中的请求');
  console.log('💡 或者尝试在页面上悬停/点击联系方式区域，看是否有变化');
  
  // 7. 输出完整的联系方式区域 HTML
  console.log('\n7️⃣ 完整的联系方式区域 HTML:');
  if (maskedElements.length > 0) {
    const container = maskedElements[0].closest('div[class*="info"]') || 
                     maskedElements[0].closest('div[class*="contact"]') ||
                     maskedElements[0].parentElement?.parentElement;
    
    if (container) {
      console.log(container.outerHTML);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 分析完成');
  console.log('='.repeat(50));
  console.log('💡 建议:');
  console.log('1. 手动点击页面上的眼睛图标（如果有）');
  console.log('2. 观察 Network 标签，看是否有 API 请求');
  console.log('3. 尝试悬停在联系方式区域');
  console.log('4. 检查是否需要特殊权限才能查看');
  
})();
