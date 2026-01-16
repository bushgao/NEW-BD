/**
 * 平台管理员登录页面
 * 
 * 独立于工厂客户的登录入口
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';
import * as authService from '../../services/auth.service';

const { Title, Text } = Typography;

interface LoginFormValues {
    email: string;
    password: string;
}

const AdminLoginPage = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useAdminStore();

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/admin';

    const handleSubmit = async (values: LoginFormValues) => {
        setLoading(true);
        try {
            const response = await authService.login({ email: values.email, password: values.password });

            if (response.success && response.data) {
                const { user, tokens } = response.data;

                // 验证是否是平台管理员
                if (user.role !== 'PLATFORM_ADMIN') {
                    message.error('此入口仅限平台管理员登录');
                    setLoading(false);
                    return;
                }

                setAuth(
                    {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: 'PLATFORM_ADMIN',
                    },
                    tokens
                );

                message.success('管理员登录成功');
                navigate(from, { replace: true });
            } else {
                message.error(response.error?.message || '登录失败');
            }
        } catch (error) {
            message.error('登录失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                padding: 24,
            }}
        >
            <Card
                style={{
                    width: '100%',
                    maxWidth: 420,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.95)',
                }}
                styles={{ body: { padding: '48px 32px' } }}
            >
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <SafetyCertificateOutlined
                        style={{
                            fontSize: 48,
                            color: '#1890ff',
                            marginBottom: 16,
                        }}
                    />
                    <Title level={2} style={{ marginBottom: 8, color: '#1a1a2e' }}>
                        平台管理后台
                    </Title>
                    <Text type="secondary">管理员专用入口</Text>
                </div>

                <Alert
                    message="安全提示"
                    description="此入口仅限平台管理员使用，请勿分享登录信息"
                    type="warning"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                <Form
                    name="admin-login"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    size="large"
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '邮箱格式不正确' },
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="管理员邮箱"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                            placeholder="密码"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                            style={{
                                height: 48,
                                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                border: 'none',
                                fontWeight: 500,
                            }}
                        >
                            登录管理后台
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        如需帮助，请联系技术支持
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default AdminLoginPage;
