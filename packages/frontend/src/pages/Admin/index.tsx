import { useState, useEffect } from 'react';
import {
  Tabs,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Typography,
} from 'antd';
import {
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import FactoryList from './FactoryList';
import PlanConfigList from './PlanConfigList';
import InfluencerManagement from './InfluencerManagement';
import InfluencerStatsPanel from './InfluencerStatsPanel';
import IndependentBusinessList from './IndependentBusinessList';
import {
  getPlatformStats,
  type PlatformStats,
} from '../../services/platform.service';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { Title } = Typography;

const AdminPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // 加载平台统计数据
  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getPlatformStats();
      setStats(data);
    } catch (error) {
      message.error('加载统计数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const tabItems = [
    {
      key: 'overview',
      label: '数据概览',
      children: <InfluencerStatsPanel />,
    },
    {
      key: 'factories',
      label: '品牌管理',
      children: <FactoryList onRefresh={loadStats} />,
    },
    {
      key: 'independent',
      label: '独立商务',
      children: <IndependentBusinessList />,
    },
    {
      key: 'influencers',
      label: '达人管理',
      children: <InfluencerManagement />,
    },
    {
      key: 'plans',
      label: '套餐配置',
      children: <PlanConfigList />,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div
        style={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
          position: 'relative',
          padding: '40px',
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
          <Title level={4} style={{ marginBottom: 24 }}>
            平台管理
          </Title>

          {/* 统计卡片 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="品牌总数"
                    value={stats?.totalFactories || 0}
                    prefix={<ShopOutlined />}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="待审核"
                    value={stats?.pendingFactories || 0}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="已通过"
                    value={stats?.approvedFactories || 0}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="用户总数"
                    value={stats?.totalUsers || 0}
                    prefix={<UserOutlined />}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="达人总数"
                    value={stats?.totalInfluencers || 0}
                    prefix={<TeamOutlined />}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="合作总数"
                    value={stats?.totalCollaborations || 0}
                    prefix={<ProjectOutlined />}
                  />
                </CardContent>
              </Card>
            </Col>
          </Row>

          {/* 套餐分布 */}
          {stats && (
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={6}>
                <Card variant="elevated" hoverable>
                  <CardContent>
                    <Statistic
                      title="免费版品牌"
                      value={stats.factoriesByPlan.FREE || 0}
                      suffix="家"
                    />
                  </CardContent>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="elevated" hoverable>
                  <CardContent>
                    <Statistic
                      title="专业版品牌"
                      value={stats.factoriesByPlan.PROFESSIONAL || 0}
                      suffix="家"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </CardContent>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="elevated" hoverable>
                  <CardContent>
                    <Statistic
                      title="企业版品牌"
                      value={stats.factoriesByPlan.ENTERPRISE || 0}
                      suffix="家"
                      valueStyle={{ color: '#faad14' }}
                    />
                  </CardContent>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card variant="elevated" hoverable>
                  <CardContent>
                    <Statistic
                      title="独立商务"
                      value={stats.independentBusinessUsers || 0}
                      suffix="人"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </CardContent>
                </Card>
              </Col>
            </Row>
          )}

          {/* 管理标签页 */}
          <Card variant="elevated">
            <CardContent>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Spin>
  );
};

export default AdminPage;
