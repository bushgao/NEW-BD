import { useState, useEffect } from 'react';
import {
  Tabs,
  Tag,
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
import { BentoGrid, BentoCard } from '../../components/ui/Bento';
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
          <div className="mb-4 flex items-center justify-between">
            <Title level={4} style={{ margin: 0 }}>
              平台管理
            </Title>
            <Tag color="geekblue">{new Date().toLocaleDateString()}</Tag>
          </div>

          <BentoGrid>
            {/* 统计卡片 - 带彩色图标背景 */}
            <BentoCard span={1} className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shadow-sm">
                    <ShopOutlined />
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">品牌总数</div>
                  <div className="text-2xl font-bold text-neutral-800">{stats?.totalFactories || 0}</div>
                </div>
              </div>
            </BentoCard>
            <BentoCard span={1} className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg shadow-sm">
                    <ClockCircleOutlined />
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">待审核</div>
                  <div className="text-2xl font-bold text-amber-500">{stats?.pendingFactories || 0}</div>
                </div>
              </div>
            </BentoCard>
            <BentoCard span={1} className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-lg shadow-sm">
                    <CheckCircleOutlined />
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">已通过</div>
                  <div className="text-2xl font-bold text-emerald-500">{stats?.approvedFactories || 0}</div>
                </div>
              </div>
            </BentoCard>
            <BentoCard span={1} className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-lg shadow-sm">
                    <UserOutlined />
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">用户总数</div>
                  <div className="text-2xl font-bold text-neutral-800">{stats?.totalUsers || 0}</div>
                </div>
              </div>
            </BentoCard>
            <BentoCard span={1} className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center text-lg shadow-sm">
                    <TeamOutlined />
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">达人总数</div>
                  <div className="text-2xl font-bold text-neutral-800">{stats?.totalInfluencers || 0}</div>
                </div>
              </div>
            </BentoCard>
            <BentoCard span={1} className="h-full">
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-lg shadow-sm">
                    <ProjectOutlined />
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">合作总数</div>
                  <div className="text-2xl font-bold text-neutral-800">{stats?.totalCollaborations || 0}</div>
                </div>
              </div>
            </BentoCard>

            {/* 套餐分布 */}
            {stats && (
              <>
                <BentoCard title="免费版品牌" span={2}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-neutral-800">{stats.factoriesByPlan.FREE || 0}</span>
                    <span className="text-neutral-400 mb-1.5">家</span>
                  </div>
                </BentoCard>
                <BentoCard title="专业版品牌" span={2}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-blue-600">{stats.factoriesByPlan.PROFESSIONAL || 0}</span>
                    <span className="text-neutral-400 mb-1.5">家</span>
                  </div>
                </BentoCard>
                <BentoCard title="企业版品牌" span={1}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-amber-500">{stats.factoriesByPlan.ENTERPRISE || 0}</span>
                    <span className="text-neutral-400 mb-1.5">家</span>
                  </div>
                </BentoCard>
                <BentoCard title="独立商务" span={1}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-purple-600">{stats.independentBusinessUsers || 0}</span>
                    <span className="text-neutral-400 mb-1.5">人</span>
                  </div>
                </BentoCard>
              </>
            )}

            {/* 管理标签页 */}
            <BentoCard span={6}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
              />
            </BentoCard>
          </BentoGrid>
        </div>
      </div>
    </Spin>
  );
};

export default AdminPage;
