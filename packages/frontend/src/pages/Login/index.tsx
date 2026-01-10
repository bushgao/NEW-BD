import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined, AppstoreOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuthStore, getDefaultPathForRole } from '../../stores/authStore';
import * as authService from '../../services/auth.service';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, loginAsDemo } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await authService.login(values);

      if (response.success && response.data) {
        const { user, tokens } = response.data;

        setAuth(user, tokens);
        message.success('登录成功');

        // Redirect based on role
        const defaultPath = getDefaultPathForRole(user.role);
        navigate(defaultPath, { replace: true });
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: '#0f172a', // Deep slate background
      padding: '24px',
    }}>
      {/* Animated Aurora Background Blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '10%',
        width: '40vw',
        height: '40vw',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float-slow 20s ease-in-out infinite',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '35vw',
        height: '35vw',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float-slow-reverse 25s ease-in-out infinite',
        zIndex: 0,
      }} />

      {/* Noise Texture Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        zIndex: 1,
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '440px',
      }}>
        {/* Brand/Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
          }}>
            <AppstoreOutlined style={{ fontSize: '24px', color: '#6366f1' }} />
            <span style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>
              Zilo
            </span>
          </div>
        </div>

        {/* Main Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '48px 40px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Subtle Glow Header */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <Title level={2} style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}>
              欢迎回来
            </Title>
            <Text style={{
              fontSize: '15px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: '8px',
              display: 'block',
            }}>
              让合作更透明，让 ROI 更真实
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              style={{ marginBottom: '20px' }}
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入邮箱' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: 'rgba(255, 255, 255, 0.3)', marginRight: '8px' }} />}
                placeholder="邮箱地址"
                size="large"
                style={{
                  height: '52px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  fontSize: '15px',
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              style={{ marginBottom: '28px' }}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.3)', marginRight: '8px' }} />}
                placeholder="登录密码"
                size="large"
                style={{
                  height: '52px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  fontSize: '15px',
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{
                  height: '54px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  border: 'none',
                  boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                }}
                icon={<ArrowRightOutlined />}
              >
                立即登录
              </Button>
            </Form.Item>
          </Form>

          {/* Social/Other Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                block
                size="large"
                onClick={() => {
                  loginAsDemo('BRAND');
                  navigate('/app/dashboard');
                  message.success('已进入演示模式');
                }}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                演示模式
              </Button>
              <Link to="/register" style={{ flex: 1 }}>
                <Button
                  block
                  size="large"
                  style={{
                    height: '46px',
                    borderRadius: '14px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  注册账号
                </Button>
              </Link>
            </div>

            <Link to="/influencer-portal/login">
              <Button
                block
                size="large"
                type="text"
                style={{
                  height: '40px',
                  fontSize: '14px',
                  color: '#a855f7',
                  fontWeight: 600,
                }}
              >
                达人登录入口
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '12px',
        }}>
          登录即代表同意 Zilo 服务协议与隐私政策
        </div>
      </div>

      {/* Global CSS for Animations and Overrides */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, 5%) scale(1.1); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translate(0, 0) scale(1.1); }
          50% { transform: translate(-5%, -5%) scale(1); }
        }
        .ant-input-affix-wrapper, .ant-input-password {
          transition: all 0.3s ease !important;
        }
        .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper-focused {
          border-color: rgba(99, 102, 241, 0.5) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
        }
        .ant-input {
          background: transparent !important;
          color: #ffffff !important;
        }
        .ant-input::placeholder {
          color: rgba(255, 255, 255, 0.2) !important;
        }
        .ant-btn-text:hover {
          background: rgba(168, 85, 247, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
