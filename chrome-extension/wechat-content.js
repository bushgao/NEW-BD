// Content Script - 与前端页面通信
// 这个脚本运行在网页上下文中，负责转发消息

console.log('[Zilo WeChat] Content script loaded');

// 持续发送就绪消息，确保前端能接收到
function broadcastReady() {
    window.postMessage({
        type: 'zilo-wechat-ready',
        ready: true
    }, '*');
}

// 立即发送一次
broadcastReady();

// 每 500ms 发送一次，持续 5 秒
let readyCount = 0;
const readyInterval = setInterval(() => {
    broadcastReady();
    readyCount++;
    if (readyCount >= 10) {
        clearInterval(readyInterval);
    }
}, 500);

// 监听来自网页的消息
window.addEventListener('message', async (event) => {
    // 确保消息来自同一页面
    if (event.source !== window) return;

    const { type, action, data } = event.data || {};

    // 响应 ping 请求
    if (type === 'zilo-wechat-ping') {
        console.log('[Zilo WeChat] Received ping, sending ready response');
        broadcastReady();
        return;
    }

    // 只处理 zilo-wechat 类型的消息
    if (type !== 'zilo-wechat') return;

    console.log('[Zilo WeChat] Received message from page:', action, data);

    try {
        // 转发消息到 background script
        const response = await chrome.runtime.sendMessage({
            action: action,
            ...data
        });

        console.log('[Zilo WeChat] Response from background:', response);

        // 发送响应回网页
        window.postMessage({
            type: 'zilo-wechat-response',
            action: action,
            success: response?.success !== false,
            data: response,
            error: response?.error
        }, '*');

    } catch (error) {
        console.error('[Zilo WeChat] Error:', error);

        window.postMessage({
            type: 'zilo-wechat-response',
            action: action,
            success: false,
            error: error.message || '通信失败'
        }, '*');
    }
});
