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
exports.parseFile = parseFile;
exports.previewInfluencerImport = previewInfluencerImport;
exports.executeInfluencerImport = executeInfluencerImport;
exports.previewSampleImport = previewSampleImport;
exports.executeSampleImport = executeSampleImport;
exports.suggestInfluencerMapping = suggestInfluencerMapping;
exports.suggestSampleMapping = suggestSampleMapping;
exports.previewImport = previewImport;
exports.executeImport = executeImport;
exports.suggestMapping = suggestMapping;
const XLSX = __importStar(require("xlsx"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const influencerService = __importStar(require("./influencer.service"));
// Platform mapping for Chinese to enum
const PLATFORM_MAP = {
    '抖音': 'DOUYIN',
    'douyin': 'DOUYIN',
    'DOUYIN': 'DOUYIN',
    '快手': 'KUAISHOU',
    'kuaishou': 'KUAISHOU',
    'KUAISHOU': 'KUAISHOU',
    '小红书': 'XIAOHONGSHU',
    'xiaohongshu': 'XIAOHONGSHU',
    'XIAOHONGSHU': 'XIAOHONGSHU',
    '微博': 'WEIBO',
    'weibo': 'WEIBO',
    'WEIBO': 'WEIBO',
    '其他': 'OTHER',
    'other': 'OTHER',
    'OTHER': 'OTHER',
};
// ==================== 通用函数 ====================
/**
 * Parse Excel/CSV file buffer and return raw data
 */
function parseFile(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw (0, errorHandler_1.createBadRequestError)('文件中没有找到工作表');
    }
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (jsonData.length < 2) {
        throw (0, errorHandler_1.createBadRequestError)('文件中没有数据行');
    }
    const headers = jsonData[0].map((h) => String(h || '').trim());
    const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ''));
    return { headers, rows };
}
/**
 * Get value from row by header name
 */
function getValue(row, headers, field) {
    if (!field)
        return undefined;
    const index = headers.indexOf(field);
    if (index === -1)
        return undefined;
    const value = row[index];
    return value !== null && value !== undefined ? String(value).trim() : undefined;
}
/**
 * Parse number from string (supports both integer and decimal)
 */
function parseNumber(value) {
    if (!value)
        return null;
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? null : num;
}
/**
 * Parse money value (元 to 分)
 */
function parseMoney(value) {
    const num = parseNumber(value);
    if (num === null)
        return null;
    return Math.round(num * 100);
}
// ==================== 达人导入 ====================
/**
 * Validate and transform a single influencer row
 */
function validateInfluencerRow(row, headers, mapping) {
    const errors = [];
    // Required fields
    const nickname = getValue(row, headers, mapping.nickname);
    const platformRaw = getValue(row, headers, mapping.platform);
    const platformId = getValue(row, headers, mapping.platformId);
    if (!nickname) {
        errors.push('昵称不能为空');
    }
    if (!platformRaw) {
        errors.push('平台不能为空');
    }
    if (!platformId) {
        errors.push('平台账号ID不能为空');
    }
    // Validate platform
    let platform;
    if (platformRaw) {
        platform = PLATFORM_MAP[platformRaw];
        if (!platform) {
            errors.push(`无效的平台类型: ${platformRaw}`);
        }
    }
    // Optional fields
    const phone = getValue(row, headers, mapping.phone);
    const categoriesRaw = getValue(row, headers, mapping.categories);
    const tagsRaw = getValue(row, headers, mapping.tags);
    const notes = getValue(row, headers, mapping.notes);
    // Parse categories and tags (comma or semicolon separated)
    const categories = categoriesRaw
        ? categoriesRaw.split(/[,;，；]/).map((c) => c.trim()).filter(Boolean)
        : undefined;
    const tags = tagsRaw
        ? tagsRaw.split(/[,;，；]/).map((t) => t.trim()).filter(Boolean)
        : undefined;
    if (errors.length > 0 || !nickname || !platform || !platformId) {
        return { data: null, errors };
    }
    return {
        data: {
            nickname,
            platform,
            platformId,
            phone: phone || undefined,
            categories,
            tags,
            notes: notes || undefined,
        },
        errors,
    };
}
/**
 * Preview influencer import data with validation and duplicate checking
 */
