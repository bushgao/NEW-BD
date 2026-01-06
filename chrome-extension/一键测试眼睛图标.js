// 一键测试眼睛图标点击功能
// 在达人详情页控制台运行此脚本

(async function() {
  console.log('=== 🧪 一键测试眼睛图标点击 ===\n');
  
  // 1. 检查当前状态
  console.log('1️⃣ 检查联系方式当前状态');
  let allText = document.body.innerText;
  const beforeHidden = allText.includes('***********') || allText.includes('*****');
  
  if (beforeHidden) {
    console.log('✅ 联系方式当前是隐藏的（显示为星号）');
  } else {
    console.log('⚠️  联系方式可能已经显示，或者没有联系方式');
    console.log('   如果已经显示，此测试将无法验证点击效果');
  }
  console.log('');
  
  // 2. 尝试所有可能的选择器
  console.log('2️⃣ 尝试点击所有可能的眼睛图标');
  
  const strategies = [
    {
      name: '策略1：查找联系方式附近的 SVG',
      action: () => {
        const keywords = ['手机号', '微信号', '联系方式'];
        for (const keyword of keywords) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent.includes(keyword)) {
              let parent = node.parentElement;
              for (let i = 0; i < 3 && parent; i++) {
                const svg = parent.querySelector('svg');
                if (svg) {
                  const rect = svg.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0 && rect.width < 50) {
                    return svg.parentElement || svg;
                  }
                }
                parent = parent.parentElement;
              }
            }
          }
        }
        return null;
      }
    },
    {
      name: '策略2：查找包含 eye 类名的元素',
      action: () => {
        const elements = document.querySelectorAll('[class*="eye"], [class*="Eye"]');
        for (const el of elements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return el;
          }
        }
        return null;
      }
    },
    {
      name: '策略3：查找星号附近的可点击元素',
      action: () => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('***')) {
            let parent = node.parentElement;
            for (let i = 0; i < 3 && parent; i++) {
              const clickables = parent.querySelectorAll('svg, button, [role="button"], [class*="icon"]');
              for (const el of clickables) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0 && rect.width < 100 && rect.height < 100) {
                  return el;
                }
              }
              parent = parent.parentElement;
            }
          }
        }
        return null;
      }
    },
    {
      name: '策略4：查找所有小尺寸 SVG',
      action: () => {
        const svgs = document.querySelectorAll('svg');
        for (const svg of svgs) {
          const rect = svg.getBoundingClientRect();
          if (rect.width > 10 && rect.width < 40 && rect.height > 10 && rect.height < 40) {
            // 检查是否在联系方式区域附近
            const parent = svg.closest('[class*="contact"], [class*="info"], [class*="detail"]');
            if (parent) {
              return svg.parentElement || svg;
            }
          }
        }
        return null;
      }
    }
  ];
  
  let foundIcon = null;
  let successStrategy = null;
  
  for (const strategy of strategies) {
    console.log(`\n尝试 ${strategy.name}...`);
    const element = strategy.action();
    
    if (element) {
      console.log('✅ 找到元素:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
      
      // 尝试点击
      console.log('   正在点击...');
      element.click();
      
      // 等待 1.5 秒让页面更新
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 检查是否成功
      allText = document.body.innerText;
      const afterHidden = allText.includes('***********') || allText.includes('*****');
      
      if (beforeHidden && !afterHidden) {
        console.log('   🎉 成功！联系方式已显示');
        foundIcon = element;
        successStrategy = strategy.name;
        break;
      } else if (!beforeHidden) {
        console.log('   ⚠️  无法验证（联系方式本来就是显示的）');
      } else {
        console.log('   ❌ 点击后联系方式仍然隐藏');
      }
    } else {
      console.log('❌ 未找到元素');
    }
  }
  
  console.log('\n');
  console.log('=== 📊 测试结果 ===');
  
  if (foundIcon) {
    console.log('✅ 找到正确的眼睛图标！');
    console.log('');
    console.log('成功策略:', successStrategy);
    console.log('元素信息:');
    console.log('  标签:', foundIcon.tagName);
    console.log('  类名:', foundIcon.className);
    console.log('  ID:', foundIcon.id || '(无)');
    console.log('');
    console.log('📋 建议的选择器:');
    
    // 生成选择器建议
    if (foundIcon.id) {
      console.log(`  #${foundIcon.id}`);
    }
    if (foundIcon.className) {
      const classes = foundIcon.className.split(' ').filter(c => c);
      if (classes.length > 0) {
        console.log(`  .${classes.join('.')}`);
      }
    }
    console.log(`  ${foundIcon.tagName.toLowerCase()}`);
    
    console.log('');
    console.log('💡 请将这个选择器告诉我，我会更新 content.js');
    
    // 保存到全局变量
    window.correctEyeIcon = foundIcon;
    console.log('');
    console.log('✨ 元素已保存到 window.correctEyeIcon，可以再次测试：');
    console.log('   correctEyeIcon.click()');
    
  } else {
    console.log('❌ 未找到正确的眼睛图标');
    console.log('');
    console.log('可能的原因：');
    console.log('1. 联系方式本来就是显示的（不需要点击）');
    console.log('2. 眼睛图标的实现方式比较特殊');
    console.log('3. 需要特殊的权限或登录状态');
    console.log('');
    console.log('💡 建议：');
    console.log('1. 刷新页面，确保联系方式是隐藏的');
    console.log('2. 手动点击眼睛图标，观察它的位置和样式');
    console.log('3. 运行 "查找眼睛图标.js" 脚本获取更详细的信息');
  }
  
  console.log('');
  console.log('=== 🧪 测试完成 ===');
})();
