import prisma from '../lib/prisma';

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
export async function getTrendData(
  factoryId: string,
  period: 'week' | 'month' | 'quarter',
  dataType: 'gmv' | 'cost' | 'roi'
): Promise<TrendData> {
  const now = new Date();
  
  // 计算日期范围
  const { currentStart, currentEnd, previousStart, previousEnd, days } = calculateDateRanges(now, period);
  
  // 获取当前周期数据
  const currentData = await fetchPeriodData(factoryId, currentStart, currentEnd, days, dataType);
  
  // 获取上一周期数据
  const previousData = await fetchPeriodData(factoryId, previousStart, previousEnd, days, dataType);
  
  // 计算环比变化
  const currentTotal = currentData.reduce((sum, d) => sum + d.value, 0);
  const previousTotal = previousData.reduce((sum, d) => sum + d.value, 0);
  
  const change = currentTotal - previousTotal;
  const percentage = previousTotal === 0 ? (currentTotal > 0 ? 100 : 0) : (change / previousTotal) * 100;
  
  return {
    current: currentData,
    previous: previousData,
    comparison: {
      change,
      percentage,
    },
  };
}

/**
 * 计算日期范围
 */
function calculateDateRanges(now: Date, period: 'week' | 'month' | 'quarter') {
  let days: number;
  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;
  
  if (period === 'week') {
    days = 7;
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 6);
    
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
  } else if (period === 'month') {
    days = 30;
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 29);
    
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 29);
  } else {
    // quarter
    days = 90;
    currentEnd = new Date(now);
    currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 89);
    
    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 89);
  }
  
  // 设置时间为当天的开始和结束
  currentStart.setHours(0, 0, 0, 0);
  currentEnd.setHours(23, 59, 59, 999);
  previousStart.setHours(0, 0, 0, 0);
  previousEnd.setHours(23, 59, 59, 999);
  
  return { currentStart, currentEnd, previousStart, previousEnd, days };
}

/**
 * 获取指定周期的数据
 */
async function fetchPeriodData(
  factoryId: string,
  startDate: Date,
  endDate: Date,
  days: number,
  dataType: 'gmv' | 'cost' | 'roi'
): Promise<TrendDataPoint[]> {
  // 获取该周期内的所有合作结果
  const results = await prisma.collaborationResult.findMany({
    where: {
      collaboration: { factoryId },
      publishedAt: { gte: startDate, lte: endDate },
    },
    select: {
      publishedAt: true,
      salesGmv: true,
      totalCollaborationCost: true,
      roi: true,
    },
  });
  
  // 按日期分组
  const dataMap = new Map<string, { gmv: number; cost: number; count: number }>();
  
  // 初始化所有日期
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = formatDate(date);
    dataMap.set(dateKey, { gmv: 0, cost: 0, count: 0 });
  }
  
  // 填充实际数据
  for (const result of results) {
    const dateKey = formatDate(result.publishedAt);
    const data = dataMap.get(dateKey);
    if (data) {
      data.gmv += result.salesGmv;
      data.cost += result.totalCollaborationCost;
      data.count += 1;
    }
  }
  
  // 转换为趋势数据点
  const trendData: TrendDataPoint[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = formatDate(date);
    const data = dataMap.get(dateKey)!;
    
    let value: number;
    if (dataType === 'gmv') {
      value = data.gmv / 100; // 转换为元
    } else if (dataType === 'cost') {
      value = data.cost / 100; // 转换为元
    } else {
      // roi - 计算平均ROI
      value = data.count > 0 && data.cost > 0 ? data.gmv / data.cost : 0;
    }
    
    trendData.push({
      date: dateKey,
      value,
      label: formatLabel(date, days),
    });
  }
  
  return trendData;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化标签
 */
function formatLabel(date: Date, totalDays: number): string {
  if (totalDays <= 7) {
    // 7天显示：周一、周二...
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  } else if (totalDays <= 30) {
    // 30天显示：MM/DD
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  } else {
    // 90天显示：MM/DD
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }
}
