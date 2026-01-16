/**
 * 达人登录页面
 * 
 * 使用手机号+密码登录
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { PhoneOutlined, LockOutlined, ArrowLeftOutlined, UserAddOutlined } from '@ant-design/icons';
import { useInfluencerPortalStore } from '../../stores/influencerPortalStore';
import { useAuthStore } from '../../stores/authStore';
import * as influencerPortalService from '../../services/influencer-portal.service';

const { Title, Text } = Typography;

interface LoginFormValues {
  phone: string;
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
      // 手机号转换为邮箱格式（后端兼容）
      const response = await influencerPortalService.login(`${values.phone}@phone.local`, values.password);

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
          borderRadius: 8,
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#722ed1' }}>
            达人端口
          </Title>
          <Text type="secondary">查看您在各品牌的样品和合作信息</Text>
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
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="手机号"
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
          <Button
            type="link"
            icon={<UserAddOutlined />}
            onClick={() => {
              // 清除主账号登录状态后再跳转到注册页
              useAuthStore.getState().logout();
              // 同时清除持久化存储
              localStorage.removeItem('auth-storage');
              navigate('/register');
            }}
          >
            注册达人账号
          </Button>
          <Link to="/login">
            <Button type="link" icon={<ArrowLeftOutlined />}>
              返回品牌/商务登录
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default InfluencerLoginPage;

