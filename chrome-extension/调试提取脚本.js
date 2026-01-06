// 🔍 在抖音精选联盟达人详情页的控制台运行此脚本
// 用于调试字段提取

(function() {
  console.log('='.repeat(60));
  console.log('🔍 Zilo 达人信息提取调试');
  console.log('='.repeat(60));
  
  // 1. 提取昵称
  console.log('\n📝 1. 提取昵称');
  const nicknameSelectors = [
    'span.auxo-dorami-atom-text',
    'span[class*="atom-text"]',
    'h1', 'h2', 'h3',
    '.author-name', '.daren-name', '.profile-name',
    '[class*="name"]',
  ];
  
  for (const selector of nicknameSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`  ✓ 选择器: ${selector}`);
      elements.forEach((el, idx) => {
        const text = el.textContent.trim();
        if (text && text.length > 0 && text.length < 100) {
          console.log(`    [${idx}] ${text.substring(0, 50)}`);
        }
      });
    }
  }
  
  // 2. 提取粉丝数
  console.log('\n👥 2. 提取粉丝数');
  const followersSelectors = [
    '[class*="fans"]',
    '[class*="follower"]',
    '[class*="粉丝"]',
  ];
  
  for (const selector of followersSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`  ✓ 选择器: ${selector}`);
      elements.forEach((el, idx) => {
        console.log(`    [${idx}] ${el.textContent.trim()}`);
      });
    }
  }
  
  // 3. 查找所有包含数字的元素（可能是粉丝数、作品数等）
  console.log('\n🔢 3. 查找包含数字的元素');
  const allElements = document.querySelectorAll('*');
  const numberElements = [];
  
  allElements.forEach(el => {
    const text = el.textContent.trim();
    // 匹配类似 "24.99万"、"82"、"137" 的数字
    if (/^\d+(\.\d+)?[万wW]?$/.test(text) && text.length < 20) {
      const className = el.className || '(no class)';
      numberElements.push({
        text,
        tag: el.tagName.toLowerCase(),
        class: className,
      });
    }
  });
  
  // 去重并显示
  const uniqueNumbers = [...new Map(numberElements.map(item => 
    [item.text, item]
  )).values()];
  
  uniqueNumbers.slice(0, 20).forEach(item => {
    console.log(`  ${item.text} - <${item.tag}> class="${item.class}"`);
  });
  
  // 4. 查找所有文本节点
  console.log('\n📄 4. 页面主要文本内容（前20个）');
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text && text.length > 2 && text.length < 100) {
      textNodes.push(text);
    }
  }
  
  // 去重并显示
  const uniqueTexts = [...new Set(textNodes)];
  uniqueTexts.slice(0, 20).forEach((text, idx) => {
    console.log(`  [${idx}] ${text}`);
  });
  
  // 5. 查找可能的抖音号
  console.log('\n🆔 5. 查找抖音号');
  const idPattern = /抖音号[：:]?\s*(\w+)/;
  uniqueTexts.forEach(text => {
    const match = text.match(idPattern);
    if (match) {
      console.log(`  ✓ 找到: ${match[0]}`);
    }
  });
  
  // 从 URL 提取
  const urlMatch = window.location.href.match(/author_id=([^&]+)/);
  if (urlMatch) {
    console.log(`  ✓ URL 中的 author_id: ${urlMatch[1]}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 调试完成！');
  console.log('请查看上面的输出，找到正确的选择器');
  console.log('='.repeat(60));
})();
