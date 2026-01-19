import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Typography,
  Tag,
  Row,
  Col,
  Progress,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
  UserAddOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  listStaff,
  deleteStaff,
  updateStaffStatus,
  getQuotaUsage,
  type StaffMember,
  type QuotaUsage,
} from '../../services/staff-management.service';
import { Card, CardContent } from '../../components/ui/Card';
import AddStaffModal from './AddStaffModal';
import InviteStaffModal from './InviteStaffModal';
import StaffDetailModal from './StaffDetailModal';
import StaffPermissionsModal from './StaffPermissionsModal';
import { useTheme } from '../../theme/ThemeProvider';

const { Title, Text } = Typography;

const TeamPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });
  const [quotaUsage, setQuotaUsage] = useState<QuotaUsage | null>(null);

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listStaff(pagination.page, pagination.pageSize);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('获取商务账号列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  const fetchQuota = useCallback(async () => {
    try {
      const quota = await getQuotaUsage();
      setQuotaUsage(quota);
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchQuota();
  }, [fetchData, fetchQuota]);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      page: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10,
    });
  };

  const handleAdd = () => {
    if (quotaUsage?.staff.isReached) {
      message.warning('已达到商务账号数量上限，请升级套餐');
      return;
    }
    setAddModalVisible(true);
  };

  const handleAddSuccess = () => {
    setAddModalVisible(false);
    fetchData();
    fetchQuota();
    message.success('商务账号创建成功');
  };

  const handleViewDetail = (staffId: string) => {
    setSelectedStaffId(staffId);
    setDetailModalVisible(true);
  };

  const handleSetPermissions = (staff: StaffMember) => {
    setSelectedStaffId(staff.id);
    setSelectedStaffName(staff.name);
    setPermissionsModalVisible(true);
  };

  const handlePermissionsSuccess = () => {
    setPermissionsModalVisible(false);
    setSelectedStaffId(null);
    setSelectedStaffName('');
    message.success('权限更新成功，立即生效');
    fetchData();
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    const newStatus = staff.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const actionText = newStatus === 'DISABLED' ? '禁用' : '启用';

    try {
      await updateStaffStatus(staff.id, newStatus);
      message.success(`${actionText}成功`);
      fetchData();
    } catch (error) {
      message.error(`${actionText}失败`);
    }
  };

  const handleDelete = async (staffId: string) => {
    try {
      await deleteStaff(staffId);
      message.success('删除成功');
      fetchData();
      fetchQuota();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<StaffMember> = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      render: (email: string) => email?.includes('@phone.local') ? '-' : email,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (status === 'ACTIVE') {
          return <Tag color="success">正常</Tag>;
        }
        return <Tag color="default">已禁用</Tag>;
      },
    },
    {
      title: '加入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      render: (_: unknown, record: StaffMember) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            查看详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SafetyOutlined />}
            onClick={() => handleSetPermissions(record)}
          >
            权限设置
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 'ACTIVE' ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'ACTIVE' ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后该商务无法登录，但其创建的达人和合作记录将保留。此操作不可撤销，确定要删除吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '24px',
        margin: '-24px',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Title level={2}>团队管理</Title>

        {/* 配额使用情况卡片 */}
        {quotaUsage && (
          <Row gutter={16} style={{ marginBottom: 24, display: 'flex', alignItems: 'stretch' }}>
            <Col span={12}>
              <Card style={{ height: '100%' }}>
                <CardContent>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      商务账号配额
                    </Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>
                      已开通 {quotaUsage.staff.current}/{quotaUsage.staff.limit}
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round((quotaUsage.staff.current / quotaUsage.staff.limit) * 100)}
                    status={quotaUsage.staff.isReached ? 'exception' : 'active'}
                    strokeColor={quotaUsage.staff.isReached ? '#ff4d4f' : '#1890ff'}
                  />
                  {quotaUsage.staff.isReached && (
                    <Text type="danger" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                      已达上限，请升级套餐
                    </Text>
                  )}
                </CardContent>
              </Card>
            </Col>
            <Col span={12}>
              <Card style={{ height: '100%' }}>
                <CardContent>
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ fontSize: 16 }}>
                      达人数量配额
                    </Text>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>
                      已添加 {quotaUsage.influencer.current}/{quotaUsage.influencer.limit}
                    </Text>
                  </div>
                  <Progress
                    percent={Math.round(
                      (quotaUsage.influencer.current / quotaUsage.influencer.limit) * 100
                    )}
                    status={quotaUsage.influencer.isReached ? 'exception' : 'active'}
                    strokeColor={quotaUsage.influencer.isReached ? '#ff4d4f' : '#1890ff'}
                  />
                  {quotaUsage.influencer.isReached && (
                    <Text type="danger" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                      已达上限，请升级套餐
                    </Text>
                  )}
                </CardContent>
              </Card>
            </Col>
          </Row>
        )}

        {/* 配额警告横幅 */}
        {quotaUsage?.staff.isReached && (
          <Alert
            message="商务账号配额已达上限"
            description="您已达到当前套餐的商务账号数量上限，无法添加新的商务账号。请升级套餐以获取更多配额。"
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Card>
          <CardContent>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <Text type="secondary">
                  共 {total} 个商务账号
                  {quotaUsage && ` (配额: ${quotaUsage.staff.current}/${quotaUsage.staff.limit})`}
                </Text>
              </div>
              <Space>
                <Button
                  icon={<UserAddOutlined />}
                  onClick={() => setInviteModalVisible(true)}
                >
                  邀请商务
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                  disabled={quotaUsage?.staff.isReached}
                >
                  添加商务账号
                </Button>
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.page,
                pageSize: pagination.pageSize,
                total,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={handleTableChange}
            />
          </CardContent>
        </Card>

        {/* 添加商务账号弹窗 */}
        <AddStaffModal
          visible={addModalVisible}
          onCancel={() => setAddModalVisible(false)}
          onSuccess={handleAddSuccess}
        />

        {/* 邀请商务弹窗 */}
        <InviteStaffModal
          visible={inviteModalVisible}
          onCancel={() => setInviteModalVisible(false)}
        />

        {/* 商务账号详情弹窗 */}
        {selectedStaffId && (
          <StaffDetailModal
            visible={detailModalVisible}
            staffId={selectedStaffId}
            onCancel={() => {
              setDetailModalVisible(false);
              setSelectedStaffId(null);
            }}
          />
        )}

        {/* 权限设置弹窗 */}
        {selectedStaffId && (
          <StaffPermissionsModal
            visible={permissionsModalVisible}
            staffId={selectedStaffId}
            staffName={selectedStaffName}
            onCancel={() => {
              setPermissionsModalVisible(false);
              setSelectedStaffId(null);
              setSelectedStaffName('');
            }}
            onSuccess={handlePermissionsSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default TeamPage;
