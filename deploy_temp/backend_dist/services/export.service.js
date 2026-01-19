"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportInfluencers = exportInfluencers;
exports.exportSamples = exportSamples;
exports.exportDispatches = exportDispatches;
exports.exportCollaborations = exportCollaborations;
exports.exportResults = exportResults;
exports.exportData = exportData;
exports.exportUserDataBackup = exportUserDataBackup;
const XLSX = __importStar(require("xlsx"));
const prisma_1 = __importDefault(require("../lib/prisma"));
// 平台名称映射
const PLATFORM_NAMES = {
    DOUYIN: '抖音',
    KUAISHOU: '快手',
    XIAOHONGSHU: '小红书',
    WEIBO: '微博',
    OTHER: '其他',
};
// 阶段名称映射
const STAGE_NAMES = {
    LEAD: '线索达人',
    CONTACTED: '已联系',
    QUOTED: '已报价',
    SAMPLED: '已寄样',
    SCHEDULED: '已排期',
    PUBLISHED: '已发布',
    REVIEWED: '已复盘',
};
// 签收状态映射
const RECEIVED_STATUS_NAMES = {
    PENDING: '待签收',
    RECEIVED: '已签收',
    LOST: '已丢失',
};
// 上车状态映射
const ONBOARD_STATUS_NAMES = {
    UNKNOWN: '未确认',
    ONBOARD: '已上车',
    NOT_ONBOARD: '未上车',
};
// 回本状态映射
const PROFIT_STATUS_NAMES = {
    LOSS: '未回本',
    BREAK_EVEN: '刚回本',
    PROFIT: '已回本',
    HIGH_PROFIT: '爆赚',
};
// ==================== 辅助函数 ====================
/**
 * 格式化金额（分转元）
 */
function formatMoney(cents) {
    return (cents / 100).toFixed(2);
}
/**
 * 格式化日期
 */
function formatDate(date) {
    if (!date)
        return '';
    return new Date(date).toLocaleDateString('zh-CN');
}
/**
 * 格式化日期时间
 */
function formatDateTime(date) {
    if (!date)
        return '';
    return new Date(date).toLocaleString('zh-CN');
}
/**
 * 创建Excel工作簿并返回Buffer
 */
function createExcelBuffer(data, sheetName, colWidths) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    if (colWidths) {
        worksheet['!cols'] = colWidths.map(w => ({ wch: w }));
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
// ==================== 导出函数 ====================
/**
 * 导出达人列表
 * Requirements: 9.4
 */
async function exportInfluencers(options) {
    const { brandId, filters } = options;
    const where = { brandId };
    if (filters?.platform)
        where.platform = filters.platform;
    if (filters?.keyword) {
        where.OR = [
            { nickname: { contains: filters.keyword, mode: 'insensitive' } },
            { platformId: { contains: filters.keyword, mode: 'insensitive' } },
        ];
    }
    const influencers = await prisma_1.default.influencer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
    const data = influencers.map(inf => ({
        '昵称': inf.nickname,
        '平台': PLATFORM_NAMES[inf.platform],
        '平台账号ID': inf.platformId,
        '手机号': inf.phone || '',
        '类目': inf.categories.join(', '),
        '标签': inf.tags.join(', '),
        '备注': inf.notes || '',
        '创建时间': formatDateTime(inf.createdAt),
    }));
    return createExcelBuffer(data, '达人列表', [15, 10, 20, 15, 20, 20, 30, 20]);
}
/**
 * 导出样品列表
 * Requirements: 9.4
 */
async function exportSamples(options) {
    const { brandId } = options;
    const samples = await prisma_1.default.sample.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
    });
    const data = samples.map(s => ({
        'SKU': s.sku,
        '名称': s.name,
        '单件成本（元）': formatMoney(s.unitCost),
        '建议零售价（元）': formatMoney(s.retailPrice),
        '可复寄': s.canResend ? '是' : '否',
        '备注': s.notes || '',
        '创建时间': formatDateTime(s.createdAt),
    }));
    return createExcelBuffer(data, '样品列表', [15, 20, 15, 15, 10, 30, 20]);
}
/**
 * 导出寄样记录
 * Requirements: 9.4
 */
