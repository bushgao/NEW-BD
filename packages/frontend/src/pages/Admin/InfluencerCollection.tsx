import { useState, useEffect } from 'react';
import {
    Card,
    Tabs,
    Form,
    Input,
    Select,
    Button,
    Table,
    Upload,
    message,
    Space,
    Typography,
    Row,
    Col,
    Tag,
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    DownloadOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTheme } from '../../theme/ThemeProvider';
import { createGlobalInfluencer, getGlobalInfluencerList, type Platform, type GlobalInfluencer, PLATFORM_LABELS } from '../../services/global-influencer.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface InfluencerFormData {
    nickname: string;
    platform: Platform;
    platformId: string;
    uid?: string;
    followers?: string;
    phone?: string;
    wechat?: string;
    homeUrl?: string;
    notes?: string;
}

interface ImportRow {
    key: string;
    nickname: string;
    platform: Platform;
    platformId: string;
    uid?: string;
    followers?: string;
    status?: 'pending' | 'success' | 'error';
    errorMsg?: string;
}

const platformOptions = Object.entries(PLATFORM_LABELS).map(([value, label]) => ({
    label,
    value,
}));

const InfluencerCollectionPage = () => {
    const { theme } = useTheme();
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('single');
    const [loading, setLoading] = useState(false);
    const [importData, setImportData] = useState<ImportRow[]>([]);
    const [importing, setImporting] = useState(false);

    // 最近入库记录状态
    const [influencerList, setInfluencerList] = useState<GlobalInfluencer[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [timeFilter, setTimeFilter] = useState<'session' | '1h' | '24h' | 'all'>('session');
    const [sessionStartTime] = useState(new Date()); // 本次会话开始时间

    // 加载最近入库记录
    const loadInfluencerList = async (page = 1, filter = timeFilter) => {
        setListLoading(true);
        try {
            // 根据时间筛选计算 createdAfter 参数
            let createdAfter: string | undefined;
            const now = new Date();
            if (filter === 'session') {
                createdAfter = sessionStartTime.toISOString();
            } else if (filter === '1h') {
                createdAfter = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
            } else if (filter === '24h') {
                createdAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
            }
            // filter === 'all' 时不传 createdAfter

            const result = await getGlobalInfluencerList({ page, pageSize: 10, createdAfter });
            setInfluencerList(result.data);
            setTotal(result.total);
            setCurrentPage(page);
        } catch (error) {
            message.error('加载达人列表失败');
        } finally {
            setListLoading(false);
        }
    };

    // 页面加载时获取列表
    useEffect(() => {
        loadInfluencerList();
    }, []);

    // 单独添加达人到全局达人池
    const handleAddSingle = async (values: InfluencerFormData) => {
        setLoading(true);
        try {
            await createGlobalInfluencer({
                nickname: values.nickname,
                phone: values.phone,
                wechat: values.wechat,
                platformAccounts: [{
                    platform: values.platform,
                    platformId: values.platformId,
                    followers: values.followers,
                    profileUrl: values.homeUrl,
                }],
            });
            message.success('达人已添加到全局达人池');
            form.resetFields();
            // 刷新列表
            loadInfluencerList();
        } catch (error: any) {
            message.error(error.response?.data?.message || '添加失败');
        } finally {
            setLoading(false);
        }
    };

    // 解析 Excel 数据（模拟）
    const handleUpload = (_file: UploadFile) => {
        message.info('Excel 解析功能待实现，请使用模板格式');
        const mockData: ImportRow[] = [
            {
                key: '1',
                nickname: '示例达人1',
                platform: 'DOUYIN',
                platformId: 'example1',
                uid: 'uid001',
                followers: '100000',
                status: 'pending',
            },
        ];
        setImportData(mockData);
        return false;
    };

    // 下载模板
    const handleDownloadTemplate = () => {
        const headers = ['昵称', '平台', '账号ID', 'UID', '粉丝数', '手机号', '微信号', '主页', '备注'];
        const exampleRow = ['示例达人', 'DOUYIN', 'example123', 'uid001', '10000', '13800138000', 'wx123', 'https://...', '备注内容'];
        const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '达人导入模板.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    // 批量导入
    const handleBatchImport = async () => {
        if (importData.length === 0) {
            message.warning('没有待导入的数据');
            return;
        }

        setImporting(true);
        let successCount = 0;
        let failCount = 0;

        for (const row of importData) {
            try {
                await createGlobalInfluencer({
                    nickname: row.nickname,
                    platformAccounts: [{
                        platform: row.platform,
                        platformId: row.platformId,
                        followers: row.followers,
                    }],
                });
                row.status = 'success';
                successCount++;
            } catch (error: any) {
                row.status = 'error';
                row.errorMsg = error.response?.data?.message || '导入失败';
                failCount++;
            }
            setImportData([...importData]);
        }

        setImporting(false);
        message.info(`导入完成：成功 ${successCount} 条，失败 ${failCount} 条`);
    };

    const handleRemoveRow = (key: string) => {
        setImportData(importData.filter(row => row.key !== key));
    };

    const importColumns = [
        { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
        { title: '平台', dataIndex: 'platform', key: 'platform', render: (v: Platform) => PLATFORM_LABELS[v] || v },
        { title: '账号ID', dataIndex: 'platformId', key: 'platformId' },
        { title: 'UID', dataIndex: 'uid', key: 'uid' },
        { title: '粉丝数', dataIndex: 'followers', key: 'followers' },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: ImportRow) => {
                if (status === 'success') return <Tag color="success">成功</Tag>;
                if (status === 'error') return <Tag color="error" title={record.errorMsg}>失败</Tag>;
                return <Tag>待导入</Tag>;
            },
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: ImportRow) => (
                <Button type="link" danger size="small" onClick={() => handleRemoveRow(record.key)}>
                    删除
                </Button>
            ),
        },
    ];

    return (
        <div style={{
            padding: '24px',
            margin: '-24px',
            background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
            minHeight: '100vh',
        }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>🎯 达人入库</Title>
                        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                            将达人添加到全局达人池，品牌可从达人池中选择达人进行合作
                        </Paragraph>
                    </Col>
                </Row>

                <Card
                    style={{
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                    }}
                    bodyStyle={{ padding: 24 }}
                >
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: 'single',
                                label: '✏️ 单独添加',
                                children: (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleAddSingle}
                                        style={{ maxWidth: 600 }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="nickname"
                                                    label="达人昵称"
                                                    rules={[{ required: true, message: '请输入达人昵称' }]}
                                                >
                                                    <Input placeholder="请输入达人昵称" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="platform"
                                                    label="平台"
                                                    rules={[{ required: true, message: '请选择平台' }]}
                                                >
                                                    <Select placeholder="选择平台" options={platformOptions} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="platformId"
                                                    label="平台账号ID"
                                                    rules={[{ required: true, message: '请输入账号ID' }]}
                                                >
                                                    <Input placeholder="请输入平台账号ID" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="followers"
                                                    label="粉丝数"
                                                >
                                                    <Input placeholder="如：100000" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="phone"
                                                    label="手机号"
                                                >
                                                    <Input placeholder="请输入手机号" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="wechat"
                                                    label="微信号"
                                                >
                                                    <Input placeholder="请输入微信号" />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="homeUrl"
                                            label="主页链接"
                                        >
                                            <Input placeholder="请输入主页链接" />
                                        </Form.Item>

                                        <Form.Item
                                            name="notes"
                                            label="备注"
                                        >
                                            <TextArea rows={3} placeholder="请输入备注" />
                                        </Form.Item>

                                        <Form.Item>
                                            <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                                                添加到达人池
                                            </Button>
                                        </Form.Item>
                                    </Form>
                                ),
                            },
                            {
                                key: 'import',
                                label: '📥 Excel导入',
                                children: (
                                    <div>
                                        <Space style={{ marginBottom: 16 }}>
                                            <Upload
                                                accept=".xlsx,.xls,.csv"
                                                beforeUpload={handleUpload}
                                                showUploadList={false}
                                            >
                                                <Button icon={<UploadOutlined />}>选择文件</Button>
                                            </Upload>
                                            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                                                下载模板
                                            </Button>
                                            {importData.length > 0 && (
                                                <Button
                                                    type="primary"
                                                    icon={<CheckCircleOutlined />}
                                                    onClick={handleBatchImport}
                                                    loading={importing}
                                                >
                                                    确认导入 ({importData.length} 条)
                                                </Button>
                                            )}
                                        </Space>

                                        {importData.length > 0 ? (
                                            <Table
                                                columns={importColumns}
                                                dataSource={importData}
                                                size="small"
                                                pagination={false}
                                                scroll={{ x: true }}
                                            />
                                        ) : (
                                            <div style={{
                                                textAlign: 'center',
                                                padding: 60,
                                                background: '#fafafa',
                                                borderRadius: 6,
                                            }}>
                                                <Text type="secondary">
                                                    请上传 Excel 或 CSV 文件，或先下载模板填写后上传
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Card>

                {/* 最近入库记录 */}
                <Card
                    style={{
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 6,
                        marginTop: 24,
                    }}
                    bodyStyle={{ padding: 24 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={5} style={{ margin: 0 }}>📋 最近入库记录</Title>
                        <Space>
                            <Button
                                type={timeFilter === 'session' ? 'primary' : 'default'}
                                size="small"
                                onClick={() => { setTimeFilter('session'); loadInfluencerList(1, 'session'); }}
                            >
                                本次
                            </Button>
                            <Button
                                type={timeFilter === '1h' ? 'primary' : 'default'}
                                size="small"
                                onClick={() => { setTimeFilter('1h'); loadInfluencerList(1, '1h'); }}
                            >
                                1小时内
                            </Button>
                            <Button
                                type={timeFilter === '24h' ? 'primary' : 'default'}
                                size="small"
                                onClick={() => { setTimeFilter('24h'); loadInfluencerList(1, '24h'); }}
                            >
                                24小时内
                            </Button>
                            <Button
                                type={timeFilter === 'all' ? 'primary' : 'default'}
                                size="small"
                                onClick={() => { setTimeFilter('all'); loadInfluencerList(1, 'all'); }}
                            >
                                全部
                            </Button>
                        </Space>
                    </div>
                    <Table
                        loading={listLoading}
                        dataSource={influencerList}
                        rowKey="id"
                        size="small"
                        pagination={{
                            current: currentPage,
                            total: total,
                            pageSize: 10,
                            onChange: (page) => loadInfluencerList(page),
                            showTotal: (t) => `共 ${t} 条`,
                        }}
                        columns={[
                            {
                                title: '昵称',
                                dataIndex: 'nickname',
                                key: 'nickname',
                            },
                            {
                                title: '手机号',
                                dataIndex: 'phone',
                                key: 'phone',
                                render: (v: string) => v || '-',
                            },
                            {
                                title: '微信号',
                                dataIndex: 'wechat',
                                key: 'wechat',
                                render: (v: string) => v || '-',
                            },
                            {
                                title: '合作品牌数',
                                dataIndex: 'brandCount',
                                key: 'brandCount',
                                render: (v: number) => v || 0,
                            },
                            {
                                title: '入库时间',
                                dataIndex: 'createdAt',
                                key: 'createdAt',
                                render: (v: string) => v ? new Date(v).toLocaleDateString() : '-',
                            },
                        ]}
                    />
                </Card>
            </div>
        </div>
    );
};

export default InfluencerCollectionPage;
