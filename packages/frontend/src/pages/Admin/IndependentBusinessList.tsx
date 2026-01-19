import { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Space, message, Modal, Select, Typography, Switch, DatePicker } from 'antd';
import { SearchOutlined, TeamOutlined, LockOutlined, UnlockOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useTheme } from '../../theme/ThemeProvider';
import * as platformService from '../../services/platform.service';
import dayjs from 'dayjs';

const { Title } = Typography;

interface IndependentUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    brandId?: string;
    brand?: {
        id: string;
        name: string;
        planType: string;
        planExpiresAt?: string;
        isPaid?: boolean;
        isLocked?: boolean;
    };
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

    // 订阅编辑弹窗
    const [subModalOpen, setSubModalOpen] = useState(false);
    const [subUser, setSubUser] = useState<IndependentUser | null>(null);
    const [subExpiresAt, setSubExpiresAt] = useState<dayjs.Dayjs | null>(null);
    const [subIsPaid, setSubIsPaid] = useState(false);
    const [savingSub, setSavingSub] = useState(false);

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

    // 打开订阅编辑弹窗
    const handleEditSubscription = (user: IndependentUser) => {
        setSubUser(user);
        if (user.brand?.planExpiresAt) {
            setSubExpiresAt(dayjs(user.brand.planExpiresAt));
        } else {
            setSubExpiresAt(null);
        }
        setSubIsPaid(user.brand?.isPaid || false);
        setSubModalOpen(true);
    };

    // 保存订阅设置
    const saveSubscription = async () => {
        if (!subUser?.brand?.id) {
            message.error('用户没有关联的工作区');
            return;
        }

        setSavingSub(true);
        try {
            await platformService.updateFactory(subUser.brand.id, {
                planExpiresAt: subExpiresAt ? subExpiresAt.toISOString() : undefined,
                isPaid: subIsPaid,
            } as any);
            message.success('订阅设置保存成功');
            setSubModalOpen(false);
            loadUsers();
        } catch (error: any) {
            message.error(error.message || '保存失败');
        } finally {
            setSavingSub(false);
        }
    };

    // 计算剩余天数
    const getDaysRemaining = (expiresAt?: string) => {
        if (!expiresAt) return null;
        const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days;
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
            title: '剩余天数',
            key: 'daysRemaining',
            width: 100,
            render: (_, record) => {
                const days = getDaysRemaining(record.brand?.planExpiresAt);
                if (days === null) {
                    return <span style={{ color: '#999' }}>未设置</span>;
                }
                if (days <= 0) {
                    return <Tag color="red">已到期</Tag>;
                }
                if (days <= 5) {
                    return <Tag color="orange">{days} 天</Tag>;
                }
                if (days <= 30) {
                    return <Tag color="gold">{days} 天</Tag>;
                }
                return <span style={{ color: '#52c41a' }}>{days} 天</span>;
            },
        },
        {
            title: '锁定状态',
            key: 'isLocked',
            width: 100,
            render: (_, record) => (
                record.brand?.isLocked ? (
                    <Tag color="red" icon={<LockOutlined />}>已锁定</Tag>
                ) : (
                    <Tag color="green" icon={<UnlockOutlined />}>正常</Tag>
                )
            ),
        },
        {
            title: '付费状态',
            key: 'isPaid',
            width: 100,
            render: (_, record) => (
                record.brand?.isPaid ? (
                    <Tag color="blue">已付费</Tag>
                ) : (
                    <Tag color="default">试用中</Tag>
                )
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
            width: 280,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEditSubscription(record)}
                    >
                        订阅设置
                    </Button>
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
                    scroll={{ x: 1400 }}
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

                {/* 订阅设置弹窗 */}
                <Modal
                    title={`订阅设置 - ${subUser?.name || ''}`}
                    open={subModalOpen}
                    onOk={saveSubscription}
                    onCancel={() => setSubModalOpen(false)}
                    confirmLoading={savingSub}
                    okText="保存"
                >
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ marginBottom: 8 }}><strong>套餐到期时间：</strong></p>
                        <DatePicker
                            value={subExpiresAt}
                            onChange={setSubExpiresAt}
                            style={{ width: '100%' }}
                            placeholder="留空表示永不过期"
                            allowClear
                        />
                        <p style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                            个人版默认30天试用期，付费后延长至365天
                        </p>
                    </div>
                    <div>
                        <p style={{ marginBottom: 8 }}><strong>付费状态：</strong></p>
                        <Switch
                            checked={subIsPaid}
                            onChange={setSubIsPaid}
                            checkedChildren="已付费"
                            unCheckedChildren="试用中"
                        />
                    </div>
                </Modal>
            </div>
        </div>
    );
}
