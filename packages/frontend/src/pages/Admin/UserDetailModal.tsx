import { useState, useEffect } from 'react';
import { Modal, Tabs, Descriptions, Card, Row, Col, Statistic, Table, Tag, message } from 'antd';
import { TeamOutlined, ProjectOutlined, TrophyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as platformService from '../../services/platform.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  factoryId?: string;
  factoryName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserDetailModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onRefresh?: () => void;
}

interface UserWorkStats {
  influencersAdded: number;
  collaborationsCreated: number;
  collaborationsCompleted: number;
  successRate: number;
}

interface Influencer {
  id: string;
  name: string;
  platform: string;
  followersCount: number;
  createdAt: string;
}

interface Collaboration {
  id: string;
  influencerName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

const UserDetailModal = ({ visible, user, onClose, onRefresh }: UserDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [workStats, setWorkStats] = useState<UserWorkStats | null>(null);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [influencersPage, setInfluencersPage] = useState(1);
  const [collaborationsPage, setCollaborationsPage] = useState(1);
  const [influencersTotal, setInfluencersTotal] = useState(0);
  const [collaborationsTotal, setCollaborationsTotal] = useState(0);

  useEffect(() => {
    if (visible && user.role === 'BUSINESS') {
      fetchWorkStats();
      fetchInfluencers(1);
      fetchCollaborations(1);
    }
  }, [visible, user]);

  const fetchWorkStats = async () => {
    try {
      const stats = await platformService.getStaffWorkStats(user.id);
      setWorkStats(stats);
    } catch (error) {
      console.error('获取工作统计失败:', error);
      message.error('获取工作统计失败');
    }
  };

  const fetchInfluencers = async (page: number) => {
    setLoading(true);
    try {
      const response = await platformService.getStaffInfluencers(user.id, { page, pageSize: 10 });
      setInfluencers(response.data || []);
      setInfluencersTotal(response.total || 0);
      setInfluencersPage(page);
    } catch (error) {
      console.error('获取达人列表失败:', error);
      message.error('获取达人列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborations = async (page: number) => {
    setLoading(true);
    try {
      const response = await platformService.getStaffCollaborations(user.id, { page, pageSize: 10 });
      setCollaborations(response.data || []);
      setCollaborationsTotal(response.total || 0);
      setCollaborationsPage(page);
    } catch (error) {
      console.error('获取合作列表失败:', error);
      message.error('获取合作列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      PLATFORM_ADMIN: '平台管理员',
      BRAND: '品牌',
      BUSINESS: '商务',
    };
    return roleMap[role] || role;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: '待确认', color: 'default' },
      CONFIRMED: { label: '已确认', color: 'blue' },
      SAMPLE_SENT: { label: '样品已发', color: 'cyan' },
      CONTENT_CREATED: { label: '内容已创建', color: 'purple' },
      PUBLISHED: { label: '已发布', color: 'green' },
      COMPLETED: { label: '已完成', color: 'success' },
      CANCELLED: { label: '已取消', color: 'error' },
    };
    return statusMap[status] || { label: status, color: 'default' };
  };

  const influencerColumns: ColumnsType<Influencer> = [
    {
      title: '达人名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => <Tag>{platform}</Tag>,
    },
    {
      title: '粉丝数',
      dataIndex: 'followersCount',
      key: 'followersCount',
      render: (count: number) => count?.toLocaleString() || '-',
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
  ];

  const collaborationColumns: ColumnsType<Collaboration> = [
    {
      title: '达人名称',
      dataIndex: 'influencerName',
      key: 'influencerName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const { label, color } = getStatusLabel(status);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
    },
  ];

  const basicInfoTab = (
    <Descriptions bordered column={2}>
      <Descriptions.Item label="姓名">{user.name}</Descriptions.Item>
      <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
      <Descriptions.Item label="角色">{getRoleLabel(user.role)}</Descriptions.Item>
      <Descriptions.Item label="所属工厂">{user.factoryName || '-'}</Descriptions.Item>
      <Descriptions.Item label="账号状态">
        <Tag color={user.isActive ? 'success' : 'error'}>
          {user.isActive ? '启用' : '禁用'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="注册时间">
        {new Date(user.createdAt).toLocaleString('zh-CN')}
      </Descriptions.Item>
      <Descriptions.Item label="最后登录">
        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
      </Descriptions.Item>
    </Descriptions>
  );

  const workStatsTab = user.role === 'BUSINESS' ? (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="添加达人数"
              value={workStats?.influencersAdded || 0}
              prefix={<TeamOutlined />}
              suffix="个"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="创建合作数"
              value={workStats?.collaborationsCreated || 0}
              prefix={<ProjectOutlined />}
              suffix="个"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="完成合作数"
              value={workStats?.collaborationsCompleted || 0}
              prefix={<TrophyOutlined />}
              suffix="个"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="成功率"
              value={workStats?.successRate || 0}
              suffix="%"
              precision={1}
            />
          </Col>
        </Row>
      </Card>
    </div>
  ) : (
    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
      该角色无工作数据统计
    </div>
  );

  const influencersTab = user.role === 'BUSINESS' ? (
    <Table
      columns={influencerColumns}
      dataSource={influencers}
      rowKey="id"
      loading={loading}
      pagination={{
        current: influencersPage,
        pageSize: 10,
        total: influencersTotal,
        showTotal: (total) => `共 ${total} 个达人`,
        onChange: fetchInfluencers,
      }}
    />
  ) : (
    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
      该角色无达人数据
    </div>
  );

  const collaborationsTab = user.role === 'BUSINESS' ? (
    <Table
      columns={collaborationColumns}
      dataSource={collaborations}
      rowKey="id"
      loading={loading}
      pagination={{
        current: collaborationsPage,
        pageSize: 10,
        total: collaborationsTotal,
        showTotal: (total) => `共 ${total} 个合作`,
        onChange: fetchCollaborations,
      }}
    />
  ) : (
    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
      该角色无合作数据
    </div>
  );

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: basicInfoTab,
    },
    {
      key: 'stats',
      label: '工作数据',
      children: workStatsTab,
    },
    {
      key: 'influencers',
      label: '达人列表',
      children: influencersTab,
    },
    {
      key: 'collaborations',
      label: '合作列表',
      children: collaborationsTab,
    },
  ];

  return (
    <Modal
      title={`用户详情 - ${user.name}`}
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <Tabs items={tabItems} />
    </Modal>
  );
};

export default UserDetailModal;
