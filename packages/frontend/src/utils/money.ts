/**
 * 统一的金额格式化工具
 * 
 * 数据库存储：分（Int）- 避免浮点数精度问题
 * 显示格式：元，带两位小数和千分位分隔符
 */

/**
 * 将分转换为元并格式化显示
 * @param cents 金额（分）
 * @returns 格式化的金额字符串，如 "1,234.56"
 */
export function formatMoney(cents: number): string {
    const yuan = cents / 100;
    return yuan.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * 将分转换为元并格式化显示（带货币符号）
 * @param cents 金额（分）
 * @returns 格式化的金额字符串，如 "¥1,234.56"
 */
export function formatMoneyWithSymbol(cents: number): string {
    return `¥${formatMoney(cents)}`;
}

/**
 * 将元转换为分（用于存储）
 * @param yuan 金额（元）
 * @returns 金额（分）
 */
export function parseMoney(yuan: number): number {
    return Math.round(yuan * 100);
}

/**
 * 格式化百分比
 * @param rate 比率（0-1 之间的小数）
 * @returns 格式化的百分比字符串，如 "12.5%"
 */
export function formatPercent(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
}

/**
 * 格式化 ROI
 * @param roi ROI 值
 * @returns 格式化的 ROI 字符串，如 "2.50x"
 */
export function formatROI(roi: number): string {
    return `${roi.toFixed(2)}x`;
}
