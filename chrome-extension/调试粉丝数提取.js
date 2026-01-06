// 在抖音精选联盟达人详情页的控制台运行此脚本
// 用于调试粉丝数提取

console.log('=== 开始调试粉丝数提取 ===');

// 方法1：查找包含 "x" 的 span 元素（42.47 x 16 格式）
console.log('\n方法1：查找包含 x 的 span 元素');
const spansWithX = Array.from(document.querySelectorAll('span')).filter(span => {
  const text = span.textContent.trim();
  return /^\d+\.?\d*\s*[xX×]\s*\d+$/.test(text);
});
console.log('找到的元素:', spansWithX);
spansWithX.forEach((span, index) => {
  console.log(`  [${index}] 文本: "${span.textContent.trim()}"`, span);
});

// 方法2：查找包含万的元素
console.log('\n方法2：查找包含"万"的元素');
const spansWithWan = Array.from(document.querySelectorAll('span')).filter(span => {
  const text = span.textContent.trim();
  return /\d+\.?\d*[万wW]/.test(text);
});
console.log('找到的元素:', spansWithWan);
spansWithWan.forEach((span, index) => {
  console.log(`  [${index}] 文本: "${span.textContent.trim()}"`, span);
});

// 方法3：查找 detail-data-num 类
console.log('\n方法3：查找 detail-data-num 类');
const detailDataNums = document.querySelectorAll('[class*="detail-data-num"]');
console.log('找到的元素:', detailDataNums);
detailDataNums.forEach((elem, index) => {
  console.log(`  [${index}] 文本: "${elem.textContent.trim()}"`, elem);
  console.log(`  [${index}] 类名: "${elem.className}"`);
});

// 方法4：查找所有数字格式的 span
console.log('\n方法4：查找所有数字格式的 span');
const numberSpans = Array.from(document.querySelectorAll('span')).filter(span => {
  const text = span.textContent.trim();
  return /^\d+\.?\d*\s*[万wWxX×]\s*\d*$/.test(text) && text.length < 20;
});
console.log('找到的元素:', numberSpans);
numberSpans.forEach((span, index) => {
  console.log(`  [${index}] 文本: "${span.textContent.trim()}"`, span);
  console.log(`  [${index}] 父元素:`, span.parentElement);
});

// 方法5：查找特定的数据结构
console.log('\n方法5：查找数据展示区域');
const dataAreas = document.querySelectorAll('[class*="data"], [class*="info"], [class*="stat"]');
console.log('找到的数据区域:', dataAreas.length);
dataAreas.forEach((area, index) => {
  const text = area.textContent.trim();
  if (text.length < 50 && /\d+\.?\d*/.test(text)) {
    console.log(`  [${index}] 文本: "${text}"`, area);
  }
});

// 方法6：查找页面上所有可能是粉丝数的文本
console.log('\n方法6：在页面文本中搜索粉丝数格式');
const bodyText = document.body.innerText;
const matches = bodyText.match(/\d+\.?\d*\s*[xX×]\s*\d+/g);
console.log('找到的匹配:', matches);

// 方法7：检查特定位置的元素
console.log('\n方法7：检查用户信息区域');
const userInfoSelectors = [
  '[class*="user-info"]',
  '[class*="author-info"]',
  '[class*="profile"]',
  '[class*="daren"]',
];
userInfoSelectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`选择器 ${selector}:`, elements);
    elements.forEach(elem => {
      const spans = elem.querySelectorAll('span');
      spans.forEach(span => {
        const text = span.textContent.trim();
        if (/\d+\.?\d*\s*[xX×万wW]/.test(text)) {
          console.log(`  找到可能的粉丝数: "${text}"`, span);
        }
      });
    });
  }
});

console.log('\n=== 调试完成 ===');
console.log('请查看上面的输出，找到正确的粉丝数元素');
