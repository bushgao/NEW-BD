import { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Tag, Space, message, Modal } from 'antd';
import { useTheme } from '../../theme/ThemeProvider';
import { SearchOutlined, EyeOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import * as platformService from '../../services/platform.service';
import UserDetailModal from './UserDetailModal';

const { Search } = Input;
const { Option } = Select;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  brandId?: string;
  factoryName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const Users = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await platformService.listAllUsers({
        page: currentPage,
        pageSize,
        search: searchText,
        role: roleFilter || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
      });
      setUsers(response.users);
      setTotal(response.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, roleFilter, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleViewDetail = (user: User) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await platformService.toggleUserStatus(userId, !currentStatus);
      message.success(currentStatus ? '用户已禁用' : '用户已启用');
      fetchUsers();
    } catch (error) {
      console.error('切换用户状态失败:', error);
      message.error('操作失败');
    }
  };

  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户「${user.name}」吗？此操作不可恢复。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await platformService.deleteUser(user.id);
          message.success('删除成功');
          fetchUsers();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      PLATFORM_ADMIN: { label: '平台管理员', color: 'purple' },
      BRAND: { label: '品牌', color: 'blue' },
      BUSINESS: { label: '商务', color: 'green' },
      INFLUENCER: { label: '达人', color: 'cyan' },
    };
    return roleMap[role] || { label: role, color: 'default' };
  };

  const columns: ColumnsType<User> = [
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
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const { label, color } = getRoleLabel(role);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: '所属品牌',
      dataIndex: 'factoryName',
      key: 'factoryName',
      width: 150,
      render: (name: string) => name || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '从未登录',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.isActive}
            icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record.id, record.isActive)}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
          {record.role !== 'PLATFORM_ADMIN' && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleDeleteUser(record)}
            >
              删除
            </Button>
          )}
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
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Search
              placeholder="搜索姓名或邮箱"
              allowClear
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
            />
            <Select
              placeholder="角色筛选"
              allowClear
              style={{ width: 150 }}
              value={roleFilter || undefined}
              onChange={setRoleFilter}
            >
              <Option value="PLATFORM_ADMIN">平台管理员</Option>
              <Option value="BRAND">品牌</Option>
              <Option value="BUSINESS">商务</Option>
              <Option value="INFLUENCER">达人</Option>
            </Select>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Space>

          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              current: currentPage,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个用户`,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </Space>

        {selectedUser && (
          <UserDetailModal
            visible={detailModalVisible}
            user={selectedUser}
            onClose={() => {
              setDetailModalVisible(false);
              setSelectedUser(null);
            }}
            onRefresh={fetchUsers}
          />
        )}
      </div>
    </div>
  );
};

export default Users;
