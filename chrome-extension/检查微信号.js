// 在达人详情页控制台运行此脚本，检查微信号

console.log('=== 🔍 检查微信号 ===\n');

// 1. 检查页面文本
const allText = document.body.innerText;
console.log('1️⃣ 检查页面是否包含"微信"相关文字');

const wechatKeywords = ['微信', 'WeChat', 'wechat', 'wx'];
wechatKeywords.forEach(keyword => {
  if (allText.includes(keyword)) {
    console.log(`✅ 找到关键词: ${keyword}`);
    
    // 查找包含该关键词的行
    const lines = allText.split('\n');
    lines.forEach((line, index) => {
      if (line.includes(keyword)) {
        console.log(`   第 ${index} 行: ${line.trim()}`);
      }
    });
  } else {
    console.log(`❌ 未找到关键词: ${keyword}`);
  }
});

console.log('\n2️⃣ 尝试提取微信号');

// 尝试各种匹配模式
const patterns = [
  /达人微信号[：:]\s*([^\n]+)/,
  /微信号[：:]\s*([^\n]+)/,
  /微信[：:]\s*([^\n]+)/,
  /WeChat[：:]\s*([^\n]+)/i,
];

patterns.forEach((pattern, index) => {
  const match = allText.match(pattern);
  if (match) {
    console.log(`✅ 模式 ${index + 1} 匹配成功:`, match[1].trim());
  } else {
    console.log(`❌ 模式 ${index + 1} 未匹配:`, pattern);
  }
});

console.log('\n3️⃣ 查找所有包含"微信"的元素');
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  null,
  false
);

let node;
let count = 0;
while (node = walker.nextNode()) {
  if (node.textContent.includes('微信')) {
    count++;
    console.log(`[${count}] 元素:`, {
      文本: node.textContent.trim().substring(0, 100),
      父元素: node.parentElement.tagName,
      类名: node.parentElement.className
    });
  }
}

if (count === 0) {
  console.log('❌ 页面上没有找到"微信"相关文本');
  console.log('');
  console.log('💡 可能的原因:');
  console.log('1. 该达人没有填写微信号');
  console.log('2. 微信号也需要点击眼睛图标才能显示');
  console.log('3. 微信号使用了其他名称（如"联系方式"）');
}

console.log('\n=== 🔍 检查完成 ===');
