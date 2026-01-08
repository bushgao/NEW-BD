import { useState, useEffect } from 'react';
import {
  Card as AntCard,
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
import type { PipelineStage } from '@ics/shared';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import TrendChart from '../../components/charts/TrendChart';
import ROIAnalysisChart from '../../components/charts/ROIAnalysisChart';
import PipelineFunnelChart from '../../components/charts/PipelineFunnelChart';
import StaffComparisonChart from '../../components/charts/StaffComparisonChart';
import QuickActionsPanel from '../../components/dashboard/QuickActionsPanel';
import SmartNotifications from '../../components/dashboard/SmartNotifications';
import FollowUpReminder from '../../components/dashboard/FollowUpReminder';
import CustomizableDashboard, { type DashboardCard } from '../../components/dashboard/CustomizableDashboard';
import TodayTodoList from '../../components/dashboard/TodayTodoList';
import WorkStats from '../../components/dashboard/WorkStats';
import QuickActions from '../../components/dashboard/QuickActions';
import InfluencerModal from '../Influencers/InfluencerModal';
import CreateCollaborationModal from '../Pipeline/CreateCollaborationModal';
import type { Influencer } from '../../services/influencer.service';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

// 阶段颜色映射
const STAGE_COLORS: Record<PipelineStage, string> = {
  LEAD: '#d9d9d9',
  CONTACTED: '#1890ff',
  QUOTED: '#722ed1',
  SAMPLED: '#faad14',
  SCHEDULED: '#13c2c2',
  PUBLISHED: '#52c41a',
  REVIEWED: '#eb2f96',
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { theme } = useTheme();
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
  const [dailySummaryLoading, setDailySummaryLoading] = useState(false);
  
  // 今日待办状态
  const [todayTodos, setTodayTodos] = useState<TodayTodosResponse | null>(null);
  const [todayTodosLoading, setTodayTodosLoading] = useState(false);
  
  // 快捷操作模态框状态
  const [influencerModalVisible, setInfluencerModalVisible] = useState(false);
  const [collaborationModalVisible, setCollaborationModalVisible] = useState(false);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  const isFactoryOwner = user?.role === 'FACTORY_OWNER';
  const isBusinessStaff = user?.role === 'BUSINESS_STAFF';

  // 加载看板数据
  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (isFactoryOwner) {
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
    if (!isFactoryOwner) return;
    
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
    if (!isFactoryOwner) return;
    
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
    if (!isFactoryOwner) return;
    
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
    if (!isFactoryOwner) return;
    
    setDailySummaryLoading(true);
    try {
      const data = await getDailySummary();
      setDailySummary(data);
    } catch (error) {
      message.error('加载每日摘要数据失败');
      console.error(error);
    } finally {
      setDailySummaryLoading(false);
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
    if (!isFactoryOwner) return;
    
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
    if (!isFactoryOwner || staffIds.length < 2) {
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
  
  // 处理导出报表
  const handleExportReport = () => {
    message.info('导出报表功能开发中...');
    // TODO: 实现导出报表功能
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
    if (isFactoryOwner || isBusinessStaff) {
      loadDashboard();
      refreshUserInfo(); // 刷新用户信息以获取最新的工厂状态
    }
  }, [period, isFactoryOwner, isBusinessStaff]);
  
  // 加载趋势数据
  useEffect(() => {
    if (isFactoryOwner) {
      loadTrendData();
    }
  }, [trendPeriod, isFactoryOwner]);
  
  // 加载 ROI 分析数据
  useEffect(() => {
    if (isFactoryOwner) {
      loadRoiAnalysis();
    }
  }, [isFactoryOwner]);
  
  // 加载管道漏斗数据
  useEffect(() => {
    if (isFactoryOwner) {
      loadPipelineFunnel();
      loadDailySummary();
    }
  }, [isFactoryOwner]);
  
  // 加载今日待办数据（商务人员）
  useEffect(() => {
    if (isBusinessStaff) {
      loadTodayTodos();
    }
  }, [isBusinessStaff]);
  
  // 加载商务列表（当 factoryDashboard 加载完成后）
  useEffect(() => {
    if (isFactoryOwner && factoryDashboard) {
      loadStaffList();
    }
  }, [isFactoryOwner, factoryDashboard]);

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
  if (!isFactoryOwner && !isBusinessStaff) {
    return (
      <div 
        style={{ 
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
          position: 'relative',
          padding: '24px',
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

  // 商务人员仪表盘 - 有数据时显示
  if (isBusinessStaff && staffDashboard) {
    const activityIcons = {
      stage_change: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      follow_up: <MessageOutlined style={{ color: '#1890ff' }} />,
      dispatch: <SendOutlined style={{ color: '#faad14' }} />,
      result: <TrophyOutlined style={{ color: '#eb2f96' }} />,
    };

    // 工厂状态横幅配置
    const factoryStatus = user?.factory?.status;
    const factoryStatusConfig = {
      PENDING: {
        color: '#faad14',
        bgColor: '#fff7e6',
        borderColor: '#ffd591',
        icon: <ClockCircleOutlined />,
        title: '工厂审核中',
        message: '您的工厂正在审核中，审核通过后即可使用全部功能',
      },
      REJECTED: {
        color: '#ff4d4f',
        bgColor: '#fff1f0',
        borderColor: '#ffa39e',
        icon: <WarningOutlined />,
        title: '工厂审核未通过',
        message: '您的工厂审核未通过，请联系平台管理员了解详情',
      },
      SUSPENDED: {
        color: '#ff4d4f',
        bgColor: '#fff1f0',
        borderColor: '#ffa39e',
        icon: <WarningOutlined />,
        title: '工厂已暂停',
        message: '您的工厂已被暂停使用，请联系平台管理员',
      },
    };

    const statusConfig = factoryStatus && factoryStatus !== 'APPROVED' ? factoryStatusConfig[factoryStatus] : null;

    return (
        <div 
          style={{ 
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
            position: 'relative',
            padding: '24px',
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
          <div style={{
            position: 'absolute',
            top: '40%',
            right: '10%',
            width: '500px',
            height: '500px',
            background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
            borderRadius: '50%',
            filter: 'blur(100px)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
          {/* 工厂状态横幅 */}
          {statusConfig && (
            <AntCard
              style={{
                marginBottom: 24,
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              }}
            >
              <Space>
                <span style={{ color: statusConfig.color, fontSize: 20 }}>
                  {statusConfig.icon}
                </span>
                <div>
                  <Text strong style={{ color: statusConfig.color, fontSize: 16 }}>
                    {statusConfig.title}
                  </Text>
                  <br />
                  <Text type="secondary">{statusConfig.message}</Text>
                </div>
              </Space>
            </AntCard>
          )}

          {/* 标题和周期切换 */}
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                欢迎回来,{user?.name}
              </Title>
            </Col>
            <Col>
              <Segmented
                options={[
                  { label: '本周', value: 'week' },
                  { label: '本月', value: 'month' },
                ]}
                value={period}
                onChange={(value) => setPeriod(value as 'week' | 'month')}
              />
            </Col>
          </Row>

          {/* 今日工作清单 */}
          {todayTodos && (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24}>
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
              </Col>
            </Row>
          )}
          
          {/* 快捷操作 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24}>
              <QuickActions
                onAddInfluencer={handleAddInfluencer}
                onCreateCollaboration={handleCreateCollaboration}
                onDispatchSample={handleDispatchSample}
                onQuickFollowUp={handleQuickFollowUp}
              />
            </Col>
          </Row>

          {/* 关键指标卡片 */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="建联数量"
                    value={staffDashboard.metrics.currentPeriod.contactedCount}
                    prefix={<UserOutlined />}
                    suffix="个"
                  />
                  <div style={{ marginTop: 8 }}>
                    {renderChange(staffDashboard.metrics.periodComparison.contactedChange)}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      环比
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="成交数量"
                    value={staffDashboard.metrics.currentPeriod.closedCount}
                    prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    suffix="单"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    {renderChange(staffDashboard.metrics.periodComparison.closedChange)}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      环比
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="总GMV"
                    value={Number(formatMoney(staffDashboard.metrics.currentPeriod.totalGmv))}
                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                    suffix="元"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    {renderChange(staffDashboard.metrics.periodComparison.gmvChange)}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      环比
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="平均ROI"
                    value={staffDashboard.metrics.currentPeriod.averageRoi}
                    prefix={<RiseOutlined />}
                    precision={2}
                    valueStyle={{
                      color: staffDashboard.metrics.currentPeriod.averageRoi >= 1 ? '#52c41a' : '#ff4d4f',
                    }}
                  />
                  <div style={{ marginTop: 8 }}>
                    {renderChange(staffDashboard.metrics.periodComparison.roiChange)}
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      环比
                    </Text>
                  </div>
                </CardContent>
              </Card>
            </Col>
          </Row>

          {/* 寄样统计 */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="寄样次数"
                    value={staffDashboard.metrics.currentPeriod.dispatchCount}
                    prefix={<ShoppingOutlined />}
                    suffix="次"
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="寄样成本"
                    value={Number(formatMoney(staffDashboard.metrics.currentPeriod.dispatchCost))}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    precision={2}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="推进数量"
                    value={staffDashboard.metrics.currentPeriod.progressedCount}
                    prefix={<TeamOutlined />}
                    suffix="个"
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="我的排名"
                    value={`${staffDashboard.ranking.myRank}/${staffDashboard.ranking.totalStaff}`}
                    prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
                  />
                </CardContent>
              </Card>
            </Col>
          </Row>

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
                              size={70}
                            />
                            <div style={{ marginTop: 8, fontSize: 12 }}>
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
        </div>
    );
  }

  // 工厂老板仪表盘
  // 如果正在加载或数据为空，显示加载状态
  if (isFactoryOwner && loading) {
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
  if (isFactoryOwner && !factoryDashboard) {
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

  const pipelineTotal = factoryDashboard
    ? Object.values(factoryDashboard.pipelineDistribution).reduce((a, b) => a + b, 0)
    : 0;

  // 工厂状态横幅配置
  const factoryStatus = user?.factory?.status;
  const factoryStatusConfig = {
    PENDING: {
      color: '#faad14',
      bgColor: '#fff7e6',
      borderColor: '#ffd591',
      icon: <ClockCircleOutlined />,
      title: '工厂审核中',
      message: '您的工厂正在审核中，审核通过后即可使用全部功能',
    },
    REJECTED: {
      color: '#ff4d4f',
      bgColor: '#fff1f0',
      borderColor: '#ffa39e',
      icon: <WarningOutlined />,
      title: '工厂审核未通过',
      message: '您的工厂审核未通过，请联系平台管理员了解详情',
    },
    SUSPENDED: {
      color: '#ff4d4f',
      bgColor: '#fff1f0',
      borderColor: '#ffa39e',
      icon: <WarningOutlined />,
      title: '工厂已暂停',
      message: '您的工厂已被暂停使用，请联系平台管理员',
    },
  };

  const statusConfig = factoryStatus && factoryStatus !== 'APPROVED' ? factoryStatusConfig[factoryStatus] : null;

  // 配额信息
  const staffCount = user?.factory?._count?.staff || 0;
  const staffLimit = user?.factory?.staffLimit || 0;
  const influencerCount = user?.factory?._count?.influencers || 0;
  const influencerLimit = user?.factory?.influencerLimit || 0;
  const planTypeLabels = {
    FREE: '免费版',
    PROFESSIONAL: '专业版',
    ENTERPRISE: '企业版',
  };
  const planType = user?.factory?.planType || 'FREE';

  // 为工厂老板创建可自定义的卡片配置
  const factoryOwnerDashboardCards: DashboardCard[] = [
    {
      id: 'quota-usage',
      title: '配额使用情况',
      visible: true,
      order: 0,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card variant="elevated">
              <CardContent>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>商务账号配额</Text>
                    <Text type={staffCount >= staffLimit ? 'danger' : 'secondary'}>
                      {staffCount} / {staffLimit}
                    </Text>
                  </div>
                  <Progress
                    percent={(staffCount / staffLimit) * 100}
                    strokeColor={staffCount >= staffLimit ? '#ff4d4f' : '#1890ff'}
                    showInfo={false}
                  />
                  {staffCount >= staffLimit && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      已达上限，请升级套餐
                    </Text>
                  )}
                </Space>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card variant="elevated">
              <CardContent>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong>达人数量配额</Text>
                    <Text type={influencerCount >= influencerLimit ? 'danger' : 'secondary'}>
                      {influencerCount} / {influencerLimit}
                    </Text>
                  </div>
                  <Progress
                    percent={(influencerCount / influencerLimit) * 100}
                    strokeColor={influencerCount >= influencerLimit ? '#ff4d4f' : '#52c41a'}
                    showInfo={false}
                  />
                  {influencerCount >= influencerLimit && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                      已达上限，请升级套餐
                    </Text>
                  )}
                </Space>
              </CardContent>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      id: 'quick-actions',
      title: '快捷操作和智能提醒',
      visible: true,
      order: 1,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            {dailySummary && (
              <QuickActionsPanel
                overdueCollaborations={dailySummary.overdueCollaborations}
                pendingReceipts={dailySummary.pendingSamples}
                pendingResults={dailySummary.pendingResults}
                onExport={handleExportReport}
              />
            )}
          </Col>
          <Col xs={24} lg={6}>
            <SmartNotifications factoryId={user?.factoryId} />
          </Col>
          <Col xs={24} lg={6}>
            <FollowUpReminder 
              onRemind={(collaborationId) => {
                navigate(`/app/pipeline?highlight=${collaborationId}`);
              }}
            />
          </Col>
        </Row>
      ),
    },
    {
      id: 'key-metrics',
      title: '关键指标',
      visible: true,
      order: 2,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="寄样成本"
                  value={factoryDashboard ? Number(formatMoney(factoryDashboard.metrics.totalSampleCost)) : 0}
                  prefix={<ShoppingOutlined />}
                  suffix="元"
                  precision={2}
                />
                <div style={{ marginTop: 8 }}>
                  {factoryDashboard && renderChange(factoryDashboard.metrics.periodComparison.sampleCostChange)}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    环比
                  </Text>
                </div>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="合作成本"
                  value={factoryDashboard ? Number(formatMoney(factoryDashboard.metrics.totalCollaborationCost)) : 0}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  precision={2}
                />
                <div style={{ marginTop: 8, height: 22 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    本周期累计
                  </Text>
                </div>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="总GMV"
                  value={factoryDashboard ? Number(formatMoney(factoryDashboard.metrics.totalGmv)) : 0}
                  prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                  suffix="元"
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: 8 }}>
                  {factoryDashboard && renderChange(factoryDashboard.metrics.periodComparison.gmvChange)}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    环比
                  </Text>
                </div>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="整体ROI"
                  value={factoryDashboard ? factoryDashboard.metrics.overallRoi : 0}
                  prefix={<RiseOutlined />}
                  precision={2}
                  valueStyle={{
                    color: factoryDashboard && factoryDashboard.metrics.overallRoi >= 1 ? '#52c41a' : '#ff4d4f',
                  }}
                />
                <div style={{ marginTop: 8 }}>
                  {factoryDashboard && renderChange(factoryDashboard.metrics.periodComparison.roiChange)}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    环比
                  </Text>
                </div>
              </CardContent>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      id: 'trend-charts',
      title: '趋势图表',
      visible: true,
      order: 3,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <TrendChart
              title="GMV 趋势"
              dataType="gmv"
              currentData={gmvTrend?.current || []}
              previousData={gmvTrend?.previous}
              loading={trendLoading}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
              valueFormatter={(value) => `¥${value.toFixed(2)}`}
            />
          </Col>
          <Col xs={24} lg={8}>
            <TrendChart
              title="成本趋势"
              dataType="cost"
              currentData={costTrend?.current || []}
              previousData={costTrend?.previous}
              loading={trendLoading}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
              valueFormatter={(value) => `¥${value.toFixed(2)}`}
            />
          </Col>
          <Col xs={24} lg={8}>
            <TrendChart
              title="ROI 趋势"
              dataType="roi"
              currentData={roiTrend?.current || []}
              previousData={roiTrend?.previous}
              loading={trendLoading}
              period={trendPeriod}
              onPeriodChange={setTrendPeriod}
              valueFormatter={(value) => value.toFixed(2)}
            />
          </Col>
        </Row>
      ),
    },
    {
      id: 'roi-analysis',
      title: 'ROI 分析',
      visible: true,
      order: 4,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <ROIAnalysisChart data={roiAnalysis} loading={roiAnalysisLoading} />
          </Col>
        </Row>
      ),
    },
    {
      id: 'pipeline-funnel',
      title: '管道漏斗图',
      visible: true,
      order: 5,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <PipelineFunnelChart
              data={pipelineFunnel}
              loading={pipelineFunnelLoading}
              onStageClick={handleStageClick}
            />
          </Col>
        </Row>
      ),
    },
    {
      id: 'staff-comparison',
      title: '商务对比分析',
      visible: true,
      order: 6,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <StaffComparisonChart
              staffList={staffList}
              comparisonData={staffComparison}
              loading={staffComparisonLoading}
              onStaffSelect={loadStaffComparison}
            />
          </Col>
        </Row>
      ),
    },
    {
      id: 'pipeline-distribution',
      title: '管道分布和待办事项',
      visible: true,
      order: 7,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card variant="elevated">
              <CardContent>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong style={{ fontSize: 16 }}>合作管道分布</Text>
                  <Text type="secondary">共 {pipelineTotal} 个合作</Text>
                </div>
                <Row gutter={[8, 16]}>
                  {factoryDashboard &&
                    (Object.entries(factoryDashboard.pipelineDistribution) as [PipelineStage, number][]).map(
                      ([stage, count]) => (
                        <Col xs={12} sm={8} md={6} key={stage}>
                          <div style={{ textAlign: 'center' }}>
                            <Progress
                              type="circle"
                              percent={pipelineTotal > 0 ? (count / pipelineTotal) * 100 : 0}
                              format={() => count}
                              strokeColor={STAGE_COLORS[stage]}
                              size={80}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Badge color={STAGE_COLORS[stage]} text={STAGE_LABELS[stage]} />
                            </div>
                          </div>
                        </Col>
                      )
                    )}
                </Row>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card variant="elevated">
              <CardContent>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>待办事项</Text>
                <List
                  dataSource={[
                    {
                      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
                      title: '超期合作',
                      count: factoryDashboard?.pendingItems.overdueCollaborations || 0,
                      path: '/pipeline',
                      color: '#ff4d4f',
                    },
                    {
                      icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
                      title: '待签收样品',
                      count: factoryDashboard?.pendingItems.pendingReceipts || 0,
                      path: '/samples',
                      color: '#faad14',
                    },
                    {
                      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
                      title: '待录入结果',
                      count: factoryDashboard?.pendingItems.pendingResults || 0,
                      path: '/results',
                      color: '#1890ff',
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
      ),
    },
    {
      id: 'staff-ranking',
      title: '商务排行榜',
      visible: true,
      order: 8,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card variant="elevated">
              <CardContent>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <TrophyOutlined style={{ color: '#faad14' }} />
                    <Text strong style={{ fontSize: 16 }}>商务排行榜</Text>
                  </Space>
                  <Button type="link" onClick={() => navigate('/reports')}>
                    查看详情
                  </Button>
                </div>
                <Table
                  dataSource={factoryDashboard?.staffRanking || []}
                  rowKey="staffId"
                  pagination={false}
                  columns={[
                    {
                      title: '排名',
                      key: 'rank',
                      width: 80,
                      render: (_, __, index) => {
                        const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                        return (
                          <Badge
                            count={index + 1}
                            style={{
                              backgroundColor: colors[index] || '#d9d9d9',
                            }}
                          />
                        );
                      },
                    },
                    {
                      title: '商务姓名',
                      dataIndex: 'staffName',
                      key: 'staffName',
                    },
                    {
                      title: '成交数量',
                      dataIndex: 'closedDeals',
                      key: 'closedDeals',
                      align: 'right',
                      render: (value: number) => `${value} 单`,
                    },
                    {
                      title: '总GMV',
                      dataIndex: 'totalGmv',
                      key: 'totalGmv',
                      align: 'right',
                      render: (value: number) => (
                        <Text strong style={{ color: '#52c41a' }}>
                          ¥{formatMoney(value)}
                        </Text>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      id: 'staff-progress',
      title: '商务团队工作进展',
      visible: true,
      order: 9,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card variant="elevated">
              <CardContent>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <TeamOutlined style={{ color: '#1890ff' }} />
                    <Text strong style={{ fontSize: 16 }}>商务团队工作进展</Text>
                  </Space>
                </div>
                <Table
                  dataSource={factoryDashboard?.staffProgress || []}
                  rowKey="staffId"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '商务姓名',
                      dataIndex: 'staffName',
                      key: 'staffName',
                      fixed: 'left',
                      width: 120,
                    },
                    {
                      title: '今日跟进',
                      dataIndex: 'todayFollowUps',
                      key: 'todayFollowUps',
                      align: 'center',
                      width: 100,
                      render: (value: number) => (
                        <Badge count={value} showZero style={{ backgroundColor: value > 0 ? '#52c41a' : '#d9d9d9' }} />
                      ),
                    },
                    {
                      title: '本周跟进',
                      dataIndex: 'weekFollowUps',
                      key: 'weekFollowUps',
                      align: 'center',
                      width: 100,
                      render: (value: number) => (
                        <Badge count={value} showZero style={{ backgroundColor: value > 0 ? '#1890ff' : '#d9d9d9' }} />
                      ),
                    },
                    {
                      title: '活跃合作',
                      dataIndex: 'activeCollaborations',
                      key: 'activeCollaborations',
                      align: 'center',
                      width: 100,
                      render: (value: number) => <Text strong>{value}</Text>,
                    },
                    {
                      title: '卡住合作',
                      dataIndex: 'stuckCollaborations',
                      key: 'stuckCollaborations',
                      align: 'center',
                      width: 100,
                      render: (value: number) =>
                        value > 0 ? <Tag color="warning">{value}</Tag> : <Text type="secondary">0</Text>,
                    },
                    {
                      title: '平均成交天数',
                      dataIndex: 'avgDaysToClose',
                      key: 'avgDaysToClose',
                      align: 'center',
                      width: 120,
                      render: (value: number) => (
                        <Text type={value > 0 ? undefined : 'secondary'}>{value > 0 ? `${value} 天` : '-'}</Text>
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      id: 'team-efficiency',
      title: '团队效率指标',
      visible: true,
      order: 10,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card variant="elevated">
              <CardContent>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <ClockCircleOutlined style={{ color: '#722ed1' }} />
                    <Text strong style={{ fontSize: 16 }}>团队效率指标</Text>
                  </Space>
                </div>
                <Row gutter={[16, 16]}>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="线索→联系"
                      value={factoryDashboard?.teamEfficiency.avgLeadToContact || 0}
                      suffix="天"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="联系→报价"
                      value={factoryDashboard?.teamEfficiency.avgContactToQuoted || 0}
                      suffix="天"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="报价→寄样"
                      value={factoryDashboard?.teamEfficiency.avgQuotedToSampled || 0}
                      suffix="天"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="寄样→排期"
                      value={factoryDashboard?.teamEfficiency.avgSampledToScheduled || 0}
                      suffix="天"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="排期→发布"
                      value={factoryDashboard?.teamEfficiency.avgScheduledToPublished || 0}
                      suffix="天"
                      valueStyle={{ fontSize: 20 }}
                    />
                  </Col>
                  <Col xs={12} sm={8} md={4}>
                    <Statistic
                      title="整体平均"
                      value={factoryDashboard?.teamEfficiency.overallAvgDays || 0}
                      suffix="天"
                      valueStyle={{ fontSize: 20, color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              </CardContent>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      id: 'risk-alerts',
      title: '风险预警和团队动态',
      visible: true,
      order: 11,
      component: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card variant="elevated" style={{ height: '100%' }}>
              <CardContent style={{ minHeight: 300 }}>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <WarningOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong style={{ fontSize: 16 }}>风险预警</Text>
                  </Space>
                </div>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {factoryDashboard?.riskAlerts && factoryDashboard.riskAlerts.longStuckCollaborations > 0 && (
                    <AntCard size="small" style={{ backgroundColor: '#fff2e8', borderColor: '#ffbb96' }}>
                      <Space>
                        <WarningOutlined style={{ color: '#fa8c16' }} />
                        <div>
                          <Text strong>长期卡住的合作</Text>
                          <br />
                          <Text type="secondary">
                            有 {factoryDashboard.riskAlerts.longStuckCollaborations} 个合作超过14天未推进
                          </Text>
                        </div>
                      </Space>
                    </AntCard>
                  )}
                  {factoryDashboard?.riskAlerts && factoryDashboard.riskAlerts.unbalancedWorkload && (
                    <AntCard size="small" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
                      <Space>
                        <WarningOutlined style={{ color: '#1890ff' }} />
                        <div>
                          <Text strong>工作量不均衡</Text>
                          <br />
                          <Text type="secondary">团队成员间工作量差异较大，建议重新分配</Text>
                        </div>
                      </Space>
                    </AntCard>
                  )}
                  {factoryDashboard?.riskAlerts && factoryDashboard.riskAlerts.highCostAlert && (
                    <AntCard size="small" style={{ backgroundColor: '#fff1f0', borderColor: '#ffa39e' }}>
                      <Space>
                        <WarningOutlined style={{ color: '#ff4d4f' }} />
                        <div>
                          <Text strong>成本异常</Text>
                          <br />
                          <Text type="secondary">本周期寄样成本比上周期增长超过50%</Text>
                        </div>
                      </Space>
                    </AntCard>
                  )}
                  {factoryDashboard?.riskAlerts &&
                    !factoryDashboard.riskAlerts.longStuckCollaborations &&
                    !factoryDashboard.riskAlerts.unbalancedWorkload &&
                    !factoryDashboard.riskAlerts.highCostAlert && (
                      <Empty description="暂无风险预警" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                </Space>
              </CardContent>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card variant="elevated" style={{ height: '100%' }}>
              <CardContent style={{ minHeight: 300 }}>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
                  最近团队动态
                </Text>
                {factoryDashboard?.recentTeamActivities && factoryDashboard.recentTeamActivities.length > 0 ? (
                  <Timeline
                    items={factoryDashboard.recentTeamActivities.map((activity) => {
                      const icons = {
                        new_collaboration: <UserOutlined style={{ color: '#1890ff' }} />,
                        stage_progress: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                        closed_deal: <TrophyOutlined style={{ color: '#faad14' }} />,
                        dispatch: <SendOutlined style={{ color: '#722ed1' }} />,
                      };
                      return {
                        dot: icons[activity.type],
                        children: (
                          <div>
                            <Text strong>{activity.staffName}</Text>
                            <Text> - {activity.influencerName}</Text>
                            <br />
                            <Text style={{ fontSize: 12 }}>{activity.content}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(activity.createdAt).fromNow()}
                            </Text>
                          </div>
                        ),
                      };
                    })}
                  />
                ) : (
                  <Empty description="暂无团队动态" />
                )}
              </CardContent>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '24px',
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
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* 工厂状态横幅 */}
      {statusConfig && (
        <AntCard
          style={{
            marginBottom: 24,
            backgroundColor: statusConfig.bgColor,
            borderColor: statusConfig.borderColor,
          }}
        >
          <Space>
            <span style={{ color: statusConfig.color, fontSize: 20 }}>
              {statusConfig.icon}
            </span>
            <div>
              <Text strong style={{ color: statusConfig.color, fontSize: 16 }}>
                {statusConfig.title}
              </Text>
              <br />
              <Text type="secondary">{statusConfig.message}</Text>
            </div>
          </Space>
        </AntCard>
      )}

      {/* 标题和周期切换 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            欢迎回来,{user?.name}
          </Title>
          <Text type="secondary">
            当前套餐：{planTypeLabels[planType as keyof typeof planTypeLabels]}
          </Text>
        </Col>
        <Col>
          <Segmented
            options={[
              { label: '本周', value: 'week' },
              { label: '本月', value: 'month' },
            ]}
            value={period}
            onChange={(value) => setPeriod(value as 'week' | 'month')}
          />
        </Col>
      </Row>

      {/* 使用可自定义看板 */}
      <CustomizableDashboard cards={factoryOwnerDashboardCards} autoSave={true} />
      </div>
    </div>
  );
};

export default Dashboard;
