import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal,
    Button,
    Table,
    Form,
    InputNumber,
    Select,
    Progress,
    Space,
    Tag,
    Typography,
    Alert,
    message,
    Divider,
    Card,
    Tooltip,
} from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
    getWeChatScripts,
    createWeChatLog,
    replaceScriptVariables,
    WeChatScript,
} from '../../services/wechat';

const { Text, Title } = Typography;

export interface BatchAddItem {
    id: string;
    influencerId: string;
    nickname: string;
    platform: string;
    wechatId: string;
    status: 'waiting' | 'processing' | 'success' | 'failed';
    message?: string;
}

interface BatchAddWeChatModalProps {
    visible: boolean;
    items: BatchAddItem[];
    onClose: () => void;
    onComplete: () => void;
}

// 状态配�?
const STATUS_CONFIG = {
    waiting: { color: 'default', icon: <ClockCircleOutlined />, text: '等待�? },
    processing: { color: 'processing', icon: <ReloadOutlined spin />, text: '处理�? },
    success: { color: 'success', icon: <CheckCircleOutlined />, text: '已发�? },
    failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
};

const BatchAddWeChatModal = ({
    visible,
    items: initialItems,
    onClose,
    onComplete,
}: BatchAddWeChatModalProps) => {
    const [form] = Form.useForm();
    const [scripts, setScripts] = useState<WeChatScript[]>([]);
    const [selectedScript, setSelectedScript] = useState<WeChatScript | null>(null);
    const [items, setItems] = useState<BatchAddItem[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, remaining: 0 });

    const abortRef = useRef(false);
    const pauseRef = useRef(false);

    // 加载话术
    useEffect(() => {
        if (visible) {
            loadScripts();
            setItems(initialItems);
            setStats({
                total: initialItems.length,
                success: 0,
                failed: 0,
                remaining: initialItems.length,
            });
            setCurrentIndex(0);
            setIsRunning(false);
            setIsPaused(false);
            abortRef.current = false;
            pauseRef.current = false;
        }
    }, [visible, initialItems]);

    const loadScripts = async () => {
        try {
            const res = await getWeChatScripts();
            if (res.success) {
                setScripts(res.data);
                // 默认选择默认话术
                const defaultScript = res.data.find((s: WeChatScript) => s.isDefault);
                if (defaultScript) {
                    setSelectedScript(defaultScript);
                    form.setFieldsValue({ scriptId: defaultScript.id });
                }
            }
        } catch (error) {
            console.error('加载话术失败:', error);
        }
    };

    // 延迟函数
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 执行单个添加
    const processItem = async (item: BatchAddItem, script: WeChatScript | null): Promise<boolean> => {
        try {
            // 替换变量
            const messageContent = script
                ? replaceScriptVariables(script.content, {
                    达人昵称: item.nickname,
                    产品�? script.sample?.name || '',
                    微信�? item.wechatId,
                })
                : '';

            // 调用后端创建日志（记录待添加状态）
            await createWeChatLog({
                targetWechatId: item.wechatId,
                targetNickname: item.nickname,
                targetPlatform: item.platform,
                influencerId: item.influencerId,
                scriptId: script?.id || undefined,
                noteSet: `${item.nickname}-${item.platform}`,
            });

            // 注意：实际的微信添加操作需要通过 Chrome 插件完成
            // 这里只是创建记录，用户需要在插件中触发实际添�?
            return true;
        } catch (error) {
            console.error('处理失败:', error);
            return false;
        }
    };

    // 开始批量添�?
    const handleStart = async () => {
        const values = await form.validateFields();
        const intervalMs = (values.interval || 30) * 1000;

        setIsRunning(true);
        setIsPaused(false);
        abortRef.current = false;
        pauseRef.current = false;

        const script = scripts.find(s => s.id === values.scriptId) || null;
        setSelectedScript(script);

        for (let i = currentIndex; i < items.length; i++) {
            // 检查是否中�?
            if (abortRef.current) {
                break;
            }

            // 检查是否暂�?
            while (pauseRef.current) {
                await delay(500);
                if (abortRef.current) break;
            }
            if (abortRef.current) break;

            setCurrentIndex(i);

            // 更新状态为处理�?
            setItems(prev => prev.map((item, idx) =>
                idx === i ? { ...item, status: 'processing' as const } : item
            ));

            // 执行添加
            const success = await processItem(items[i], script);

            // 更新状�?
            setItems(prev => prev.map((item, idx) =>
                idx === i
                    ? { ...item, status: success ? 'success' : 'failed', message: success ? '已发�? : '添加失败' }
                    : item
            ));

            setStats(prev => ({
                ...prev,
                success: prev.success + (success ? 1 : 0),
                failed: prev.failed + (success ? 0 : 1),
                remaining: prev.remaining - 1,
            }));

            // 如果不是最后一个，等待间隔时间
            if (i < items.length - 1 && !abortRef.current) {
                await delay(intervalMs);
            }
        }

        setIsRunning(false);
        message.success('批量添加完成');
    };

    // 暂停
    const handlePause = () => {
        pauseRef.current = true;
        setIsPaused(true);
    };

    // 继续
    const handleResume = () => {
        pauseRef.current = false;
        setIsPaused(false);
    };

    // 停止
    const handleStop = () => {
        abortRef.current = true;
        pauseRef.current = false;
        setIsRunning(false);
        setIsPaused(false);
    };

    // 重试失败�?
    const handleRetryFailed = () => {
        const failedItems = items.filter(item => item.status === 'failed');
        if (failedItems.length === 0) {
            message.info('没有失败的项�?);
            return;
        }

        // 重置失败项为等待状�?
        setItems(prev => prev.map(item =>
            item.status === 'failed' ? { ...item, status: 'waiting' as const, message: undefined } : item
        ));
        setStats(prev => ({
            ...prev,
            failed: 0,
            remaining: prev.remaining + failedItems.length,
        }));
        setCurrentIndex(items.findIndex(item => item.status === 'failed'));
    };

    // 关闭
    const handleClose = () => {
        if (isRunning) {
            Modal.confirm({
                title: '确认退出？',
                content: '批量添加正在进行中，退出将停止所有任务�?,
                onOk: () => {
                    handleStop();
                    onClose();
                },
            });
        } else {
            onComplete();
            onClose();
        }
    };

    // 表格列定�?
    const columns: ColumnsType<BatchAddItem> = [
        {
            title: '昵称',
            dataIndex: 'nickname',
            key: 'nickname',
            width: 120,
        },
        {
            title: '微信�?,
            dataIndex: 'wechatId',
            key: 'wechatId',
            width: 150,
        },
        {
            title: '平台',
            dataIndex: 'platform',
            key: 'platform',
            width: 80,
        },
        {
            title: '状�?,
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: keyof typeof STATUS_CONFIG) => {
                const config = STATUS_CONFIG[status];
                return (
                    <Tag icon={config.icon} color={config.color}>
                        {config.text}
                    </Tag>
                );
            },
        },
        {
            title: '备注',
            dataIndex: 'message',
            key: 'message',
            ellipsis: true,
        },
    ];

    const progress = stats.total > 0
        ? Math.round(((stats.success + stats.failed) / stats.total) * 100)
        : 0;

    return (
        <Modal
            title="批量添加微信好友"
            open={visible}
            onCancel={handleClose}
            width={800}
            footer={null}
            maskClosable={false}
        >
            {/* 设置区域 */}
            <Card size="small" className="mb-4">
                <Form form={form} layout="inline">
                    <Form.Item name="scriptId" label="话术模板">
                        <Select
                            style={{ width: 200 }}
                            placeholder="选择话术"
                            allowClear
                            options={scripts.map(s => ({ value: s.id, label: s.name }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="interval"
                        label="间隔时间"
                        initialValue={30}
                        tooltip="两次添加之间的等待时间（秒）"
                    >
                        <InputNumber min={10} max={300} addonAfter="�? style={{ width: 120 }} />
                    </Form.Item>
                </Form>
            </Card>

            {/* 进度区域 */}
            <Card size="small" className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <Space>
                        <Text>总计: <Text strong>{stats.total}</Text></Text>
                        <Divider type="vertical" />
                        <Text type="success">成功: <Text strong type="success">{stats.success}</Text></Text>
                        <Divider type="vertical" />
                        <Text type="danger">失败: <Text strong type="danger">{stats.failed}</Text></Text>
                        <Divider type="vertical" />
                        <Text type="secondary">剩余: {stats.remaining}</Text>
                    </Space>
                    <Space>
                        {!isRunning ? (
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={handleStart}
                                disabled={items.length === 0 || stats.remaining === 0}
                            >
                                开�?
                            </Button>
                        ) : (
                            <>
                                {isPaused ? (
                                    <Button icon={<PlayCircleOutlined />} onClick={handleResume}>
                                        继续
                                    </Button>
                                ) : (
                                    <Button icon={<PauseCircleOutlined />} onClick={handlePause}>
                                        暂停
                                    </Button>
                                )}
                                <Button danger onClick={handleStop}>
                                    停止
                                </Button>
                            </>
                        )}
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleRetryFailed}
                            disabled={isRunning || stats.failed === 0}
                        >
                            重试失败
                        </Button>
                    </Space>
                </div>
                <Progress
                    percent={progress}
                    status={isRunning ? (isPaused ? 'exception' : 'active') : progress === 100 ? 'success' : 'normal'}
                />
            </Card>

            {/* 列表区域 */}
            <Table
                columns={columns}
                dataSource={items}
                rowKey="id"
                size="small"
                pagination={false}
                scroll={{ y: 300 }}
                rowClassName={(record) =>
                    record.status === 'processing' ? 'bg-blue-50' : ''
                }
            />

            {/* 提示 */}
            <Alert
                type="warning"
                message="注意事项"
                description="每次添加后需要在微信PC端手动确认发送。建议将间隔时间设置�?30 秒以上，避免频繁操作触发风控�?
                className="mt-4"
                showIcon
            />
        </Modal>
    );
};

export default BatchAddWeChatModal;
