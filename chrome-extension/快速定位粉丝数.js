// 在抖音精选联盟达人详情页的控制台运行此脚本
// 快速定位粉丝数的位置

console.clear();
console.log('%c=== 快速定位粉丝数 ===', 'color: #1890ff; font-size: 16px; font-weight: bold');

// 查找所有 elementtiming 元素
const timingSpans = document.querySelectorAll('span[elementtiming="element-timing"]');
console.log(`\n找到 ${timingSpans.length} 个 span[elementtiming="element-timing"] 元素\n`);

// 分析每个元素
const results = [];
timingSpans.forEach((span, index) => {
  const text = span.textContent.trim();
  const parent = span.parentElement;
  const grandParent = parent?.parentElement;
  
  // 获取父元素和祖父元素的完整文本
  const parentFullText = parent?.textContent.trim() || '';
  const grandParentFullText = grandParent?.textContent.trim() || '';
  
  // 判断是否是数字格式
  const isNumber = /^[\d.]+[万wW]?$/.test(text);
  
  // 判断上下文是否包含"粉丝"
  const hasFansKeyword = parentFullText.includes('粉丝') || grandParentFullText.includes('粉丝');
  
  results.push({
    index,
    text,
    isNumber,
    hasFansKeyword,
    parentText: parentFullText.substring(0, 50), // 只显示前50个字符
    element: span
  });
  
  // 高亮显示
  const color = isNumber ? (hasFansKeyword ? '#52c41a' : '#faad14') : '#d9d9d9';
  console.log(
    `%c[${index}] ${text}`,
    `color: ${color}; font-weight: bold; font-size: 14px`
  );
  console.log(`  是数字: ${isNumber ? '✓' : '✗'}`);
  console.log(`  包含"粉丝": ${hasFansKeyword ? '✓' : '✗'}`);
  console.log(`  父元素文本: "${parentFullText.substring(0, 50)}${parentFullText.length > 50 ? '...' : ''}"`);
  console.log('  元素:', span);
  console.log('');
});

// 找出最可能是粉丝数的元素
console.log('\n%c=== 分析结果 ===', 'color: #52c41a; font-size: 14px; font-weight: bold');

const numberCandidates = results.filter(r => r.isNumber);
console.log(`数字格式的候选: ${numberCandidates.length} 个`);

const fansNumberCandidates = numberCandidates.filter(r => r.hasFansKeyword);
console.log(`包含"粉丝"关键词的数字: ${fansNumberCandidates.length} 个`);

if (fansNumberCandidates.length > 0) {
  console.log('\n%c推荐：粉丝数最可能是以下元素', 'color: #52c41a; font-weight: bold');
  fansNumberCandidates.forEach(item => {
    console.log(`%c[${item.index}] ${item.text}`, 'color: #52c41a; font-size: 14px; font-weight: bold');
    console.log(`  父元素: "${item.parentText}"`);
  });
} else {
  console.log('\n%c警告：没有找到包含"粉丝"关键词的数字', 'color: #faad14; font-weight: bold');
  console.log('所有数字候选:');
  numberCandidates.forEach(item => {
    console.log(`[${item.index}] ${item.text} - 父元素: "${item.parentText}"`);
  });
}

// 提供测试函数
console.log('\n%c=== 下一步 ===', 'color: #1890ff; font-size: 14px; font-weight: bold');
console.log('请告诉我：');
console.log('1. 上面哪个 [索引] 的值是粉丝数"2万"？');
console.log('2. 那个元素的父元素文本是什么？');
console.log('\n或者直接告诉我：');
console.log('- "粉丝数是 [X]，父元素包含 XXX"');

// 保存结果供后续使用
window.debugResults = results;
console.log('\n提示：结果已保存到 window.debugResults');
