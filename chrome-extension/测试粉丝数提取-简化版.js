// 在抖音精选联盟达人详情页的控制台运行此脚本
// 用于测试粉丝数提取

console.log('=== 测试粉丝数提取 ===\n');

// 方法1：查找带有 elementtiming="element-timing" 属性的 span
console.log('方法1：查找 elementtiming 属性的 span');
const timingSpans = document.querySelectorAll('span[elementtiming="element-timing"]');
console.log('找到', timingSpans.length, '个元素');
timingSpans.forEach((span, index) => {
  const text = span.textContent.trim();
  console.log(`  [${index}] "${text}"`);
  if (/^[\d.]+[万wW]?$/.test(text) && text.length < 10) {
    console.log(`  ✓ 这个看起来是粉丝数！`);
  }
});

// 测试解析函数
console.log('\n测试解析函数:');
function parseFollowers(followersStr) {
  if (!followersStr) return '';
  const str = followersStr.replace(/[,，\s]/g, '');
  const match = str.match(/([\d.]+)([wW万])?/);
  if (!match) return followersStr;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit && (unit === 'w' || unit === 'W' || unit === '万')) {
    return Math.round(num * 10000).toString();
  }
  return Math.round(num).toString();
}

const testCases = ['2万', '1.2万', '123.4万', '5000', '42.47'];
testCases.forEach(test => {
  const result = parseFollowers(test);
  console.log(`  "${test}" → "${result}"`);
});

console.log('\n=== 测试完成 ===');
