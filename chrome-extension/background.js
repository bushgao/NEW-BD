// Background Service Worker - 处理与 Zilo 后端的通信

// 默认配置
const DEFAULT_CONFIG = {
  apiUrl: 'http://localhost:3000/api',
  token: '',
};

// 获取配置
async function getConfig() {
  const result = await chrome.storage.sync.get(['apiUrl', 'token']);
  return {
    apiUrl: result.apiUrl || DEFAULT_CONFIG.apiUrl,
    token: result.token || DEFAULT_CONFIG.token,
  };
}

// 保存配置
async function saveConfig(config) {
  await chrome.storage.sync.set(config);
}

// 解析粉丝数（支持 1.2w, 123.4万, 2万 等格式）
function parseFollowers(followersStr) {
  if (!followersStr) return '';
  
  // 移除逗号、空格等
  const str = followersStr.replace(/[,，\s]/g, '');
  
  // 匹配数字和单位：2万、1.2万、123.4万、5000 等
  const match = str.match(/([\d.]+)([wW万])?/);
  if (!match) return followersStr;
  
  const num = parseFloat(match[1]);
  const unit = match[2];
  
  // 如果有"万"或"w"单位，转换为实际数字
  if (unit && (unit === 'w' || unit === 'W' || unit === '万')) {
    return Math.round(num * 10000).toString();
  }
  
  // 如果没有单位，直接返回数字
  return Math.round(num).toString();
}

// 处理达人采集
async function collectInfluencer(data) {
  try {
    const config = await getConfig();
    
    if (!config.token) {
      throw new Error('请先在插件设置中配置登录令牌');
    }

    // 准备请求数据
    const requestData = {
      nickname: data.nickname,
      platform: 'DOUYIN', // 默认抖音平台
      platformId: data.platformId || data.nickname, // 如果没有抖音号，使用昵称
      phone: data.phone || undefined,
      wechat: data.wechat || undefined,
      followers: parseFollowers(data.followers), // 解析粉丝数
      categories: data.category ? [data.category] : [],
      tags: [
        ...(data.level ? [data.level] : []),
        ...(data.tags || []),
        ...(data.gender ? [`性别:${data.gender}`] : []),
        ...(data.age ? [`年龄:${data.age}`] : []),
        ...(data.location ? [`地区:${data.location}`] : []),
      ].filter(Boolean),
      notes: [
        data.avatar ? `头像: ${data.avatar}` : '',
        '通过浏览器插件采集',
      ].filter(Boolean).join('\n'),
    };

    console.log('[Zilo Background] 准备发送请求:', requestData);

    // 发送请求到 Zilo 后端
    const response = await fetch(`${config.apiUrl}/influencers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || '添加失败');
    }

    console.log('[Zilo Background] 采集成功:', result);
    
    // 更新统计
    await updateStats('success');
    
    return { success: true, data: result.data };
  } catch (error) {
    console.error('[Zilo Background] 采集失败:', error);
    
    // 更新统计
    await updateStats('error');
    
    return { success: false, error: error.message };
  }
}

// 更新统计数据
async function updateStats(type) {
  const stats = await chrome.storage.local.get(['totalCollected', 'totalErrors']);
  
  const newStats = {
    totalCollected: stats.totalCollected || 0,
    totalErrors: stats.totalErrors || 0,
  };
  
  if (type === 'success') {
    newStats.totalCollected++;
  } else if (type === 'error') {
    newStats.totalErrors++;
  }
  
  await chrome.storage.local.set(newStats);
}

// 获取统计数据
async function getStats() {
  const stats = await chrome.storage.local.get(['totalCollected', 'totalErrors']);
  return {
    totalCollected: stats.totalCollected || 0,
    totalErrors: stats.totalErrors || 0,
  };
}

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Zilo Background] 收到消息:', request);
  
  if (request.action === 'collectInfluencer') {
    // 异步处理
    collectInfluencer(request.data).then(sendResponse);
    return true; // 保持消息通道开启
  }
  
  if (request.action === 'getConfig') {
    getConfig().then(sendResponse);
    return true;
  }
  
  if (request.action === 'saveConfig') {
    saveConfig(request.config).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getStats') {
    getStats().then(sendResponse);
    return true;
  }
  
  return false;
});

// 插件安装时的初始化
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Zilo] 插件已安装');
    // 打开配置页面
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('[Zilo] 插件已更新');
  }
});

console.log('[Zilo Background] Service Worker 已启动');
