/**
 * 微信脚本管理服务
 * 用于管理添加好友时的验证消息模板
 */

export interface WeChatScript {
    id: string;
    name: string;
    content: string;
    variables: string[];
    isDefault?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const DEFAULT_SCRIPTS: WeChatScript[] = [
    {
        id: 'default-1',
        name: '通用模板',
        content: '您好，我是通过{platform}看到您的，想加您好友交流合作~',
        variables: ['platform'],
        isDefault: true,
    },
    {
        id: 'default-2',
        name: '品牌合作',
        content: '您好{nickname}，我们是做品牌推广的，想和您聊聊合作的事情~',
        variables: ['nickname'],
        isDefault: true,
    },
    {
        id: 'default-3',
        name: '简洁版',
        content: '您好，想加您好友交流~',
        variables: [],
        isDefault: true,
    },
];

const STORAGE_KEY = 'wechat_scripts';

export function getWeChatScripts(): WeChatScript[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const scripts = JSON.parse(stored) as WeChatScript[];
            const customScripts = scripts.filter(s => !s.isDefault);
            return [...DEFAULT_SCRIPTS, ...customScripts];
        }
    } catch (e) {
        console.error('Failed to load wechat scripts:', e);
    }
    return DEFAULT_SCRIPTS;
}

export function saveWeChatScript(script: Omit<WeChatScript, 'id' | 'createdAt' | 'updatedAt'>): WeChatScript {
    const scripts = getWeChatScripts().filter(s => !s.isDefault);

    const newScript: WeChatScript = {
        ...script,
        id: `custom-${Date.now()}`,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    scripts.push(newScript);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));

    return newScript;
}

export function deleteWeChatScript(scriptId: string): boolean {
    const scripts = getWeChatScripts().filter(s => !s.isDefault);
    const filtered = scripts.filter(s => s.id !== scriptId);

    if (filtered.length === scripts.length) {
        return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

export function replaceScriptVariables(
    content: string,
    variables: Record<string, string>
): string {
    let result = content;

    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
    }

    return result;
}

export function extractVariables(content: string): string[] {
    const matches = content.match(/\{(\w+)\}/g);
    if (!matches) return [];

    return [...new Set(matches.map(m => m.slice(1, -1)))];
}
