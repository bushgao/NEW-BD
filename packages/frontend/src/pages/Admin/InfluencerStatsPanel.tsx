import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, message } from 'antd';
import type { InfluencerStats } from '@ics/shared';
import * as platformInfluencerService from '../../services/platform-influencer.service';

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
          FACTORY: '工厂添加',
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
      title: '工厂名称',
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
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总达人数" value={stats.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未认证"
              value={stats.byVerificationStatus.UNVERIFIED || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已认证"
              value={stats.byVerificationStatus.VERIFIED || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="认证失败"
              value={stats.byVerificationStatus.REJECTED || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="来源分布">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="平台添加"
                  value={stats.bySourceType.PLATFORM || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="工厂添加"
                  value={stats.bySourceType.FACTORY || 0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="商务添加"
                  value={stats.bySourceType.STAFF || 0}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="平台分布">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="抖音"
                  value={stats.byPlatform.DOUYIN || 0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="快手"
                  value={stats.byPlatform.KUAISHOU || 0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="小红书"
                  value={stats.byPlatform.XIAOHONGSHU || 0}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="其他"
                  value={(stats.byPlatform.WEIBO || 0) + (stats.byPlatform.OTHER || 0)}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="来源质量分析">
            <Table
              columns={sourceQualityColumns}
              dataSource={stats.sourceQuality}
              pagination={false}
              size="small"
              rowKey="sourceType"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="工厂达人排名 (Top 10)">
            <Table
              columns={factoryRankingColumns}
              dataSource={stats.topFactories}
              pagination={false}
              size="small"
              rowKey="factoryId"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
