/**
 * 注册页面
 * 
 * 【简化版】只需：昵称、手机号、密码、确认密码、角色
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Select, Divider } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, ShopOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore, getDefaultPathForRole } from '../../stores/authStore';
import * as authService from '../../services/auth.service';
import type { UserRole } from '@ics/shared';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormValues {
  name: string;        // 昵称
  phone: string;       // 手机号
  password: string;
  confirmPassword: string;
  role: UserRole;
  brandName?: string;  // 品牌名称（仅品牌角色需要）
}

const roleLabels: Record<string, string> = {
  BRAND: '品牌',
  BUSINESS: '商务',
  INFLUENCER: '达人',
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
      // 使用手机号生成默认邮箱（后端兼容）
      const response = await authService.register({
        ...registerData,
        email: `${registerData.phone}@phone.local`,
      });

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
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 217, 61, 0.1))',
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
            requiredMark={false}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="昵称"
                style={{ borderRadius: theme.borderRadius.sm }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="手机号"
                style={{ borderRadius: theme.borderRadius.sm }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="密码"
                style={{ borderRadius: theme.borderRadius.sm }}
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
                    return Promise.reject(new Error('两次密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="确认密码"
                style={{ borderRadius: theme.borderRadius.sm }}
              />
            </Form.Item>

            <Form.Item
              name="role"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select
                placeholder="选择角色"
                onChange={handleRoleChange}
                style={{ borderRadius: theme.borderRadius.sm }}
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
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
                  style={{ borderRadius: theme.borderRadius.sm }}
                />
              </Form.Item>
            )}

            <Form.Item style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 44,
                  borderRadius: theme.borderRadius.sm,
                }}
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
