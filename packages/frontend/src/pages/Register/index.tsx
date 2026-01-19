/**
 * 注册页面
 * 
 * 分屏设计：左边深色品牌区，右边白色表单区（与登录页保持一致）
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Select } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, ShopOutlined, ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Layers } from 'lucide-react';
import { useAuthStore, getDefaultPathForRole } from '../../stores/authStore';
import * as authService from '../../services/auth.service';
import type { UserRole } from '@ics/shared';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormValues {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  brandName?: string;
}

const roleLabels: Record<string, string> = {
  BRAND: '品牌',
  BUSINESS: '商务',
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
      // 不再生成假邮箱，直接使用手机号注册
      const response = await authService.register({
        ...registerData,
        // email 不传，后端会处理为 undefined
      });

      if (response.success && response.data) {
        const { user, tokens } = response.data;
        setAuth(user, tokens);
        message.success('注册成功');
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

  const features = [
    '全流程达人管理，从建联到复盘',
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
          <div className="flex items-center gap-3 mb-12 w-fit">
            <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 flex-shrink-0">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">Zilo</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            开始您的<br />
            <span className="text-indigo-200">智能 BD 之旅</span>
          </h1>

          <p className="text-lg text-indigo-100 mb-10 max-w-md leading-relaxed">
            一分钟完成注册，即刻开启高效达人管理。让每一笔投入都清晰可控。
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

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center w-fit mx-auto">
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-xl border border-indigo-100 flex-shrink-0">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">Zilo</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <Title level={2} style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
              创建账号
            </Title>
            <Text style={{ fontSize: '15px', color: '#64748b', marginTop: '8px', display: 'block' }}>
              一分钟完成注册，开启智能 BD 管理
            </Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={handleSubmit}
            autoComplete="off"
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="name"
              label={<span className="text-slate-700 font-medium">昵称</span>}
              style={{ marginBottom: '16px' }}
              rules={[{ required: true, message: '请输入昵称' }]}
            >
              <Input
                prefix={<UserOutlined className="text-slate-400 mr-2" />}
                placeholder="请输入昵称"
                size="large"
                className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className="text-slate-700 font-medium">手机号</span>}
              style={{ marginBottom: '16px' }}
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

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="password"
                label={<span className="text-slate-700 font-medium">密码</span>}
                style={{ marginBottom: '16px' }}
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-2" />}
                  placeholder="至少6位"
                  size="large"
                  className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={<span className="text-slate-700 font-medium">确认密码</span>}
                style={{ marginBottom: '16px' }}
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-slate-400 mr-2" />}
                  placeholder="再次输入"
                  size="large"
                  className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
                />
              </Form.Item>
            </div>

            <Form.Item
              name="role"
              label={<span className="text-slate-700 font-medium">角色</span>}
              style={{ marginBottom: '16px' }}
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select
                placeholder="选择您的角色"
                onChange={handleRoleChange}
                size="large"
                className="h-12 [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-200"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Form.Item>

            {selectedRole === 'BRAND' && (
              <Form.Item
                name="brandName"
                label={<span className="text-slate-700 font-medium">品牌名称</span>}
                style={{ marginBottom: '16px' }}
                rules={[{ required: true, message: '请输入品牌名称' }]}
              >
                <Input
                  prefix={<ShopOutlined className="text-slate-400 mr-2" />}
                  placeholder="请输入品牌名称"
                  size="large"
                  className="h-12 rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500"
                />
              </Form.Item>
            )}

            <Form.Item style={{ marginBottom: '20px', marginTop: '24px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="h-12 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 border-none shadow-lg shadow-indigo-200"
                icon={<ArrowRightOutlined />}
              >
                立即注册
              </Button>
            </Form.Item>
          </Form>

          {/* Link to Login */}
          <div className="text-center">
            <Text className="text-slate-500">已有账号？</Text>
            <Link to="/login" className="ml-2 text-indigo-600 font-semibold hover:text-indigo-700">
              返回登录
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-slate-400 text-xs">
            注册即代表同意 Zilo 服务协议与隐私政策
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
