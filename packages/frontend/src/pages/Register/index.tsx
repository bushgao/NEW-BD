import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Select, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, ShopOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuthStore, getDefaultPathForRole } from '../../stores/authStore';
import * as authService from '../../services/auth.service';
import type { UserRole } from '@ics/shared';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  factoryName?: string;
}

const roleLabels: Record<UserRole, string> = {
  FACTORY_OWNER: '工厂老板',
  BUSINESS_STAFF: '商务人员',
  PLATFORM_ADMIN: '平台管理员',
};

const RegisterPage = () => {
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
    // Clear factory name if not factory owner
    if (role !== 'FACTORY_OWNER') {
      form.setFieldValue('factoryName', undefined);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1890ff' }}>
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
              <Option value="FACTORY_OWNER">{roleLabels.FACTORY_OWNER}</Option>
              <Option value="BUSINESS_STAFF">{roleLabels.BUSINESS_STAFF}</Option>
            </Select>
          </Form.Item>

          {selectedRole === 'FACTORY_OWNER' && (
            <Form.Item
              name="factoryName"
              rules={[{ required: true, message: '请输入工厂名称' }]}
            >
              <Input
                prefix={<ShopOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="工厂名称"
              />
            </Form.Item>
          )}

          {selectedRole === 'BUSINESS_STAFF' && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                注意：商务人员需要由工厂老板邀请加入，请联系您的工厂老板获取邀请。
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
              disabled={selectedRole === 'BUSINESS_STAFF'}
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
      </Card>
    </div>
  );
};

export default RegisterPage;
