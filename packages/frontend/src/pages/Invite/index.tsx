/**
 * 邀请注册页面
 * 
 * 商务人员通过邀请链接访问此页面进行注册
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Spin, Result, Card } from 'antd';
import { UserOutlined, LockOutlined, MobileOutlined, TeamOutlined } from '@ant-design/icons';
import { getInvitationByCode, type InvitationInfo } from '../../services/invitation.service';
import { register } from '../../services/auth.service';
import { useTheme } from '../../theme/ThemeProvider';

const { Title, Text, Paragraph } = Typography;

const InviteRegisterPage = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 加载邀请详情
    useEffect(() => {
        const loadInvitation = async () => {
            if (!code) {
                setError('邀请链接无效');
                setLoading(false);
                return;
            }

            try {
                const data = await getInvitationByCode(code);
                if (data.status !== 'PENDING') {
                    setError(data.status === 'USED' ? '该邀请链接已被使用' : '该邀请链接已被撤销');
                } else {
                    setInvitation(data);
                }
            } catch (err: any) {
                setError(err.message || '邀请链接无效或已过期');
            } finally {
                setLoading(false);
            }
        };

        loadInvitation();
    }, [code]);

    // 注册提交
    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            // 调用注册接口，携带邀请码
            await register({
                name: values.name,
                phone: values.phone,
                password: values.password,
                role: 'BUSINESS',
                invitationCode: code,
            });

            message.success('注册成功！正在跳转...');

            // 延迟跳转到登录页
            setTimeout(() => {
                navigate('/login', {
                    state: {
                        message: '注册成功，请使用手机号和密码登录',
                        phone: values.phone
                    }
                });
            }, 1500);
        } catch (err: any) {
            message.error(err.message || '注册失败，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    // 加载中
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
            }}>
                <Spin size="large" tip="正在验证邀请链接..." />
            </div>
        );
    }

    // 邀请无效
    if (error || !invitation) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
            }}>
                <Result
                    status="error"
                    title="邀请链接无效"
                    subTitle={error || '该邀请链接已过期或不存在'}
                    extra={[
                        <Button type="primary" key="login" onClick={() => navigate('/login')}>
                            前往登录
                        </Button>,
                        <Button key="register" onClick={() => navigate('/register')}>
                            自行注册
                        </Button>,
                    ]}
                />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
            padding: '40px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* 背景装饰 */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '5%',
                width: '400px',
                height: '400px',
                background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.08), rgba(191, 90, 242, 0.08))',
                borderRadius: '50%',
                filter: 'blur(80px)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '5%',
                width: '500px',
                height: '500px',
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
                borderRadius: '50%',
                filter: 'blur(100px)',
                pointerEvents: 'none',
                zIndex: 0,
            }} />

            <Card
                style={{
                    maxWidth: 440,
                    width: '100%',
                    borderRadius: 8,
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <TeamOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                    <Title level={3} style={{ marginBottom: 8 }}>加入 {invitation.brandName}</Title>
                    <Paragraph type="secondary">
                        {invitation.inviterName} 邀请您加入团队
                    </Paragraph>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="姓名"
                        rules={[
                            { required: true, message: '请输入您的姓名' },
                            { max: 50, message: '姓名不能超过50个字符' },
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="请输入您的姓名"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="手机号"
                        rules={[
                            { required: true, message: '请输入手机号' },
                            { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                        ]}
                    >
                        <Input
                            prefix={<MobileOutlined />}
                            placeholder="请输入手机号（用于登录）"
                            maxLength={11}
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="设置密码"
                        rules={[
                            { required: true, message: '请设置密码' },
                            { min: 6, message: '密码至少6个字符' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="请设置登录密码（至少6个字符）"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="确认密码"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: '请再次输入密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="请再次输入密码"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 8 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting}
                            block
                            size="large"
                        >
                            注册并加入团队
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">已有账号？</Text>
                        <Button type="link" onClick={() => navigate('/login')}>
                            直接登录
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default InviteRegisterPage;
