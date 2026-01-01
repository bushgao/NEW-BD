import { useState, useEffect } from 'react';
import {
  Card,
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
import {
  getPlatformStats,
  type PlatformStats,
} from '../../services/platform.service';

const { Title } = Typography;

const AdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activeTab, setActiveTab] = useState('factories');

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
      key: 'factories',
      label: '工厂管理',
      children: <FactoryList onRefresh={loadStats} />,
    },
    {
      key: 'plans',
      label: '套餐配置',
      children: <PlanConfigList />,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        平台管理
      </Title>

      {/* 统计卡片 */}
      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="工厂总数"
                value={stats?.totalFactories || 0}
                prefix={<ShopOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="待审核"
                value={stats?.pendingFactories || 0}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="已通过"
                value={stats?.approvedFactories || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="用户总数"
                value={stats?.totalUsers || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="达人总数"
                value={stats?.totalInfluencers || 0}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Card>
              <Statistic
                title="合作总数"
                value={stats?.totalCollaborations || 0}
                prefix={<ProjectOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 套餐分布 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="免费版工厂"
                  value={stats.factoriesByPlan.FREE || 0}
                  suffix="家"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="专业版工厂"
                  value={stats.factoriesByPlan.PROFESSIONAL || 0}
                  suffix="家"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="企业版工厂"
                  value={stats.factoriesByPlan.ENTERPRISE || 0}
                  suffix="家"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Spin>

      {/* 管理标签页 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default AdminPage;
