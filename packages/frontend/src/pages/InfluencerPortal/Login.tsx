/**
 * 达人登录页面
 * 
 * 使用邮箱+密码登录
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useInfluencerPortalStore } from '../../stores/influencerPortalStore';
import * as influencerPortalService from '../../services/influencer-portal.service';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const InfluencerLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useInfluencerPortalStore();
  const [form] = Form.useForm();

  // 登录
  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await influencerPortalService.login(values.email, values.password);

      if (response.success && response.data) {
        const { contact, tokens } = response.data;
        setAuth(contact, tokens);
        message.success('登录成功');
        navigate('/influencer-portal', { replace: true });
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
        background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
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
          <Title level={2} style={{ marginBottom: 8, color: '#722ed1' }}>
            达人端口
          </Title>
          <Text type="secondary">查看您在各工厂的样品和合作信息</Text>
        </div>

        <Form
          form={form}
          name="influencer-login"
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
              placeholder="邮箱"
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
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                background: '#722ed1',
                borderColor: '#722ed1',
              }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login">
            <Button type="link" icon={<ArrowLeftOutlined />}>
              返回商务/老板登录
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default InfluencerLoginPage;

