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
import {
  getFactoryDashboard,
  getBusinessStaffDashboard,
  formatMoney,
  formatChange,
  STAGE_LABELS,
  type FactoryDashboard,
  type BusinessStaffDashboard,
} from '../../services/report.service';
import type { PipelineStage } from '@ics/shared';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

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

  useEffect(() => {
    loadDashboard();
  }, [period, isFactoryOwner, isBusinessStaff]);

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

  // 非工厂老板和商务人员显示简单欢迎页面
  if (!isFactoryOwner && !isBusinessStaff) {
    return (
      <div>
        <Title level={4}>欢迎回来,{user?.name}</Title>
        <Card style={{ marginTop: 24 }}>
          <Title level={5}>快速开始</Title>
          <p>您可以使用以下功能:</p>
          <ul>
            <li>达人管理 - 添加和管理达人信息</li>
            <li>合作管道 - 追踪合作进度</li>
            <li>合作结果 - 录入和查看合作结果</li>
          </ul>
        </Card>
      </div>
    );
  }

  // 商务人员仪表盘
  if (isBusinessStaff && staffDashboard) {
    const activityIcons = {
      stage_change: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      follow_up: <MessageOutlined style={{ color: '#1890ff' }} />,
      dispatch: <SendOutlined style={{ color: '#faad14' }} />,
      result: <TrophyOutlined style={{ color: '#eb2f96' }} />,
    };

    return (
      <Spin spinning={loading}>
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
          </div>
        </div>
      </Spin>
    );
  }

  // 工厂老板仪表盘
  const pipelineTotal = factoryDashboard
    ? Object.values(factoryDashboard.pipelineDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Spin spinning={loading}>
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

        {/* 关键指标卡片 */}
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

        {/* 管道分布和待办事项 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* 管道分布 */}
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

          {/* 待办事项 */}
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

        {/* 商务排行榜 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
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

        {/* 商务团队工作进展 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
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
                    render: (value: number) => (
                      value > 0 ? (
                        <Tag color="warning">{value}</Tag>
                      ) : (
                        <Text type="secondary">0</Text>
                      )
                    ),
                  },
                  {
                    title: '平均成交天数',
                    dataIndex: 'avgDaysToClose',
                    key: 'avgDaysToClose',
                    align: 'center',
                    width: 120,
                    render: (value: number) => (
                      <Text type={value > 0 ? undefined : 'secondary'}>
                        {value > 0 ? `${value} 天` : '-'}
                      </Text>
                    ),
                  },
                ]}
              />
              </CardContent>
            </Card>
          </Col>
        </Row>

        {/* 团队效率指标 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
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

        {/* 风险预警和最近团队动态 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* 风险预警 */}
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
                        <Text type="secondary">
                          团队成员间工作量差异较大，建议重新分配
                        </Text>
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
                        <Text type="secondary">
                          本周期寄样成本比上周期增长超过50%
                        </Text>
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

          {/* 最近团队动态 */}
          <Col xs={24} lg={12}>
            <Card variant="elevated" style={{ height: '100%' }}>
              <CardContent style={{ minHeight: 300 }}>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>最近团队动态</Text>
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
        </div>
      </div>
    </Spin>
  );
};

export default Dashboard;
