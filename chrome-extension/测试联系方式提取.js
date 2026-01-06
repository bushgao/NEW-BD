// 在浏览器控制台运行此脚本来测试联系方式提取

(function() {
  console.log('=== 开始测试联系方式提取 ===');
  
  // 获取页面所有文本
  const allText = document.body.innerText;
  console.log('页面文本长度:', allText.length);
  
  // 测试手机号提取
  const phoneMatch = allText.match(/达人手机号[：:]\s*([^\n]+)/);
  if (phoneMatch) {
    console.log('✓ 找到手机号:', phoneMatch[1].trim());
  } else {
    console.log('✗ 未找到手机号');
    
    // 尝试宽松匹配
    const looseMatch = allText.match(/手机号[：:]\s*([^\n]+)/);
    if (looseMatch) {
      console.log('✓ 找到手机号 (宽松匹配):', looseMatch[1].trim());
    }
  }
  
  // 测试微信号提取
  const wechatMatch = allText.match(/达人微信号[：:]\s*([^\n]+)/);
  if (wechatMatch) {
    console.log('✓ 找到微信号:', wechatMatch[1].trim());
  } else {
    console.log('✗ 未找到微信号');
    
    // 尝试宽松匹配
    const looseMatch = allText.match(/微信号[：:]\s*([^\n]+)/);
    if (looseMatch) {
      console.log('✓ 找到微信号 (宽松匹配):', looseMatch[1].trim());
    }
  }
  
  console.log('=== 测试完成 ===');
  console.log('');
  console.log('如果没有找到联系方式，请：');
  console.log('1. 确认已点击眼睛图标显示联系方式');
  console.log('2. 检查页面上是否真的显示了"达人手机号"或"达人微信号"');
  console.log('3. 如果显示的是其他格式，请告诉我具体的文本格式');
})();
