/**
 * 插件使用说明页面
 * 提供Chrome插件的下载、安装和使用指南
 */

import { Card, Typography, Steps, Button, Alert, Divider, Space, Tag, message } from 'antd';
import {
    DownloadOutlined,
    ChromeOutlined,
    SettingOutlined,
    RocketOutlined,
    CheckCircleOutlined,
    CopyOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/authStore';
import { useAdminStore } from '../../stores/adminStore';
import { useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const PluginUsage = () => {
    const location = useLocation();
    const isAdminPath = location.pathname.startsWith('/app/admin');
    const authStore = useAuthStore();
    const adminStore = useAdminStore();
    const token = isAdminPath ? adminStore.token : authStore.token;

    const handleDownload = () => {
        // 触发下载
        const link = document.createElement('a');
        link.href = '/downloads/zilo-plugin.zip';
        link.download = 'zilo-plugin.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('插件下载已开始！');
    };

    const handleCopyToken = async () => {
        if (!token) {
            message.error('未找到登录令牌，请先登录');
            return;
        }
        try {
            await navigator.clipboard.writeText(token.accessToken);
            message.success('Token 已复制到剪贴板！');
        } catch (error) {
            message.error('复制失败，请手动复制');
        }
    };

    const installSteps = [
        {
            title: '下载插件',
            description: '点击下方按钮下载插件压缩包，并解压到本地文件夹',
        },
        {
            title: '打开Chrome扩展页',
            description: '在Chrome地址栏输入 chrome://extensions/ 并回车',
        },
        {
            title: '开启开发者模式',
            description: '点击页面右上角的"开发者模式"开关',
        },
        {
            title: '加载插件',
            description: '点击"加载已解压的扩展程序"，选择解压后的文件夹',
        },
    ];

    return (
        <div style={{ padding: '40px -24px', maxWidth: 900, margin: '0 auto' }}>
            {/* 标题区域 */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <ChromeOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
                <Title level={2} style={{ marginBottom: 8 }}>
                    Zilo 达人采集助手
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                    一键采集抖音精选联盟达人信息到 Zilo 系统
                </Text>
            </div>

            {/* 下载区域 */}
            <Card
                style={{
                    marginBottom: 24,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                }}
            >
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
                        🎉 立即下载 Chrome 插件
                    </Title>
                    <Space size="large">
                        <Button
                            type="primary"
                            size="large"
                            icon={<DownloadOutlined />}
                            onClick={handleDownload}
                            style={{
                                background: '#fff',
                                color: '#667eea',
                                fontWeight: 600,
                                height: 48,
                                paddingLeft: 32,
                                paddingRight: 32,
                            }}
                        >
                            下载插件 (ZIP)
                        </Button>
                        <Tag color="white" style={{ color: '#667eea', fontSize: 14, padding: '4px 12px' }}>
                            版本 1.0.0
                        </Tag>
                    </Space>
                </div>
            </Card>

            {/* 功能特性 */}
            <Card title="✨ 功能特性" style={{ marginBottom: 24 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text strong>一键采集</Text>
                        <Text type="secondary"> - 在抖音精选联盟达人详情页自动注入"添加到 Zilo"按钮</Text>
                    </div>
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text strong>信息提取</Text>
                        <Text type="secondary"> - 自动提取达人昵称、抖音号、粉丝数、类目、等级等信息</Text>
                    </div>
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text strong>实时统计</Text>
                        <Text type="secondary"> - 统计采集成功和失败数量</Text>
                    </div>
                    <div>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        <Text strong>安全认证</Text>
                        <Text type="secondary"> - 使用您的账户令牌安全同步数据</Text>
                    </div>
                </Space>
            </Card>

            {/* 安装步骤 */}
            <Card title="📦 安装步骤" style={{ marginBottom: 24 }}>
                <Steps
                    direction="vertical"
                    current={-1}
                    items={installSteps.map((step, index) => ({
                        title: <Text strong>{step.title}</Text>,
                        description: step.description,
                        icon: index === 0 ? <DownloadOutlined /> :
                            index === 1 ? <ChromeOutlined /> :
                                index === 2 ? <SettingOutlined /> :
                                    <RocketOutlined />,
                    }))}
                />
            </Card>

            {/* 配置指南 */}
            <Card title="⚙️ 配置插件" style={{ marginBottom: 24 }}>
                <Alert
                    message="快速配置"
                    description="安装完成后，您可以使用下方按钮一键复制登录令牌，然后在插件设置中粘贴即可。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                />

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <Text strong>方式一：一键复制 Token</Text>
                        <div style={{ marginTop: 8 }}>
                            <Button
                                icon={<CopyOutlined />}
                                onClick={handleCopyToken}
                                type="primary"
                            >
                                复制登录令牌
                            </Button>
                            <Text type="secondary" style={{ marginLeft: 12 }}>
                                然后在插件 → 设置 → 粘贴
                            </Text>
                        </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div>
                        <Text strong>方式二：使用同步按钮</Text>
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">
                                点击顶部导航栏的 <SyncOutlined /> <Text code>同步插件</Text> 按钮，
                                令牌会自动复制到剪贴板
                            </Text>
                        </div>
                    </div>
                </Space>
            </Card>

            {/* 使用方法 */}
            <Card title="🚀 使用方法" style={{ marginBottom: 24 }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Paragraph>
                        <Text strong>1.</Text> 打开 <a href="https://buyin.jinritemai.com" target="_blank" rel="noopener noreferrer">抖音精选联盟</a> 并登录
                    </Paragraph>
                    <Paragraph>
                        <Text strong>2.</Text> 进入达人详情页（搜索达人 → 点击达人卡片）
                    </Paragraph>
                    <Paragraph>
                        <Text strong>3.</Text> 页面右上角会自动出现 <Tag color="blue">添加到 Zilo</Tag> 按钮
                    </Paragraph>
                    <Paragraph>
                        <Text strong>4.</Text> 点击按钮，插件自动采集达人信息并保存到系统
                    </Paragraph>
                    <Paragraph>
                        <Text strong>5.</Text> 看到 <Tag color="success">✓ 已添加</Tag> 表示采集成功
                    </Paragraph>
                </Space>
            </Card>

            {/* 常见问题 */}
            <Card title="❓ 常见问题">
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Text strong>Q: 按钮没有出现？</Text>
                        <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                            确保您在达人详情页（URL 包含 daren-profile），刷新页面重试，或检查插件是否已启用。
                        </Paragraph>
                    </div>
                    <div>
                        <Text strong>Q: 采集失败怎么办？</Text>
                        <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                            检查网络连接，确认已正确配置登录令牌，可在浏览器控制台（F12）查看详细错误信息。
                        </Paragraph>
                    </div>
                    <div>
                        <Text strong>Q: 提示"已达到达人数量上限"？</Text>
                        <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
                            您的套餐已达到达人数量限制，请联系管理员升级套餐。
                        </Paragraph>
                    </div>
                </Space>
            </Card>
        </div>
    );
};

export default PluginUsage;
