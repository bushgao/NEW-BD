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
    sendToPlugin,
    searchWechat,
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

    // 检查状�?
    const [pluginOk, setPluginOk] = useState(false);
    const [nativeHostOk, setNativeHostOk] = useState(false);
    const [wechatOk, setWechatOk] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 分步操作阶段: 'search' | 'fill' | 'done'
    const [operationPhase, setOperationPhase] = useState<'search' | 'fill' | 'done'>('search');

    // 初始化检�?
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
    };

    const updateStepStatus = (index: number, status: StepStatus) => {
        setStepStatus(prev => {
            const newStatus = [...prev];
            newStatus[index] = status;
            return newStatus;
        });
    };

    // 运行检�?
    const runChecks = async () => {
        setLoading(true);

        // Step 1: 检查插�?
        updateStepStatus(0, 'process');
        const pluginReady = await waitForPlugin(3000);
        if (!pluginReady) {
            updateStepStatus(0, 'error');
            setErrorMessage('Chrome 插件未检测到，请确保已安装并启用 Zilo 插件');
            setLoading(false);
            return;
        }
        setPluginOk(true);
        updateStepStatus(0, 'finish');
        setCurrentStep(1);

        // Step 2: 检�?Native Host
        updateStepStatus(1, 'process');
        const hostResult = await checkNativeHostConnection();
        if (!hostResult.connected) {
            updateStepStatus(1, 'error');
            setErrorMessage('本地桥接程序未连接。请运行 native-host/install.bat 安装');
            setLoading(false);
            return;
        }
        setNativeHostOk(true);
        updateStepStatus(1, 'finish');
        setCurrentStep(2);

        // Step 3: 检查微�?
        updateStepStatus(2, 'process');
        const wechatResult = await checkWeChatStatus();
        console.log('[AddWeChatModal] 微信状态检测结�?', wechatResult);

        if (!wechatResult.running || !wechatResult.logged_in) {
            updateStepStatus(2, 'error');
            // 使用后端返回的详细消�?
            setErrorMessage(wechatResult.message || '微信未运行或未登录，请先打开并登录微信PC�?);
            setLoading(false);
            return;
        }
        setWechatOk(true);
        updateStepStatus(2, 'finish');

        // 获取微信窗口列表
        const windowsResult = await getWeChatWindows();
        console.log('[AddWeChatModal] 微信窗口列表:', windowsResult);
        if (windowsResult.success && windowsResult.windows.length > 0) {
            setWechatWindows(windowsResult.windows);
            setSelectedWindow(windowsResult.windows[0].handle);
        }

        setCurrentStep(3);
        updateStepStatus(3, 'process');
        setLoading(false);
    };

    // 加载话术
    const loadScripts = async () => {
        try {
            const res = await getWeChatScripts();
            if (res.success) {
                setScripts(res.data);
                const defaultScript = res.data.find((s: WeChatScript) => s.isDefault);
                if (defaultScript) {
                    setSelectedScript(defaultScript);
                    form.setFieldsValue({ scriptId: defaultScript.id });
                    updateMessage(defaultScript);
                }
            }
        } catch (error) {
            console.error('加载话术失败:', error);
        }
    };

    // 更新验证消息
    const updateMessage = (script: WeChatScript | null) => {
        if (script) {
            const msg = replaceScriptVariables(script.content, {
                达人昵称: nickname,
                产品�? script.sample?.name || '',
                微信�? wechatId,
            });
            form.setFieldsValue({ message: msg });
        }
    };

    // 话术选择变化
    const handleScriptChange = (scriptId: string) => {
        const script = scripts.find(s => s.id === scriptId);
        setSelectedScript(script || null);
        if (script) {
            updateMessage(script);
        }
    };

    // 步骤1: 搜索微信�?
    const handleSearchWechat = async () => {
        try {
            setLoading(true);
            updateStepStatus(3, 'process');

            const result = await searchWechat({
                wechatId,
                windowHandle: selectedWindow || undefined,
            });

            if (result.success) {
                message.success(result.message);
                setOperationPhase('fill');
            } else {
                message.error(result.message);
            }
        } catch (error: any) {
            message.error(error.message || '搜索失败');
        } finally {
            setLoading(false);
        }
    };

    // 步骤2: 填写验证信息和备�?
    const handleFillInfo = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const result = await fillFriendInfo({
                message: values.message,
                remark: values.remark || `${nickname}-${platform}`,
                windowHandle: selectedWindow || undefined,
            });

            if (result.success) {
                message.success(result.message);
                setOperationPhase('done');
                setResultSuccess(true);
                setResultMessage('信息已填写，请在微信中手动点击「发送」按钮完成添�?);
                updateStepStatus(3, 'finish');
                onSuccess?.();
            } else {
                message.warning(result.message);
            }
        } catch (error: any) {
            message.error(error.message || '填写失败');
        } finally {
            setLoading(false);
        }
    };

    // 旧的完整流程（保留作为备选）
    const handleAdd = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const result = await addWeChatFriend({
                wechatId,
                nickname,
                platform,
                message: values.message,
                remark: values.remark || `${nickname}-${platform}`,
                windowHandle: selectedWindow || undefined,
            });

            setResultSuccess(result.success);
            setResultMessage(result.message);
            updateStepStatus(3, result.success ? 'finish' : 'error');

            if (result.success) {
                message.success('添加请求已发送！');
                onSuccess?.();
            }
        } catch (error: any) {
            setResultSuccess(false);
            setResultMessage(error.message || '操作失败');
            updateStepStatus(3, 'error');
        } finally {
            setLoading(false);
        }
    };

    // 渲染步骤图标
    const getStepIcon = (index: number) => {
        const status = stepStatus[index];
        if (status === 'process') return <LoadingOutlined />;
        if (status === 'finish') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        if (status === 'error') return <WarningOutlined style={{ color: '#ff4d4f' }} />;
        return undefined;
    };

    return (
        <Modal
            title={
                <Space>
                    <WechatOutlined style={{ color: '#07C160' }} />
                    一键添加微信好�?
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            {/* 目标信息 */}
            <Alert
                type="info"
                message={
                    <Space>
                        <Text>目标达人�?/Text>
                        <Text strong>{nickname}</Text>
                        <Text type="secondary">({platform})</Text>
                        <Text>微信号：</Text>
                        <Text strong copyable>{wechatId}</Text>
                    </Space>
                }
                style={{ marginBottom: 16 }}
            />

            {/* 步骤 */}
            <Steps
                current={currentStep}
                size="small"
                style={{ marginBottom: 24 }}
                items={[
                    { title: '检测插�?, icon: getStepIcon(0) },
                    { title: '本地桥接', icon: getStepIcon(1) },
                    { title: '微信状�?, icon: getStepIcon(2) },
                    { title: '发送请�?, icon: getStepIcon(3) },
                ]}
            />

            {/* 错误提示 */}
            {errorMessage && (
                <Alert
                    type="error"
                    message={errorMessage}
                    action={
                        <Button size="small" onClick={runChecks}>
                            重试
                        </Button>
                    }
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* 成功/失败结果 */}
            {resultMessage && (
                <Result
                    status={resultSuccess ? 'success' : 'error'}
                    title={resultSuccess ? '请求已发�? : '操作失败'}
                    subTitle={resultMessage}
                    extra={
                        <Button type="primary" onClick={onClose}>
                            关闭
                        </Button>
                    }
                />
            )}

            {/* 添加表单 */}
            {currentStep === 3 && !resultMessage && (
                <Form form={form} layout="vertical">
                    {wechatWindows.length > 1 && (
                        <Form.Item label="选择微信窗口">
                            <Space.Compact style={{ width: '100%' }}>
                                <Select
                                    value={selectedWindow}
                                    onChange={(value) => {
                                        setSelectedWindow(value);
                                        // 选择时自动高亮窗�?
                                        sendToPlugin('highlightWindow', { windowHandle: value }).catch(() => { });
                                    }}
                                    options={wechatWindows.map((w, index) => ({
                                        value: w.handle,
                                        label: `微信 ${index + 1}${w.display_name && w.display_name !== w.title ? ` (${w.display_name})` : ''}`,
                                    }))}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    onClick={() => {
                                        if (selectedWindow) {
                                            sendToPlugin('highlightWindow', { windowHandle: selectedWindow }).then(() => {
                                                message.info('已将选中的微信窗口置�?);
                                            }).catch(() => { });
                                        }
                                    }}
                                >
                                    查看窗口
                                </Button>
                            </Space.Compact>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                点击"查看窗口"可以将对应微信窗口置顶显示，帮助您确认是哪个账号
                            </Text>
                        </Form.Item>
                    )}

                    <Form.Item label="话术模板">
                        <Select
                            placeholder="选择话术模板"
                            allowClear
                            onChange={handleScriptChange}
                            options={scripts.map(s => ({ value: s.id, label: s.name }))}
                        />
                    </Form.Item>

                    <Form.Item name="message" label="验证消息">
                        <TextArea rows={3} placeholder="填写添加好友的验证消�? />
                    </Form.Item>

                    <Form.Item name="remark" label="好友备注">
                        <Input placeholder={`${nickname}-${platform}`} />
                    </Form.Item>

                    <Form.Item>
                        {operationPhase === 'search' && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<RocketOutlined />}
                                loading={loading}
                                onClick={handleSearchWechat}
                                block
                            >
                                步骤1: 搜索微信�?
                            </Button>
                        )}
                        {operationPhase === 'fill' && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<RocketOutlined />}
                                loading={loading}
                                onClick={handleFillInfo}
                                block
                            >
                                步骤2: 填写验证信息
                            </Button>
                        )}
                        {operationPhase === 'done' && (
                            <Button
                                type="default"
                                size="large"
                                onClick={onClose}
                                block
                            >
                                完成
                            </Button>
                        )}

                        {operationPhase === 'search' && (
                            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                                点击后会在微信中搜索此微信号，请手动点击绿色�?网络查找微信�?区域
                            </Text>
                        )}
                        {operationPhase === 'fill' && (
                            <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                                请先在微信中点击"添加到通讯�?按钮，然后点击此按钮自动填写验证信息
                            </Text>
                        )}
                    </Form.Item>
                </Form>
            )}

            {/* 加载�?*/}
            {loading && currentStep < 3 && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary">正在检查环�?..</Text>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default AddWeChatModal;