async function exportDispatches(options) {
    const { brandId, dateRange } = options;
    const where = {
        sample: { brandId },
    };
    if (dateRange) {
        where.dispatchedAt = {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
        };
    }
    const dispatches = await prisma_1.default.sampleDispatch.findMany({
        where,
        include: {
            sample: true,
            collaboration: {
                include: {
                    influencer: true,
                },
            },
            businessStaff: {
                select: { name: true },
            },
        },
        orderBy: { dispatchedAt: 'desc' },
    });
    const data = dispatches.map(d => ({
        '样品SKU': d.sample.sku,
        '样品名称': d.sample.name,
        '达人昵称': d.collaboration.influencer.nickname,
        '平台': PLATFORM_NAMES[d.collaboration.influencer.platform],
        '商务': d.businessStaff.name,
        '数量': d.quantity,
        '单件成本（元）': formatMoney(d.unitCostSnapshot),
        '样品成本（元）': formatMoney(d.totalSampleCost),
        '快递费（元）': formatMoney(d.shippingCost),
        '总成本（元）': formatMoney(d.totalCost),
        '快递单号': d.trackingNumber || '',
        '签收状态': RECEIVED_STATUS_NAMES[d.receivedStatus],
        '签收时间': formatDateTime(d.receivedAt),
        '上车状态': ONBOARD_STATUS_NAMES[d.onboardStatus],
        '寄样时间': formatDateTime(d.dispatchedAt),
    }));
    return createExcelBuffer(data, '寄样记录', [
        12, 20, 15, 10, 12, 8, 15, 15, 12, 12, 20, 10, 18, 10, 18
    ]);
}
/**
 * 导出合作记录
 * Requirements: 9.4
 */
