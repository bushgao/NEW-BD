/**
 * 达人样品列表页
 * 
 * 按工厂分组显示样品，支持筛选和确认签收
 */

import { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, DatePicker, Space, message, Modal, Collapse, Typography, Empty, Spin } from 'antd';
import { CheckOutlined, GiftOutlined } from '@ant-design/icons';
import * as influencerPortalService from '../../services/influencer-portal.service';
import type { InfluencerSampleList, InfluencerSampleItem, SampleFilter, FactoryOption } from '../../services/influencer-portal.service';
import dayjs from 'dayjs';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const InfluencerSamplesPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState<InfluencerSampleList | null>(null);
  const [factories, setFactories] = useState<FactoryOption[]>([]);
  const [filter, setFilter] = useState<SampleFilter>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    loadFactories();
    loadSamples();
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

  const loadSamples = async (newFilter?: SampleFilter) => {
    setLoading(true);
    try {
      const response = await influencerPortalService.getSamples(newFilter || filter);
      if (response.success && response.data) {
        setSamples(response.data);
      } else {
        message.error(response.error?.message || '加载失败');
      }
    } catch (error) {
      message.error('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SampleFilter, value: any) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    loadSamples(newFilter);
  };

  const handleDateRangeChange = (dates: any) => {
    const newFilter = {
      ...filter,
      startDate: dates?.[0]?.toISOString(),
      endDate: dates?.[1]?.toISOString(),
    };
    setFilter(newFilter);
    loadSamples(newFilter);
  };

  const handleConfirmReceived = async (dispatchId: string) => {
    Modal.confirm({
      title: '确认签收',
      content: '确认已收到该样品吗？',
      okText: '确认签收',
      cancelText: '取消',
      onOk: async () => {
        setConfirmingId(dispatchId);
        try {
          const response = await influencerPortalService.confirmSampleReceived(dispatchId);
          if (response.success) {
            message.success('签收成功');
            loadSamples();
          } else {
            message.error(response.error?.message || '签收失败');
          }
        } catch (error) {
          message.error('签收失败，请稍后重试');
        } finally {
          setConfirmingId(null);
        }
      },
    });
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

  const columns = [
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
        if (record.receivedStatus === 'RECEIVED' && record.receivedAt) {
          return (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(record.receivedAt).toLocaleDateString('zh-CN')} 签收
            </Text>
          );
        }
        return null;
      },
    },
  ];

  if (loading && !samples) {
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
        <Title level={4} style={{ marginBottom: 24 }}>
          我的样品
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
                placeholder="签收状态"
                allowClear
                style={{ width: 120 }}
                value={filter.receivedStatus}
                onChange={(value) => handleFilterChange('receivedStatus', value)}
                options={[
                  { label: '待签收', value: 'PENDING' },
                  { label: '已签收', value: 'RECEIVED' },
                  { label: '已丢失', value: 'LOST' },
                ]}
              />
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                onChange={handleDateRangeChange}
                value={
                  filter.startDate && filter.endDate
                    ? [dayjs(filter.startDate), dayjs(filter.endDate)]
                    : undefined
                }
              />
            </Space>
          </CardContent>
        </Card>

        {/* 按工厂分组显示 */}
        {samples && samples.groupedByFactory.length > 0 ? (
          <Collapse
            defaultActiveKey={samples.groupedByFactory.map((g) => g.factoryId)}
            items={samples.groupedByFactory.map((group) => ({
              key: group.factoryId,
              label: (
                <Space>
                  <span>{group.factoryName}</span>
                  <Tag>{group.samples.length} 件样品</Tag>
                </Space>
              ),
              children: (
                <Table
                  dataSource={group.samples}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  loading={loading}
                />
              ),
            }))}
          />
        ) : (
          <Card variant="elevated">
            <CardContent>
              <Empty description="暂无样品记录" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InfluencerSamplesPage;
