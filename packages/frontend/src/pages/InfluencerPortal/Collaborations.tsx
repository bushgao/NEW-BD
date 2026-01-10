/**
 * 达人合作列表页
 * 
 * 显示所有合作记录，支持筛选
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Select, Space, message, Typography, Empty, Spin, Badge } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import * as influencerPortalService from '../../services/influencer-portal.service';
import type { InfluencerCollabList, InfluencerCollabItem, CollabFilter, FactoryOption } from '../../services/influencer-portal.service';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { Title, Text } = Typography;

// 阶段名称映射
const stageNames: Record<string, string> = {
  LEAD: '线索达人',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  SAMPLED: '已寄样',
  SCHEDULED: '已排期',
  PUBLISHED: '已发布',
  REVIEWED: '已复盘',
};

// 阶段颜色映射
const stageColors: Record<string, string> = {
  LEAD: 'default',
  CONTACTED: 'blue',
  QUOTED: 'cyan',
  SAMPLED: 'purple',
  SCHEDULED: 'orange',
  PUBLISHED: 'green',
  REVIEWED: 'gold',
};

const InfluencerCollaborationsPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [collaborations, setCollaborations] = useState<InfluencerCollabList | null>(null);
  const [factories, setFactories] = useState<FactoryOption[]>([]);
  const [filter, setFilter] = useState<CollabFilter>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadFactories();
    loadCollaborations();
  }, []);

  const loadFactories = async () => {
    try {
      const response = await influencerPortalService.getRelatedFactories();
      if (response.success && response.data) {
        setFactories(response.data);
      }
    } catch (error) {
      console.error('加载工厂列表失败', error);
    }
  };

  const loadCollaborations = async (newFilter?: CollabFilter) => {
    setLoading(true);
    try {
      const response = await influencerPortalService.getCollaborations(newFilter || filter);
      if (response.success && response.data) {
        setCollaborations(response.data);
      } else {
        message.error(response.error?.message || '加载失败');
      }
    } catch (error) {
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CollabFilter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    loadCollaborations(newFilter);
  };

  // 计算截止时间倒计时
  const getDeadlineDisplay = (deadline: string | null, isOverdue: boolean) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isOverdue) {
      return (
        <Badge status="error" text={<Text type="danger">已超期 {Math.abs(diffDays)} 天</Text>} />
      );
    }

    if (diffDays <= 3) {
      return (
        <Badge status="warning" text={<Text type="warning">剩余 {diffDays} 天</Text>} />
      );
    }

    return (
      <Badge status="processing" text={<Text>剩余 {diffDays} 天</Text>} />
    );
  };

  const columns = [
    {
      title: '工厂',
      dataIndex: 'factoryName',
      key: 'factoryName',
      render: (name: string) => (
        <Space>
          <TeamOutlined style={{ color: '#722ed1' }} />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: '合作阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 120,
      render: (stage: string) => (
        <Tag color={stageColors[stage] || 'default'}>{stageNames[stage] || stage}</Tag>
      ),
    },
    {
      title: '样品数量',
      dataIndex: 'sampleCount',
      key: 'sampleCount',
      width: 100,
      render: (count: number) => `${count} 件`,
    },
    {
      title: '截止时间',
      key: 'deadline',
      width: 150,
      render: (_: any, record: InfluencerCollabItem) => {
        if (!record.deadline) {
          return <Text type="secondary">未设置</Text>;
        }
        return (
          <Space direction="vertical" size={0}>
            <Text>{new Date(record.deadline).toLocaleDateString('zh-CN')}</Text>
            {getDeadlineDisplay(record.deadline, record.isOverdue)}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: InfluencerCollabItem) => (
        <a onClick={() => navigate(`/influencer-portal/collaborations/${record.id}`)}>
          查看详情
        </a>
      ),
    },
  ];

  if (loading && !collaborations) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '40px',
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
          合作进度
        </Title>

        {/* 筛选器 */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <CardContent>
            <Space wrap>
              <Select
                placeholder="选择工厂"
                allowClear
                style={{ width: 200 }}
                value={filter.factoryId}
                onChange={(value) => handleFilterChange('factoryId', value)}
                options={factories.map((f) => ({ label: f.name, value: f.id }))}
              />
              <Select
                placeholder="合作阶段"
                allowClear
                style={{ width: 120 }}
                value={filter.stage}
                onChange={(value) => handleFilterChange('stage', value)}
                options={Object.entries(stageNames).map(([value, label]) => ({
                  label,
                  value,
                }))}
              />
              <Select
                placeholder="超期状态"
                allowClear
                style={{ width: 120 }}
                value={filter.isOverdue}
                onChange={(value) => handleFilterChange('isOverdue', value)}
                options={[
                  { label: '已超期', value: true },
                  { label: '未超期', value: false },
                ]}
              />
            </Space>
          </CardContent>
        </Card>

        {/* 合作列表 */}
        <Card variant="elevated">
          <CardContent>
            {collaborations && collaborations.items.length > 0 ? (
              <Table
                dataSource={collaborations.items}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={{
                  total: collaborations.total,
                  showTotal: (total) => `共 ${total} 条合作记录`,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                }}
              />
            ) : (
              <Empty description="暂无合作记录" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InfluencerCollaborationsPage;
