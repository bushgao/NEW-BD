import { useState, useEffect } from 'react';
import { Table, Spin, message, Statistic } from 'antd';
import type { InfluencerStats } from '@ics/shared';
import * as platformInfluencerService from '../../services/platform-influencer.service';
import { BentoGrid, BentoCard } from '../../components/ui/Bento';

export default function InfluencerStatsPanel() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<InfluencerStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await platformInfluencerService.getInfluencerStats();
      setStats(data);
    } catch (error: any) {
      message.error(error.message || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const sourceQualityColumns = [
    {
      title: '来源类型',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: (type: string) => {
        const map: Record<string, string> = {
          PLATFORM: '平台添加',
          FACTORY: '品牌添加',
          STAFF: '商务添加',
        };
        return map[type] || type;
      },
    },
    {
      title: '总数',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '已认证',
      dataIndex: 'verified',
      key: 'verified',
    },
    {
      title: '认证率',
      dataIndex: 'verificationRate',
      key: 'verificationRate',
      render: (rate: number) => `${(rate * 100).toFixed(1)}%`,
    },
  ];

  const factoryRankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '品牌名称',
      dataIndex: 'factoryName',
      key: 'factoryName',
    },
    {
      title: '达人数量',
      dataIndex: 'count',
      key: 'count',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Top Stats - Custom 4-col Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard>
          <Statistic title="总达人数" value={stats.total} />
        </BentoCard>
        <BentoCard>
          <Statistic title="未认证" value={stats.byVerificationStatus.UNVERIFIED || 0} valueStyle={{ color: '#faad14' }} />
        </BentoCard>
        <BentoCard>
          <Statistic title="已认证" value={stats.byVerificationStatus.VERIFIED || 0} valueStyle={{ color: '#52c41a' }} />
        </BentoCard>
        <BentoCard>
          <Statistic title="认证失败" value={stats.byVerificationStatus.REJECTED || 0} valueStyle={{ color: '#ff4d4f' }} />
        </BentoCard>
      </div>

      <BentoGrid>
        <BentoCard title="来源分布" span={3}>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <Statistic title="平台添加" value={stats.bySourceType.PLATFORM || 0} />
            <Statistic title="品牌添加" value={stats.bySourceType.FACTORY || 0} />
            <Statistic title="商务添加" value={stats.bySourceType.STAFF || 0} />
          </div>
        </BentoCard>

        <BentoCard title="平台分布" span={3}>
          <div className="grid grid-cols-4 gap-4 pt-2">
            <Statistic title="抖音" value={stats.byPlatform.DOUYIN || 0} />
            <Statistic title="快手" value={stats.byPlatform.KUAISHOU || 0} />
            <Statistic title="小红书" value={stats.byPlatform.XIAOHONGSHU || 0} />
            <Statistic title="其他" value={(stats.byPlatform.WEIBO || 0) + (stats.byPlatform.OTHER || 0)} />
          </div>
        </BentoCard>

        <BentoCard title="来源质量分析" span={3} className="h-full">
          <Table
            columns={sourceQualityColumns}
            dataSource={stats.sourceQuality}
            pagination={false}
            size="small"
            rowKey="sourceType"
            className="mt-2"
          />
        </BentoCard>

        <BentoCard title="品牌达人排名 (Top 10)" span={3} className="h-full">
          <Table
            columns={factoryRankingColumns}
            dataSource={stats.topFactories}
            pagination={false}
            size="small"
            rowKey="brandId"
            className="mt-2"
          />
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
