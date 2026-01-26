import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Steps,
    Alert,
    Space,
    Typography,
    Spin,
    Select,
    Form,
    Input,
    Result,
    message,
} from 'antd';
import {
    WechatOutlined,
    CheckCircleOutlined,
    LoadingOutlined,
    WarningOutlined,
    RocketOutlined,
} from '@ant-design/icons';
import {
    isPluginAvailable,
    waitForPlugin,
    checkNativeHostConnection,
    checkWeChatStatus,
    getWeChatWindows,
    addWeChatFriend,
    searchWeChatList,
    fillFriendInfo,
} from '../../services/wechat-bridge';
import { getWeChatScripts, replaceScriptVariables, WeChatScript } from '../../services/wechat';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface AddWeChatModalProps {
    visible: boolean;
    onClose: () => void;
    influencerId: string;
    wechatId: string;
    nickname: string;
    platform: string;
    onSuccess?: () => void;
}

type StepStatus = 'wait' | 'process' | 'finish' | 'error';

const AddWeChatModal = ({
    visible,
    onClose,
    influencerId,
    wechatId,
    nickname,
    platform,
    onSuccess,
}: AddWeChatModalProps) => {
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [stepStatus, setStepStatus] = useState<StepStatus[]>(['wait', 'wait', 'wait', 'wait']);
    const [loading, setLoading] = useState(false);
    const [scripts, setScripts] = useState<WeChatScript[]>([]);
    const [selectedScript, setSelectedScript] = useState<WeChatScript | null>(null);
    const [wechatWindows, setWechatWindows] = useState<Array<{ title: string; handle: number; display_name?: string }>>([]);
    const [selectedWindow, setSelectedWindow] = useState<number | null>(null);
    const [resultMessage, setResultMessage] = useState('');
    const [resultSuccess, setResultSuccess] = useState(false);

    // Check states
    const [pluginOk, setPluginOk] = useState(false);
    const [nativeHostOk, setNativeHostOk] = useState(false);
    const [wechatOk, setWechatOk] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Operation phase: 'search' | 'fill' | 'done'
    const [operationPhase, setOperationPhase] = useState<'search' | 'fill' | 'done'>('search');

    // Initialize
    useEffect(() => {
        if (visible) {
            resetState();
            runChecks();
            loadScripts();
        }
    }, [visible]);

    const resetState = () => {
        setCurrentStep(0);
        setStepStatus(['wait', 'wait', 'wait', 'wait']);
        setPluginOk(false);
        setNativeHostOk(false);
        setWechatOk(false);
        setErrorMessage('');
        setResultMessage('');
        setSelectedWindow(null);
        setOperationPhase('search');
    };

    const updateStepStatus = (index: number, status: StepStatus) => {
        setStepStatus(prev => {
            const newStatus = [...prev];
            newStatus[index] = status;
            return newStatus;
        });
    };

    const loadScripts = () => {
        const scripts = getWeChatScripts();
        setScripts(scripts);
        if (scripts.length > 0) {
            setSelectedScript(scripts[0]);
            const defaultMessage = replaceScriptVariables(scripts[0].content, { nickname, platform });
            form.setFieldsValue({ message: defaultMessage });
        }
    };

    const runChecks = async () => {
        setLoading(true);

        // Step 1: Check plugin
        setCurrentStep(0);
        updateStepStatus(0, 'process');

        const pluginAvailable = await isPluginAvailable();
        if (!pluginAvailable) {
            updateStepStatus(0, 'error');
            setErrorMessage('Chrome扩展未安装或未启用');
            setLoading(false);
            return;
        }

        updateStepStatus(0, 'finish');
        setPluginOk(true);

        // Step 2: Check native host
        setCurrentStep(1);
        updateStepStatus(1, 'process');

        const nativeHostResult = await checkNativeHostConnection();
        if (!nativeHostResult.connected) {
            updateStepStatus(1, 'error');
            setErrorMessage(nativeHostResult.message || 'Native Host未连接');
            setLoading(false);
            return;
        }

        updateStepStatus(1, 'finish');
        setNativeHostOk(true);

        // Step 3: Check WeChat
        setCurrentStep(2);
        updateStepStatus(2, 'process');

        const wechatStatus = await checkWeChatStatus();
        if (!wechatStatus.available) {
            updateStepStatus(2, 'error');
            setErrorMessage('微信未登录或未运行');
            setLoading(false);
            return;
        }

        // Get WeChat windows
        const windows = await getWeChatWindows();
        setWechatWindows(windows);
        if (windows.length > 0) {
            setSelectedWindow(windows[0].handle);
        }

        updateStepStatus(2, 'finish');
        setWechatOk(true);

        // Step 4: Ready
        setCurrentStep(3);
        updateStepStatus(3, 'finish');

        setLoading(false);
    };

    const handleScriptChange = (scriptId: string) => {
        const script = scripts.find(s => s.id === scriptId);
        if (script) {
            setSelectedScript(script);
            const newMessage = replaceScriptVariables(script.content, { nickname, platform });
            form.setFieldsValue({ message: newMessage });
        }
    };

    const handleAddFriend = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const result = await addWeChatFriend({
                wechatId,
                nickname,
                platform,
                message: values.message,
                remark: values.remark || nickname,
                hwnd: selectedWindow || undefined,
            });

            setResultSuccess(result.success);
            setResultMessage(result.message);
            setOperationPhase('done');

            if (result.success) {
                message.success('好友请求已发送');
                onSuccess?.();
            } else {
                message.error(result.message || '添加失败');
            }
        } catch (error) {
            setResultSuccess(false);
            setResultMessage(error instanceof Error ? error.message : '操作失败');
            setOperationPhase('done');
        } finally {
            setLoading(false);
        }
    };

    const handleStepByStep = async () => {
        try {
            setLoading(true);

            if (operationPhase === 'search') {
                // Step 1: Search WeChat ID
                const searchResult = await searchWeChatList(wechatId, selectedWindow || undefined);
                if (searchResult.success) {
                    message.success('已搜索，请在微信中点击搜索结果');
                    setOperationPhase('fill');
                } else {
                    message.error(searchResult.message || '搜索失败');
                }
            } else if (operationPhase === 'fill') {
                // Step 2: Fill friend info
                const values = await form.validateFields();
                const fillResult = await fillFriendInfo({
                    message: values.message,
                    remark: values.remark || nickname,
                    hwnd: selectedWindow || undefined,
                });

                if (fillResult.success) {
                    message.success('信息已填写，请在微信中确认发送');
                    setOperationPhase('done');
                    setResultSuccess(true);
                    setResultMessage('好友请求已准备就绪');
                } else {
                    message.error(fillResult.message || '填写失败');
                }
            }
        } catch (error) {
            message.error(error instanceof Error ? error.message : '操作失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <WechatOutlined style={{ color: '#07c160', fontSize: 20 }} />
                    <span>添加微信好友</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={520}
            destroyOnClose
        >
            {/* Target info */}
            <Alert
                message={`目标: ${nickname}`}
                description={`微信号: ${wechatId}`}
                type="info"
                showIcon
                icon={<WechatOutlined />}
                style={{ marginBottom: 16 }}
            />

            {/* Status checks */}
            <Steps
                current={currentStep}
                size="small"
                style={{ marginBottom: 24 }}
                items={[
                    { title: '插件', status: stepStatus[0], icon: stepStatus[0] === 'process' ? <LoadingOutlined /> : undefined },
                    { title: '连接', status: stepStatus[1], icon: stepStatus[1] === 'process' ? <LoadingOutlined /> : undefined },
                    { title: '微信', status: stepStatus[2], icon: stepStatus[2] === 'process' ? <LoadingOutlined /> : undefined },
                    { title: '就绪', status: stepStatus[3], icon: stepStatus[3] === 'finish' ? <RocketOutlined /> : undefined },
                ]}
            />

            {/* Error message */}
            {errorMessage && (
                <Alert
                    message="检查失败"
                    description={errorMessage}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* Ready state - show form */}
            {wechatOk && operationPhase !== 'done' && (
                <Form form={form} layout="vertical">
                    {/* WeChat window selector */}
                    {wechatWindows.length > 1 && (
                        <Form.Item label="选择微信窗口">
                            <Select
                                value={selectedWindow}
                                onChange={setSelectedWindow}
                                options={wechatWindows.map(w => ({
                                    value: w.handle,
                                    label: w.display_name || w.title,
                                }))}
                            />
                        </Form.Item>
                    )}

                    {/* Script selector */}
                    <Form.Item label="验证消息模板">
                        <Select
                            value={selectedScript?.id}
                            onChange={handleScriptChange}
                            options={scripts.map(s => ({
                                value: s.id,
                                label: s.name,
                            }))}
                        />
                    </Form.Item>

                    {/* Message input */}
                    <Form.Item
                        name="message"
                        label="验证消息"
                        rules={[{ required: true, message: '请输入验证消息' }]}
                    >
                        <TextArea rows={3} placeholder="请输入验证消息" />
                    </Form.Item>

                    {/* Remark */}
                    <Form.Item name="remark" label="备注名">
                        <Input placeholder={nickname} />
                    </Form.Item>

                    {/* Action buttons */}
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onClose}>取消</Button>
                        <Button
                            type="primary"
                            onClick={handleAddFriend}
                            loading={loading}
                            icon={<WechatOutlined />}
                        >
                            一键添加
                        </Button>
                        <Button
                            onClick={handleStepByStep}
                            loading={loading}
                        >
                            {operationPhase === 'search' ? '步骤1: 搜索' : '步骤2: 填写信息'}
                        </Button>
                    </Space>
                </Form>
            )}

            {/* Result state */}
            {operationPhase === 'done' && (
                <Result
                    status={resultSuccess ? 'success' : 'error'}
                    title={resultSuccess ? '操作成功' : '操作失败'}
                    subTitle={resultMessage}
                    extra={[
                        <Button key="close" onClick={onClose}>
                            关闭
                        </Button>,
                    ]}
                />
            )}

            {/* Loading state */}
            {loading && currentStep < 3 && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">正在检查环境...</Text>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AddWeChatModal;
