// Content Script - 在抖音精选联盟页面注入采集功能

(function() {
  'use strict';

  // 配置
  const CONFIG = {
    buttonId: 'zilo-collect-btn',
    buttonClass: 'zilo-collect-button',
    targetUrls: [
      'buyin.jinritemai.com/dashboard/servicehall/daren-profile',
      'buyin.jinritemai.com/dashboard/personal/daren-profile',
      'fxg.jinritemai.com',
      'test-page.html'
    ],
  };

  // 检查是否在达人详情页
  function isInfluencerDetailPage() {
    const currentUrl = window.location.href;
    return CONFIG.targetUrls.some(url => currentUrl.includes(url));
  }

  // 从页面 DOM 提取联系方式（需要先点击眼睛图标显示）
  async function fetchContactInfo() {
    try {
      console.log('[Zilo] 正在从页面提取联系方式...');
      
      // 获取页面所有文本内容
      const allText = document.body.innerText;
      
      let phone = '';
      let wechat = '';
      
      // 提取手机号：匹配"达人手机号："后面的内容
      const phoneMatch = allText.match(/达人手机号[：:]\s*([^\n]+)/);
      if (phoneMatch) {
        phone = phoneMatch[1].trim();
        console.log('[Zilo] 找到手机号:', phone);
      }
      
      // 提取微信号：匹配"达人微信号："后面的内容
      const wechatMatch = allText.match(/达人微信号[：:]\s*([^\n]+)/);
      if (wechatMatch) {
        wechat = wechatMatch[1].trim();
        console.log('[Zilo] 找到微信号:', wechat);
      }
      
      // 如果没有找到，尝试更宽松的匹配
      if (!phone && !wechat) {
        console.log('[Zilo] 使用宽松匹配查找联系方式...');
        
        // 查找所有可能包含联系方式的元素
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const text = el.textContent;
          
          if (!phone && text.includes('手机号')) {
            const match = text.match(/手机号[：:]\s*([^\n]+)/);
            if (match) {
              phone = match[1].trim();
              console.log('[Zilo] 找到手机号 (宽松匹配):', phone);
            }
          }
          
          if (!wechat && text.includes('微信号')) {
            const match = text.match(/微信号[：:]\s*([^\n]+)/);
            if (match) {
              wechat = match[1].trim();
              console.log('[Zilo] 找到微信号 (宽松匹配):', wechat);
            }
          }
          
          if (phone && wechat) break;
        }
      }
      
      if (!phone && !wechat) {
        console.log('[Zilo] 未找到联系方式，可能需要先点击眼睛图标显示');
      }
      
      return { phone, wechat };
    } catch (error) {
      console.error('[Zilo] 提取联系方式失败:', error);
      return { phone: '', wechat: '' };
    }
  }

  // 提取达人信息
  async function extractInfluencerInfo() {
    try {
      const info = {
        nickname: '',
        platformId: '',
        followers: '',
        category: '',
        level: '',
        phone: '',
        wechat: '',
        avatar: '',
        gender: '',
        age: '',
        location: '',
        tags: [],
      };

      // 提取昵称 - 使用正确的选择器
      const nicknameSelectors = [
        'span.auxo-dorami-atom-text',  // 抖音精选联盟的昵称选择器
        'span[class*="atom-text"]',
        'h1', 'h2', 'h3',
        '.author-name', '.daren-name', '.profile-name',
        '[class*="name"]',
      ];
      
      for (const selector of nicknameSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          // 过滤掉太长或太短的文本
          if (text && text.length > 1 && text.length < 50 && !text.includes('抖音号')) {
            info.nickname = text;
            console.log('[Zilo] 找到昵称:', text, '选择器:', selector);
            break;
          }
        }
      }

      // 提取抖音号 - 增强版
      const idSelectors = [
        '[class*="douyin-id"]',
        '[class*="author-id"]',
        '[class*="account-id"]',
        '[class*="抖音号"]',
      ];
      
      for (const selector of idSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          // 提取抖音号（可能包含"抖音号："前缀）
          const match = text.match(/(?:抖音号[：:]?\s*)?(\w+)/);
          if (match && match[1]) {
            info.platformId = match[1];
            console.log('[Zilo] 找到抖音号:', match[1], '选择器:', selector);
            break;
          }
        }
      }

      // 如果没找到抖音号，尝试从 URL 提取
      if (!info.platformId) {
        const urlMatch = window.location.href.match(/author_id=([^&]+)/);
        if (urlMatch) {
          info.platformId = urlMatch[1];
          console.log('[Zilo] 从 URL 提取抖音号:', urlMatch[1]);
        }
      }

      // 提取粉丝数 - 支持带"万"和不带"万"的格式
      // 策略1：优先查找"数字+万"格式（如：2万、1.5万）
      // 策略2：如果没找到，查找纯数字格式（如：123、1234）
      const allText = document.body.innerText;
      
      // 先尝试匹配"数字+万"格式
      const matchesWithWan = allText.match(/(\d+\.?\d*[万wW])/g);
      if (matchesWithWan && matchesWithWan.length > 0) {
        // 取第一个匹配（通常就是粉丝数）
        info.followers = matchesWithWan[0];
        console.log('[Zilo] 找到粉丝数 (带万):', info.followers);
      } else {
        // 如果没有"万"，尝试查找纯数字（3-5位数，避免匹配太小的数字）
        // 查找所有span中的纯数字
        const allSpans = document.querySelectorAll('span');
        for (const span of allSpans) {
          const text = span.textContent.trim();
          // 匹配3-5位纯数字（粉丝数通常在这个范围）
          if (/^\d{3,5}$/.test(text)) {
            info.followers = text;
            console.log('[Zilo] 找到粉丝数 (纯数字):', info.followers);
            break;
          }
        }
        
        if (!info.followers) {
          console.log('[Zilo] 未找到粉丝数');
        }
      }

      // 提取类目 - 增强版
      const categorySelectors = [
        '[class*="category"]',
        '[class*="类目"]',
        '[class*="主推类目"]',
        '[class*="领域"]',
      ];
      
      for (const selector of categorySelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          info.category = text.replace(/(?:主推)?类目[：:]?\s*/, '').replace(/领域[：:]?\s*/, '');
          console.log('[Zilo] 找到类目:', info.category, '选择器:', selector);
          break;
        }
      }

      // 提取等级
      const levelSelectors = [
        '[class*="level"]',
        '[class*="等级"]',
        '[class*="LV"]',
        '[class*="星级"]',
      ];
      
      for (const selector of levelSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          info.level = element.textContent.trim();
          console.log('[Zilo] 找到等级:', info.level, '选择器:', selector);
          break;
        }
      }

      // 提取头像
      const avatarSelectors = [
        'img[class*="avatar"]',
        'img[class*="头像"]',
        '.author-avatar img',
        '.profile-avatar img',
      ];
      
      for (const selector of avatarSelectors) {
        const element = document.querySelector(selector);
        if (element && element.src) {
          info.avatar = element.src;
          console.log('[Zilo] 找到头像:', info.avatar);
          break;
        }
      }

      // 提取性别
      const genderSelectors = [
        '[class*="gender"]',
        '[class*="性别"]',
      ];
      
      for (const selector of genderSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          if (text.includes('男') || text.includes('♂')) info.gender = '男';
          else if (text.includes('女') || text.includes('♀')) info.gender = '女';
          console.log('[Zilo] 找到性别:', info.gender);
          break;
        }
      }

      // 提取年龄
      const ageSelectors = [
        '[class*="age"]',
        '[class*="年龄"]',
      ];
      
      for (const selector of ageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          const match = text.match(/(\d+)/);
          if (match) {
            info.age = match[1];
            console.log('[Zilo] 找到年龄:', info.age);
            break;
          }
        }
      }

      // 提取地区 - 匹配"辽宁·铁岭"这样的格式
      const allTextNodes = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        // 匹配省市格式：辽宁·铁岭、北京·朝阳等
        if (/^[\u4e00-\u9fa5]+[·・][\u4e00-\u9fa5]+$/.test(text)) {
          info.location = text;
          console.log('[Zilo] 找到地区:', info.location);
          break;
        }
      }

      // 提取标签
      const tagSelectors = [
        '[class*="tag"]',
        '[class*="标签"]',
        '[class*="label"]',
      ];
      
      for (const selector of tagSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          if (text && text.length > 0 && text.length < 20 && !info.tags.includes(text)) {
            info.tags.push(text);
          }
        }
        if (info.tags.length > 0) {
          console.log('[Zilo] 找到标签:', info.tags);
          break;
        }
      }

      // 获取联系方式（异步）
      const contactInfo = await fetchContactInfo();
      info.phone = contactInfo.phone;
      info.wechat = contactInfo.wechat;

      console.log('[Zilo] 提取的达人信息:', info);
      return info;
    } catch (error) {
      console.error('[Zilo] 提取达人信息失败:', error);
      return null;
    }
  }

  // 创建采集按钮
  function createCollectButton() {
    // 检查按钮是否已存在
    if (document.getElementById(CONFIG.buttonId)) {
      return;
    }

    const button = document.createElement('button');
    button.id = CONFIG.buttonId;
    button.className = CONFIG.buttonClass;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
        <path d="M8 0L10.5 5.5L16 6.5L12 10.5L13 16L8 13L3 16L4 10.5L0 6.5L5.5 5.5L8 0Z"/>
      </svg>
      添加到 Zilo
    `;
    
    button.addEventListener('click', handleCollect);

    // 查找合适的位置插入按钮
    const insertPositions = [
      '.author-header',
      '.profile-header',
      '[class*="header"]',
      'body',
    ];

    for (const selector of insertPositions) {
      const container = document.querySelector(selector);
      if (container) {
        container.appendChild(button);
        console.log('[Zilo] 按钮已插入到:', selector);
        break;
      }
    }
  }

  // 处理采集操作
  async function handleCollect() {
    const button = document.getElementById(CONFIG.buttonId);
    if (!button) return;

    // 禁用按钮
    button.disabled = true;
    button.textContent = '采集中...';

    try {
      // 提取达人信息
      const info = await extractInfluencerInfo();
      
      if (!info || !info.nickname) {
        throw new Error('无法提取达人信息，请确保在达人详情页');
      }

      // 发送消息到 background script
      chrome.runtime.sendMessage({
        action: 'collectInfluencer',
        data: info,
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Zilo] 发送消息失败:', chrome.runtime.lastError);
          showNotification('采集失败：' + chrome.runtime.lastError.message, 'error');
          button.disabled = false;
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
              <path d="M8 0L10.5 5.5L16 6.5L12 10.5L13 16L8 13L3 16L4 10.5L0 6.5L5.5 5.5L8 0Z"/>
            </svg>
            添加到 Zilo
          `;
          return;
        }

        if (response && response.success) {
          showNotification('达人采集成功！', 'success');
          button.textContent = '✓ 已添加';
          button.style.backgroundColor = '#52c41a';
        } else {
          const errorMsg = response?.error || '未知错误';
          showNotification('采集失败：' + errorMsg, 'error');
          button.disabled = false;
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
              <path d="M8 0L10.5 5.5L16 6.5L12 10.5L13 16L8 13L3 16L4 10.5L0 6.5L5.5 5.5L8 0Z"/>
            </svg>
            添加到 Zilo
          `;
        }
      });
    } catch (error) {
      console.error('[Zilo] 采集失败:', error);
      showNotification('采集失败：' + error.message, 'error');
      button.disabled = false;
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 6px;">
          <path d="M8 0L10.5 5.5L16 6.5L12 10.5L13 16L8 13L3 16L4 10.5L0 6.5L5.5 5.5L8 0Z"/>
        </svg>
        添加到 Zilo
      `;
    }
  }

  // 显示通知
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `zilo-notification zilo-notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // 初始化
  function init() {
    if (isInfluencerDetailPage()) {
      console.log('[Zilo] 检测到达人详情页，准备注入采集按钮');
      
      // 等待页面加载完成
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCollectButton);
      } else {
        createCollectButton();
      }

      // 监听页面变化（SPA 路由切换）
      const observer = new MutationObserver(() => {
        if (isInfluencerDetailPage() && !document.getElementById(CONFIG.buttonId)) {
          createCollectButton();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  // 启动
  init();
})();
