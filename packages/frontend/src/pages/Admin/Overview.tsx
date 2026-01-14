import { useState, useEffect } from 'react';
import { message, Spin, Typography, Tag } from 'antd';
import {
  ShopOutlined,
  TeamOutlined,
  UserOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import InfluencerStatsPanel from './InfluencerStatsPanel';
import {
  getPlatformStats,
  type PlatformStats,
} from '../../services/platform.service';
import { BentoGrid, BentoCard } from '../../components/ui/Bento';
import { useTheme } from '../../theme/ThemeProvider';

const { Title } = Typography;

const AdminOverview = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);

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

  const renderStatCard = (title: string, value: number, icon: React.ReactNode, colorClass: string, bgClass: string) => (
    <BentoCard span={1} className="h-full">
      <div className="flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
          <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass} flex items-center justify-center text-lg shadow-sm`}>
            {icon}
          </div>
        </div>
        <div>
          <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
          <div className="text-2xl font-bold text-neutral-800">{value}</div>
        </div>
      </div>
    </BentoCard>
  );

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
          <div className="mb-6 flex items-center justify-between">
            <Title level={4} style={{ margin: 0 }}>
              数据概览
            </Title>
            <Tag color="geekblue">{new Date().toLocaleDateString()}</Tag>
          </div>

          <BentoGrid>
            {/* 顶层关键指标 */}
            {renderStatCard("品牌总数", stats?.totalFactories || 0, <ShopOutlined />, "text-blue-600", "bg-blue-50")}
            {renderStatCard("待审核", stats?.pendingFactories || 0, <ClockCircleOutlined />, "text-amber-500", "bg-amber-50")}
            {renderStatCard("已通过", stats?.approvedFactories || 0, <CheckCircleOutlined />, "text-emerald-500", "bg-emerald-50")}
            {renderStatCard("用户总数", stats?.totalUsers || 0, <UserOutlined />, "text-indigo-500", "bg-indigo-50")}
            {renderStatCard("达人总数", stats?.totalInfluencers || 0, <TeamOutlined />, "text-purple-500", "bg-purple-50")}
            {renderStatCard("合作总数", stats?.totalCollaborations || 0, <ProjectOutlined />, "text-rose-500", "bg-rose-50")}

            {/* 套餐分布 */}
            {stats && (
              <>
                <BentoCard title="免费版品牌" span={2}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-neutral-800">{stats.factoriesByPlan.FREE || 0}</span>
                    <span className="text-neutral-400 mb-1.5">家</span>
                  </div>
                  <div className="mt-4 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-neutral-400 rounded-full" style={{ width: `${(stats.factoriesByPlan.FREE / stats.totalFactories) * 100}%` }} />
                  </div>
                </BentoCard>
                <BentoCard title="专业版品牌" span={2}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-blue-600">{stats.factoriesByPlan.PROFESSIONAL || 0}</span>
                    <span className="text-neutral-400 mb-1.5">家</span>
                  </div>
                  <div className="mt-4 h-1.5 bg-blue-50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.factoriesByPlan.PROFESSIONAL / stats.totalFactories) * 100}%` }} />
                  </div>
                </BentoCard>
                <BentoCard title="企业版品牌" span={2}>
                  <div className="flex items-end gap-2 mt-2">
                    <span className="text-4xl font-bold text-amber-500">{stats.factoriesByPlan.ENTERPRISE || 0}</span>
                    <span className="text-neutral-400 mb-1.5">家</span>
                  </div>
                  <div className="mt-4 h-1.5 bg-amber-50 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.factoriesByPlan.ENTERPRISE / stats.totalFactories) * 100}%` }} />
                  </div>
                </BentoCard>
              </>
            )}

            {/* 达人统计 - 占据全宽 (Span 6) */}
            <BentoCard span={6} className="!p-0 overflow-hidden bg-transparent shadow-none border-none">
              <InfluencerStatsPanel />
            </BentoCard>
          </BentoGrid>
        </div>
      </div>
    </Spin>
  );
};

export default AdminOverview;
