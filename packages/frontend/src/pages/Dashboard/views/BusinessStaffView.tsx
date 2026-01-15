import React from 'react';
import { Typography, Row, Col, Statistic, Progress, Badge, List, Button, Table, Tag, Timeline, Empty, Segmented, Spin, Space } from 'antd';
import {
    UserOutlined,
    CheckCircleOutlined,
    RiseOutlined,
    ShoppingOutlined,
    SyncOutlined,
    TrophyOutlined,
    WarningOutlined,
    MessageOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    CrownOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Card, CardContent } from '../../../components/ui/Card';
import { BentoGrid, BentoCard } from '../../../components/ui/Bento';
import { useTheme } from '../../../theme/ThemeProvider';
import { useAuthStore } from '../../../stores/authStore';
import TodayTodoList from '../../../components/dashboard/TodayTodoList';
import QuickActions from '../../../components/dashboard/QuickActions';
import WorkStats from '../../../components/dashboard/WorkStats';
import InfluencerModal from '../../Influencers/InfluencerModal';
import CreateCollaborationModal from '../../Pipeline/CreateCollaborationModal';
import { formatMoney, STAGE_LABELS, type BusinessStaffDashboard, type TodayTodosResponse } from '../../../services/report.service';
import { STAGE_COLORS } from '../../../services/collaboration.service';
import type { PipelineStage } from '@ics/shared';
import type { Influencer } from '../../../services/influencer.service';

const { Text } = Typography;

dayjs.extend(relativeTime);

interface BusinessStaffViewProps {
    loading: boolean;
    staffDashboard: BusinessStaffDashboard | null;
    period: 'week' | 'month';
    setPeriod: (value: 'week' | 'month') => void;
    statusConfig: any;
    todayTodos: TodayTodosResponse | null;
    todayTodosLoading: boolean;
    handleCompleteTodo: (todoId: string) => Promise<void>;
    handleSnoozeTodo: (todoId: string, until: Date) => Promise<void>;
    handleAddInfluencer: () => void;
    handleCreateCollaboration: () => void;
    handleDispatchSample: () => void;
    handleQuickFollowUp: () => void;
    influencerModalVisible: boolean;
    handleInfluencerModalClose: (refresh?: boolean) => void;
    allCategories: string[];
    allTags: string[];
    collaborationModalVisible: boolean;
    influencers: Influencer[];
    handleCollaborationModalClose: (refresh?: boolean) => void;
    reloadDashboard: () => void;
    renderChange: (change: number) => React.ReactNode;
}