async function previewInfluencerImport(buffer, mapping, brandId) {
    const { headers, rows } = parseFile(buffer);
    // Validate mapping
    if (!headers.includes(mapping.nickname)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到昵称列: ${mapping.nickname}`);
    }
    if (!headers.includes(mapping.platform)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到平台列: ${mapping.platform}`);
    }
    if (!headers.includes(mapping.platformId)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到平台账号ID列: ${mapping.platformId}`);
    }
    const preview = [];
    let validRows = 0;
    let errorRows = 0;
    let duplicateRows = 0;
    // Process each row
    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2; // Excel row number (1-indexed, plus header)
        const { data, errors } = validateInfluencerRow(rows[i], headers, mapping);
        if (!data) {
            errorRows++;
            preview.push({
                rowNumber,
                data: null,
                errors,
                isDuplicate: false,
            });
            continue;
        }
        // Check for duplicates
        const duplicateCheck = await influencerService.checkDuplicate(brandId, data.phone, data.platform, data.platformId);
        if (duplicateCheck.isDuplicate) {
            duplicateRows++;
            preview.push({
                rowNumber,
                data,
                errors,
                isDuplicate: true,
                duplicateInfo: {
                    type: duplicateCheck.duplicateType,
                    existingId: duplicateCheck.existingInfluencer.id,
                    existingName: duplicateCheck.existingInfluencer.nickname,
                },
            });
        }
        else {
            validRows++;
            preview.push({
                rowNumber,
                data,
                errors,
                isDuplicate: false,
            });
        }
    }
    return {
        totalRows: rows.length,
        validRows,
        errorRows,
        duplicateRows,
        preview,
        headers,
    };
}
/**
 * Execute influencer batch import
 */
async function executeInfluencerImport(buffer, mapping, brandId, skipDuplicates = true) {
    const { headers, rows } = parseFile(buffer);
    // Check quota
    const factory = await prisma_1.default.brand.findUnique({
        where: { id: brandId },
        select: { influencerLimit: true },
    });
    if (!factory) {
        throw (0, errorHandler_1.createBadRequestError)('工厂不存在');
    }
    const currentCount = await prisma_1.default.influencer.count({ where: { brandId } });
    const availableSlots = factory.influencerLimit - currentCount;
    if (availableSlots <= 0) {
        throw (0, errorHandler_1.createQuotaExceededError)('已达到达人数量上限，请升级套餐');
    }
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    let skippedCount = 0;
    const errors = [];
    // Process each row
    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        // Check if we've reached the quota
        if (successCount >= availableSlots) {
            skippedCount = rows.length - i;
            errors.push({
                rowNumber,
                error: `已达到达人数量上限，剩余 ${skippedCount} 行未导入`,
            });
            break;
        }
        const { data, errors: rowErrors } = validateInfluencerRow(rows[i], headers, mapping);
        if (!data || rowErrors.length > 0) {
            errorCount++;
            errors.push({
                rowNumber,
                error: rowErrors.join('; '),
            });
            continue;
        }
        // Check for duplicates
        const duplicateCheck = await influencerService.checkDuplicate(brandId, data.phone, data.platform, data.platformId);
        if (duplicateCheck.isDuplicate) {
            duplicateCount++;
            if (skipDuplicates) {
                continue;
            }
            else {
                errors.push({
                    rowNumber,
                    error: `重复数据: ${duplicateCheck.duplicateType === 'phone' ? '手机号' : '平台账号ID'}已存在`,
                });
                continue;
            }
        }
        // Create influencer
        try {
            await prisma_1.default.influencer.create({
                data: {
                    brandId,
                    nickname: data.nickname,
                    platform: data.platform,
                    platformId: data.platformId,
                    phone: data.phone || null,
                    categories: data.categories || [],
                    tags: data.tags || [],
                    notes: data.notes || null,
                },
            });
            successCount++;
        }
        catch (err) {
            errorCount++;
            errors.push({
                rowNumber,
                error: err instanceof Error ? err.message : '创建失败',
            });
        }
    }
    return {
        totalRows: rows.length,
        successCount,
        errorCount,
        duplicateCount,
        skippedCount,
        errors,
    };
}
// ==================== 样品导入 ====================
/**
 * Validate and transform a single sample row
 */
function validateSampleRow(row, headers, mapping) {
    const errors = [];
    // Required fields
    const sku = getValue(row, headers, mapping.sku);
    const name = getValue(row, headers, mapping.name);
    const unitCostRaw = getValue(row, headers, mapping.unitCost);
    const retailPriceRaw = getValue(row, headers, mapping.retailPrice);
    if (!sku) {
        errors.push('SKU不能为空');
    }
    if (!name) {
        errors.push('名称不能为空');
    }
    const unitCost = parseMoney(unitCostRaw);
    if (unitCost === null) {
        errors.push('单件成本格式错误');
    }
    const retailPrice = parseMoney(retailPriceRaw);
    if (retailPrice === null) {
        errors.push('建议零售价格式错误');
    }
    // Optional fields
    const canResendRaw = getValue(row, headers, mapping.canResend);
    const notes = getValue(row, headers, mapping.notes);
    // Parse canResend
    let canResend = true;
    if (canResendRaw) {
        const lower = canResendRaw.toLowerCase();
        canResend = !['否', 'no', 'false', '0', 'n'].includes(lower);
    }
    if (errors.length > 0 || !sku || !name || unitCost === null || retailPrice === null) {
        return { data: null, errors };
    }
    return {
        data: {
            sku,
            name,
            unitCost,
            retailPrice,
            canResend,
            notes: notes || undefined,
        },
        errors,
    };
}
/**
 * Preview sample import data with validation and duplicate checking
 */
async function previewSampleImport(buffer, mapping, brandId) {
    const { headers, rows } = parseFile(buffer);
    // Validate mapping
    if (!headers.includes(mapping.sku)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到SKU列: ${mapping.sku}`);
    }
    if (!headers.includes(mapping.name)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到名称列: ${mapping.name}`);
    }
    if (!headers.includes(mapping.unitCost)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到单件成本列: ${mapping.unitCost}`);
    }
    if (!headers.includes(mapping.retailPrice)) {
        throw (0, errorHandler_1.createBadRequestError)(`找不到建议零售价列: ${mapping.retailPrice}`);
    }
    const preview = [];
    let validRows = 0;
    let errorRows = 0;
    let duplicateRows = 0;
    // Get existing SKUs
    const existingSamples = await prisma_1.default.sample.findMany({
        where: { brandId },
        select: { id: true, sku: true, name: true },
    });
    const existingSkuMap = new Map(existingSamples.map(s => [s.sku, s]));
    // Process each row
    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        const { data, errors } = validateSampleRow(rows[i], headers, mapping);
        if (!data) {
            errorRows++;
            preview.push({
                rowNumber,
                data: null,
                errors,
                isDuplicate: false,
            });
            continue;
        }
        // Check for duplicates
        const existing = existingSkuMap.get(data.sku);
        if (existing) {
            duplicateRows++;
            preview.push({
                rowNumber,
                data,
                errors,
                isDuplicate: true,
                duplicateInfo: {
                    type: 'sku',
                    existingId: existing.id,
                    existingName: existing.name,
                },
            });
        }
        else {
            validRows++;
            preview.push({
                rowNumber,
                data,
                errors,
                isDuplicate: false,
            });
        }
    }
    return {
        totalRows: rows.length,
        validRows,
        errorRows,
        duplicateRows,
        preview,
        headers,
    };
}
/**
 * Execute sample batch import
 */
