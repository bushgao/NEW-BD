/**
 * 微信一键添�?- Chrome 插件通信服务
 * 通过 postMessage �?Chrome 插件�?content script 通信
 */

// 检查插件是否已加载
let pluginReady = false;

// 监听插件就绪消息
window.addEventListener('message', (event) => {
    if (event.data?.type === 'zilo-wechat-ready') {
        pluginReady = true;
        console.log('[WeChat Bridge] Chrome 插件已就�?);
    }
});

/**
 * 检�?Chrome 插件是否可用
 */
export const isPluginAvailable = (): boolean => {
    return pluginReady;
};

/**
 * 等待插件就绪
 */
export const waitForPlugin = (timeout = 3000): Promise<boolean> => {
    return new Promise((resolve) => {
        if (pluginReady) {
            resolve(true);
            return;
        }

        const startTime = Date.now();

        // 主动发�?ping 请求触发 ready 响应
        const sendPing = () => {
            window.postMessage({ type: 'zilo-wechat-ping' }, '*');
        };

        // 立即发送一�?ping
        sendPing();

        const checkInterval = setInterval(() => {
            if (pluginReady) {
                clearInterval(checkInterval);
                resolve(true);
            } else if (Date.now() - startTime > timeout) {
                clearInterval(checkInterval);
                resolve(false);
            } else {
                // 每次检查时发�?ping
                sendPing();
            }
        }, 200);
    });
};

/**
 * 发送消息到 Chrome 插件并等待响�?
 */
export const sendToPlugin = <T = any>(
    action: string,
    data: Record<string, any> = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
    return new Promise((resolve) => {
        const handleResponse = (event: MessageEvent) => {
            if (
                event.data?.type === 'zilo-wechat-response' &&
                event.data?.action === action
            ) {
                window.removeEventListener('message', handleResponse);
                resolve({
                    success: event.data.success,
                    data: event.data.data,
                    error: event.data.error,
                });
            }
        };

        // 设置超时（添加好友操作需要较长时间）
        const timeoutId = setTimeout(() => {
            window.removeEventListener('message', handleResponse);
            resolve({ success: false, error: '通信超时，请确保 Chrome 插件已安装并启用' });
        }, 30000);

        window.addEventListener('message', handleResponse);

        // 发送消�?
        window.postMessage({
            type: 'zilo-wechat',
            action,
            data,
        }, '*');
    });
};

/**
 * 检�?Native Host 连接状�?
 */
export const checkNativeHostConnection = async (): Promise<{
    connected: boolean;
    message: string;
}> => {
    const result = await sendToPlugin<{ message: string }>('checkNativeHost');
    return {
        connected: result.success,
        message: result.data?.message || result.error || '未知状�?,
    };
};

/**
 * 获取微信窗口列表
 */
export const getWeChatWindows = async (): Promise<{
    success: boolean;
    windows: Array<{
        title: string;
        handle: number;
        account_name: string;
    }>;
    error?: string;
}> => {
    const result = await sendToPlugin<{
        windows: Array<{ title: string; handle: number; account_name: string }>;
    }>('getWeChatWindows');

    return {
        success: result.success,
        windows: result.data?.windows || [],
        error: result.error,
    };
};

/**
 * 添加微信好友（完整流程）
 */
export const addWeChatFriend = async (params: {
    wechatId: string;
    nickname: string;
    platform?: string;
    message?: string;
    remark?: string;
    windowHandle?: number;
}): Promise<{
    success: boolean;
    step?: string;
    message: string;
}> => {
    const result = await sendToPlugin<{
        step: string;
        message: string;
    }>('addWeChatFriend', { params });

    return {
        success: result.success,
        step: result.data?.step,
        message: result.data?.message || result.error || '操作失败',
    };
};

/**
 * 分步1: 搜索微信号（用户需手动点击搜索结果�?
 */
export const searchWechat = async (params: {
    wechatId: string;
    windowHandle?: number;
}): Promise<{
    success: boolean;
    message: string;
}> => {
    const result = await sendToPlugin<{
        message: string;
    }>('searchWechat', { params });

    return {
        success: result.success,
        message: result.data?.message || result.error || '操作失败',
    };
};

/**
 * 分步2: 填写验证信息（用户已进入添加好友界面后调用）
 */
export const fillFriendInfo = async (params: {
    message?: string;
    remark?: string;
    windowHandle?: number;
}): Promise<{
    success: boolean;
    message: string;
}> => {
    const result = await sendToPlugin<{
        message: string;
    }>('fillFriendInfo', { params });

    return {
        success: result.success,
        message: result.data?.message || result.error || '操作失败',
    };
};

/**
 * 检查微信状�?
 */
export const checkWeChatStatus = async (): Promise<{
    installed: boolean;
    running: boolean;
    logged_in: boolean;
    window_count: number;
    message: string;
}> => {
    const result = await sendToPlugin<{
        installed: boolean;
        running: boolean;
        logged_in: boolean;
        window_count: number;
        message: string;
    }>('checkWeChatStatus');

    if (!result.success) {
        return {
            installed: false,
            running: false,
            logged_in: false,
            window_count: 0,
            message: result.error || '检查失�?,
        };
    }

    return result.data!;
};
