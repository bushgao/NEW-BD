import type { PipelineStage } from '@prisma/client';
export interface DateRange {
    startDate: Date;
    endDate: Date;
}
export interface StaffPerformanceItem {
    staffId: string;
    staffName: string;
    staffEmail: string | null;
    contactedCount: number;
    progressedCount: number;
    closedCount: number;
    totalGmv: number;
    totalCost: number;
    averageRoi: number;
    dispatchCount: number;
    dispatchCost: number;
}
export interface StaffPerformanceReport {
    items: StaffPerformanceItem[];
    summary: {
        totalStaff: number;
        totalContactedCount: number;
        totalProgressedCount: number;
        totalClosedCount: number;
        totalGmv: number;
        totalCost: number;
        overallRoi: number;
        totalDispatchCount: number;
        totalDispatchCost: number;
    };
}
export interface FactoryDashboard {
    metrics: {
        totalSampleCost: number;
        totalCollaborationCost: number;
        totalGmv: number;
        overallRoi: number;
        periodComparison: {
            sampleCostChange: number;
            gmvChange: number;
            roiChange: number;
        };
    };
    pipelineDistribution: Record<PipelineStage, number>;
    pendingItems: {
        overdueCollaborations: number;
        pendingReceipts: number;
        pendingResults: number;
    };
    staffRanking: {
        staffId: string;
        staffName: string;
        closedDeals: number;
        totalGmv: number;
    }[];
    staffProgress: {
        staffId: string;
        staffName: string;
        todayFollowUps: number;
        weekFollowUps: number;
        activeCollaborations: number;
        stuckCollaborations: number;
        avgDaysToClose: number;
    }[];
    teamEfficiency: {
        avgLeadToContact: number;
        avgContactToQuoted: number;
        avgQuotedToSampled: number;
        avgSampledToScheduled: number;
        avgScheduledToPublished: number;
        overallAvgDays: number;
    };
    recentTeamActivities: {
        id: string;
        type: 'new_collaboration' | 'stage_progress' | 'closed_deal' | 'dispatch';
        staffName: string;
        influencerName: string;
        content: string;
        createdAt: Date;
    }[];
    riskAlerts: {
        longStuckCollaborations: number;
        unbalancedWorkload: boolean;
        highCostAlert: boolean;
    };
}
export interface BusinessStaffDashboard {
    metrics: {
        currentPeriod: {
            contactedCount: number;
            progressedCount: number;
            closedCount: number;
            totalGmv: number;
            totalCost: number;
            averageRoi: number;
            dispatchCount: number;
            dispatchCost: number;
        };
        periodComparison: {
            contactedChange: number;
            closedChange: number;
            gmvChange: number;
            roiChange: number;
        };
    };
    myPipelineDistribution: Record<PipelineStage, number>;
    pendingItems: {
        overdueCollaborations: number;
        needFollowUp: number;
        pendingReceipts: number;
        pendingResults: number;
    };
    sampleUsage: {
        sampleId: string;
        sampleName: string;
        sku: string;
        dispatchCount: number;
        totalQuantity: number;
        totalCost: number;
        receivedCount: number;
        onboardCount: number;
        onboardRate: number;
    }[];
    recentActivities: {
        id: string;
        type: 'stage_change' | 'follow_up' | 'dispatch' | 'result';
        collaborationId: string;
        influencerName: string;
        content: string;
        createdAt: Date;
    }[];
    ranking: {
        myRank: number;
        totalStaff: number;
        myClosedCount: number;
        myGmv: number;
        topPerformer: {
            name: string;
            closedCount: number;
            gmv: number;
        } | null;
    };
}
export type ReportType = 'staff-performance' | 'roi' | 'sample-cost' | 'collaboration';
export interface ExportParams {
    brandId: string;
    dateRange?: DateRange;
    groupBy?: string;
}
/**
 * 获取商务绩效报表
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
export declare function getStaffPerformance(brandId: string, dateRange?: DateRange): Promise<StaffPerformanceReport>;
/**
 * 获取工厂老板看板数据
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export declare function getFactoryDashboard(brandId: string, period?: 'week' | 'month'): Promise<FactoryDashboard>;
/**
 * 获取商务人员个人看板数据
 */
export declare function getBusinessStaffDashboard(brandId: string, staffId: string, period?: 'week' | 'month'): Promise<BusinessStaffDashboard>;
/**
 * 导出商务绩效报表为Excel
 */
export declare function exportStaffPerformanceReport(brandId: string, dateRange?: DateRange): Promise<Buffer>;
/**
 * 导出ROI报表为Excel
 */
export declare function exportRoiReport(brandId: string, groupBy: 'influencer' | 'sample' | 'staff' | 'month', dateRange?: DateRange): Promise<Buffer>;
/**
 * 导出合作记录为Excel
 */
export declare function exportCollaborationReport(brandId: string, dateRange?: DateRange): Promise<Buffer>;
export interface StaffROIData {
    staffId: string;
    staffName: string;
    totalGmv: number;
    totalCost: number;
    roi: number;
    collaborationCount: number;
}
export interface CostBreakdown {
    sampleCost: number;
    collaborationCost: number;
    otherCost: number;
}
export interface ScatterDataPoint {
    cost: number;
    revenue: number;
    roi: number;
    name: string;
}
export interface ROIAnalysisData {
    byStaff: StaffROIData[];
    costBreakdown: CostBreakdown;
    costVsRevenue: ScatterDataPoint[];
}
/**
 * 获取 ROI 分析数据
 * 用于工厂老板 Dashboard 的 ROI 分析图表
 */
