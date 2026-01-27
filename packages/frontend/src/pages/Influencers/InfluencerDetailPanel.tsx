import { useState, useEffect } from 'react';
import {
  Drawer,
  Tabs,
  Descriptions,
  Table,
  Tag,
  Spin,
  Empty,
  Typography,
  Space,
  Statistic,
  Row,
  Col,
  Timeline,
  Card as AntCard,
  message,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  WechatOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import {
  getInfluencerCollaborationHistory,
  getInfluencerROIStats,
  PLATFORM_LABELS,
  type Influencer,
} from '../../services/influencer.service';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Types
interface CollaborationHistory {
  id: string;
  stage: string;
  sampleName: string;
  businessStaffName: string;
  createdAt: string;
  updatedAt: string;
  result?: {
    salesGmv: number;
    cost: number;
    roi: number;
  };
}

interface ROIStats {
  avgROI: number;
  totalGMV: number;
  totalCost: number;
  collaborationCount: number;
  successRate: number;
  bestSample?: {
    id: string;
    name: string;
    roi: number;
    gmv: number;
  };
}

interface ContactRecord {
  id: string;
  type: 'followup' | 'note';
  content: string;
  createdBy: string;
  createdAt: string;
}

interface InfluencerDetailPanelProps {
  visible: boolean;
  influencer: Influencer | null;
  onClose: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  LEAD: '建联',
  CONTACTED: '已联系',
  QUOTED: '已报价',
  SAMPLED: '已寄样',
  SCHEDULED: '已排期',
  PUBLISHED: '已发布',
  REVIEWED: '已复盘',
};

const STAGE_COLORS: Record<string, string> = {
  LEAD: 'default',
  CONTACTED: 'blue',
  QUOTED: 'cyan',
  SAMPLED: 'orange',
  SCHEDULED: 'purple',
  PUBLISHED: 'green',
  REVIEWED: 'success',
};

const InfluencerDetailPanel: React.FC<InfluencerDetailPanelProps> = ({
  visible,
  influencer,
  onClose,
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [collaborationHistory, setCollaborationHistory] = useState<CollaborationHistory[]>([]);
  const [roiStats, setROIStats] = useState<ROIStats | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (visible && influencer) {
      fetchInfluencerDetails();
    }
  }, [visible, influencer]);

  const fetchInfluencerDetails = async () => {
    if (!influencer) return;

    setLoading(true);
    try {
      // Fetch collaboration history and ROI stats in parallel
      const [historyData, statsData] = await Promise.all([
        getInfluencerCollaborationHistory(influencer.id),
        getInfluencerROIStats(influencer.id),
      ]);

      setCollaborationHistory(historyData);
      setROIStats(statsData);
    } catch (error: any) {
      message.error(error.message || '加载达人详情失败');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // Collaboration history table columns
  const historyColumns: ColumnsType<CollaborationHistory> = [
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (stage: string) => (
        <Tag color={STAGE_COLORS[stage] || 'default'}>
          {STAGE_LABELS[stage] || stage}
        </Tag>
      ),
    },
    {
      title: '样品',
      dataIndex: 'sampleName',
      key: 'sampleName',
      ellipsis: true,
    },
    {
      title: '商务',
      dataIndex: 'businessStaffName',
      key: 'businessStaffName',
      width: 100,
    },
    {
      title: 'GMV',
      dataIndex: ['result', 'salesGmv'],
      key: 'gmv',
      width: 120,
      render: (gmv: number) => (gmv ? formatCurrency(gmv) : '-'),
    },
    {
      title: 'ROI',
      dataIndex: ['result', 'roi'],
      key: 'roi',
      width: 100,
      render: (roi: number) => {
        if (!roi) return '-';
        const color = roi > 100 ? 'green' : roi > 0 ? 'orange' : 'red';
        return <Text style={{ color }}>{formatPercent(roi)}</Text>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
  ];

  // Basic info tab
  const renderBasicInfo = () => {
    if (!influencer) return null;

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Descriptions column={1} size="small" labelStyle={{ width: 100 }} contentStyle={{ fontWeight: 500 }}>
          <Descriptions.Item label="昵称" span={2}>
            <Text strong>{influencer.nickname}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="平台">
            <Tag color="blue">{PLATFORM_LABELS[influencer.platform]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="平台账号ID">
            {influencer.platformId}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">
            {influencer.phone ? (
              <Space>
                <PhoneOutlined />
                {influencer.phone}
              </Space>
            ) : (
              <Text type="secondary">未填写</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="微信号">
            {influencer.wechat ? (
              <Space>
                <WechatOutlined />
                {influencer.wechat}
              </Space>
            ) : (
              <Text type="secondary">未填写</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="粉丝数">
            {influencer.followers ? (
              <Space>
                <TeamOutlined />
                {influencer.followers}
              </Space>
            ) : (
              <Text type="secondary">未填写</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="类目" span={2}>
            {influencer.categories && influencer.categories.length > 0 ? (
              <Space wrap>
                {influencer.categories.map((cat) => (
                  <Tag key={cat}>{cat}</Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="标签" span={2}>
            {influencer.tags && influencer.tags.length > 0 ? (
              <Space wrap>
                {influencer.tags.map((tag) => (
                  <Tag key={tag} color="blue">
                    {tag}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">未设置</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {influencer.notes ? (
              <Paragraph style={{ marginBottom: 0 }}>{influencer.notes}</Paragraph>
            ) : (
              <Text type="secondary">无备注</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatDate(influencer.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {formatDate(influencer.updatedAt)}
          </Descriptions.Item>
        </Descriptions>
      </Space>
    );
  };

  // ROI stats tab
  const renderROIStats = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (!roiStats || roiStats.collaborationCount === 0) {
      return (
        <Empty
          description="暂无合作数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Key metrics */}
        <Row gutter={16}>
          <Col span={6}>
            <AntCard>
              <Statistic
                title="平均ROI"
                value={roiStats.avgROI}
                precision={1}
                suffix="%"
                valueStyle={{ color: roiStats.avgROI > 0 ? '#3f8600' : '#cf1322' }}
                prefix={<RiseOutlined />}
              />
            </AntCard>
          </Col>
          <Col span={6}>
            <AntCard>
              <Statistic
                title="总GMV"
                value={roiStats.totalGMV}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </AntCard>
          </Col>
          <Col span={6}>
            <AntCard>
              <Statistic
                title="总成本"
                value={roiStats.totalCost}
                precision={2}
                prefix="¥"
              />
            </AntCard>
          </Col>
          <Col span={6}>
            <AntCard>
              <Statistic
                title="成功率"
                value={roiStats.successRate}
                precision={1}
                suffix="%"
                valueStyle={{ color: roiStats.successRate > 50 ? '#3f8600' : '#faad14' }}
              />
            </AntCard>
          </Col>
        </Row>

        {/* Best sample */}
        {roiStats.bestSample && (
          <AntCard title="最佳合作样品" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="样品名称">
                <Text strong>{roiStats.bestSample.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="ROI">
                <Text style={{ color: '#3f8600', fontWeight: 'bold' }}>
                  {formatPercent(roiStats.bestSample.roi)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="GMV" span={2}>
                {formatCurrency(roiStats.bestSample.gmv)}
              </Descriptions.Item>
            </Descriptions>
          </AntCard>
        )}

        {/* Collaboration summary */}
        <AntCard title="合作统计" size="small">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="合作次数">
              {roiStats.collaborationCount} 次
            </Descriptions.Item>
            <Descriptions.Item label="成功合作">
              {Math.round((roiStats.successRate / 100) * roiStats.collaborationCount)} 次
            </Descriptions.Item>
          </Descriptions>
        </AntCard>
      </Space>
    );
  };

  // Collaboration history tab
  const renderCollaborationHistory = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (collaborationHistory.length === 0) {
      return (
        <Empty
          description="暂无合作记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <Table
        columns={historyColumns}
        dataSource={collaborationHistory}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ y: 400 }}
      />
    );
  };

  // Contact history tab (placeholder for now)
  const renderContactHistory = () => {
    return (
      <Empty
        description="联系记录功能即将上线"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  };

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          <span>达人详情</span>
          {influencer && <Text type="secondary">- {influencer.nickname}</Text>}
        </Space>
      }
      placement="right"
      width={800}
      onClose={onClose}
      open={visible}
      destroyOnClose
    >
      {influencer && (
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="基本信息" key="basic">
            {renderBasicInfo()}
          </TabPane>
          <TabPane tab="ROI数据" key="roi">
            {renderROIStats()}
          </TabPane>
          <TabPane tab="合作历史" key="history">
            {renderCollaborationHistory()}
          </TabPane>
          <TabPane tab="联系记录" key="contacts">
            {renderContactHistory()}
          </TabPane>
        </Tabs>
      )}
    </Drawer>
  );
};

export default InfluencerDetailPanel;
