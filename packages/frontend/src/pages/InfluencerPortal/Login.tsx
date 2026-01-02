/**
 * 达人登录页面
 * 
 * 使用手机号+验证码登录
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { MobileOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useInfluencerPortalStore } from '../../stores/influencerPortalStore';
import * as influencerPortalService from '../../services/influencer-portal.service';

const { Title, Text } = Typography;

interface LoginFormValues {
  phone: string;
  code: string;
}

const InfluencerLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { setAuth } = useInfluencerPortalStore();
  const [form] = Form.useForm();

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const phone = form.getFieldValue('phone');
      if (!phone) {
        message.error('请先输入手机号');
        return;
      }
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        message.error('手机号格式不正确');
        return;
      }

      setSendingCode(true);
      const response = await influencerPortalService.sendVerificationCode(phone);
      
      if (response.success) {
        message.success('验证码已发送');
        setCountdown(60);
      } else {
        message.error(response.error?.message || '发送失败');
      }
    } catch (error) {
      message.error('发送失败，请稍后重试');
    } finally {
      setSendingCode(false);
    }
  };

  // 登录
  const handleSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await influencerPortalService.login(values.phone, values.code);
      
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
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input
              prefix={<MobileOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="手机号"
              maxLength={11}
            />
          </Form.Item>

          <Form.Item
            name="code"
            rules={[
              { required: true, message: '请输入验证码' },
              { len: 6, message: '验证码为6位数字' },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input
                prefix={<SafetyOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="验证码"
                maxLength={6}
                style={{ flex: 1 }}
              />
              <Button
                onClick={handleSendCode}
                loading={sendingCode}
                disabled={countdown > 0}
                style={{ width: 120 }}
              >
                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
              </Button>
            </Space.Compact>
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
