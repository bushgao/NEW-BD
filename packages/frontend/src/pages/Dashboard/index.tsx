import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Badge,
  Space,
  Segmented,
  Spin,
  message,
  Progress,
  List,
  Button,
  Tag,
  Timeline,
  Empty,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  ShoppingOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TrophyOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  SendOutlined,
  CrownOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import {
  getFactoryDashboard,
  getBusinessStaffDashboard,
  getTrendData,
  getRoiAnalysis,
  getPipelineFunnel,
  getStaffComparison,
  getDailySummary,
  getTodayTodos,
  formatMoney,
  formatChange,
  STAGE_LABELS,
  type FactoryDashboard,
  type BusinessStaffDashboard,
  type TrendData,
  type ROIAnalysisData,
  type PipelineFunnelData,
  type StaffComparisonAnalysis,
  type DailySummaryData,
  type TodayTodosResponse,
} from '../../services/report.service';
import { STAGE_COLORS } from '../../services/collaboration.service';
import type { PipelineStage } from '@ics/shared';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Card, CardContent } from '../../components/ui/Card';
import { BentoGrid, BentoCard } from '../../components/ui/Bento';
import { useTheme } from '../../theme/ThemeProvider';
import TrendChart from '../../components/charts/TrendChart';
import ROIAnalysisChart from '../../components/charts/ROIAnalysisChart';
import PipelineFunnelChart from '../../components/charts/PipelineFunnelChart';
import StaffComparisonChart from '../../components/charts/StaffComparisonChart';
import SmartNotifications from '../../components/dashboard/SmartNotifications';
import FollowUpReminder from '../../components/dashboard/FollowUpReminder';
import TodayTodoList from '../../components/dashboard/TodayTodoList';
import WorkStats from '../../components/dashboard/WorkStats';
import QuickActions from '../../components/dashboard/QuickActions';
import InfluencerModal from '../Influencers/InfluencerModal';
import CreateCollaborationModal from '../Pipeline/CreateCollaborationModal';
import type { Influencer } from '../../services/influencer.service';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { theme, mode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [factoryDashboard, setFactoryDashboard] = useState<FactoryDashboard | null>(null);
  const [staffDashboard, setStaffDashboard] = useState<BusinessStaffDashboard | null>(null);

  // 趋势图表状态
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [gmvTrend, setGmvTrend] = useState<TrendData | null>(null);
  const [costTrend, setCostTrend] = useState<TrendData | null>(null);
  const [roiTrend, setRoiTrend] = useState<TrendData | null>(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // ROI 分析图表状态
  const [roiAnalysis, setRoiAnalysis] = useState<ROIAnalysisData | null>(null);
  const [roiAnalysisLoading, setRoiAnalysisLoading] = useState(false);

  // 管道漏斗图状态
  const [pipelineFunnel, setPipelineFunnel] = useState<PipelineFunnelData | null>(null);
  const [pipelineFunnelLoading, setPipelineFunnelLoading] = useState(false);

  // 商务对比分析状态
  const [staffComparison, setStaffComparison] = useState<StaffComparisonAnalysis | null>(null);
  const [staffComparisonLoading, setStaffComparisonLoading] = useState(false);
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string }>>([]);

  // 每日摘要状态
  const [dailySummary, setDailySummary] = useState<DailySummaryData | null>(null);

  // 今日待办状态
  const [todayTodos, setTodayTodos] = useState<TodayTodosResponse | null>(null);
  const [todayTodosLoading, setTodayTodosLoading] = useState(false);

  // 快捷操作模态框状态
  const [influencerModalVisible, setInfluencerModalVisible] = useState(false);
  const [collaborationModalVisible, setCollaborationModalVisible] = useState(false);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const isBrandOwner = user?.role === 'BRAND';
  const isBusinessStaff = user?.role === 'BUSINESS';

  // 工厂状态横幅配置 (共享)
  const factoryStatus = user?.brand?.status;
  const factoryStatusConfig: Record<string, any> = {
    PENDING: {
      color: '#faad14',
      bgColor: '#fffbe6',
      borderColor: '#ffe58f',
      icon: <ClockCircleOutlined />,
      title: '平台审核中',
      message: '您的品牌正在平台审核中，审核通过后即可使用全部功能',
    },
    REJECTED: {
      color: '#ff4d4f',
      bgColor: '#fff2f0',
      borderColor: '#ffccc7',
      icon: <WarningOutlined />,
      title: '审核未通过',
      message: '您的品牌审核未通过，请联系平台管理员了解详情',
    },
    SUSPENDED: {
      color: '#ff4d4f',
      bgColor: '#fff2f0',
      borderColor: '#ffccc7',
      icon: <WarningOutlined />,
      title: '品牌已暂停',
      message: '您的品牌已被暂停使用，请联系平台管理员',
    },
  };

  const statusConfig = factoryStatus && factoryStatus !== 'APPROVED' ? factoryStatusConfig[factoryStatus] : null;

  const activityIcons = {
    stage_change: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    follow_up: <MessageOutlined style={{ color: '#1890ff' }} />,
    dispatch: <SendOutlined style={{ color: '#faad14' }} />,
    result: <TrophyOutlined style={{ color: '#eb2f96' }} />,
  };

  // 加载看板数据
  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (isBrandOwner) {
        const data = await getFactoryDashboard(period);
        setFactoryDashboard(data);
      } else if (isBusinessStaff) {
        const data = await getBusinessStaffDashboard(period);
        setStaffDashboard(data);
      }
    } catch (error) {
      message.error('加载看板数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载趋势数据（仅工厂老板）
  const loadTrendData = async () => {
    if (!isBrandOwner) return;

    setTrendLoading(true);
    try {
      const [gmv, cost, roi] = await Promise.all([
        getTrendData(trendPeriod, 'gmv'),
        getTrendData(trendPeriod, 'cost'),
        getTrendData(trendPeriod, 'roi'),
      ]);

      setGmvTrend(gmv);
      setCostTrend(cost);
      setRoiTrend(roi);
    } catch (error) {
      message.error('加载趋势数据失败');
      console.error(error);
    } finally {
      setTrendLoading(false);
    }
  };

  // 加载 ROI 分析数据（仅工厂老板）
  const loadRoiAnalysis = async () => {
    if (!isBrandOwner) return;

    setRoiAnalysisLoading(true);
    try {
      const data = await getRoiAnalysis();
      setRoiAnalysis(data);
    } catch (error) {
      message.error('加载 ROI 分析数据失败');
      console.error(error);
    } finally {
      setRoiAnalysisLoading(false);
    }
  };

  // 加载管道漏斗数据（仅工厂老板）
  const loadPipelineFunnel = async () => {
    if (!isBrandOwner) return;

    setPipelineFunnelLoading(true);
    try {
      const data = await getPipelineFunnel();
      setPipelineFunnel(data);
    } catch (error) {
      message.error('加载管道漏斗数据失败');
      console.error(error);
    } finally {
      setPipelineFunnelLoading(false);
    }
  };

  // 加载每日摘要数据（仅工厂老板）
  const loadDailySummary = async () => {
    if (!isBrandOwner) return;

    try {
      const data = await getDailySummary();
      setDailySummary(data);
    } catch (error) {
      message.error('加载每日摘要数据失败');
      console.error(error);
    }
  };

  // 加载今日待办数据（仅商务人员）
  const loadTodayTodos = async () => {
    if (!isBusinessStaff) return;

    setTodayTodosLoading(true);
    try {
      const data = await getTodayTodos();
      setTodayTodos(data);
    } catch (error) {
      message.error('加载今日待办数据失败');
      console.error(error);
    } finally {
      setTodayTodosLoading(false);
    }
  };

  // 加载商务列表（仅工厂老板）
  const loadStaffList = async () => {
    if (!isBrandOwner) return;

    try {
      // 从 factoryDashboard 的 staffRanking 中获取商务列表
      if (factoryDashboard && factoryDashboard.staffRanking) {
        const list = factoryDashboard.staffRanking.map(staff => ({
          id: staff.staffId,
          name: staff.staffName,
        }));
        setStaffList(list);
      }
    } catch (error) {
      console.error('加载商务列表失败:', error);
    }
  };

  // 加载商务对比数据（仅工厂老板）
  const loadStaffComparison = async (staffIds: string[]) => {
    if (!isBrandOwner || staffIds.length < 2) {
      setStaffComparison(null);
      return;
    }

    setStaffComparisonLoading(true);
    try {
      const data = await getStaffComparison(staffIds);
      setStaffComparison(data);
    } catch (error) {
      message.error('加载商务对比数据失败');
      console.error(error);
    } finally {
      setStaffComparisonLoading(false);
    }
  };

  // 处理漏斗图阶段点击
  const handleStageClick = (stage: string) => {
    // 跳转到合作管道页面，并筛选对应阶段
    navigate(`/app/pipeline?stage=${stage}`);
  };



  // 处理完成待办
  const handleCompleteTodo = async (todoId: string) => {
    try {
      // TODO: 实现完成待办的API调用
      // await api.put(`/reports/my-dashboard/todos/${todoId}/complete`);

      // 暂时只更新本地状态
      if (todayTodos) {
        setTodayTodos({
          ...todayTodos,
          todos: todayTodos.todos.map(todo =>
            todo.id === todoId ? { ...todo, completed: true } : todo
          ),
          summary: {
            ...todayTodos.summary,
            completed: todayTodos.summary.completed + 1,
          },
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // 处理暂停待办
  const handleSnoozeTodo = async (todoId: string, until: Date) => {
    try {
      // TODO: 实现暂停待办的API调用
      // await api.put(`/reports/my-dashboard/todos/${todoId}/snooze`, { until });

      // 暂时只更新本地状态
      if (todayTodos) {
        setTodayTodos({
          ...todayTodos,
          todos: todayTodos.todos.map(todo =>
            todo.id === todoId ? { ...todo, snoozedUntil: until.toISOString() } : todo
          ),
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // 加载达人列表（用于创建合作）
  const loadInfluencers = async () => {
    try {
      const response = await api.get('/influencers', {
        params: { page: 1, pageSize: 1000 },
      });
      if (response.data?.success && response.data?.data?.data) {
        setInfluencers(response.data.data.data);
      }
    } catch (error) {
      console.error('加载达人列表失败:', error);
    }
  };

  // 加载达人元数据（分类和标签）
  const loadInfluencerMetadata = async () => {
    try {
      const response = await api.get('/influencers/metadata');
      if (response.data?.success && response.data?.data) {
        setAllCategories(response.data.data.categories || []);
        setAllTags(response.data.data.tags || []);
      }
    } catch (error) {
      console.error('加载达人元数据失败:', error);
    }
  };

  // 快捷操作处理函数
  const handleAddInfluencer = async () => {
    // 先加载元数据
    await loadInfluencerMetadata();
    setInfluencerModalVisible(true);
  };

  const handleCreateCollaboration = async () => {
    // 先加载达人列表
    await loadInfluencers();
    setCollaborationModalVisible(true);
  };

  const handleDispatchSample = () => {
    // 跳转到合作管道页面，打开寄样功能
    navigate('/app/pipeline');
    message.info('请在合作管道中选择合作进行寄样');
  };

  const handleQuickFollowUp = () => {
    // 跳转到合作管道页面，打开快速跟进功能
    navigate('/app/pipeline');
    message.info('请在合作管道中选择合作进行跟进');
  };

  // 关闭达人模态框
  const handleInfluencerModalClose = (refresh?: boolean) => {
    setInfluencerModalVisible(false);
    if (refresh) {
      // 刷新看板数据
      loadDashboard();
    }
  };

  // 关闭合作模态框
  const handleCollaborationModalClose = (refresh?: boolean) => {
    setCollaborationModalVisible(false);
    if (refresh) {
      // 刷新看板数据
      loadDashboard();
    }
  };

  // 刷新用户信息（获取最新的工厂状态）
  const refreshUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.data?.user) {
        useAuthStore.getState().setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user info:', error);
    }
  };

  useEffect(() => {
    // 只有工厂老板和商务人员需要加载看板数据和刷新用户信息
    if (isBrandOwner || isBusinessStaff) {
      loadDashboard();
      refreshUserInfo(); // 刷新用户信息以获取最新的工厂状态
    }
  }, [period, isBrandOwner, isBusinessStaff]);

  // 加载趋势数据
  useEffect(() => {
    if (isBrandOwner) {
      loadTrendData();
    }
  }, [trendPeriod, isBrandOwner]);

  // 加载 ROI 分析数据
  useEffect(() => {
    if (isBrandOwner) {
      loadRoiAnalysis();
    }
  }, [isBrandOwner]);

  // 加载管道漏斗数据
  useEffect(() => {
    if (isBrandOwner) {
      loadPipelineFunnel();
      loadDailySummary();
    }
  }, [isBrandOwner]);

  // 加载今日待办数据（商务人员）
  useEffect(() => {
    if (isBusinessStaff) {
      loadTodayTodos();
    }
  }, [isBusinessStaff]);

  // 加载商务列表（当 factoryDashboard 加载完成后）
  useEffect(() => {
    if (isBrandOwner && factoryDashboard) {
      loadStaffList();
    }
  }, [isBrandOwner, factoryDashboard]);

  // 渲染变化指标
  const renderChange = (change: number) => {
    if (change === 0) return <Text type="secondary">持平</Text>;
    const isPositive = change > 0;
    return (
      <Text type={isPositive ? 'success' : 'danger'}>
        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {formatChange(change)}
      </Text>
    );
  };

  // 非工厂老板和商务人员显示简单欢迎页面（平台管理员）
  if (!isBrandOwner && !isBusinessStaff) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
          position: 'relative',
          padding: '24px',
          margin: '-24px',
        }}
      >
        {/* 背景装饰元素 */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '400px',
          height: '400px',
          background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.08), rgba(191, 90, 242, 0.08))',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Title level={4}>欢迎回来, {user?.name}</Title>
          <Card variant="elevated" style={{ marginTop: 24 }}>
            <CardContent>
              <Title level={5}>平台管理</Title>
              <p>作为平台管理员，您可以使用以下功能:</p>
              <List
                dataSource={[
                  {
                    icon: <TeamOutlined style={{ color: '#1890ff' }} />,
                    title: '工厂管理',
                    description: '审核和管理工厂账号',
                    path: '/app/admin',
                  },
                  {
                    icon: <UserOutlined style={{ color: '#52c41a' }} />,
                    title: '套餐配置',
                    description: '配置不同套餐的功能和配额',
                    path: '/app/admin',
                  },
                ]}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => navigate(item.path)}>
                        前往
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={item.icon}
                      title={item.title}
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 商务人员仪表盘
  // 如果正在加载或数据为空，显示加载状态
  if (isBusinessStaff && loading) {
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

  // 如果不是加载状态但数据为空，显示错误提示
  if (isBusinessStaff && !staffDashboard) {
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
              <Button type="primary" onClick={() => loadDashboard()}>
                重新加载
              </Button>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 商务人员仪表盘
  if (isBusinessStaff && staffDashboard) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f0f2f5',
          padding: '24px',
        }}
      >

        <div className="h-full flex flex-col gap-4">
          {/* 紧凑型顶部控制栏 */}
          <div className="flex flex-row justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10 py-2 px-1 rounded-lg border border-neutral-100/50 shadow-sm">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 m-0 pl-2">
                下午好, {user?.name}
              </h1>
              <span className="text-neutral-400 text-sm border-l border-neutral-200 pl-3">
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
                className="bg-neutral-100/80 font-medium"
              />
            </div>
          </div>


          <BentoGrid>
            {/* 今日待办 & 快捷操作 - 左侧大卡片 */}
            <BentoCard span={2} title="今日任务清单" subtitle="需要优先处理的跟进和事项">
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
            <BentoCard span={1} title="建联概览">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={staffDashboard.metrics.currentPeriod.contactedCount}
                  prefix={<UserOutlined className="text-neutral-300 mr-2" />}
                  suffix={<span className="text-sm text-neutral-400 font-normal ml-1">个达人</span>}
                  valueStyle={{ fontSize: 36, fontWeight: 700, color: '#111827' }}
                />
                <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-neutral-50 rounded-md w-fit border border-neutral-100">
                  {renderChange(staffDashboard.metrics.periodComparison.contactedChange)}
                  <span className="text-xs text-neutral-400">环比上期</span>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={1} title="成交转化">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={staffDashboard.metrics.currentPeriod.closedCount}
                  prefix={<CheckCircleOutlined className="text-brand-500 mr-2" />}
                  suffix={<span className="text-sm text-neutral-400 font-normal ml-1">单成交</span>}
                  valueStyle={{ fontSize: 36, fontWeight: 700, color: '#6378ff' }}
                />
                <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-neutral-50 rounded-md w-fit border border-neutral-100">
                  {renderChange(staffDashboard.metrics.periodComparison.closedChange)}
                  <span className="text-xs text-neutral-400">环比上期</span>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={1} title="ROI 效率">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={staffDashboard.metrics.currentPeriod.averageRoi}
                  prefix={<RiseOutlined className="text-neutral-300 mr-2" />}
                  precision={2}
                  valueStyle={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: staffDashboard.metrics.currentPeriod.averageRoi >= 1 ? '#10B981' : '#EF4444'
                  }}
                />
                <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-neutral-50 rounded-md w-fit border border-neutral-100">
                  {renderChange(staffDashboard.metrics.periodComparison.roiChange)}
                  <span className="text-xs text-neutral-400">环比上期</span>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={1} title="GMV 内容贡献">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={Number(formatMoney(staffDashboard.metrics.currentPeriod.totalGmv))}
                  prefix={<span className="text-lg text-neutral-300 mr-1 font-normal">¥</span>}
                  precision={2}
                  valueStyle={{ fontSize: 32, fontWeight: 700, color: '#111827' }}
                />
                <div className="mt-8 flex items-center gap-2 py-2 px-3 bg-neutral-50 rounded-md w-fit border border-neutral-100">
                  {renderChange(staffDashboard.metrics.periodComparison.gmvChange)}
                  <span className="text-xs text-neutral-400">环比上期</span>
                </div>
              </div>
            </BentoCard>


            {/* 寄样统计 - 这一组也可以放在同一个 Grid */}
            <BentoCard span={1} title="寄样规模">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={staffDashboard.metrics.currentPeriod.dispatchCount}
                  prefix={<ShoppingOutlined className="text-neutral-300 mr-2" />}
                  suffix={<span className="text-sm text-neutral-400 font-normal ml-1">次寄样</span>}
                  valueStyle={{ fontSize: 32, fontWeight: 700, color: '#111827' }}
                />
                <div className="mt-4 pt-4 border-t border-neutral-50">
                  <Text type="secondary" className="text-xs">本周期寄样频率正常</Text>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={1} title="寄样投入">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={Number(formatMoney(staffDashboard.metrics.currentPeriod.dispatchCost))}
                  prefix={<span className="text-lg text-neutral-300 mr-1 font-normal">¥</span>}
                  precision={2}
                  valueStyle={{ fontSize: 32, fontWeight: 700, color: '#111827' }}
                />
                <div className="mt-4 pt-4 border-t border-neutral-50">
                  <Text type="secondary" className="text-xs">样品投入回报率良好</Text>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={1} title="流程进展">
              <div className="flex flex-col justify-between h-full">
                <Statistic
                  value={staffDashboard.metrics.currentPeriod.progressedCount}
                  prefix={<SyncOutlined spin={false} className="text-brand-400 mr-2" />}
                  suffix={<span className="text-sm text-neutral-400 font-normal ml-1">步推进</span>}
                  valueStyle={{ fontSize: 32, fontWeight: 700, color: '#111827' }}
                />
                <div className="mt-4 pt-4 border-t border-neutral-50">
                  <Text type="secondary" className="text-xs">管道流转效率提升</Text>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={1} title="团队竞争力">
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 font-bold text-xl">
                    {staffDashboard.ranking.myRank}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900">
                      第 {staffDashboard.ranking.myRank} 名
                    </div>
                    <div className="text-xs text-neutral-400">全公司共 {staffDashboard.ranking.totalStaff} 位成员</div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-50 flex items-center gap-1">
                  <TrophyOutlined className="text-amber-400" />
                  <Text type="secondary" className="text-xs font-medium">继续加油！距离上一名仅一步之遥</Text>
                </div>
              </div>
            </BentoCard>
          </BentoGrid>

          {/* 管道分布和待办事项 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            {/* 我的管道分布 */}
            <Col xs={24} lg={12}>
              <Card
                variant="elevated"
              >
                <CardContent>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>我的合作管道</Text>
                    <Text type="secondary">
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
              <Card variant="elevated">
                <CardContent>
                  <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>待办事项</Text>
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
                          title={item.title}
                          description={
                            <Badge
                              count={item.count}
                              showZero
                              style={{ backgroundColor: item.count > 0 ? item.color : '#d9d9d9' }}
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
              <Card variant="elevated">
                <CardContent>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 16 }}>样品使用统计</Text>
                    <Button type="link" onClick={() => navigate('/samples')}>
                      查看详情
                    </Button>
                  </div>
                  {staffDashboard.sampleUsage.length > 0 ? (
                    <Table
                      dataSource={staffDashboard.sampleUsage.slice(0, 5)}
                      rowKey="sampleId"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: '样品名称',
                          dataIndex: 'sampleName',
                          key: 'sampleName',
                          render: (text: string, record) => (
                            <div>
                              <Text strong>{text}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
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
                        },
                        {
                          title: '上车率',
                          dataIndex: 'onboardRate',
                          key: 'onboardRate',
                          align: 'center',
                          width: 80,
                          render: (rate: number) => (
                            <Tag color={rate >= 0.5 ? 'success' : rate >= 0.3 ? 'warning' : 'default'}>
                              {(rate * 100).toFixed(0)}%
                            </Tag>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <Empty description="暂无寄样记录" />
                  )}
                </CardContent>
              </Card>
            </Col>

            {/* 最近动态 */}
            <Col xs={24} lg={12}>
              <Card variant="elevated">
                <CardContent>
                  <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>最近动态</Text>
                  {staffDashboard.recentActivities.length > 0 ? (
                    <Timeline
                      items={staffDashboard.recentActivities.map((activity) => ({
                        dot: activityIcons[activity.type],
                        children: (
                          <div>
                            <Text strong>{activity.influencerName}</Text>
                            <br />
                            <Text style={{ fontSize: 12 }}>{activity.content}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(activity.createdAt).fromNow()}
                            </Text>
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <Empty description="暂无动态" />
                  )}
                </CardContent>
              </Card>
            </Col>
          </Row>

          {/* 排名信息 */}
          {staffDashboard.ranking.topPerformer && (
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={24}>
                <Card variant="elevated">
                  <CardContent>
                    <Row gutter={16} align="middle">
                      <Col xs={24} sm={12}>
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">我的业绩</Text>
                          <Space size="large">
                            <Statistic
                              title="成交数量"
                              value={staffDashboard.ranking.myClosedCount}
                              suffix="单"
                            />
                            <Statistic
                              title="总GMV"
                              value={Number(formatMoney(staffDashboard.ranking.myGmv))}
                              suffix="元"
                              precision={2}
                            />
                          </Space>
                        </Space>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Space direction="vertical" size={0}>
                          <Text type="secondary">
                            <CrownOutlined style={{ color: '#faad14' }} /> 第一名
                          </Text>
                          <Space size="large">
                            <div>
                              <Text strong>{staffDashboard.ranking.topPerformer.name}</Text>
                              <br />
                              <Text type="secondary">
                                {staffDashboard.ranking.topPerformer.closedCount} 单
                              </Text>
                            </div>
                            <Statistic
                              value={Number(formatMoney(staffDashboard.ranking.topPerformer.gmv))}
                              suffix="元"
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
  }

  // 工厂老板仪表盘
  // 如果正在加载或数据为空，显示加载状态
  if (isBrandOwner && loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
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

  // 如果不是加载状态但数据为空，显示错误提示
  if (isBrandOwner && !factoryDashboard) {
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
              <Button type="primary" onClick={() => loadDashboard()}>
                重新加载
              </Button>
            </Empty>
          </CardContent>
        </Card>
      </div>
    );
  }





  // 配额信息
  const staffCount = user?.brand?._count?.staff || 0;
  const staffLimit = user?.brand?.staffLimit || 0;
  const influencerCount = user?.brand?._count?.influencers || 0;
  const influencerLimit = user?.brand?.influencerLimit || 0;
  const planTypeLabels = {
    FREE: '免费版',
    PROFESSIONAL: '专业版',
    ENTERPRISE: '企业版',
  };
  const planType = user?.brand?.planType || 'FREE';



  // Hardcoded Factory Dashboard Layout for Stability
  const renderFactoryDashboard = () => (
    <div className="flex flex-col gap-6 pb-8">
      {/* Row 1: 资源概览 + KPI 统计卡片（对齐） */}
      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6 items-stretch">

        {/* Left Column (Span 2) */}
        <div className="col-span-1 xl:col-span-2 flex flex-col gap-6">
          {/* 资源概览卡片 - 使用 bento-card 样式匹配其他卡片 */}
          <div className="bento-card h-32 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight leading-tight">资源概览</h3>
              <Tag color="geekblue" className="mr-0 border-none bg-indigo-50 text-indigo-600 font-bold px-2 rounded-md">
                {planTypeLabels[planType] || planType}
              </Tag>
            </div>

            {/* Content */}
            <div className="flex items-center justify-around">
              {/* Business Account */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                  <TeamOutlined className="text-lg" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-neutral-800">{staffCount}</span>
                  <span className="text-xs text-neutral-400">/{staffLimit}</span>
                  <span className="text-xs text-neutral-500 font-medium">商务账号</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-neutral-200"></div>

              {/* Influencer Resource */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                  <CrownOutlined className="text-lg" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-neutral-800">{influencerCount}</span>
                  <span className="text-xs text-neutral-400">/{influencerLimit}</span>
                  <span className="text-xs text-neutral-500 font-medium">达人资源</span>
                </div>
              </div>
            </div>
          </div>

          <BentoCard title="快捷操作" span={6} className="h-auto">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <WarningOutlined className="text-lg" />,
                  label: '超期跟进',
                  count: dailySummary?.overdueCollaborations || 0,
                  color: 'text-orange-500',
                  bg: 'bg-orange-50 hover:bg-orange-100',
                  path: '/app/pipeline?status=overdue'
                },
                {
                  icon: <ClockCircleOutlined className="text-lg" />,
                  label: '待签样品',
                  count: dailySummary?.pendingSamples || 0,
                  color: 'text-blue-500',
                  bg: 'bg-blue-50 hover:bg-blue-100',
                  path: '/app/samples?status=pending'
                },
                {
                  icon: <FileTextOutlined className="text-lg" />,
                  label: '待录结果',
                  count: dailySummary?.pendingResults || 0,
                  color: 'text-purple-500',
                  bg: 'bg-purple-50 hover:bg-purple-100',
                  path: '/app/results?status=pending'
                },
                {
                  icon: <UserOutlined className="text-lg" />,
                  label: '新增达人',
                  count: 0,
                  color: 'text-emerald-500',
                  bg: 'bg-emerald-50 hover:bg-emerald-100',
                  path: '#'
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className={`cursor-pointer rounded-lg p-3 flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-95 ${item.bg}`}
                  onClick={() => item.path !== '#' && navigate(item.path)}
                  style={{ minHeight: '90px' }}
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-8 h-8 rounded-lg bg-white flex items-center justify-center ${item.color} shadow-sm`}>
                      {item.icon}
                    </div>
                    {item.count > 0 && (
                      <Badge
                        count={item.count}
                        size="small"
                        style={{ backgroundColor: '#ff4d4f', boxShadow: 'none' }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-bold text-neutral-800 mt-2">{item.label}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="管道漏斗" span={6}>
            <PipelineFunnelChart
              data={pipelineFunnel}
              loading={pipelineFunnelLoading}
              onStageClick={handleStageClick}
              isBento={true}
            />
          </BentoCard>

          <BentoCard title="ROI 构成" span={6}>
            <ROIAnalysisChart data={roiAnalysis} loading={roiAnalysisLoading} isBento={true} />
          </BentoCard>

        </div>

        {/* Right Column (Span 4) */}
        <div className="col-span-1 xl:col-span-4 flex flex-col gap-6">

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm flex flex-col justify-between h-32">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center"><ShoppingOutlined /></div>
                <span className="text-neutral-500 text-xs font-medium">寄样成本</span>
              </div>
              <div className="text-2xl font-bold flex items-end gap-1">
                ¥{factoryDashboard ? formatMoney(factoryDashboard.metrics.totalSampleCost) : '0'}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>环比</span>
                {factoryDashboard && renderChange(factoryDashboard.metrics.periodComparison.sampleCostChange)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm flex flex-col justify-between h-32">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center"><DollarOutlined /></div>
                <span className="text-neutral-500 text-xs font-medium">合作投入</span>
              </div>
              <div className="text-2xl font-bold flex items-end gap-1">
                ¥{factoryDashboard ? formatMoney(factoryDashboard.metrics.totalCollaborationCost) : '0'}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>趋势</span>
                <CheckCircleOutlined className="text-emerald-400" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm flex flex-col justify-between h-32">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><RiseOutlined /></div>
                <span className="text-neutral-500 text-xs font-medium">成交 GMV</span>
              </div>
              <div className="text-2xl font-bold flex items-end gap-1 text-emerald-600">
                ¥{factoryDashboard ? formatMoney(factoryDashboard.metrics.totalGmv) : '0'}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>增长</span>
                {factoryDashboard && renderChange(factoryDashboard.metrics.periodComparison.gmvChange)}
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-neutral-100 shadow-sm flex flex-col justify-between h-32">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"><TrophyOutlined /></div>
                <span className="text-neutral-500 text-xs font-medium">总 ROI</span>
              </div>
              <div className="text-2xl font-bold flex items-end gap-1 text-neutral-800">
                {factoryDashboard ? factoryDashboard.metrics.overallRoi.toFixed(2) : '0.00'}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                <span>效能</span>
                {factoryDashboard && renderChange(factoryDashboard.metrics.periodComparison.roiChange)}
              </div>
            </div>
          </div>

          {/* Trend Charts */}
          <BentoCard title="趋势洞察指挥舱" span={6}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-64 lg:h-80">
              <TrendChart
                title="GMV"
                dataType="gmv"
                currentData={gmvTrend?.current || []}
                previousData={gmvTrend?.previous}
                loading={trendLoading}
                period={trendPeriod}
                onPeriodChange={setTrendPeriod}
                valueFormatter={(value) => `¥${value.toFixed(0)}`}
                isBento={true}
              />
              <TrendChart
                title="成本"
                dataType="cost"
                currentData={costTrend?.current || []}
                previousData={costTrend?.previous}
                loading={trendLoading}
                period={trendPeriod}
                onPeriodChange={setTrendPeriod}
                valueFormatter={(value) => `¥${value.toFixed(0)}`}
                isBento={true}
              />
              <TrendChart
                title="ROI"
                dataType="roi"
                currentData={roiTrend?.current || []}
                previousData={roiTrend?.previous}
                loading={trendLoading}
                period={trendPeriod}
                onPeriodChange={setTrendPeriod}
                valueFormatter={(value) => value.toFixed(2)}
                isBento={true}
              />
            </div>
          </BentoCard>

          {/* Smart Assistant */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SmartNotifications brandId={user?.brandId} isBento={true} />
            <FollowUpReminder
              onRemind={(collaborationId) => {
                navigate(`/app/pipeline?highlight=${collaborationId}`);
              }}
              isBento={true}
            />
          </div>

          {/* Staff Comparison */}
          <BentoCard title="商务团队作战大屏" span={6}>
            <StaffComparisonChart
              staffList={staffList}
              comparisonData={staffComparison}
              loading={staffComparisonLoading}
              onStaffSelect={loadStaffComparison}
              isBento={true}
            />
          </BentoCard>

        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-slate-50/50"
      style={{
        padding: '24px',
        margin: '-24px',
        backgroundImage:
          mode === 'dark'
            ? 'radial-gradient(circle at 50% 0%, #1f1f1f 0%, #141414 100%)'
            : 'radial-gradient(circle at 50% 0%, #f1f5f9 0%, #f8fafc 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="h-full flex flex-col gap-4">
        <div className="flex flex-row justify-between items-center bg-white/60 backdrop-blur-xl sticky top-0 z-20 py-2 px-3 rounded-lg border border-white/60 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 m-0">
              下午好, {user?.name}
            </h1>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-px h-4 bg-neutral-300 mx-1"></span>
              <span className="text-xs text-neutral-500 font-medium bg-neutral-100 px-2 py-0.5 rounded-md">
                全屏指挥舱 v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {statusConfig && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-help"
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
              className="font-medium bg-neutral-100/80 p-0.5"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-[80vh] flex justify-center items-center">
            <Spin size="large" tip="正在加载指挥舱数据..." />
          </div>
        ) : (
          isBrandOwner ? renderFactoryDashboard() : (
            <div className="max-w-[1200px] mx-auto py-12">
              <Empty description="商务端概览升级中，请稍候..." />
            </div>
          )
        )}
      </div>
    </div >
  );
};

export default Dashboard;
