import { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, message, Modal, Select, Typography } from 'antd';
import { SearchOutlined, TeamOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTheme } from '../../theme/ThemeProvider';
import * as platformService from '../../services/platform.service';

const { Title } = Typography;

interface IndependentUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
}

interface BrandOption {
    id: string;
    name: string;
}

export default function IndependentBusinessList() {
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<IndependentUser[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [keyword, setKeyword] = useState('');

    // 划归品牌弹窗
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IndependentUser | null>(null);
    const [brands, setBrands] = useState<BrandOption[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string>('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [page, pageSize]);

    useEffect(() => {
        loadBrands();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const result = await platformService.getIndependentBusinessUsers({
                page,
                pageSize,
                keyword: keyword || undefined,
            });
            setUsers(result.data);
            setTotal(result.total);
        } catch (error: any) {
            message.error(error.message || '加载独立商务列表失败');
        } finally {
            setLoading(false);
        }
    };

    const loadBrands = async () => {
        try {
            const result = await platformService.listFactories({ page: 1, pageSize: 100, status: 'APPROVED' });
            setBrands(result.data.map((f: any) => ({ id: f.id, name: f.name })));
        } catch (error) {
            console.error('加载品牌列表失败', error);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadUsers();
    };

    const handleAssign = (user: IndependentUser) => {
        setSelectedUser(user);
        setSelectedBrandId('');
        setAssignModalOpen(true);
    };

    const confirmAssign = async () => {
        if (!selectedUser || !selectedBrandId) {
            message.warning('请选择目标品牌');
            return;
        }

        setAssigning(true);
        try {
            await platformService.assignUserToBrand(selectedUser.id, selectedBrandId);
            message.success('商务已成功划归到品牌');
            setAssignModalOpen(false);
            loadUsers(); // 刷新列表
        } catch (error: any) {
            message.error(error.message || '划归失败');
        } finally {
            setAssigning(false);
        }
    };

    const handleDelete = (user: IndependentUser) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除商务「${user.name}」吗？此操作不可恢复。`,
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await platformService.deleteUser(user.id);
                    message.success('删除成功');
                    loadUsers();
                } catch (error: any) {
                    message.error(error.message || '删除失败');
                }
            },
        });
    };

    const columns: ColumnsType<IndependentUser> = [
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
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
            render: (phone: string) => phone || '-',
        },
        {
            title: '状态',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 80,
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
            width: 160,
            render: (date: string) => new Date(date).toLocaleString('zh-CN'),
        },
        {
            title: '最后登录',
            dataIndex: 'lastLoginAt',
            key: 'lastLoginAt',
            width: 160,
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
                        icon={<TeamOutlined />}
                        onClick={() => handleAssign(record)}
                    >
                        划归品牌
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => handleDelete(record)}
                    >
                        删除
                    </Button>
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
                <Title level={4} style={{ marginBottom: 24 }}>
                    独立商务
                </Title>
                <div style={{ marginBottom: 16 }}>
                    <Space wrap>
                        <Input
                            placeholder="搜索姓名/邮箱/手机号"
                            prefix={<SearchOutlined />}
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onPressEnter={handleSearch}
                            style={{ width: 220 }}
                            allowClear
                        />
                        <Button type="primary" onClick={handleSearch}>
                            搜索
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={users}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1000 }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条`,
                        onChange: (p, ps) => {
                            setPage(p);
                            setPageSize(ps);
                        },
                    }}
                />

                {/* 划归品牌弹窗 */}
                <Modal
                    title="划归品牌"
                    open={assignModalOpen}
                    onOk={confirmAssign}
                    onCancel={() => setAssignModalOpen(false)}
                    confirmLoading={assigning}
                    okText="确认划归"
                >
                    {selectedUser && (
                        <div style={{ marginBottom: 16 }}>
                            <p><strong>商务姓名：</strong>{selectedUser.name}</p>
                            <p><strong>邮箱：</strong>{selectedUser.email}</p>
                        </div>
                    )}
                    <div>
                        <p style={{ marginBottom: 8 }}><strong>选择目标品牌：</strong></p>
                        <Select
                            placeholder="请选择品牌"
                            style={{ width: '100%' }}
                            value={selectedBrandId || undefined}
                            onChange={setSelectedBrandId}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {brands.map((brand) => (
                                <Select.Option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                    <p style={{ color: '#999', fontSize: 12, marginTop: 12 }}>
                        划归后，该商务将隶属于所选品牌，不再显示在独立商务列表中。
                    </p>
                </Modal>
            </div>
        </div>
    );
}

