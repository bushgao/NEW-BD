import React, { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Button,
    Switch,
    Modal,
    Form,
    Input,
    message,
    Tag,
    Space,
    Typography,
    Spin,
    Empty,
    Tooltip,
} from 'antd';
import {
    EditOutlined,
    BellOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface NotificationTemplate {
    id: string;
    type: string;
    title: string;
    content: string;
    isEnabled: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

// 通知类型标签配置
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    WELCOME: { label: '欢迎消息', color: 'green' },
    DEADLINE_APPROACHING: { label: '到期提醒', color: 'orange' },
    DEADLINE_OVERDUE: { label: '超期警告', color: 'red' },
    SAMPLE_NOT_RECEIVED: { label: '样品未签收', color: 'purple' },
    RESULT_NOT_RECORDED: { label: '结果待录入', color: 'blue' },
};

const NotificationSettings: React.FC = () => {
    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate | null>(null);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    // 加载模板列表
    const loadTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notification-templates');
            if (response.data.success) {
                setTemplates(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
            message.error('加载通知模板失败');
        } finally {
            setLoading(false);
        }
    };

    // 初始化默认模板
    const seedTemplates = async () => {
        try {
            setLoading(true);
            await api.post('/notification-templates/seed');
            message.success('默认模板初始化成功');
            loadTemplates();
        } catch (error) {
            console.error('Failed to seed templates:', error);
            message.error('初始化模板失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    // 打开编辑弹窗
    const handleEdit = (template: NotificationTemplate) => {
        setCurrentTemplate(template);
        form.setFieldsValue({
            title: template.title,
            content: template.content,
        });
        setEditModalVisible(true);
    };

    // 打开预览弹窗
    const handlePreview = (template: NotificationTemplate) => {
        setCurrentTemplate(template);
        setPreviewModalVisible(true);
    };

    // 保存模板
    const handleSave = async () => {
        if (!currentTemplate) return;

        try {
            const values = await form.validateFields();
            setSaving(true);

            await api.put(`/notification-templates/${currentTemplate.type}`, {
                title: values.title,
                content: values.content,
            });

            message.success('模板保存成功');
            setEditModalVisible(false);
            loadTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
            message.error('保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 切换启用状态
    const handleToggleEnabled = async (template: NotificationTemplate) => {
        try {
            await api.put(`/notification-templates/${template.type}`, {
                isEnabled: !template.isEnabled,
            });

            message.success(`通知已${template.isEnabled ? '禁用' : '启用'}`);
            loadTemplates();
        } catch (error) {
            console.error('Failed to toggle template:', error);
            message.error('操作失败');
        }
    };

    const columns = [
        {
            title: '通知类型',
            dataIndex: 'type',
            key: 'type',
            width: 150,
            render: (type: string) => {
                const config = TYPE_CONFIG[type] || { label: type, color: 'default' };
                return <Tag color={config.color}>{config.label}</Tag>;
            },
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            render: (title: string) => (
                <Text strong style={{ fontSize: 14 }}>
                    {title}
                </Text>
            ),
        },
        {
            title: '内容预览',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (content: string) => (
                <Text type="secondary" style={{ fontSize: 13 }}>
                    {content.substring(0, 50)}...
                </Text>
            ),
        },
        {
            title: '状态',
            dataIndex: 'isEnabled',
            key: 'isEnabled',
            width: 100,
            render: (isEnabled: boolean, record: NotificationTemplate) => (
                <Switch
                    checked={isEnabled}
                    onChange={() => handleToggleEnabled(record)}
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<CloseCircleOutlined />}
                />
            ),
        },
        {
            title: '操作',
            key: 'actions',
            width: 150,
            render: (_: unknown, record: NotificationTemplate) => (
                <Space>
                    <Tooltip title="预览">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(record)}
                        />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card
                title={
                    <Space>
                        <BellOutlined style={{ fontSize: 20, color: '#6366f1' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            消息通知设置
                        </Title>
                    </Space>
                }
                extra={
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={loadTemplates}>
                            刷新
                        </Button>
                        {templates.length === 0 && (
                            <Button type="primary" onClick={seedTemplates}>
                                初始化默认模板
                            </Button>
                        )}
                    </Space>
                }
            >
                <Paragraph type="secondary" style={{ marginBottom: 24 }}>
                    配置系统发送给用户的各类通知消息内容。您可以编辑通知的标题和内容，或禁用特定类型的通知。
                </Paragraph>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : templates.length === 0 ? (
                    <Empty
                        description="暂无通知模板"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                        <Button type="primary" onClick={seedTemplates}>
                            初始化默认模板
                        </Button>
                    </Empty>
                ) : (
                    <Table
                        columns={columns}
                        dataSource={templates}
                        rowKey="id"
                        pagination={false}
                    />
                )}
            </Card>

            {/* 编辑弹窗 */}
            <Modal
                title={
                    <Space>
                        <EditOutlined />
                        <span>编辑通知模板</span>
                        {currentTemplate && (
                            <Tag color={TYPE_CONFIG[currentTemplate.type]?.color || 'default'}>
                                {TYPE_CONFIG[currentTemplate.type]?.label || currentTemplate.type}
                            </Tag>
                        )}
                    </Space>
                }
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                onOk={handleSave}
                confirmLoading={saving}
                width={600}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="title"
                        label="通知标题"
                        rules={[{ required: true, message: '请输入通知标题' }]}
                    >
                        <Input placeholder="输入通知标题" />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="通知内容"
                        rules={[{ required: true, message: '请输入通知内容' }]}
                        extra="支持变量：{{influencerName}}(达人名称)，{{deadline}}(截止日期)"
                    >
                        <TextArea
                            rows={6}
                            placeholder="输入通知内容"
                            style={{ fontFamily: 'monospace' }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 预览弹窗 */}
            <Modal
                title="通知预览"
                open={previewModalVisible}
                onCancel={() => setPreviewModalVisible(false)}
                footer={null}
                width={500}
            >
                {currentTemplate && (
                    <div
                        style={{
                            padding: 20,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 12,
                            color: 'white',
                        }}
                    >
                        <div style={{ marginBottom: 12 }}>
                            <Tag color={TYPE_CONFIG[currentTemplate.type]?.color || 'default'}>
                                {TYPE_CONFIG[currentTemplate.type]?.label || currentTemplate.type}
                            </Tag>
                        </div>
                        <Title level={4} style={{ color: 'white', marginBottom: 12 }}>
                            {currentTemplate.title}
                        </Title>
                        <Paragraph style={{ color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
                            {currentTemplate.content}
                        </Paragraph>
                        {currentTemplate.metadata?.showQrCode && (
                            <div
                                style={{
                                    marginTop: 16,
                                    padding: 16,
                                    background: 'white',
                                    borderRadius: 8,
                                    textAlign: 'center',
                                }}
                            >
                                <img
                                    src={currentTemplate.metadata.qrCodeUrl as string}
                                    alt="WeChat QR"
                                    style={{ maxWidth: 150, borderRadius: 8 }}
                                />
                                <div style={{ color: '#666', fontSize: 12, marginTop: 8 }}>
                                    扫码添加微信
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default NotificationSettings;
