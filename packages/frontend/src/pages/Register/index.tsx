import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Select, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ShopOutlined, LoginOutlined, PhoneOutlined, WechatOutlined } from '@ant-design/icons';
import { useAuthStore, getDefaultPathForRole } from '../../stores/authStore';
import * as authService from '../../services/auth.service';
import type { UserRole } from '@ics/shared';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  wechat: string;
  role: UserRole;
  brandName?: string;
}

const roleLabels: Record<UserRole, string> = {
  BRAND: '品牌',
  BUSINESS: '商务',
  PLATFORM_ADMIN: '平台管理员',
};

const RegisterPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = values;
      const response = await authService.register(registerData);

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        setAuth(user, tokens);
        message.success('注册成功');

        // Redirect based on role
        const defaultPath = getDefaultPathForRole(user.role);
        navigate(defaultPath, { replace: true });
      } else {
        message.error(response.error?.message || '注册失败');
      }
    } catch (error) {
      message.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    // Clear brand name if not brand owner
    if (role !== 'BRAND') {
      form.setFieldValue('brandName', undefined);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        padding: 24,
        position: 'relative',
      }}
    >
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.12), rgba(191, 90, 242, 0.12))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.12), rgba(255, 217, 61, 0.12))',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <Card
        variant="elevated"
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <CardContent style={{ padding: '40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8, color: theme.colors.primary[500] }}>
              注册账号
            </Title>
            <Text type="secondary">创建您的达人合作系统账号</Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            autoComplete="off"
            size="large"
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
                prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="邮箱"
              />
            </Form.Item>

            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="姓名"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="手机号"
              />
            </Form.Item>

            <Form.Item
              name="wechat"
              rules={[{ required: true, message: '请输入微信号' }]}
            >
              <Input
                prefix={<WechatOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="微信号"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少为6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
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
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select
                placeholder="选择角色"
                onChange={handleRoleChange}
                suffixIcon={<UserOutlined style={{ color: '#bfbfbf' }} />}
              >
                <Option value="BRAND">{roleLabels.BRAND}</Option>
                <Option value="BUSINESS">{roleLabels.BUSINESS}</Option>
              </Select>
            </Form.Item>

            {selectedRole === 'BRAND' && (
              <Form.Item
                name="brandName"
                rules={[{ required: true, message: '请输入品牌名称' }]}
              >
                <Input
                  prefix={<ShopOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="品牌名称"
                />
              </Form.Item>
            )}

            {selectedRole === 'BUSINESS' && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  注意：您可以先独立注册使用，后续可加入品牌团队。
                </Text>
              </div>
            )}

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44 }}
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <Divider plain>
            <Text type="secondary" style={{ fontSize: 12 }}>
              已有账号？
            </Text>
          </Divider>

          <div style={{ textAlign: 'center' }}>
            <Link to="/login">
              <Button type="link" icon={<LoginOutlined />}>
                返回登录
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
