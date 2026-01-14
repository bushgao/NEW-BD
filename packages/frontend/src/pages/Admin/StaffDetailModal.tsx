import { useState, useEffect } from 'react';
import { Modal, Tabs, Descriptions, Statistic, Row, Col, Table, message, Spin } from 'antd';
import { UserOutlined, TeamOutlined, ProjectOutlined, TrophyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getStaffWorkStats,
  getStaffInfluencers,
  getStaffCollaborations,
  type StaffWorkStats,
} from '../../services/platform.service';
import { Card, CardContent } from '../../components/ui/Card';

interface StaffDetailModalProps {
  staffId: string | null;
  visible: boolean;
  onClose: () => void;
}

const StaffDetailModal = ({ staffId, visible, onClose }: StaffDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StaffWorkStats | null>(null);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [influencersTotal, setInfluencersTotal] = useState(0);
  const [collaborationsTotal, setCollaborationsTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('stats');

  // 加载商务统计数据
  const loadStats = async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const data = await getStaffWorkStats(staffId);
      setStats(data);
    } catch (error) {
      message.error('加载商务统计失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载达人列表
  const loadInfluencers = async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const result = await getStaffInfluencers(staffId, 1, 10);
      setInfluencers(result.data);
      setInfluencersTotal(result.total);
    } catch (error) {
      message.error('加载达人列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 加载合作列表
  const loadCollaborations = async () => {
    if (!staffId) return;

    setLoading(true);
    try {
      const result = await getStaffCollaborations(staffId, 1, 10);
      setCollaborations(result.data);
      setCollaborationsTotal(result.total);
    } catch (error) {
      message.error('加载合作列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && staffId) {
      loadStats();
      loadInfluencers();
      loadCollaborations();
    }
  }, [visible, staffId]);

  // 达人列表列定义
  const influencerColumns: ColumnsType<any> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '粉丝数',
      dataIndex: 'followersCount',
      key: 'followersCount',
      render: (count: number) => count?.toLocaleString() || '-',
    },
    {
      title: '合作次数',
      dataIndex: ['_count', 'collaborations'],
      key: 'collaborations',
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
  ];

  // 合作列表列定义
  const collaborationColumns: ColumnsType<any> = [
    {
      title: '达人',
      dataIndex: ['influencer', 'nickname'],
      key: 'influencer',
    },
    {
      title: '平台',
      dataIndex: ['influencer', 'platform'],
      key: 'platform',
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => (
        record.result ? '已完成' : '进行中'
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
  ];

  const tabItems = [
    {
      key: 'stats',
      label: '工作数据',
      children: (
        <Spin spinning={loading}>
          {stats && (
            <div>
              {/* 基本信息 */}
              <Descriptions title="基本信息" bordered column={2} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="姓名">{stats.name}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{stats.email}</Descriptions.Item>
                <Descriptions.Item label="所属品牌">{stats.factoryName}</Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {new Date(stats.createdAt).toLocaleDateString('zh-CN')}
                </Descriptions.Item>
              </Descriptions>

              {/* 工作统计 */}
              <Row gutter={16}>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="添加达人"
                        value={stats.influencersAdded}
                        prefix={<TeamOutlined />}
                        suffix="个"
                      />
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="创建合作"
                        value={stats.collaborationsCreated}
                        prefix={<ProjectOutlined />}
                        suffix="个"
                      />
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="完成合作"
                        value={stats.collaborationsCompleted}
                        prefix={<TrophyOutlined />}
                        suffix="个"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="成功率"
                        value={stats.successRate}
                        prefix={<UserOutlined />}
                        suffix="%"
                        precision={1}
                        valueStyle={{ color: stats.successRate >= 60 ? '#52c41a' : '#faad14' }}
                      />
                    </CardContent>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Spin>
      ),
    },
    {
      key: 'influencers',
      label: `达人列表 (${influencersTotal})`,
      children: (
        <Table
          columns={influencerColumns}
          dataSource={influencers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: influencersTotal,
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个达人`,
          }}
        />
      ),
    },
    {
      key: 'collaborations',
      label: `合作列表 (${collaborationsTotal})`,
      children: (
        <Table
          columns={collaborationColumns}
          dataSource={collaborations}
          rowKey="id"
          loading={loading}
          pagination={{
            total: collaborationsTotal,
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个合作`,
          }}
        />
      ),
    },
  ];

  return (
    <Modal
      title={stats ? `商务详情 - ${stats.name}` : '商务详情'}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
};

export default StaffDetailModal;