async function exportCollaborations(options) {
    const { brandId, dateRange } = options;
    const where = { brandId };
    if (dateRange) {
        where.createdAt = {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
        };
    }
    const collaborations = await prisma_1.default.collaboration.findMany({
        where,
        include: {
            influencer: true,
            businessStaff: { select: { name: true } },
            dispatches: true,
            result: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    const data = collaborations.map(c => ({
        '达人昵称': c.influencer.nickname,
        '平台': PLATFORM_NAMES[c.influencer.platform],
        '平台账号ID': c.influencer.platformId,
        '商务': c.businessStaff.name,
        '阶段': STAGE_NAMES[c.stage],
        '是否超期': c.isOverdue ? '是' : '否',
        '截止时间': formatDate(c.deadline),
        '寄样次数': c.dispatches.length,
        '寄样成本（元）': formatMoney(c.dispatches.reduce((sum, d) => sum + d.totalCost, 0)),
        '销售GMV（元）': c.result ? formatMoney(c.result.salesGmv) : '',
        '合作成本（元）': c.result ? formatMoney(c.result.totalCollaborationCost) : '',
        'ROI': c.result ? c.result.roi.toFixed(4) : '',
        '回本状态': c.result ? PROFIT_STATUS_NAMES[c.result.profitStatus] : '',
        '创建时间': formatDateTime(c.createdAt),
    }));
    return createExcelBuffer(data, '合作记录', [
        15, 10, 20, 12, 10, 10, 12, 10, 15, 15, 15, 10, 10, 18
    ]);
}
/**
 * 导出合作结果
 * Requirements: 9.4
 */
async function exportResults(options) {
    const { brandId, dateRange } = options;
    const where = {
        collaboration: { brandId },
    };
    if (dateRange) {
        where.publishedAt = {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
        };
    }
    const results = await prisma_1.default.collaborationResult.findMany({
        where,
        include: {
            collaboration: {
                include: {
                    influencer: true,
                    businessStaff: { select: { name: true } },
                },
            },
        },
        orderBy: { publishedAt: 'desc' },
    });
    const data = results.map(r => ({
        '达人昵称': r.collaboration.influencer.nickname,
        '平台': PLATFORM_NAMES[r.collaboration.influencer.platform],
        '商务': r.collaboration.businessStaff.name,
        '内容形式': r.contentType === 'SHORT_VIDEO' ? '短视频' : '直播',
        '发布时间': formatDateTime(r.publishedAt),
        '销售件数': r.salesQuantity,
        '销售GMV（元）': formatMoney(r.salesGmv),
        '佣金比例（%）': r.commissionRate ? `${r.commissionRate}%` : '',
        '坑位费（元）': formatMoney(r.pitFee),
        '实付佣金（元）': formatMoney(r.actualCommission),
        '样品成本（元）': formatMoney(r.totalSampleCost),
        '合作总成本（元）': formatMoney(r.totalCollaborationCost),
        'ROI': r.roi.toFixed(4),
        '回本状态': PROFIT_STATUS_NAMES[r.profitStatus],
        '是否复投': r.willRepeat ? '是' : '否',
        '备注': r.notes || '',
    }));
    return createExcelBuffer(data, '合作结果', [
        15, 10, 12, 10, 18, 10, 15, 12, 12, 15, 15, 15, 10, 10, 10, 30
    ]);
}
/**
 * 统一导出接口
 */
async function exportData(type, options) {
    const timestamp = new Date().toISOString().slice(0, 10);
    let buffer;
    let filename;
    switch (type) {
        case 'influencers':
            buffer = await exportInfluencers(options);
            filename = `达人列表_${timestamp}.xlsx`;
            break;
        case 'samples':
            buffer = await exportSamples(options);
            filename = `样品列表_${timestamp}.xlsx`;
            break;
        case 'dispatches':
            buffer = await exportDispatches(options);
            filename = `寄样记录_${timestamp}.xlsx`;
            break;
        case 'collaborations':
            buffer = await exportCollaborations(options);
            filename = `合作记录_${timestamp}.xlsx`;
            break;
        case 'results':
            buffer = await exportResults(options);
            filename = `合作结果_${timestamp}.xlsx`;
            break;
        default:
            throw new Error(`不支持的导出类型: ${type}`);
    }
    return { buffer, filename };
}
/**
 * 导出用户在指定品牌下的所有业务数据（多 sheet Excel）
 * 用于加入品牌前的数据备份
 *
 * 独立商务拥有的数据：
 * - 样品列表（属于品牌）
 * - 达人列表（属于品牌，由用户创建）
 * - 达人分组（属于品牌）
 * - 合作记录（属于品牌，由用户负责）
 * - 合作结果（关联合作）
 * - 样品发放（由用户发放）
 * - 跟进记录（由用户添加）
 */
async function exportUserDataBackup(userId, brandId) {
    // 获取用户信息
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });
    // 1. 获取样品列表（品牌的所有样品，因为独立商务的品牌就是自己的）
    const samples = await prisma_1.default.sample.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
    });
    // 2. 获取达人数据
    const influencers = await prisma_1.default.influencer.findMany({
        where: { brandId },
        include: {
            group: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    // 3. 获取达人分组
    const groups = await prisma_1.default.influencerGroup.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
    });
    // 4. 获取合作记录
    const collaborations = await prisma_1.default.collaboration.findMany({
        where: { brandId },
        include: {
            influencer: true,
            sample: true,
            result: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    // 5. 获取合作结果
    const results = await prisma_1.default.collaborationResult.findMany({
        where: {
            collaboration: { brandId },
        },
        include: {
            collaboration: {
                include: {
                    influencer: true,
                },
            },
        },
        orderBy: { publishedAt: 'desc' },
    });
    // 6. 获取样品发放记录
    const dispatches = await prisma_1.default.sampleDispatch.findMany({
        where: {
            collaboration: { brandId },
        },
        include: {
            sample: true,
            collaboration: {
                include: {
                    influencer: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    // 7. 获取跟进记录
    const followUps = await prisma_1.default.followUpRecord.findMany({
        where: {
            collaboration: { brandId },
        },
        include: {
            collaboration: {
                include: {
                    influencer: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
    // 创建 Excel 工作簿
    const workbook = XLSX.utils.book_new();
    // Sheet 1: 数据汇总
    const summarySheetData = [
        ['数据备份汇总'],
        [''],
        ['导出用户', user?.name || ''],
        ['导出时间', formatDateTime(new Date())],
        [''],
        ['数据类型', '数量'],
        ['样品', samples.length],
        ['达人', influencers.length],
        ['达人分组', groups.length],
        ['合作记录', collaborations.length],
        ['合作结果', results.length],
        ['样品发放', dispatches.length],
        ['跟进记录', followUps.length],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(workbook, wsSummary, '数据汇总');
    // Sheet 2: 样品列表
    const sampleData = samples.map((s, index) => ({
        '序号': index + 1,
        'SKU': s.sku,
        '名称': s.name,
        '单件成本（元）': formatMoney(s.unitCost),
        '建议零售价（元）': formatMoney(s.retailPrice),
        '可复寄': s.canResend ? '是' : '否',
        '备注': s.notes || '',
        '创建时间': formatDateTime(s.createdAt),
    }));
    if (sampleData.length > 0) {
        const wsSamples = XLSX.utils.json_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(workbook, wsSamples, '样品列表');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无样品数据']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '样品列表');
    }
    // Sheet 3: 达人列表
    const influencerData = influencers.map((inf, index) => ({
        '序号': index + 1,
        '昵称': inf.nickname,
        '平台': PLATFORM_NAMES[inf.platform],
        '平台账号ID': inf.platformId,
        'UID': inf.uid || '',
        '主页链接': inf.homeUrl || '',
        '手机号': inf.phone || '',
        '微信号': inf.wechat || '',
        '收件地址': inf.shippingAddress || '',
        '粉丝数': inf.followers || '',
        '分组': inf.group?.name || '',
        '标签': inf.tags.join(', '),
        '备注': inf.notes || '',
        '创建时间': formatDateTime(inf.createdAt),
    }));
    if (influencerData.length > 0) {
        const wsInfluencers = XLSX.utils.json_to_sheet(influencerData);
        XLSX.utils.book_append_sheet(workbook, wsInfluencers, '达人列表');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无达人数据']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '达人列表');
    }
    // Sheet 4: 达人分组
    const groupData = groups.map((g, index) => ({
        '序号': index + 1,
        '分组名称': g.name,
        '颜色': g.color,
        '描述': g.description || '',
        '创建时间': formatDateTime(g.createdAt),
    }));
    if (groupData.length > 0) {
        const wsGroups = XLSX.utils.json_to_sheet(groupData);
        XLSX.utils.book_append_sheet(workbook, wsGroups, '达人分组');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无分组数据']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '达人分组');
    }
    // Sheet 5: 合作记录
    const collaborationData = collaborations.map((collab, index) => ({
        '序号': index + 1,
        '达人昵称': collab.influencer?.nickname || '',
        '平台': collab.influencer ? PLATFORM_NAMES[collab.influencer.platform] : '',
        '阶段': STAGE_NAMES[collab.stage],
        '样品': collab.sample?.name || '',
        '报价（元）': collab.quotedPrice ? formatMoney(collab.quotedPrice) : '',
        '是否超期': collab.isOverdue ? '是' : '否',
        '截止时间': formatDate(collab.deadline),
        '销售GMV（元）': collab.result ? formatMoney(collab.result.salesGmv) : '',
        'ROI': collab.result ? collab.result.roi.toFixed(2) : '',
        '回本状态': collab.result ? PROFIT_STATUS_NAMES[collab.result.profitStatus] : '',
        '创建时间': formatDateTime(collab.createdAt),
    }));
    if (collaborationData.length > 0) {
        const wsCollaborations = XLSX.utils.json_to_sheet(collaborationData);
        XLSX.utils.book_append_sheet(workbook, wsCollaborations, '合作记录');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无合作记录']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '合作记录');
    }
    // Sheet 6: 合作结果
    const resultData = results.map((r, index) => ({
        '序号': index + 1,
        '达人昵称': r.collaboration?.influencer?.nickname || '',
        '平台': r.collaboration?.influencer ? PLATFORM_NAMES[r.collaboration.influencer.platform] : '',
        '内容形式': r.contentType === 'SHORT_VIDEO' ? '短视频' : '直播',
        '发布时间': formatDateTime(r.publishedAt),
        '销售件数': r.salesQuantity,
        '销售GMV（元）': formatMoney(r.salesGmv),
        '佣金比例（%）': r.commissionRate ? `${r.commissionRate}%` : '',
        '坑位费（元）': formatMoney(r.pitFee),
        '实付佣金（元）': formatMoney(r.actualCommission),
        '样品成本（元）': formatMoney(r.totalSampleCost),
        '合作总成本（元）': formatMoney(r.totalCollaborationCost),
        'ROI': r.roi.toFixed(4),
        '回本状态': PROFIT_STATUS_NAMES[r.profitStatus],
        '是否复投': r.willRepeat ? '是' : '否',
        '备注': r.notes || '',
    }));
    if (resultData.length > 0) {
        const wsResults = XLSX.utils.json_to_sheet(resultData);
        XLSX.utils.book_append_sheet(workbook, wsResults, '合作结果');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无合作结果']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '合作结果');
    }
    // Sheet 7: 样品发放记录
    const dispatchData = dispatches.map((d, index) => ({
        '序号': index + 1,
        '样品SKU': d.sample?.sku || '',
        '样品名称': d.sample?.name || '',
        '达人昵称': d.collaboration?.influencer?.nickname || '',
        '数量': d.quantity,
        '样品成本（元）': formatMoney(d.totalSampleCost),
        '快递费（元）': formatMoney(d.shippingCost),
        '总成本（元）': formatMoney(d.totalCost),
        '快递单号': d.trackingNumber || '',
        '签收状态': RECEIVED_STATUS_NAMES[d.receivedStatus],
        '上车状态': ONBOARD_STATUS_NAMES[d.onboardStatus],
        '寄样时间': formatDateTime(d.dispatchedAt),
    }));
    if (dispatchData.length > 0) {
        const wsDispatches = XLSX.utils.json_to_sheet(dispatchData);
        XLSX.utils.book_append_sheet(workbook, wsDispatches, '样品发放');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无样品发放记录']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '样品发放');
    }
    // Sheet 8: 跟进记录
    const followUpData = followUps.map((record, index) => ({
        '序号': index + 1,
        '达人昵称': record.collaboration?.influencer?.nickname || '',
        '跟进内容': record.content,
        '跟进时间': formatDateTime(record.createdAt),
    }));
    if (followUpData.length > 0) {
        const wsFollowUps = XLSX.utils.json_to_sheet(followUpData);
        XLSX.utils.book_append_sheet(workbook, wsFollowUps, '跟进记录');
    }
    else {
        const wsEmpty = XLSX.utils.aoa_to_sheet([['暂无跟进记录']]);
        XLSX.utils.book_append_sheet(workbook, wsEmpty, '跟进记录');
    }
    // 生成 Excel 文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `数据备份_${user?.name || 'user'}_${timestamp}.xlsx`;
    return {
        buffer,
        filename,
        summary: {
            sampleCount: samples.length,
            influencerCount: influencers.length,
            groupCount: groups.length,
            collaborationCount: collaborations.length,
            resultCount: results.length,
            dispatchCount: dispatches.length,
            followUpCount: followUps.length,
        },
    };
}
//# sourceMappingURL=export.service.js.map