const BusinessStaffView: React.FC<BusinessStaffViewProps> = ({
    loading,
    staffDashboard,
    period,
    setPeriod,
    statusConfig,
    todayTodos,
    todayTodosLoading,
    handleCompleteTodo,
    handleSnoozeTodo,
    handleAddInfluencer,
    handleCreateCollaboration,
    handleDispatchSample,
    handleQuickFollowUp,
    influencerModalVisible,
    handleInfluencerModalClose,
    allCategories,
    allTags,
    collaborationModalVisible,
    influencers,
    handleCollaborationModalClose,
    reloadDashboard,
    renderChange
}) => {
    const { user } = useAuthStore();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const activityIcons = {
        stage_change: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        follow_up: <MessageOutlined style={{ color: '#1890ff' }} />,
        dispatch: <SendOutlined style={{ color: '#faad14' }} />,
        result: <TrophyOutlined style={{ color: '#eb2f96' }} />,
    } as any;
    // Note: SendOutlined is missing in imports if used above, or define locally. 
    // Based on reading: import { ... SendOutlined ... } from '@ant-design/icons';
    // Let's add SendOutlined to imports.

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
                    position: 'relative',
                    padding: '24px',
                    margin: '-24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                }}
            >
                <Spin size="large" />
                <Text style={{ fontSize: 16, color: theme.colors.neutral[600] }}>
                    加载看板数据中...
                </Text>
            </div>
        );
    }

    if (!staffDashboard) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
                    padding: '24px',
                }}
            >
                <Card variant="elevated">
                    <CardContent>
                        <Empty
                            description="无法加载看板数据，请刷新页面重试"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        >
                            <Button type="primary" onClick={reloadDashboard}>
                                重新加载
                            </Button>
                        </Empty>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="deep-space-wrapper" style={{ padding: '40px', margin: '-24px', position: 'relative' }}>
            {/* Contextual Glow */}
            <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-500/10 to-violet-500/10 blur-[80px] pointer-events-none z-0" />
            <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 blur-[100px] pointer-events-none z-0" />

            <div className="h-full flex flex-col gap-4 relative z-10">
                {/* 紧凑型顶部控制栏 */}
                <div className="flex flex-row justify-between items-center bg-black/20 backdrop-blur-md sticky top-0 z-10 py-2 px-1 rounded-xl border border-white/10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold tracking-tight text-white m-0 pl-2">
                            下午好, {user?.name}
                        </h1>
                        <span className="text-slate-400 text-sm border-l border-white/20 pl-3">
                            全屏指挥舱模式已就绪
                        </span>
                    </div>

                    <div className="flex items-center gap-4 pr-1">
                        {/* 工厂状态微型提示 */}
                        {statusConfig && (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                                style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
                                {statusConfig.icon}
                                <span>{statusConfig.title}</span>
                            </div>
                        )}

                        <Segmented
                            size="small"
                            options={[
                                { label: '本周', value: 'week' },
                                { label: '本月', value: 'month' },
                            ]}
                            value={period}
                            onChange={(value) => setPeriod(value as 'week' | 'month')}
                            className="bg-white/10 text-white font-medium"
                        />
                    </div>
                </div>


                <BentoGrid>
                    {/* 今日待办 & 快捷操作 - 左侧大卡片 */}
                    <BentoCard span={2} title="今日任务清单" subtitle="需要优先处理的跟进和事项" variant="deep">
                        <div className="space-y-6">
                            {todayTodos && (
                                <TodayTodoList
                                    todos={todayTodos.todos.map(todo => ({
                                        ...todo,
                                        dueTime: todo.dueTime ? new Date(todo.dueTime) : undefined,
                                        snoozedUntil: todo.snoozedUntil ? new Date(todo.snoozedUntil) : undefined,
                                    }))}
                                    goals={todayTodos.goals}
                                    onComplete={handleCompleteTodo}
                                    onSnooze={handleSnoozeTodo}
                                    loading={todayTodosLoading}
                                />
                            )}
                            <div className="pt-6 mt-6 border-t border-neutral-100">
                                <p className="text-xs font-bold text-neutral-400 mb-4 uppercase tracking-widest">快捷办公</p>
                                <QuickActions
                                    onAddInfluencer={handleAddInfluencer}
                                    onCreateCollaboration={handleCreateCollaboration}
                                    onDispatchSample={handleDispatchSample}
                                    onQuickFollowUp={handleQuickFollowUp}
                                />
                            </div>
                        </div>
                    </BentoCard>

                    {/* 关键指标 - 右侧四个小卡片 */}
                    <BentoCard span={1} title="建联概览" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={staffDashboard.metrics.currentPeriod.contactedCount}
                                prefix={<UserOutlined className="text-indigo-300 mr-2" />}
                                suffix={<span className="text-sm text-slate-400 font-normal ml-1">个达人</span>}
                                valueStyle={{ fontSize: 36, fontWeight: 700, color: '#f8fafc' }}
                            />
                            <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-white/5 rounded-xl w-fit border border-white/10">
                                {renderChange(staffDashboard.metrics.periodComparison.contactedChange)}
                                <span className="text-xs text-slate-400">环比上期</span>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard span={1} title="成交转化" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={staffDashboard.metrics.currentPeriod.closedCount}
                                prefix={<CheckCircleOutlined className="text-emerald-400 mr-2" />}
                                suffix={<span className="text-sm text-slate-400 font-normal ml-1">单成交</span>}
                                valueStyle={{ fontSize: 36, fontWeight: 700, color: '#6378ff' }}
                            />
                            <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-white/5 rounded-xl w-fit border border-white/10">
                                {renderChange(staffDashboard.metrics.periodComparison.closedChange)}
                                <span className="text-xs text-slate-400">环比上期</span>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard span={1} title="ROI 效率" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={staffDashboard.metrics.currentPeriod.averageRoi}
                                prefix={<RiseOutlined className="text-amber-400 mr-2" />}
                                precision={2}
                                valueStyle={{
                                    fontSize: 36,
                                    fontWeight: 700,
                                    color: staffDashboard.metrics.currentPeriod.averageRoi >= 1 ? '#10B981' : '#EF4444'
                                }}
                            />
                            <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-white/5 rounded-xl w-fit border border-white/10">
                                {renderChange(staffDashboard.metrics.periodComparison.roiChange)}
                                <span className="text-xs text-slate-400">环比上期</span>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard span={1} title="GMV 内容贡献" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={Number(formatMoney(staffDashboard.metrics.currentPeriod.totalGmv))}
                                prefix={<span className="text-lg text-slate-300 mr-1 font-normal">¥</span>}
                                precision={2}
                                valueStyle={{ fontSize: 32, fontWeight: 700, color: '#f8fafc' }}
                            />
                            <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-white/5 rounded-xl w-fit border border-white/10">
                                {renderChange(staffDashboard.metrics.periodComparison.gmvChange)}
                                <span className="text-xs text-slate-400">环比上期</span>
                            </div>
                        </div>
                    </BentoCard>


                    {/* 寄样统计 - 这一组也可以放在同一个 Grid */}
                    <BentoCard span={1} title="寄样规模" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={staffDashboard.metrics.currentPeriod.dispatchCount}
                                prefix={<ShoppingOutlined className="text-indigo-300 mr-2" />}
                                suffix={<span className="text-sm text-slate-400 font-normal ml-1">次寄样</span>}
                                valueStyle={{ fontSize: 32, fontWeight: 700, color: '#f8fafc' }}
                            />
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <Text type="secondary" className="text-xs !text-slate-400">本周期寄样频率正常</Text>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard span={1} title="寄样投入" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={Number(formatMoney(staffDashboard.metrics.currentPeriod.dispatchCost))}
                                prefix={<span className="text-lg text-slate-300 mr-1 font-normal">¥</span>}
                                precision={2}
                                valueStyle={{ fontSize: 32, fontWeight: 700, color: '#f8fafc' }}
                            />
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <Text type="secondary" className="text-xs !text-slate-400">样品投入回报率良好</Text>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard span={1} title="流程进展" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <Statistic
                                value={staffDashboard.metrics.currentPeriod.progressedCount}
                                prefix={<SyncOutlined spin={false} className="text-brand-400 mr-2" />}
                                suffix={<span className="text-sm text-slate-400 font-normal ml-1">步推进</span>}
                                valueStyle={{ fontSize: 32, fontWeight: 700, color: '#f8fafc' }}
                            />
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <Text type="secondary" className="text-xs !text-slate-400">管道流转效率提升</Text>
                            </div>
                        </div>
                    </BentoCard>

                    <BentoCard span={1} title="团队竞争力" variant="deep">
                        <div className="flex flex-col justify-between h-full">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/20 text-brand-300 font-bold text-xl ring-1 ring-brand-500/30">
                                    {staffDashboard.ranking.myRank}
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        第 {staffDashboard.ranking.myRank} 名
                                    </div>
                                    <div className="text-xs text-slate-400">全公司共 {staffDashboard.ranking.totalStaff} 位成员</div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-1">
                                <TrophyOutlined className="text-amber-400" />
                                <Text type="secondary" className="text-xs font-medium !text-slate-400">继续加油！距离上一名仅一步之遥</Text>
                            </div>
                        </div>
                    </BentoCard>
                </BentoGrid>

                {/* 管道分布和待办事项 */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    {/* 我的管道分布 */}
                    <Col xs={24} lg={12}>
                        <Card
                            variant="deep"
                        >
                            <CardContent>
                                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: 16 }} className="!text-white">我的合作管道</Text>
                                    <Text type="secondary" className="!text-slate-400">
                                        共{' '}
                                        {Object.values(staffDashboard.myPipelineDistribution).reduce((a, b) => a + b, 0)}{' '}
                                        个合作
                                    </Text>
                                </div>
                                <Row gutter={[8, 16]}>
                                    {(
                                        Object.entries(staffDashboard.myPipelineDistribution) as [PipelineStage, number][]
                                    ).map(([stage, count]) => {
                                        const total = Object.values(staffDashboard.myPipelineDistribution).reduce(
                                            (a, b) => a + b,
                                            0
                                        );
                                        return (
                                            <Col xs={12} sm={8} md={6} key={stage}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <Progress
                                                        type="circle"
                                                        percent={total > 0 ? (count / total) * 100 : 0}
                                                        format={() => count}
                                                        strokeColor={STAGE_COLORS[stage]}
                                                        size={60}
                                                        strokeWidth={8}
                                                    />
                                                    <div style={{ marginTop: 6, fontSize: 11 }}>
                                                        <Badge color={STAGE_COLORS[stage]} text={STAGE_LABELS[stage]} />
                                                    </div>
                                                </div>
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </CardContent>
                        </Card>
                    </Col>

                    {/* 待办事项 */}
                    <Col xs={24} lg={12}>
                        <Card variant="deep">
                            <CardContent>
                                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }} className="!text-white">待办事项</Text>
                                <List
                                    dataSource={[
                                        {
                                            icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
                                            title: '超期合作',
                                            count: staffDashboard.pendingItems.overdueCollaborations,
                                            path: '/pipeline',
                                            color: '#ff4d4f',
                                        },
                                        {
                                            icon: <MessageOutlined style={{ color: '#faad14' }} />,
                                            title: '需要跟进',
                                            count: staffDashboard.pendingItems.needFollowUp,
                                            path: '/pipeline',
                                            color: '#faad14',
                                        },
                                        {
                                            icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
                                            title: '待签收样品',
                                            count: staffDashboard.pendingItems.pendingReceipts,
                                            path: '/samples',
                                            color: '#1890ff',
                                        },
                                        {
                                            icon: <FileTextOutlined style={{ color: '#722ed1' }} />,
                                            title: '待录入结果',
                                            count: staffDashboard.pendingItems.pendingResults,
                                            path: '/results',
                                            color: '#722ed1',
                                        },
                                    ]}
                                    renderItem={(item) => (
                                        <List.Item
                                            actions={[
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    onClick={() => navigate(item.path)}
                                                    disabled={item.count === 0}
                                                >
                                                    查看
                                                </Button>,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={item.icon}
                                                title={<span className="text-slate-200">{item.title}</span>}
                                                description={
                                                    <Badge
                                                        count={item.count}
                                                        showZero
                                                        style={{ backgroundColor: item.count > 0 ? item.color : '#4b5563', boxShadow: 'none' }}
                                                    />
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </Col>
                </Row>

                {/* 样品使用统计和最近动态 */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    {/* 样品使用统计 */}
                    <Col xs={24} lg={12}>
                        <Card variant="deep">
                            <CardContent>
                                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong style={{ fontSize: 16 }} className="!text-white">样品使用统计</Text>
                                    <Button type="link" onClick={() => navigate('/samples')} className="!text-indigo-300 hover:!text-indigo-200">
                                        查看详情
                                    </Button>
                                </div>
                                {staffDashboard.sampleUsage.length > 0 ? (
                                    <Table
                                        dataSource={staffDashboard.sampleUsage.slice(0, 5)}
                                        rowKey="sampleId"
                                        pagination={false}
                                        size="small"
                                        className="deep-table"
                                        columns={[
                                            {
                                                title: '样品名称',
                                                dataIndex: 'sampleName',
                                                key: 'sampleName',
                                                render: (text: string, record: any) => (
                                                    <div>
                                                        <Text strong className="!text-slate-200">{text}</Text>
                                                        <br />
                                                        <Text type="secondary" style={{ fontSize: 12 }} className="!text-slate-400">
                                                            {record.sku}
                                                        </Text>
                                                    </div>
                                                ),
                                            },
                                            {
                                                title: '寄样次数',
                                                dataIndex: 'dispatchCount',
                                                key: 'dispatchCount',
                                                align: 'center',
                                                width: 80,
                                                render: (text) => <span className="text-slate-300">{text}</span>
                                            },
                                            {
                                                title: '上车率',
                                                dataIndex: 'onboardRate',
                                                key: 'onboardRate',
                                                align: 'center',
                                                width: 80,
                                                render: (rate: number) => (
                                                    <Tag color={rate >= 0.5 ? 'success' : rate >= 0.3 ? 'warning' : 'default'} className="!border-none">
                                                        {(rate * 100).toFixed(0)}%
                                                    </Tag>
                                                ),
                                            },
                                        ]}
                                    />
                                ) : (
                                    <Empty description={<span className="text-slate-400">暂无寄样记录</span>} />
                                )}
                            </CardContent>
                        </Card>
                    </Col>

                    {/* 最近动态 */}
                    <Col xs={24} lg={12}>
                        <Card variant="deep">
                            <CardContent>
                                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }} className="!text-white">最近动态</Text>
                                {staffDashboard.recentActivities.length > 0 ? (
                                    <Timeline
                                        className="deep-timeline"
                                        items={staffDashboard.recentActivities.map((activity) => ({
                                            dot: activityIcons[activity.type],
                                            children: (
                                                <div>
                                                    <Text strong className="!text-slate-200">{activity.influencerName}</Text>
                                                    <br />
                                                    <Text style={{ fontSize: 12 }} className="!text-slate-300">{activity.content}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: 12 }} className="!text-slate-500">
                                                        {dayjs(activity.createdAt).fromNow()}
                                                    </Text>
                                                </div>
                                            ),
                                        }))}
                                    />
                                ) : (
                                    <Empty description={<span className="text-slate-400">暂无动态</span>} />
                                )}
                            </CardContent>
                        </Card>
                    </Col>
                </Row>

                {/* 排名信息 */}
                {staffDashboard.ranking.topPerformer && (
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col xs={24}>
                            <Card variant="deep">
                                <CardContent>
                                    <Row gutter={16} align="middle">
                                        <Col xs={24} sm={12}>
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary" className="!text-slate-400">我的业绩</Text>
                                                <Space size="large">
                                                    <Statistic
                                                        title={<span className="text-slate-400">成交数量</span>}
                                                        value={staffDashboard.ranking.myClosedCount}
                                                        suffix={<span className="text-slate-400">单</span>}
                                                        valueStyle={{ color: '#f8fafc' }}
                                                    />
                                                    <Statistic
                                                        title={<span className="text-slate-400">总GMV</span>}
                                                        value={Number(formatMoney(staffDashboard.ranking.myGmv))}
                                                        suffix={<span className="text-slate-400">元</span>}
                                                        precision={2}
                                                        valueStyle={{ color: '#f8fafc' }}
                                                    />
                                                </Space>
                                            </Space>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary" className="!text-slate-400">
                                                    <CrownOutlined style={{ color: '#faad14' }} /> 第一名
                                                </Text>
                                                <Space size="large">
                                                    <div>
                                                        <Text strong className="!text-white">{staffDashboard.ranking.topPerformer.name}</Text>
                                                        <br />
                                                        <Text type="secondary" className="!text-slate-400">
                                                            {staffDashboard.ranking.topPerformer.closedCount} 单
                                                        </Text>
                                                    </div>
                                                    <Statistic
                                                        value={Number(formatMoney(staffDashboard.ranking.topPerformer.gmv))}
                                                        suffix={<span className="text-slate-400">元</span>}
                                                        precision={2}
                                                        valueStyle={{ color: '#52c41a' }}
                                                    />
                                                </Space>
                                            </Space>
                                        </Col>
                                    </Row>
                                </CardContent>
                            </Card>
                        </Col>
                    </Row>
                )}

                {/* 工作统计 */}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                    <Col xs={24}>
                        <WorkStats period={period} showTrend={true} />
                    </Col>
                </Row>

                {/* 快捷操作模态框 */}
                <InfluencerModal
                    visible={influencerModalVisible}
                    influencer={null}
                    onClose={handleInfluencerModalClose}
                    allCategories={allCategories}
                    allTags={allTags}
                />

                <CreateCollaborationModal
                    visible={collaborationModalVisible}
                    influencers={influencers}
                    onClose={handleCollaborationModalClose}
                />
            </div>
        </div >
    );
};

export default BusinessStaffView;
