// 在抖音精选联盟达人详情页的控制台运行此脚本
// 这个脚本会帮助你找到粉丝数的准确位置

console.log('=== 开始查找粉丝数 ===\n');

// 步骤1：找到所有可能包含粉丝数的元素
console.log('步骤1：查找所有 span[elementtiming="element-timing"] 元素');
const timingSpans = document.querySelectorAll('span[elementtiming="element-timing"]');
console.log(`找到 ${timingSpans.length} 个元素\n`);

const candidates = [];
timingSpans.forEach((span, index) => {
  const text = span.textContent.trim();
  const parent = span.parentElement;
  const parentText = parent ? parent.textContent.trim() : '';
  
  console.log(`[${index}] 文本: "${text}"`);
  console.log(`    父元素文本: "${parentText}"`);
  console.log(`    父元素类名: "${parent?.className || ''}"`);
  console.log(`    元素:`, span);
  console.log('');
  
  // 收集所有数字格式的候选
  if (/^[\d.]+[万wW]?$/.test(text)) {
    candidates.push({
      index,
      text,
      parentText,
      parentClass: parent?.className || '',
      element: span
    });
  }
});

// 步骤2：显示所有候选项
console.log('\n步骤2：所有数字格式的候选项');
console.log('候选项数量:', candidates.length);
candidates.forEach((item, i) => {
  console.log(`候选 ${i + 1}:`);
  console.log(`  原始索引: [${item.index}]`);
  console.log(`  文本: "${item.text}"`);
  console.log(`  父元素文本: "${item.parentText}"`);
  console.log(`  父元素类名: "${item.parentClass}"`);
  console.log('');
});

// 步骤3：让用户选择
console.log('\n步骤3：请告诉我哪个是粉丝数');
console.log('请查看上面的候选项，然后告诉我：');
console.log('1. 哪个候选项的"文本"是粉丝数？（例如：候选 1）');
console.log('2. 粉丝数的值是什么？（例如：2万）');
console.log('3. 父元素文本是什么？（这可以帮助我们区分不同的字段）');
console.log('\n例如，如果粉丝数是"2万"，请告诉我：');
console.log('  - 候选编号：候选 X');
console.log('  - 文本值："2万"');
console.log('  - 父元素文本："2万粉丝" 或其他包含"粉丝"的文本');

// 步骤4：提供一个辅助函数来测试选择器
console.log('\n步骤4：测试选择器（可选）');
console.log('如果你想测试某个选择器，可以运行：');
console.log('testSelector("你的选择器")');
console.log('例如：testSelector("span[elementtiming=\\"element-timing\\"]")');

window.testSelector = function(selector) {
  console.log(`\n测试选择器: ${selector}`);
  const elements = document.querySelectorAll(selector);
  console.log(`找到 ${elements.length} 个元素`);
  elements.forEach((el, i) => {
    console.log(`[${i}] "${el.textContent.trim()}"`, el);
  });
};

// 步骤5：查找包含"粉丝"文字的元素
console.log('\n步骤5：查找包含"粉丝"文字的区域');
const fansElements = Array.from(document.querySelectorAll('*')).filter(el => {
  const text = el.textContent;
  return text.includes('粉丝') && text.length < 50;
});

console.log(`找到 ${fansElements.length} 个包含"粉丝"的元素`);
fansElements.slice(0, 5).forEach((el, i) => {
  console.log(`[${i}] "${el.textContent.trim()}"`, el);
});

console.log('\n=== 调试完成 ===');
console.log('\n请将以下信息告诉我：');
console.log('1. 候选项中哪个是粉丝数？（候选 X）');
console.log('2. 粉丝数的值是什么？');
console.log('3. 父元素文本包含什么关键词？（如"粉丝"）');
console.log('4. 截图发给我也可以！');
