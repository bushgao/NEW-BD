import { useState, useEffect } from 'react';
import {
  Card,
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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  getFactoryDashboard,
  formatMoney,
  formatChange,
  STAGE_LABELS,
  type FactoryDashboard,
} from '../../services/report.service';
import type { PipelineStage } from '@ics/shared';

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
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [dashboard, setDashboard] = useState<FactoryDashboard | null>(null);

  const isFactoryOwner = user?.role === 'FACTORY_OWNER';

  // 加载看板数据
  const loadDashboard = async () => {
    if (!isFactoryOwner) return;

    setLoading(true);
    try {
      const data = await getFactoryDashboard(period);
      setDashboard(data);
    } catch (error) {
      message.error('加载看板数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period, isFactoryOwner]);

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

  // 非工厂老板显示简单欢迎页面
  if (!isFactoryOwner) {
    return (
      <div>
        <Title level={4}>欢迎回来，{user?.name}</Title>
        <Card style={{ marginTop: 24 }}>
          <Title level={5}>快速开始</Title>
          <p>您可以使用以下功能：</p>
          <ul>
            <li>达人管理 - 添加和管理达人信息</li>
            <li>合作管道 - 追踪合作进度</li>
            <li>合作结果 - 录入和查看合作结果</li>
          </ul>
        </Card>
      </div>
    );
  }

  // 计算管道总数
  const pipelineTotal = dashboard
    ? Object.values(dashboard.pipelineDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Spin spinning={loading}>
      <div>
        {/* 标题和周期切换 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              欢迎回来，{user?.name}
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
            <Card>
              <Statistic
                title="寄样成本"
                value={dashboard ? Number(formatMoney(dashboard.metrics.totalSampleCost)) : 0}
                prefix={<ShoppingOutlined />}
                suffix="元"
                precision={2}
              />
              <div style={{ marginTop: 8 }}>
                {dashboard && renderChange(dashboard.metrics.periodComparison.sampleCostChange)}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  环比
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="合作成本"
                value={dashboard ? Number(formatMoney(dashboard.metrics.totalCollaborationCost)) : 0}
                prefix={<DollarOutlined />}
                suffix="元"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总GMV"
                value={dashboard ? Number(formatMoney(dashboard.metrics.totalGmv)) : 0}
                prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                suffix="元"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                {dashboard && renderChange(dashboard.metrics.periodComparison.gmvChange)}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  环比
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="整体ROI"
                value={dashboard ? dashboard.metrics.overallRoi : 0}
                prefix={<RiseOutlined />}
                precision={2}
                valueStyle={{
                  color: dashboard && dashboard.metrics.overallRoi >= 1 ? '#52c41a' : '#ff4d4f',
                }}
              />
              <div style={{ marginTop: 8 }}>
                {dashboard && renderChange(dashboard.metrics.periodComparison.roiChange)}
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  环比
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 管道分布和待办事项 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          {/* 管道分布 */}
          <Col xs={24} lg={16}>
            <Card title="合作管道分布" extra={<Text type="secondary">共 {pipelineTotal} 个合作</Text>}>
              <Row gutter={[8, 16]}>
                {dashboard &&
                  (Object.entries(dashboard.pipelineDistribution) as [PipelineStage, number][]).map(
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
            </Card>
          </Col>

          {/* 待办事项 */}
          <Col xs={24} lg={8}>
            <Card title="待办事项">
              <List
                dataSource={[
                  {
                    icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
                    title: '超期合作',
                    count: dashboard?.pendingItems.overdueCollaborations || 0,
                    path: '/pipeline',
                    color: '#ff4d4f',
                  },
                  {
                    icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
                    title: '待签收样品',
                    count: dashboard?.pendingItems.pendingReceipts || 0,
                    path: '/samples',
                    color: '#faad14',
                  },
                  {
                    icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
                    title: '待录入结果',
                    count: dashboard?.pendingItems.pendingResults || 0,
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
            </Card>
          </Col>
        </Row>

        {/* 商务排行榜 */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  商务排行榜
                </Space>
              }
              extra={
                <Button type="link" onClick={() => navigate('/reports')}>
                  查看详情
                </Button>
              }
            >
              <Table
                dataSource={dashboard?.staffRanking || []}
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
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default Dashboard;
