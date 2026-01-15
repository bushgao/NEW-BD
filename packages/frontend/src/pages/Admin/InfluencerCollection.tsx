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
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface InfluencerFormData {
    nickname: string;
    platform: string;
    platformId: string;
    uid?: string;
    followers?: string;
    phone?: string;
    wechat?: string;
    homeUrl?: string;
    tags?: string[];
    notes?: string;
}

interface ImportRow extends InfluencerFormData {
    key: string;
    status?: 'pending' | 'success' | 'error';
    errorMsg?: string;
}

const platformOptions = [
    { label: '抖音', value: 'DOUYIN' },
    { label: '小红书', value: 'XIAOHONGSHU' },
    { label: '快手', value: 'KUAISHOU' },
    { label: '视频号', value: 'SHIPINHAO' },
    { label: '微博', value: 'WEIBO' },
    { label: 'B站', value: 'BILIBILI' },
    { label: '淘宝', value: 'TAOBAO' },
    { label: '其他', value: 'OTHER' },
];

const InfluencerCollectionPage = () => {
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState('single');
    const [loading, setLoading] = useState(false);
    const [importData, setImportData] = useState<ImportRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

    // 加载品牌列表
    useEffect(() => {
        const loadBrands = async () => {
            try {
                const response = await api.get('/platform/factories');
                setBrands(response.data.data?.data || []);
            } catch (error) {
                console.error('Failed to load brands:', error);
            }
        };
        loadBrands();
    }, []);

    // 单独添加达人
    const handleAddSingle = async (values: InfluencerFormData) => {
        if (!selectedBrandId) {
            message.error('请先选择品牌');
            return;
        }

        setLoading(true);
        try {
            await api.post('/platform/influencers', {
                ...values,
                brandId: selectedBrandId,
                sourceType: 'PLATFORM',
            });
            message.success('添加成功');
            form.resetFields();
        } catch (error: any) {
            message.error(error.response?.data?.message || '添加失败');
        } finally {
            setLoading(false);
        }
    };

    // 解析 Excel 数据（模拟）
    const handleUpload = (_file: UploadFile) => {
        // TODO: 实际项目中使用 xlsx 库解析
        message.info('Excel 解析功能待实现，请使用模板格式');

        // 模拟导入数据
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
        return false; // 阻止自动上传
    };

    // 下载模板
    const handleDownloadTemplate = () => {
        // 创建 CSV 模板
        const headers = ['昵称', '平台', '账号ID', 'UID', '粉丝数', '手机号', '微信号', '主页', '标签', '备注'];
        const exampleRow = ['示例达人', 'DOUYIN', 'example123', 'uid001', '10000', '13800138000', 'wx123', 'https://...', '美妆;护肤', '备注内容'];
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
        if (!selectedBrandId) {
            message.error('请先选择品牌');
            return;
        }

        if (importData.length === 0) {
            message.warning('没有待导入的数据');
            return;
        }

        setImporting(true);
        let successCount = 0;
        let failCount = 0;

        for (const row of importData) {
            try {
                await api.post('/platform/influencers', {
                    ...row,
                    brandId: selectedBrandId,
                    sourceType: 'PLATFORM',
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

    // 删除导入行
    const handleRemoveRow = (key: string) => {
        setImportData(importData.filter(row => row.key !== key));
    };

    const importColumns = [
        { title: '昵称', dataIndex: 'nickname', key: 'nickname' },
        { title: '平台', dataIndex: 'platform', key: 'platform', render: (v: string) => platformOptions.find(p => p.value === v)?.label || v },
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
            background: 'linear-gradient(135deg, #0f0c29 0%, #1a1a3e 50%, #24243e 100%)',
            minHeight: '100vh',
        }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={3} style={{ margin: 0, color: '#fff' }}>🎯 达人入库</Title>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, marginBottom: 0 }}>
                        平台统一管理达人资源，支持单独添加或批量导入
                    </Paragraph>
                </Col>
            </Row>

            {/* 品牌选择 */}
            <Card
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
                    marginBottom: 24,
                }}
                bodyStyle={{ padding: 16 }}
            >
                <Space size="middle" align="center">
                    <Text style={{ color: 'rgba(255,255,255,0.85)' }}>目标品牌：</Text>
                    <Select
                        value={selectedBrandId}
                        onChange={setSelectedBrandId}
                        placeholder="选择要入库的品牌"
                        style={{ width: 300 }}
                        options={brands.map(b => ({ label: b.name, value: b.id }))}
                        showSearch
                        optionFilterProp="label"
                    />
                </Space>
            </Card>

            <Card
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16,
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
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>达人昵称</Text>}
                                                rules={[{ required: true, message: '请输入达人昵称' }]}
                                            >
                                                <Input placeholder="请输入达人昵称" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="platform"
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>平台</Text>}
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
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>平台账号ID</Text>}
                                                rules={[{ required: true, message: '请输入账号ID' }]}
                                            >
                                                <Input placeholder="请输入平台账号ID" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="uid"
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>UID</Text>}
                                            >
                                                <Input placeholder="请输入达人UID（可选）" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="followers"
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>粉丝数</Text>}
                                            >
                                                <Input placeholder="如：100000" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="phone"
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>手机号</Text>}
                                            >
                                                <Input placeholder="请输入手机号" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="wechat"
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>微信号</Text>}
                                            >
                                                <Input placeholder="请输入微信号" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="homeUrl"
                                                label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>主页链接</Text>}
                                            >
                                                <Input placeholder="请输入主页链接" />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item
                                        name="tags"
                                        label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>标签</Text>}
                                    >
                                        <Select mode="tags" placeholder="输入标签后回车" />
                                    </Form.Item>

                                    <Form.Item
                                        name="notes"
                                        label={<Text style={{ color: 'rgba(255,255,255,0.85)' }}>备注</Text>}
                                    >
                                        <TextArea rows={3} placeholder="请输入备注" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading} icon={<PlusOutlined />}>
                                            添加达人
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
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: 8,
                                        }}>
                                            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
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
        </div>
    );
};

export default InfluencerCollectionPage;