async function executeSampleImport(buffer, mapping, brandId, skipDuplicates = true) {
    const { headers, rows } = parseFile(buffer);
    // Get existing SKUs
    const existingSamples = await prisma_1.default.sample.findMany({
        where: { brandId },
        select: { sku: true },
    });
    const existingSkus = new Set(existingSamples.map(s => s.sku));
    let successCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;
    const skippedCount = 0;
    const errors = [];
    // Process each row
    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        const { data, errors: rowErrors } = validateSampleRow(rows[i], headers, mapping);
        if (!data || rowErrors.length > 0) {
            errorCount++;
            errors.push({
                rowNumber,
                error: rowErrors.join('; '),
            });
            continue;
        }
        // Check for duplicates
        if (existingSkus.has(data.sku)) {
            duplicateCount++;
            if (skipDuplicates) {
                continue;
            }
            else {
                errors.push({
                    rowNumber,
                    error: `重复数据: SKU ${data.sku} 已存在`,
                });
                continue;
            }
        }
        // Create sample
        try {
            await prisma_1.default.sample.create({
                data: {
                    brandId,
                    sku: data.sku,
                    name: data.name,
                    unitCost: data.unitCost,
                    retailPrice: data.retailPrice,
                    canResend: data.canResend,
                    notes: data.notes || null,
                },
            });
            successCount++;
            existingSkus.add(data.sku); // Add to set to prevent duplicates within same import
        }
        catch (err) {
            errorCount++;
            errors.push({
                rowNumber,
                error: err instanceof Error ? err.message : '创建失败',
            });
        }
    }
    return {
        totalRows: rows.length,
        successCount,
        errorCount,
        duplicateCount,
        skippedCount,
        errors,
    };
}
// ==================== 建议映射 ====================
/**
 * Get suggested field mapping for influencers based on headers
 */
