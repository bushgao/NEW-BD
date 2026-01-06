import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, MailOutlined, AppstoreOutlined, RiseOutlined, ArrowRightOutlined } from '@ant-design/icons';
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
      position: 'relative',
      overflow: 'hidden',
      background: '#ffffff',
    }}>
      {/* 左侧：营销内容区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 60px',
        position: 'relative',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overflow: 'hidden',
      }}>
        {/* 动画背景装饰 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
          backgroundSize: '4rem 4rem',
          opacity: 0.1,
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)',
        }} />

        {/* 动画光球 */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '33%',
          width: '800px',
          height: '800px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          filter: 'blur(120px)',
          animation: 'float 15s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '80px',
          right: 0,
          width: '600px',
          height: '600px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          animation: 'float 18s ease-in-out infinite 2s',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
            }}>
              <AppstoreOutlined style={{ fontSize: '32px', color: '#ffffff' }} />
            </div>
            <span style={{
              fontSize: '32px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>
              Zilo
            </span>
          </div>

          {/* 主标题 */}
          <h1 style={{
            fontSize: '48px',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: '24px',
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}>
            把影响力转化为<br />
            <span style={{
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              真实净利润
            </span>
          </h1>

          {/* 副标题 */}
          <p style={{
            fontSize: '20px',
            lineHeight: 1.6,
            marginBottom: '40px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 500,
          }}>
            样品寄出了一堆，回款却算不明白？<br />
            Zilo 帮你把散落在微信和表格里的糊涂账，<br />
            变成看得见的真实 ROI。
          </p>

          {/* 特性列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
            {[
              { icon: '✓', text: '100% 样品追踪准确率' },
              { icon: '✓', text: '每天节省 2.5 小时统计时间' },
              { icon: '✓', text: '只关注净利润的真实 ROI' },
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}>
                  {item.icon}
                </div>
                {item.text}
              </div>
            ))}
          </div>

          {/* 统计数据 */}
          <div style={{
            display: 'flex',
            gap: '48px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          }}>
            <div>
              <div style={{
                fontSize: '36px',
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: '4px',
              }}>
                100%
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                样品追踪准确率
              </div>
            </div>
            <div>
              <div style={{
                fontSize: '36px',
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <RiseOutlined style={{ fontSize: '28px' }} />
                ROI
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                只关注净利润
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：登录表单区域 */}
      <div style={{
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 60px',
        background: '#ffffff',
        position: 'relative',
      }}>
        <div style={{ maxWidth: '360px', margin: '0 auto', width: '100%' }}>
          {/* 表单标题 */}
          <div style={{ marginBottom: '40px' }}>
            <Title level={2} style={{
              marginBottom: '8px',
              fontSize: '32px',
              fontWeight: 900,
              color: '#1e293b',
            }}>
              欢迎回来
            </Title>
            <Text style={{
              fontSize: '16px',
              color: '#64748b',
            }}>
              登录到达人合作执行系统
            </Text>
          </div>

          {/* 登录表单 */}
          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#94a3b8', fontSize: '18px' }} />}
                placeholder="邮箱地址"
                size="large"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  fontSize: '15px',
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8', fontSize: '18px' }} />}
                placeholder="密码"
                size="large"
                style={{
                  height: '48px',
                  borderRadius: '12px',
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
                  height: '52px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                }}
                icon={<ArrowRightOutlined />}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          {/* 分隔线 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            margin: '32px 0',
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <Text style={{ fontSize: '14px', color: '#94a3b8' }}>或</Text>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* 其他登录选项 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button
                block
                size="large"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '2px solid #e2e8f0',
                  color: '#475569',
                }}
              >
                注册新账号
              </Button>
            </Link>

            <Link to="/influencer-portal/login" style={{ textDecoration: 'none' }}>
              <Button
                block
                size="large"
                style={{
                  height: '48px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '2px solid #c084fc',
                  color: '#9333ea',
                  background: 'rgba(147, 51, 234, 0.05)',
                }}
              >
                达人登录入口
              </Button>
            </Link>

            <Button
              block
              size="large"
              onClick={() => {
                loginAsDemo('FACTORY_OWNER');
                navigate('/app/dashboard');
                message.success('已进入演示模式');
              }}
              style={{
                height: '48px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                border: 'none',
                background: '#334155',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)',
              }}
              icon={<AppstoreOutlined />}
            >
              直接预览 (演示模式)
            </Button>
          </div>

          {/* 页脚文字 */}
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#94a3b8',
          }}>
            登录即表示您同意我们的服务条款和隐私政策
          </div>
        </div>
      </div>

      {/* CSS 动画 */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translate(50px, 30px) scale(1.1);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
