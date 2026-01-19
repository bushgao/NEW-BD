import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, PhoneOutlined, ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Layers } from 'lucide-react';
import { useAuthStore, getDefaultPathForRole } from '../../stores/authStore';
import * as authService from '../../services/auth.service';

const { Title, Text } = Typography;

interface LoginFormValues {
  phone: string;
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
      const response = await authService.loginByPhone({
        phone: values.phone,
        password: values.password,
      });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        setAuth(user, tokens);
        message.success('登录成功');
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

  const features = [
    '样品回收率提升 68%',
    '实时冲突检测，避免内部撞单',
    '全链路 ROI 追踪分析',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual/Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">Zilo</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            让每一笔投入<br />
            <span className="text-indigo-200">都透明可控</span>
          </h1>

          <p className="text-lg text-indigo-100 mb-10 max-w-md leading-relaxed">
            专为现代 BD 团队打造的达人管理系统。从建联到复盘，全流程数据化、透明化。
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircleFilled className="text-indigo-300 text-lg" />
                <span className="text-indigo-100 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Testimonial/Stats */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`/avatars/avatar${i}.png`}
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-indigo-600 object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="text-white font-bold text-lg">15,000+</div>
                <div className="text-indigo-200 text-sm">商务人员正在使用</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Zilo</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              欢迎回来
            </Title>
            <Text style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', display: 'block' }}>
              登录您的账户继续管理达人合作
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
              name="phone"
              label={<span className="text-slate-700 font-medium">手机号</span>}
              style={{ marginBottom: '20px' }}
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="text-slate-400 mr-2" />}
                placeholder="请输入手机号"
                size="large"
                className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="text-slate-700 font-medium">密码</span>}
              style={{ marginBottom: '28px' }}
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400 mr-2" />}
                placeholder="请输入登录密码"
                size="large"
                className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '20px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="h-12 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-200"
                icon={<ArrowRightOutlined />}
              >
                立即登录
              </Button>
            </Form.Item>
          </Form>

          {/* Secondary Actions */}
          <div className="flex gap-3 mb-4">
            <Button
              block
              size="large"
              onClick={() => {
                loginAsDemo('BRAND');
                navigate('/app/dashboard');
                message.success('已进入演示模式');
              }}
              className="h-11 rounded-xl text-sm font-semibold border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            >
              演示模式
            </Button>
            <Link to="/register" className="flex-1">
              <Button
                block
                size="large"
                className="h-11 rounded-xl text-sm font-semibold border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
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
              className="h-10 text-sm text-indigo-600 font-semibold hover:bg-indigo-50"
            >
              达人登录入口 →
            </Button>
          </Link>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-center text-slate-400 text-xs">
            登录即代表同意 Zilo 服务协议与隐私政策
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
