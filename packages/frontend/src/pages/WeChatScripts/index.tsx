import { useState, useEffect } from 'react';
import {
    Card,
    Tabs,
    Table,
    Button,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Space,
    Popconfirm,
    message,
    Typography,
    Badge,
    Empty,
    Tooltip,
    Statistic,
    Row,
    Col,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    StarOutlined,
    StarFilled,
    ReloadOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
    getWeChatScripts,
    createWeChatScript,
    updateWeChatScript,
    deleteWeChatScript,
    setDefaultWeChatScript,
    getWeChatLogs,
    getWeChatLogsStats,
    updateWeChatLogStatus,
    retryWeChatLog,
    replaceScriptVariables,
    getScriptVariables,
    WeChatScript,
    WeChatAddLog,
    WeChatLogsStats,
    WeChatAddStatus,
} from '../../services/wechat';
import { getSamples } from '../../services/sample.service';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 支持的变量列�?
const SUPPORTED_VARIABLES = [
    { key: '{达人昵称}', desc: '达人的昵�? },
    { key: '{产品名}', desc: '选择的产品名�? },
    { key: '{品牌名}', desc: '您的品牌/工厂名称' },
    { key: '{当前日期}', desc: '今天的日�? },
    { key: '{微信号}', desc: '达人的微信号' },
];

// 状态颜色映�?
const STATUS_COLOR_MAP: Record<WeChatAddStatus, string> = {
    PENDING: 'processing',
    ACCEPTED: 'success',
    REJECTED: 'error',
    EXPIRED: 'warning',
    FAILED: 'error',
};

const STATUS_TEXT_MAP: Record<WeChatAddStatus, string> = {
    PENDING: '待通过',
    ACCEPTED: '已通过',
    REJECTED: '已拒�?,
    EXPIRED: '已过�?,
    FAILED: '添加失败',
};

const WeChatScriptsPage = () => {
    const [activeTab, setActiveTab] = useState('scripts');

    // 话术状�?
    const [scripts, setScripts] = useState<WeChatScript[]>([]);
    const [scriptsLoading, setScriptsLoading] = useState(false);
    const [scriptModalVisible, setScriptModalVisible] = useState(false);
    const [editingScript, setEditingScript] = useState<WeChatScript | null>(null);
    const [previewContent, setPreviewContent] = useState('');
    const [samples, setSamples] = useState<any[]>([]);
    const [scriptForm] = Form.useForm();

    // 日志状�?
    const [logs, setLogs] = useState<WeChatAddLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsPagination, setLogsPagination] = useState({ page: 1, pageSize: 20, total: 0 });
    const [logsStats, setLogsStats] = useState<WeChatLogsStats | null>(null);
    const [statusFilter, setStatusFilter] = useState<WeChatAddStatus | undefined>(undefined);

    // 加载话术列表
    const loadScripts = async () => {
        setScriptsLoading(true);
        try {
            const res = await getWeChatScripts();
            if (res.success) {
                setScripts(res.data);
            }
        } catch (error) {
            console.error('加载话术失败:', error);
            message.error('加载话术失败');
        } finally {
            setScriptsLoading(false);
        }
    };

    // 加载产品列表
    const loadSamples = async () => {
        try {
            const res = await getSamples();
            // getSamples 返回 PaginatedResult<Sample>，直接使�?data
            setSamples(res.data || []);
        } catch (error) {
            console.error('加载产品失败:', error);
        }
    };

    // 加载日志列表
    const loadLogs = async (page = 1) => {
        setLogsLoading(true);
        try {
            const res = await getWeChatLogs({
                status: statusFilter,
                page,
                pageSize: logsPagination.pageSize,
            });
            if (res.success) {
                setLogs(res.data.list);
                setLogsPagination({
                    page: res.data.pagination.page,
                    pageSize: res.data.pagination.pageSize,
                    total: res.data.pagination.total,
                });
            }
        } catch (error) {
            console.error('加载日志失败:', error);
            message.error('加载日志失败');
        } finally {
            setLogsLoading(false);
        }
    };

    // 加载统计数据
    const loadStats = async () => {
        try {
            const res = await getWeChatLogsStats();
            if (res.success) {
                setLogsStats(res.data);
            }
        } catch (error) {
            console.error('加载统计失败:', error);
        }
    };

    useEffect(() => {
        loadScripts();
        loadSamples();
        loadLogs();
        loadStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') {
            loadLogs();
            loadStats();
        }
    }, [statusFilter, activeTab]);

    // 打开话术编辑弹窗
    const openScriptModal = (script?: WeChatScript) => {
        setEditingScript(script || null);
        if (script) {
            scriptForm.setFieldsValue({
                name: script.name,
                content: script.content,
                sampleId: script.sampleId,
                isDefault: script.isDefault,
            });
            setPreviewContent(script.content);
        } else {
            scriptForm.resetFields();
            setPreviewContent('');
        }
        setScriptModalVisible(true);
    };

    // 保存话术
    const handleSaveScript = async () => {
        try {
            const values = await scriptForm.validateFields();

            if (editingScript) {
                await updateWeChatScript(editingScript.id, values);
                message.success('话术已更�?);
            } else {
                await createWeChatScript(values);
                message.success('话术已创�?);
            }

            setScriptModalVisible(false);
            loadScripts();
        } catch (error: any) {
            if (error.response?.data?.error?.message) {
                message.error(error.response.data.error.message);
            }
        }
    };

    // 删除话术
    const handleDeleteScript = async (id: string) => {
        try {
            await deleteWeChatScript(id);
            message.success('话术已删�?);
            loadScripts();
        } catch (error: any) {
            message.error(error.response?.data?.error?.message || '删除失败');
        }
    };

    // 设置默认话术
    const handleSetDefault = async (id: string) => {
        try {
            await setDefaultWeChatScript(id);
            message.success('已设为默�?);
            loadScripts();
        } catch (error: any) {
            message.error(error.response?.data?.error?.message || '设置失败');
        }
    };

    // 取消默认话术
    const handleCancelDefault = async (id: string) => {
        try {
            await updateWeChatScript(id, { isDefault: false });
            message.success('已取消默�?);
            loadScripts();
        } catch (error: any) {
            message.error(error.response?.data?.error?.message || '取消失败');
        }
    };

    // 更新日志状�?
    const handleUpdateLogStatus = async (id: string, status: WeChatAddStatus) => {
        try {
            await updateWeChatLogStatus(id, { status });
            message.success('状态已更新');
            loadLogs(logsPagination.page);
            loadStats();
        } catch (error: any) {
            message.error(error.response?.data?.error?.message || '更新失败');
        }
    };

    // 重试添加
    const handleRetry = async (id: string) => {
        try {
            await retryWeChatLog(id);
            message.success('已加入重试队�?);
            loadLogs(logsPagination.page);
            loadStats();
        } catch (error: any) {
            message.error(error.response?.data?.error?.message || '重试失败');
        }
    };

    // 话术内容变化时更新预�?
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const content = e.target.value;
        setPreviewContent(content);
    };

    // 话术表格列定�?
    const scriptColumns: ColumnsType<WeChatScript> = [
        {
            title: '话术名称',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    {name}
                    {record.isDefault && (
                        <Tag color="gold" icon={<StarFilled />}>
                            默认
                        </Tag>
                    )}
                </Space>
            ),
        },
        {
            title: '关联产品',
            dataIndex: 'sample',
            key: 'sample',
            render: (sample) => sample ? <Tag color="blue">{sample.name}</Tag> : <Text type="secondary">通用话术</Text>,
        },
        {
            title: '话术内容',
            dataIndex: 'content',
            key: 'content',
            width: 300,
            ellipsis: true,
            render: (content) => (
                <Tooltip title={content}>
                    <Text ellipsis style={{ maxWidth: 280 }}>{content}</Text>
                </Tooltip>
            ),
        },
        {
            title: '创建�?,
            dataIndex: 'creator',
            key: 'creator',
            render: (creator) => creator?.name || '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 280,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openScriptModal(record)}
                    >
                        编辑
                    </Button>
                    {record.isDefault ? (
                        <Button
                            type="text"
                            size="small"
                            icon={<StarFilled style={{ color: '#faad14' }} />}
                            onClick={() => handleCancelDefault(record.id)}
                        >
                            取消默认
                        </Button>
                    ) : (
                        <Button
                            type="text"
                            size="small"
                            icon={<StarOutlined />}
                            onClick={() => handleSetDefault(record.id)}
                        >
                            设为默认
                        </Button>
                    )}
                    <Popconfirm
                        title="确定删除此话术？"
                        onConfirm={() => handleDeleteScript(record.id)}
                    >
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 日志表格列定�?
    const logColumns: ColumnsType<WeChatAddLog> = [
        {
            title: '达人昵称',
            dataIndex: 'targetNickname',
            key: 'targetNickname',
        },
        {
            title: '微信�?,
            dataIndex: 'targetWechatId',
            key: 'targetWechatId',
            render: (id) => <Text copyable>{id}</Text>,
        },
        {
            title: '平台',
            dataIndex: 'targetPlatform',
            key: 'targetPlatform',
            render: (platform) => platform || '-',
        },
        {
            title: '状�?,
            dataIndex: 'status',
            key: 'status',
            render: (status: WeChatAddStatus) => (
                <Badge status={STATUS_COLOR_MAP[status] as any} text={STATUS_TEXT_MAP[status]} />
            ),
        },
        {
            title: '操作�?,
            dataIndex: 'staff',
            key: 'staff',
            render: (staff) => staff?.name || '-',
        },
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleString('zh-CN'),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_, record) => (
                <Space>
                    {record.status === 'PENDING' && (
                        <Button
                            type="link"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleUpdateLogStatus(record.id, 'ACCEPTED')}
                        >
                            标记通过
                        </Button>
                    )}
                    {record.status === 'FAILED' && record.isRetryable && record.retryCount < 3 && (
                        <Button
                            type="link"
                            size="small"
                            icon={<ReloadOutlined />}
                            onClick={() => handleRetry(record.id)}
                        >
                            重试
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6" style={{ padding: 40, margin: -24 }}>
            {/* 页面标题 */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900">话术管理</h1>
                <p className="text-neutral-500 mt-1">管理微信添加话术模板和添加记�?/p>
            </div>

            <Card className="shadow-soft rounded-2xl">
                <Tabs activeKey={activeTab} onChange={setActiveTab}>
                    {/* 话术模板 Tab */}
                    <TabPane tab="话术模板" key="scripts">
                        <div className="mb-4 flex justify-between items-center">
                            <div>
                                <Text type="secondary">
                                    �?{scripts.length} 个话术模�?
                                </Text>
                            </div>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => openScriptModal()}
                            >
                                添加话术
                            </Button>
                        </div>

                        <Table
                            columns={scriptColumns}
                            dataSource={scripts}
                            rowKey="id"
                            loading={scriptsLoading}
                            pagination={false}
                            locale={{
                                emptyText: (
                                    <Empty
                                        description="暂无话术模板"
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    >
                                        <Button type="primary" onClick={() => openScriptModal()}>
                                            创建第一个话�?
                                        </Button>
                                    </Empty>
                                ),
                            }}
                        />

                        {/* 变量说明 */}
                        <div className="mt-6 p-4 bg-surface-bg rounded-xl">
                            <Text strong className="block mb-2">💡 支持的变�?/Text>
                            <div className="flex flex-wrap gap-2">
                                {SUPPORTED_VARIABLES.map((v) => (
                                    <Tooltip key={v.key} title={v.desc}>
                                        <Tag color="blue" className="cursor-pointer">
                                            {v.key}
                                        </Tag>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>
                    </TabPane>

                    {/* 添加记录 Tab */}
                    <TabPane
                        tab={
                            <Space>
                                添加记录
                                {logsStats && logsStats.pending > 0 && (
                                    <Badge count={logsStats.pending} size="small" />
                                )}
                            </Space>
                        }
                        key="logs"
                    >
                        {/* 统计卡片 */}
                        {logsStats && (
                            <Row gutter={16} className="mb-4">
                                <Col span={4}>
                                    <Card size="small" className="text-center">
                                        <Statistic title="总计" value={logsStats.total} />
                                    </Card>
                                </Col>
                                <Col span={4}>
                                    <Card size="small" className="text-center">
                                        <Statistic
                                            title="待通过"
                                            value={logsStats.pending}
                                            valueStyle={{ color: '#1890ff' }}
                                            prefix={<ClockCircleOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col span={4}>
                                    <Card size="small" className="text-center">
                                        <Statistic
                                            title="已通过"
                                            value={logsStats.accepted}
                                            valueStyle={{ color: '#52c41a' }}
                                            prefix={<CheckCircleOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col span={4}>
                                    <Card size="small" className="text-center">
                                        <Statistic
                                            title="失败"
                                            value={logsStats.failed}
                                            valueStyle={{ color: '#ff4d4f' }}
                                            prefix={<CloseCircleOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col span={4}>
                                    <Card size="small" className="text-center">
                                        <Statistic
                                            title="可重�?
                                            value={logsStats.retryable}
                                            valueStyle={{ color: '#faad14' }}
                                            prefix={<ReloadOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col span={4}>
                                    <Card size="small" className="text-center">
                                        <Statistic
                                            title="通过�?
                                            value={logsStats.successRate}
                                            suffix="%"
                                            valueStyle={{ color: '#52c41a' }}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        )}

                        {/* 筛选和操作�?*/}
                        <div className="mb-4 flex justify-between items-center">
                            <Space>
                                <Select
                                    placeholder="状态筛�?
                                    allowClear
                                    style={{ width: 120 }}
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={[
                                        { value: 'PENDING', label: '待通过' },
                                        { value: 'ACCEPTED', label: '已通过' },
                                        { value: 'REJECTED', label: '已拒�? },
                                        { value: 'EXPIRED', label: '已过�? },
                                        { value: 'FAILED', label: '失败' },
                                    ]}
                                />
                            </Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    loadLogs();
                                    loadStats();
                                }}
                            >
                                刷新
                            </Button>
                        </div>

                        <Table
                            columns={logColumns}
                            dataSource={logs}
                            rowKey="id"
                            loading={logsLoading}
                            pagination={{
                                current: logsPagination.page,
                                pageSize: logsPagination.pageSize,
                                total: logsPagination.total,
                                showSizeChanger: true,
                                showTotal: (total) => `�?${total} 条记录`,
                                onChange: (page) => loadLogs(page),
                            }}
                            locale={{
                                emptyText: <Empty description="暂无添加记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                            }}
                        />
                    </TabPane>
                </Tabs>
            </Card>

            {/* 话术编辑弹窗 */}
            <Modal
                title={editingScript ? '编辑话术' : '添加话术'}
                open={scriptModalVisible}
                onOk={handleSaveScript}
                onCancel={() => setScriptModalVisible(false)}
                width={700}
                okText="保存"
                cancelText="取消"
            >
                <Form form={scriptForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label="话术名称"
                        rules={[{ required: true, message: '请输入话术名�? }]}
                    >
                        <Input placeholder="例如：美白精华推广话�? />
                    </Form.Item>

                    <Form.Item
                        name="sampleId"
                        label="关联产品"
                        extra="选择产品后，此话术将在添加该产品相关达人时优先展�?
                    >
                        <Select
                            placeholder="选择产品（可选）"
                            allowClear
                            options={samples.map((s) => ({ value: s.id, label: `${s.name} (${s.sku})` }))}
                        />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="话术内容"
                        rules={[{ required: true, message: '请输入话术内�? }]}
                        extra={
                            <div className="mt-2">
                                <Text type="secondary">可用变量�?/Text>
                                <Space className="mt-1" wrap>
                                    {SUPPORTED_VARIABLES.map((v) => (
                                        <Tag
                                            key={v.key}
                                            color="blue"
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const current = scriptForm.getFieldValue('content') || '';
                                                scriptForm.setFieldsValue({ content: current + v.key });
                                                setPreviewContent(current + v.key);
                                            }}
                                        >
                                            {v.key}
                                        </Tag>
                                    ))}
                                </Space>
                            </div>
                        }
                    >
                        <TextArea
                            rows={4}
                            placeholder="您好{达人昵称}，我是{品牌名}的商务，看了您的内容非常喜欢..."
                            onChange={handleContentChange}
                        />
                    </Form.Item>

                    {/* 预览 */}
                    {previewContent && getScriptVariables(previewContent).length > 0 && (
                        <div className="bg-surface-bg p-4 rounded-lg">
                            <Text strong className="block mb-2">
                                <EyeOutlined className="mr-1" />
                                预览效果
                            </Text>
                            <Paragraph className="mb-0 whitespace-pre-wrap">
                                {replaceScriptVariables(previewContent, {
                                    达人昵称: '小红',
                                    产品�? '美白精华',
                                    品牌�? '示例品牌',
                                    微信�? 'wx123456',
                                })}
                            </Paragraph>
                        </div>
                    )}
                </Form>
            </Modal>
        </div>
    );
};

export default WeChatScriptsPage;
