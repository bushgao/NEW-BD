/**
 * 达人合作详情页
 * 
 * 显示合作详情、关联样品和阶段时间线
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Tag, Table, Timeline, Button, Space, message, Typography, Spin, Empty, Badge } from 'antd';
import { ArrowLeftOutlined, GiftOutlined, CheckOutlined } from '@ant-design/icons';
import * as influencerPortalService from '../../services/influencer-portal.service';
import type { InfluencerCollabDetail, InfluencerSampleItem } from '../../services/influencer-portal.service';
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

const InfluencerCollaborationDetailPage = () => {
  const { theme } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<InfluencerCollabDetail | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDetail();
    }
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const response = await influencerPortalService.getCollaborationDetail(id!);
      if (response.success && response.data) {
        setDetail(response.data);
      } else {
        message.error(response.error?.message || '加载失败');
      }
    } catch (error) {
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async (dispatchId: string) => {
    setConfirmingId(dispatchId);
    try {
      const response = await influencerPortalService.confirmSampleReceived(dispatchId);
      if (response.success) {
        message.success('签收成功');
        loadDetail();
      } else {
        message.error(response.error?.message || '签收失败');
      }
    } catch (error) {
      message.error('签收失败，请稍后重试');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="orange">待签收</Tag>;
      case 'RECEIVED':
        return <Tag color="green">已签收</Tag>;
      case 'LOST':
        return <Tag color="red">已丢失</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const sampleColumns = [
    {
      title: '样品名称',
      dataIndex: 'sampleName',
      key: 'sampleName',
      render: (name: string, record: InfluencerSampleItem) => (
        <Space>
          <GiftOutlined style={{ color: '#722ed1' }} />
          <span>{name}</span>
          <Text type="secondary">({record.sampleSku})</Text>
        </Space>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '寄出时间',
      dataIndex: 'dispatchedAt',
      key: 'dispatchedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '快递单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 150,
      render: (num: string | null) => num || <Text type="secondary">暂无</Text>,
    },
    {
      title: '状态',
      dataIndex: 'receivedStatus',
      key: 'receivedStatus',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: InfluencerSampleItem) => {
        if (record.receivedStatus === 'PENDING') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              loading={confirmingId === record.id}
              onClick={() => handleConfirmReceived(record.id)}
              style={{ background: '#722ed1', borderColor: '#722ed1' }}
            >
              确认签收
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return <Empty description="合作记录不存在" />;
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
        <Space style={{ marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            合作详情
          </Title>
        </Space>

        {/* 基本信息 */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <CardContent>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>基本信息</Text>
            </div>
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="工厂">{detail.factoryName}</Descriptions.Item>
              <Descriptions.Item label="当前阶段">
                <Tag color={stageColors[detail.stage] || 'default'}>{stageNames[detail.stage] || detail.stage}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {detail.isOverdue ? (
                  <Badge status="error" text="已超期" />
                ) : (
                  <Badge status="success" text="正常" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {detail.deadline
                  ? new Date(detail.deadline).toLocaleDateString('zh-CN')
                  : '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(detail.createdAt).toLocaleDateString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="样品数量">
                {detail.samples.length} 件
              </Descriptions.Item>
            </Descriptions>
          </CardContent>
        </Card>

        {/* 关联样品 */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <CardContent>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>关联样品</Text>
            </div>
            {detail.samples.length > 0 ? (
              <Table
                dataSource={detail.samples}
                columns={sampleColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="暂无关联样品" />
            )}
          </CardContent>
        </Card>

        {/* 阶段时间线 */}
        <Card variant="elevated">
          <CardContent>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16 }}>阶段变更历史</Text>
            </div>
            {detail.stageHistory.length > 0 ? (
              <Timeline
                mode="left"
                items={detail.stageHistory.map((item, index) => ({
                  color: index === detail.stageHistory.length - 1 ? '#722ed1' : 'gray',
                  children: (
                    <div>
                      <Tag color={stageColors[item.stage] || 'default'}>{stageNames[item.stage] || item.stage}</Tag>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {new Date(item.changedAt).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无阶段变更记录" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InfluencerCollaborationDetailPage;