export declare function getRoiAnalysis(brandId: string): Promise<ROIAnalysisData>;
export interface PipelineStageData {
    stage: string;
    stageName: string;
    count: number;
    conversionRate: number;
    dropRate: number;
}
export interface PipelineFunnelData {
    stages: PipelineStageData[];
    totalCount: number;
    overallConversionRate: number;
}
/**
 * 获取管道漏斗数据
 * 用于工厂老板 Dashboard 的管道漏斗图
 */
export declare function getPipelineFunnel(brandId: string): Promise<PipelineFunnelData>;
export interface StaffComparisonMetrics {
    leads: number;
    deals: number;
    gmv: number;
    roi: number;
    efficiency: number;
}
export interface StaffComparisonData {
    staffId: string;
    staffName: string;
    metrics: StaffComparisonMetrics;
    normalizedMetrics: StaffComparisonMetrics;
}
export interface StaffComparisonAnalysis {
    staffData: StaffComparisonData[];
    insights: {
        strengths: Record<string, string[]>;
        weaknesses: Record<string, string[]>;
    };
}
/**
 * 获取商务对比分析数据
 * 用于工厂老板 Dashboard 的商务对比分析
 */
export declare function getStaffComparison(brandId: string, staffIds: string[]): Promise<StaffComparisonAnalysis>;
export interface QualityScore {
    overall: number;
    followUpFrequency: number;
    conversionRate: number;
    roi: number;
    efficiency: number;
    trend: ScoreTrend[];
    suggestions: string[];
}
export interface ScoreTrend {
    date: string;
    overall: number;
    followUpFrequency: number;
    conversionRate: number;
    roi: number;
    efficiency: number;
}
/**
 * 计算商务工作质量评分
 * 综合评分算法：
 * - 跟进频率 (25%): 基于跟进记录的频率和及时性
 * - 转化率 (30%): 从线索到成交的转化率
 * - ROI (25%): 合作的投资回报率
 * - 效率 (20%): 合作推进速度和完成时间
 */
export declare function getStaffQualityScore(staffId: string, brandId: string): Promise<QualityScore>;
interface CalendarEvent {
    date: string;
    type: 'deadline' | 'scheduled' | 'followup';
    title: string;
    collaborationId: string;
    influencerName: string;
    stage: string;
}
interface WorkloadData {
    date: string;
    count: number;
    level: 'low' | 'medium' | 'high';
}
interface CalendarData {
    events: CalendarEvent[];
    workload: WorkloadData[];
    stats: {
        totalEvents: number;
        deadlines: number;
        scheduled: number;
        followups: number;
        avgDailyWorkload: number;
    };
}
/**
 * 获取商务工作日历数据
 * 显示指定月份的工作安排，包括：
 * - 截止日期
 * - 排期日期
 * - 跟进提醒
 * - 工作负载热力图
 */
export declare function getStaffCalendar(staffId: string, brandId: string, month: string): Promise<CalendarData>;
export interface DailySummaryData {
    overdueCollaborations: number;
    pendingSamples: number;
    pendingResults: number;
    alerts: Alert[];
    highlights: string[];
}
export interface Alert {
    id: string;
    type: 'overdue' | 'pending_sample' | 'pending_result' | 'low_conversion' | 'high_cost';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    createdAt: Date;
}
/**
 * 获取每日摘要数据
 * 用于快捷操作面板
 * Requirements: FR-1.3
 */
export declare function getDailySummary(brandId: string): Promise<DailySummaryData>;
export interface SmartAlert {
    id: string;
    type: 'summary' | 'warning' | 'reminder';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, any>;
}
export interface SmartAlertsResponse {
    alerts: SmartAlert[];
    unreadCount: number;
}
/**
 * 获取智能提醒列表
 * 生成每日工作摘要、异常预警和重要节点提醒
 * Requirements: FR-1.3
 */
export declare function getSmartAlerts(brandId: string, _userId?: string): Promise<SmartAlertsResponse>;
/**
 * 标记提醒为已读
 * Requirements: FR-1.3
 */
export declare function markAlertAsRead(alertId: string, userId: string): Promise<void>;
/**
 * 标记所有提醒为已读
 * Requirements: FR-1.3
 */
export declare function markAllAlertsAsRead(userId: string, brandId: string): Promise<void>;
export interface TodoItem {
    id: string;
    type: 'followup' | 'deadline' | 'dispatch' | 'result';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    dueTime?: Date;
    relatedId: string;
    completed?: boolean;
    snoozedUntil?: Date;
}
export interface TodayGoal {
    type: 'followup' | 'dispatch' | 'deal';
    target: number;
    current: number;
    label: string;
}
export interface TodayTodosResponse {
    todos: TodoItem[];
    goals: TodayGoal[];
    summary: {
        total: number;
        completed: number;
        overdue: number;
    };
}
/**
 * 获取今日待办事项
 * Requirements: FR-2.4
 */
export declare function getTodayTodos(brandId: string, staffId: string): Promise<TodayTodosResponse>;
export interface WorkStats {
    leadsAdded: number;
    collaborationsCreated: number;
    samplesDispatched: number;
    followUpsCompleted: number;
    dealsCompleted: number;
    gmv: number;
    goalProgress: number;
    rankChange: number;
}
export interface WorkStatsTrend {
    date: string;
    leadsAdded: number;
    collaborationsCreated: number;
    dealsCompleted: number;
    gmv: number;
}
export interface WorkStatsResponse {
    stats: WorkStats;
    trend: WorkStatsTrend[];
}
/**
 * 获取商务人员工作统计
 * Requirements: FR-2.4
 */
export declare function getWorkStats(brandId: string, staffId: string, period?: 'today' | 'week' | 'month'): Promise<WorkStatsResponse>;
export {};
//# sourceMappingURL=report.service.d.ts.map