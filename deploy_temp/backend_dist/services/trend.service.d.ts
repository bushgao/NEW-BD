export interface TrendDataPoint {
    date: string;
    value: number;
    label: string;
}
export interface TrendData {
    current: TrendDataPoint[];
    previous: TrendDataPoint[];
    comparison: {
        change: number;
        percentage: number;
    };
}
/**
 * 获取趋势数据
 */
export declare function getTrendData(brandId: string, period: 'week' | 'month' | 'quarter', dataType: 'gmv' | 'cost' | 'roi'): Promise<TrendData>;
//# sourceMappingURL=trend.service.d.ts.map