function suggestInfluencerMapping(headers) {
    const mapping = {};
    const nicknamePatterns = ['昵称', '达人昵称', '名称', 'nickname', 'name'];
    const platformPatterns = ['平台', 'platform'];
    const platformIdPatterns = ['账号ID', '平台ID', '账号', 'platformId', 'id'];
    const phonePatterns = ['手机', '电话', '联系方式', 'phone', 'mobile'];
    const categoryPatterns = ['类目', '分类', 'category', 'categories'];
    const tagPatterns = ['标签', 'tag', 'tags'];
    const notesPatterns = ['备注', '说明', 'notes', 'remark'];
    const findMatch = (patterns) => {
        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            for (const pattern of patterns) {
                if (lowerHeader.includes(pattern.toLowerCase())) {
                    return header;
                }
            }
        }
        return undefined;
    };
    mapping.nickname = findMatch(nicknamePatterns);
    mapping.platform = findMatch(platformPatterns);
    mapping.platformId = findMatch(platformIdPatterns);
    mapping.phone = findMatch(phonePatterns);
    mapping.categories = findMatch(categoryPatterns);
    mapping.tags = findMatch(tagPatterns);
    mapping.notes = findMatch(notesPatterns);
    return mapping;
}
/**
 * Get suggested field mapping for samples based on headers
 */
function suggestSampleMapping(headers) {
    const mapping = {};
    const skuPatterns = ['sku', 'SKU', '货号', '编号'];
    const namePatterns = ['名称', '样品名称', '产品名称', 'name'];
    const unitCostPatterns = ['成本', '单件成本', '单价', 'cost', 'unitCost'];
    const retailPricePatterns = ['零售价', '售价', '建议零售价', 'price', 'retailPrice'];
    const canResendPatterns = ['可复寄', '复寄', 'canResend'];
    const notesPatterns = ['备注', '说明', 'notes', 'remark'];
    const findMatch = (patterns) => {
        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            for (const pattern of patterns) {
                if (lowerHeader.includes(pattern.toLowerCase())) {
                    return header;
                }
            }
        }
        return undefined;
    };
    mapping.sku = findMatch(skuPatterns);
    mapping.name = findMatch(namePatterns);
    mapping.unitCost = findMatch(unitCostPatterns);
    mapping.retailPrice = findMatch(retailPricePatterns);
    mapping.canResend = findMatch(canResendPatterns);
    mapping.notes = findMatch(notesPatterns);
    return mapping;
}
async function previewImport(buffer, mapping, brandId) {
    return previewInfluencerImport(buffer, mapping, brandId);
}
async function executeImport(buffer, mapping, brandId, skipDuplicates = true) {
    return executeInfluencerImport(buffer, mapping, brandId, skipDuplicates);
}
function suggestMapping(headers) {
    return suggestInfluencerMapping(headers);
}
//# sourceMappingURL=import.service.js.map