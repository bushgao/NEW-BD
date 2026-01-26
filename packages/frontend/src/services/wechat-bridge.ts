/**
 * 微信桥接服务
 * 通过Chrome Native Messaging与本地微信自动化程序通信
 */

// Chrome Extension API type declarations
declare const chrome: {
    runtime: {
        connectNative: (hostName: string) => ChromePort;
    };
} | undefined;

interface ChromePort {
    postMessage: (message: unknown) => void;
    onMessage: {
        addListener: (callback: (message: unknown) => void) => void;
    };
    onDisconnect: {
        addListener: (callback: () => void) => void;
    };
    disconnect: () => void;
}

const NATIVE_HOST_ID = 'com.ics.wechat_bridge';

interface NativeMessage {
    action: string;
    [key: string]: unknown;
}

interface NativeResponse {
    success: boolean;
    message?: string;
    data?: unknown;
    error?: string;
}

interface WeChatWindow {
    title: string;
    handle: number;
    display_name?: string;
    nickname?: string;
}

let nativePort: ChromePort | null = null;
let messageId = 0;
const pendingMessages = new Map<number, { resolve: (value: NativeResponse) => void; reject: (reason: Error) => void }>();

/**
 * 检查Native Host是否可用
 */
export async function isPluginAvailable(): Promise<boolean> {
    try {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.warn('Chrome extension API not available');
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * 等待插件准备就绪
 */
export async function waitForPlugin(timeout = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        if (await isPluginAvailable()) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return false;
}

/**
 * 连接到Native Host
 */
function connectToNativeHost(): ChromePort | null {
    try {
        if (nativePort) {
            return nativePort;
        }

        if (typeof chrome === 'undefined' || !chrome.runtime) {
            return null;
        }

        nativePort = chrome.runtime.connectNative(NATIVE_HOST_ID);

        nativePort.onMessage.addListener((response: unknown) => {
            const res = response as NativeResponse & { id?: number };
            if (res.id !== undefined && pendingMessages.has(res.id)) {
                const { resolve } = pendingMessages.get(res.id)!;
                pendingMessages.delete(res.id);
                resolve(res);
            }
        });

        nativePort.onDisconnect.addListener(() => {
            console.log('Native host disconnected');
            nativePort = null;

            for (const [id, { reject }] of pendingMessages) {
                reject(new Error('Native host disconnected'));
                pendingMessages.delete(id);
            }
        });

        return nativePort;
    } catch (error) {
        console.error('Failed to connect to native host:', error);
        return null;
    }
}

/**
 * 发送消息到Native Host
 */
async function sendNativeMessage(message: NativeMessage): Promise<NativeResponse> {
    return new Promise((resolve, reject) => {
        const port = connectToNativeHost();

        if (!port) {
            reject(new Error('无法连接到微信助手，请确保已安装Chrome扩展'));
            return;
        }

        const id = ++messageId;
        pendingMessages.set(id, { resolve, reject });

        port.postMessage({ ...message, id });

        setTimeout(() => {
            if (pendingMessages.has(id)) {
                pendingMessages.delete(id);
                reject(new Error('请求超时'));
            }
        }, 30000);
    });
}

/**
 * 检查Native Host连接状态
 */
export async function checkNativeHostConnection(): Promise<{ connected: boolean; message: string }> {
    try {
        const response = await sendNativeMessage({ action: 'ping' });
        return {
            connected: response.success,
            message: response.message || '已连接',
        };
    } catch (error) {
        return {
            connected: false,
            message: error instanceof Error ? error.message : '连接失败',
        };
    }
}

/**
 * 检查微信状态
 */
export async function checkWeChatStatus(): Promise<{ available: boolean; message: string; clients?: WeChatWindow[] }> {
    try {
        const response = await sendNativeMessage({ action: 'check_wechat_status' });
        return {
            available: response.success,
            message: response.message || '',
            clients: response.data as WeChatWindow[] | undefined,
        };
    } catch (error) {
        return {
            available: false,
            message: error instanceof Error ? error.message : '检查失败',
        };
    }
}

/**
 * 获取所有微信窗口
 */
export async function getWeChatWindows(): Promise<WeChatWindow[]> {
    try {
        const response = await sendNativeMessage({ action: 'get_wechat_windows' });
        if (response.success && Array.isArray(response.data)) {
            return response.data as WeChatWindow[];
        }
        return [];
    } catch (error) {
        console.error('Failed to get wechat windows:', error);
        return [];
    }
}

/**
 * 添加微信好友
 */
export async function addWeChatFriend(params: {
    wechatId: string;
    nickname?: string;
    platform?: string;
    message?: string;
    remark?: string;
    hwnd?: number;
}): Promise<{ success: boolean; message: string }> {
    try {
        const response = await sendNativeMessage({
            action: 'add_friend',
            wechat_id: params.wechatId,
            nickname: params.nickname,
            platform: params.platform,
            message: params.message,
            remark: params.remark,
            hwnd: params.hwnd,
        });

        return {
            success: response.success,
            message: response.message || (response.success ? '好友请求已发送' : '添加失败'),
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : '添加失败',
        };
    }
}

/**
 * 搜索微信号
 */
export async function searchWeChatList(wechatId: string, hwnd?: number): Promise<{ success: boolean; message: string }> {
    try {
        const response = await sendNativeMessage({
            action: 'search_wechat',
            wechat_id: wechatId,
            window_handle: hwnd,
        });

        return {
            success: response.success,
            message: response.message || '',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : '搜索失败',
        };
    }
}

/**
 * 填写好友信息
 */
export async function fillFriendInfo(params: {
    message?: string;
    remark?: string;
    hwnd?: number;
}): Promise<{ success: boolean; message: string }> {
    try {
        const response = await sendNativeMessage({
            action: 'fill_friend_info',
            message: params.message,
            remark: params.remark,
            window_handle: params.hwnd,
        });

        return {
            success: response.success,
            message: response.message || '',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : '填写失败',
        };
    }
}

/**
 * 发送文件
 */
export async function sendFilePlugin(filePath: string, hwnd?: number): Promise<{ success: boolean; message: string }> {
    try {
        const response = await sendNativeMessage({
            action: 'send_file',
            file_path: filePath,
            window_handle: hwnd,
        });

        return {
            success: response.success,
            message: response.message || '',
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : '发送失败',
        };
    }
}
