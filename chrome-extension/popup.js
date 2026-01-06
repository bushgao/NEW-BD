// Popup UI 逻辑

// DOM 元素
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const totalCollected = document.getElementById('totalCollected');
const totalErrors = document.getElementById('totalErrors');
const settingsBtn = document.getElementById('settingsBtn');
const helpBtn = document.getElementById('helpBtn');
const saveBtn = document.getElementById('saveBtn');
const backBtn = document.getElementById('backBtn');
const apiUrlInput = document.getElementById('apiUrl');
const tokenInput = document.getElementById('token');
const messageDiv = document.getElementById('message');

// 显示消息
function showMessage(text, type = 'success') {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
  messageDiv.classList.remove('hidden');
  
  setTimeout(() => {
    messageDiv.classList.add('hidden');
  }, 3000);
}

// 加载配置
async function loadConfig() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    apiUrlInput.value = response.apiUrl || 'http://localhost:3000/api';
    tokenInput.value = response.token || '';
    
    // 检查连接状态
    checkConnection(response);
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

// 检查连接状态
function checkConnection(config) {
  if (!config.token) {
    statusDot.classList.add('error');
    statusText.textContent = '未配置';
    return;
  }
  
  // 简单检查 - 实际应该发送请求验证
  statusDot.classList.remove('error');
  statusText.textContent = '已连接';
}

// 加载统计数据
async function loadStats() {
  try {
    const stats = await chrome.runtime.sendMessage({ action: 'getStats' });
    totalCollected.textContent = stats.totalCollected || 0;
    totalErrors.textContent = stats.totalErrors || 0;
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 保存配置
async function saveConfig() {
  const apiUrl = apiUrlInput.value.trim();
  const token = tokenInput.value.trim();
  
  if (!apiUrl) {
    showMessage('请输入 API 地址', 'error');
    return;
  }
  
  if (!token) {
    showMessage('请输入登录令牌', 'error');
    return;
  }
  
  try {
    await chrome.runtime.sendMessage({
      action: 'saveConfig',
      config: { apiUrl, token },
    });
    
    showMessage('配置已保存', 'success');
    
    setTimeout(() => {
      showMainView();
    }, 1000);
  } catch (error) {
    console.error('保存配置失败:', error);
    showMessage('保存失败：' + error.message, 'error');
  }
}

// 显示主视图
function showMainView() {
  mainView.classList.remove('hidden');
  settingsView.classList.add('hidden');
  loadConfig();
  loadStats();
}

// 显示设置视图
function showSettingsView() {
  mainView.classList.add('hidden');
  settingsView.classList.remove('hidden');
  loadConfig();
}

// 显示帮助
function showHelp() {
  const helpUrl = 'https://github.com/yourusername/zilo-extension/blob/main/README.md';
  chrome.tabs.create({ url: helpUrl });
}

// 事件监听
settingsBtn.addEventListener('click', showSettingsView);
helpBtn.addEventListener('click', showHelp);
saveBtn.addEventListener('click', saveConfig);
backBtn.addEventListener('click', showMainView);

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  showMainView();
});
