import api from './api';

// ============================================
// 话术模板 API
// ============================================

export interface WeChatScript {
    id: string;
    brandId: string;
    sampleId: string | null;
    name: string;
    content: string;
    isDefault: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    sample?: {
        id: string;
        name: string;
        sku: string;
    };
    creator?: {
        id: string;
        name: string;
    };
}

export interface CreateScriptParams {
    name: string;
    content: string;
    sampleId?: string | null;
    isDefault?: boolean;
}

export interface UpdateScriptParams {
    name?: string;
    content?: string;
    sampleId?: string | null;
    isDefault?: boolean;
}

// 获取话术列表
export const getWeChatScripts = async (params?: { sampleId?: string; onlyMine?: boolean }) => {
    const response = await api.get('/wechat-scripts', { params });
    return response.data;
};

// 获取单个话术
export const getWeChatScript = async (id: string) => {
    const response = await api.get(`/wechat-scripts/${id}`);
    return response.data;
};

// 创建话术
export const createWeChatScript = async (data: CreateScriptParams) => {
    const response = await api.post('/wechat-scripts', data);
    return response.data;
};

// 更新话术
export const updateWeChatScript = async (id: string, data: UpdateScriptParams) => {
    const response = await api.put(`/wechat-scripts/${id}`, data);
    return response.data;
};

// 删除话术
export const deleteWeChatScript = async (id: string) => {
    const response = await api.delete(`/wechat-scripts/${id}`);
    return response.data;
};

// 设置为默认话�?
export const setDefaultWeChatScript = async (id: string) => {
    const response = await api.post(`/wechat-scripts/${id}/set-default`);
    return response.data;
};

// ============================================
// 微信添加日志 API
// ============================================

export type WeChatAddStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'FAILED';

export interface WeChatAddLog {
    id: string;
    brandId: string;
    influencerId: string | null;
    staffId: string;
    scriptId: string | null;
    targetWechatId: string;
    targetNickname: string;
    targetPlatform: string | null;
    noteSet: string | null;
    status: WeChatAddStatus;
    errorMessage: string | null;
    retryCount: number;
    isRetryable: boolean;
    nextRetryAt: string | null;
    createdAt: string;
    acceptedAt: string | null;
    updatedAt: string;
    influencer?: {
        id: string;
        nickname: string;
        platform: string;
        wechat: string | null;
    };
    staff?: {
        id: string;
        name: string;
    };
    script?: {
        id: string;
        name: string;
    };
}

export interface CreateLogParams {
    targetWechatId: string;
    targetNickname: string;
    targetPlatform?: string;
    influencerId?: string | null;
    scriptId?: string | null;
    noteSet?: string;
}

export interface WeChatLogsResponse {
    list: WeChatAddLog[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export interface WeChatLogsStats {
    total: number;
    pending: number;
    accepted: number;
    failed: number;
    retryable: number;
    successRate: string;
}

// 获取添加日志列表
export const getWeChatLogs = async (params?: {
    status?: WeChatAddStatus;
    staffId?: string;
    influencerId?: string;
    page?: number;
    pageSize?: number;
}): Promise<{ success: boolean; data: WeChatLogsResponse }> => {
    const response = await api.get('/wechat-logs', { params });
    return response.data;
};

// 获取达人的微信添加状�?
export const getInfluencerWeChatStatus = async (influencerId: string) => {
    const response = await api.get(`/wechat-logs/influencer/${influencerId}`);
    return response.data;
};

// 创建添加日志
export const createWeChatLog = async (data: CreateLogParams) => {
    const response = await api.post('/wechat-logs', data);
    return response.data;
};

// 更新添加状�?
export const updateWeChatLogStatus = async (id: string, data: { status: WeChatAddStatus; errorMessage?: string }) => {
    const response = await api.put(`/wechat-logs/${id}/status`, data);
    return response.data;
};

// 重试添加
export const retryWeChatLog = async (id: string) => {
    const response = await api.post(`/wechat-logs/${id}/retry`);
    return response.data;
};

// 获取统计数据
export const getWeChatLogsStats = async (): Promise<{ success: boolean; data: WeChatLogsStats }> => {
    const response = await api.get('/wechat-logs/stats');
    return response.data;
};

// ============================================
// 话术变量替换工具函数
// ============================================

export interface ScriptVariables {
    达人昵称?: string;
    产品�?: string;
    品牌�?: string;
    当前日期?: string;
    微信�?: string;
}

/**
 * 替换话术中的变量
 * 支持的变�? {达人昵称}, {产品名}, {品牌名}, {当前日期}, {微信号}
 */
export const replaceScriptVariables = (content: string, variables: ScriptVariables): string => {
    let result = content;

    if (variables.达人昵称) {
        result = result.replace(/\{达人昵称\}/g, variables.达人昵称);
    }
    if (variables.产品�? {
        result = result.replace(/\{产品名\}/g, variables.产品�?;
    }
    if (variables.品牌�? {
        result = result.replace(/\{品牌名\}/g, variables.品牌�?;
    }
    if (variables.当前日期) {
        result = result.replace(/\{当前日期\}/g, variables.当前日期);
    } else {
        // 默认使用当前日期
        result = result.replace(/\{当前日期\}/g, new Date().toLocaleDateString('zh-CN'));
    }
    if (variables.微信�? {
        result = result.replace(/\{微信号\}/g, variables.微信�?;
    }

    return result;
};

/**
 * 获取话术中使用的变量列表
 */
export const getScriptVariables = (content: string): string[] => {
    const regex = /\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (!variables.includes(match[1])) {
            variables.push(match[1]);
        }
    }

    return variables;
};
