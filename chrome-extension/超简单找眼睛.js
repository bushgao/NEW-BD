// 超简单找眼睛图标 - 复制粘贴到控制台运行

console.log('🔍 开始查找眼睛图标...\n');

// 查找所有包含星号的文本
const allText = document.body.innerText;
if (allText.includes('***')) {
  console.log('✅ 发现隐藏的联系方式（星号）\n');
} else {
  console.log('⚠️  没有发现星号，联系方式可能已经显示\n');
}

// 查找所有小图标（SVG）
const allSvgs = document.querySelectorAll('svg');
console.log(`找到 ${allSvgs.length} 个 SVG 图标\n`);

let count = 0;
allSvgs.forEach((svg, i) => {
  const rect = svg.getBoundingClientRect();
  // 只看小图标（16-32px）
  if (rect.width > 10 && rect.width < 50 && rect.height > 10 && rect.height < 50) {
    console.log(`[${count}] SVG 图标:`);
    console.log(`   大小: ${Math.round(rect.width)}x${Math.round(rect.height)}px`);
    console.log(`   位置: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}`);
    console.log(`   类名: ${svg.className.baseVal || '(无)'}`);
    
    // 保存到全局变量
    window[`icon${count}`] = svg;
    console.log(`   👉 测试命令: icon${count}.click()\n`);
    
    count++;
  }
});

console.log('━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 使用方法:');
console.log('1. 在控制台输入: icon0.click()');
console.log('2. 看看联系方式是否从星号变成真实号码');
console.log('3. 如果没变，试试: icon1.click()');
console.log('4. 继续试 icon2.click(), icon3.click() ...');
console.log('5. 找到能显示联系方式的那个，告诉我是 icon几');
console.log('━━━━━━━━━━━━━━━━━━━━━━');
