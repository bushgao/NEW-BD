// 测试脚本：采集抖音达人的隐藏手机号和微信号
// 在抖音达人主页的控制台运行此脚本

(function() {
  console.log('=== 开始测试隐藏字段采集 ===');
  
  // 1. 查找所有可能包含手机号和微信号的元素
  function findContactFields() {
    console.log('\n--- 步骤1: 查找联系方式字段 ---');
    
    // 查找包含"手机"、"电话"、"微信"等关键词的元素
    const keywords = ['手机', '电话', '微信', 'WeChat', 'Phone', '联系方式'];
    const results = [];
    
    keywords.forEach(keyword => {
      // 使用 XPath 查找包含关键词的元素
      const xpath = `//*[contains(text(), '${keyword}')]`;
      const iterator = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
      let node = iterator.iterateNext();
      
      while (node) {
        console.log(`找到包含"${keyword}"的元素:`, node);
        console.log('  - 标签:', node.tagName);
        console.log('  - 文本:', node.textContent.trim());
        console.log('  - 父元素:', node.parentElement);
        results.push({
          keyword,
          element: node,
          parent: node.parentElement
        });
        node = iterator.iterateNext();
      }
    });
    
    return results;
  }
  
  // 2. 查找所有"眼睛"图标（显示/隐藏按钮）
  function findEyeIcons() {
    console.log('\n--- 步骤2: 查找眼睛图标 ---');
    
    // 可能的选择器
    const selectors = [
      'svg[class*="eye"]',
      '[class*="eye-icon"]',
      '[class*="show-icon"]',
      '[class*="visibility"]',
      'i[class*="eye"]',
      'span[class*="eye"]',
      // 抖音特定的类名
      '[class*="Icon"]',
      'svg',
    ];
    
    const icons = [];
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // 检查是否在联系方式区域附近
        const text = el.parentElement?.textContent || '';
        if (text.includes('手机') || text.includes('微信') || text.includes('联系')) {
          console.log('找到可能的眼睛图标:', el);
          console.log('  - 父元素文本:', text);
          icons.push(el);
        }
      });
    });
    
    return icons;
  }
  
  // 3. 查找隐藏的输入框或文本
  function findHiddenFields() {
    console.log('\n--- 步骤3: 查找隐藏字段 ---');
    
    // 查找所有可能隐藏的元素
    const hiddenElements = document.querySelectorAll('[type="password"], [style*="display: none"], [style*="visibility: hidden"]');
    
    hiddenElements.forEach(el => {
      const parent = el.closest('div');
      const text = parent?.textContent || '';
      if (text.includes('手机') || text.includes('微信')) {
        console.log('找到隐藏字段:', el);
        console.log('  - 类型:', el.type);
        console.log('  - 值:', el.value);
        console.log('  - 父元素:', parent);
      }
    });
  }
  
  // 4. 查找所有包含星号(*)的文本（通常用于隐藏信息）
  function findMaskedText() {
    console.log('\n--- 步骤4: 查找被遮挡的文本 ---');
    
    const xpath = "//*[contains(text(), '*')]";
    const iterator = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    let node = iterator.iterateNext();
    
    while (node) {
      const text = node.textContent.trim();
      if (text.includes('*') && (text.length > 5)) {
        console.log('找到被遮挡的文本:', text);
        console.log('  - 元素:', node);
        console.log('  - 父元素:', node.parentElement);
        console.log('  - 所有类名:', node.className);
      }
      node = iterator.iterateNext();
    }
  }
  
  // 5. 尝试模拟点击眼睛图标
  function tryClickEyeIcon(icon) {
    console.log('\n--- 尝试点击眼睛图标 ---');
    console.log('点击元素:', icon);
    
    // 记录点击前的状态
    const beforeHTML = document.body.innerHTML;
    
    // 模拟点击
    icon.click();
    
    // 等待一下，看看有什么变化
    setTimeout(() => {
      const afterHTML = document.body.innerHTML;
      if (beforeHTML !== afterHTML) {
        console.log('✅ 页面内容发生了变化！');
        // 再次查找联系方式
        findContactFields();
      } else {
        console.log('❌ 页面内容没有变化');
      }
    }, 500);
  }
  
  // 6. 查找整个联系方式区域
  function findContactSection() {
    console.log('\n--- 步骤5: 查找联系方式区域 ---');
    
    // 查找包含"联系方式"的区域
    const sections = document.querySelectorAll('div, section');
    sections.forEach(section => {
      const text = section.textContent;
      if ((text.includes('手机') || text.includes('微信')) && text.length < 500) {
        console.log('找到联系方式区域:');
        console.log('  - HTML:', section.outerHTML.substring(0, 500));
        console.log('  - 文本:', text);
      }
    });
  }
  
  // 执行所有测试
  const contactFields = findContactFields();
  const eyeIcons = findEyeIcons();
  findHiddenFields();
  findMaskedText();
  findContactSection();
  
  console.log('\n=== 测试总结 ===');
  console.log('找到联系方式字段数量:', contactFields.length);
  console.log('找到眼睛图标数量:', eyeIcons.length);
  
  // 如果找到眼睛图标，询问是否要点击
  if (eyeIcons.length > 0) {
    console.log('\n💡 提示: 找到了眼睛图标，你可以手动运行以下命令来点击:');
    eyeIcons.forEach((icon, index) => {
      console.log(`  - 点击第${index + 1}个图标: document.querySelectorAll('svg')[${index}].click()`);
    });
  }
  
  // 返回结果供进一步分析
  return {
    contactFields,
    eyeIcons
  };
})();
