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
async function collectInfluencer(data, pageToken) {
  try {
    const config = await getConfig();

    // 优先使用页面传来的 token（当前登录用户），如果没有则使用插件配置的 token
    const token = pageToken || config.token;

    if (!token) {
      throw new Error('请先登录系统或在插件设置中配置登录令牌');
    }

    console.log('[Zilo Background] 使用 token:', pageToken ? '页面 token（当前登录用户）' : '插件配置 token');

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
        'Authorization': `Bearer ${token}`,
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

// 消息监听器已移到文件末尾（包含 Native Messaging 扩展）

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

// ============================================
// Native Messaging - 微信桥接程序通信
// ============================================

const NATIVE_HOST_NAME = 'com.ics.wechat_bridge';

// 发送消息到 Native Host
async function sendNativeMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Zilo Native] 通信错误:', chrome.runtime.lastError.message);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          console.log('[Zilo Native] 收到响应:', response);
          resolve(response);
        }
      });
    } catch (error) {
      console.error('[Zilo Native] 发送失败:', error);
      reject(error);
    }
  });
}

// 检查 Native Host 连接状态
async function checkNativeHostConnection() {
  console.log('[Zilo Native] 开始检查 Native Host 连接...');
  try {
    const response = await sendNativeMessage({ action: 'ping' });
    console.log('[Zilo Native] 收到响应:', response);
    return {
      success: true,
      connected: true,
      version: response.data?.version || response.status || 'unknown',
      automationAvailable: response.data?.automation_available || response.automation_available || false,
      message: '本地桥接程序已连接',
    };
  } catch (error) {
    console.error('[Zilo Native] 连接检查失败:', error);
    return {
      success: false,
      connected: false,
      error: error.message,
      message: '本地桥接程序未连接，请运行 native-host/install.bat 安装',
    };
  }
}

// 获取微信窗口列表
async function getWeChatWindows() {
  try {
    const response = await sendNativeMessage({ action: 'get_wechat_windows' });
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error?.message || '获取微信窗口失败');
    }
  } catch (error) {
    console.error('[Zilo Native] 获取微信窗口失败:', error);
    throw error;
  }
}

// 检查微信状态
async function checkWeChatStatus() {
  try {
    const response = await sendNativeMessage({ action: 'check_wechat_status' });
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error?.message || '检查微信状态失败');
    }
  } catch (error) {
    console.error('[Zilo Native] 检查微信状态失败:', error);
    throw error;
  }
}

// 一键添加微信好友
async function addWeChatFriend(params) {
  try {
    console.log('[Zilo Native] 准备添加微信好友:', params);

    const response = await sendNativeMessage({
      action: 'add_friend',
      wechat_id: params.wechatId,
      nickname: params.nickname,
      platform: params.platform,
      message: params.message,
      auto_confirm: params.autoConfirm || false,
    });

    if (response.success) {
      console.log('[Zilo Native] 添加好友成功:', response.data);
      return { success: true, data: response.data };
    } else {
      throw new Error(response.error?.message || '添加好友失败');
    }
  } catch (error) {
    console.error('[Zilo Native] 添加好友失败:', error);
    return { success: false, error: error.message };
  }
}

// 扩展消息监听器，添加 Native Messaging 相关处理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Zilo Background] 收到消息:', request.action);

  // 原有的消息处理
  if (request.action === 'collectInfluencer') {
    collectInfluencer(request.data, request.pageToken).then(sendResponse);
    return true;
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

  // Native Messaging 相关消息处理
  if (request.action === 'checkNativeHost') {
    checkNativeHostConnection().then(sendResponse);
    return true;
  }

  if (request.action === 'getWeChatWindows') {
    getWeChatWindows().then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (request.action === 'checkWeChatStatus') {
    checkWeChatStatus().then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  if (request.action === 'addWeChatFriend') {
    addWeChatFriend(request.params).then(sendResponse);
    return true;
  }

  if (request.action === 'highlightWindow') {
    sendNativeMessage({
      action: 'highlight_window',
      window_handle: request.params?.windowHandle
    }).then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  // 分步 API: 搜索微信号
  if (request.action === 'searchWechat') {
    sendNativeMessage({
      action: 'search_wechat',
      wechat_id: request.params?.wechatId,
      window_handle: request.params?.windowHandle
    }).then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  // 分步 API: 填写验证信息
  if (request.action === 'fillFriendInfo') {
    sendNativeMessage({
      action: 'fill_friend_info',
      message: request.params?.message,
      remark: request.params?.remark,
      window_handle: request.params?.windowHandle
    }).then(sendResponse).catch(err => {
      sendResponse({ success: false, error: err.message });
    });
    return true;
  }

  return false;
});

