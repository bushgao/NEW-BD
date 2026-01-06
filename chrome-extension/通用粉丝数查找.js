// 通用粉丝数查找脚本 - 不依赖特定选择器
// 在抖音精选联盟达人详情页的控制台运行

console.clear();
console.log('%c=== 通用粉丝数查找 ===', 'color: #1890ff; font-size: 16px; font-weight: bold');

// 方法1：查找所有包含"2万"的元素
console.log('\n%c方法1：查找包含"2万"的元素', 'color: #52c41a; font-weight: bold');
const allElements = document.querySelectorAll('*');
const elementsWithFans = [];

allElements.forEach(el => {
  const text = el.textContent?.trim();
  // 查找恰好是"2万"或包含"2万"的元素
  if (text && (text === '2万' || text.includes('2万'))) {
    // 排除太长的文本（避免匹配到整个页面）
    if (text.length < 100) {
      elementsWithFans.push({
        element: el,
        text: text,
        tagName: el.tagName,
        className: el.className,
        id: el.id
      });
    }
  }
});

console.log(`找到 ${elementsWithFans.length} 个包含"2万"的元素：`);
elementsWithFans.slice(0, 10).forEach((item, i) => {
  console.log(`\n[${i}] <${item.tagName}> "${item.text}"`);
  console.log(`  class: "${item.className}"`);
  console.log(`  id: "${item.id}"`);
  console.log('  元素:', item.element);
});

// 方法2：查找所有span元素中的数字
console.log('\n%c方法2：查找所有span中的数字', 'color: #52c41a; font-weight: bold');
const allSpans = document.querySelectorAll('span');
const numberSpans = [];

allSpans.forEach((span, index) => {
  const text = span.textContent?.trim();
  // 匹配纯数字或数字+万
  if (text && /^[\d.]+[万wW]?$/.test(text) && text.length < 10) {
    numberSpans.push({
      index,
      text,
      element: span,
      className: span.className,
      parentText: span.parentElement?.textContent?.trim().substring(0, 50)
    });
  }
});

console.log(`找到 ${numberSpans.length} 个包含数字的span：`);
numberSpans.forEach((item, i) => {
  const isTarget = item.text === '2万' || item.text === '2' || item.text.includes('2');
  const color = isTarget ? '#52c41a' : '#666';
  console.log(`%c[${i}] "${item.text}"`, `color: ${color}; font-weight: bold`);
  console.log(`  class: "${item.className}"`);
  console.log(`  父元素: "${item.parentText}"`);
  console.log('  元素:', item.element);
});

// 方法3：查找包含"粉丝"关键词的区域
console.log('\n%c方法3：查找包含"粉丝"的区域', 'color: #52c41a; font-weight: bold');
const fansAreas = [];
allElements.forEach(el => {
  const text = el.textContent?.trim();
  if (text && text.includes('粉丝') && text.length < 50) {
    fansAreas.push({
      element: el,
      text: text,
      tagName: el.tagName,
      className: el.className
    });
  }
});

console.log(`找到 ${fansAreas.length} 个包含"粉丝"的区域：`);
fansAreas.slice(0, 5).forEach((item, i) => {
  console.log(`\n[${i}] <${item.tagName}> "${item.text}"`);
  console.log(`  class: "${item.className}"`);
  console.log('  元素:', item.element);
});

// 方法4：直接搜索页面文本
console.log('\n%c方法4：页面文本分析', 'color: #52c41a; font-weight: bold');
const bodyText = document.body.innerText;
const matches = bodyText.match(/[\d.]+[万wW]/g);
if (matches) {
  console.log('页面中所有"数字+万"的文本：', matches.slice(0, 10));
}

// 提供交互式查找
console.log('\n%c=== 交互式查找 ===', 'color: #1890ff; font-weight: bold');
console.log('你可以使用以下函数：');
console.log('1. findByText("2万") - 查找包含特定文本的元素');
console.log('2. findByClass("类名") - 查找特定class的元素');
console.log('3. highlightElement(元素) - 高亮显示某个元素');

window.findByText = function(text) {
  const results = [];
  document.querySelectorAll('*').forEach(el => {
    if (el.textContent?.trim() === text) {
      results.push(el);
    }
  });
  console.log(`找到 ${results.length} 个文本为"${text}"的元素：`, results);
  return results;
};

window.findByClass = function(className) {
  const results = document.querySelectorAll(`.${className}`);
  console.log(`找到 ${results.length} 个class包含"${className}"的元素：`, results);
  return results;
};

window.highlightElement = function(el) {
  if (el) {
    el.style.border = '3px solid red';
    el.style.backgroundColor = 'yellow';
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    console.log('已高亮元素:', el);
  }
};

console.log('\n%c请查看上面的结果，告诉我：', 'color: #faad14; font-weight: bold');
console.log('1. 哪个方法找到了"2万"？');
console.log('2. 那个元素的 tagName 和 className 是什么？');
console.log('3. 或者直接告诉我你在页面上看到的粉丝数位置的特征');

// 保存结果
window.debugData = {
  elementsWithFans,
  numberSpans,
  fansAreas
};
console.log('\n结果已保存到 window.debugData');
