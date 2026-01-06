import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createStaff, type CreateStaffInput } from '../../services/staff-management.service';

interface AddStaffModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const AddStaffModal = ({ visible, onCancel, onSuccess }: AddStaffModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data: CreateStaffInput = {
        name: values.name,
        email: values.email,
        password: values.password,
      };

      await createStaff(data);
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 429) {
        message.error(error.response?.data?.error?.message || '已达到商务账号数量上限');
      } else if (error.response?.status === 400) {
        message.error(error.response?.data?.error?.message || '该邮箱已被注册');
      } else if (error.errorFields) {
        // 表单验证错误，不显示消息
      } else {
        message.error('创建失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="添加商务账号"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建"
      cancelText="取消"
      width={500}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
        <Form.Item
          label="姓名"
          name="name"
          rules={[
            { required: true, message: '请输入姓名' },
            { max: 50, message: '姓名不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入商务人员姓名" />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input placeholder="请输入邮箱地址（用于登录）" />
        </Form.Item>

        <Form.Item
          label="初始密码"
          name="password"
          rules={[
            { required: true, message: '请输入初始密码' },
            { min: 6, message: '密码至少6个字符' },
          ]}
        >
          <Input.Password placeholder="请设置初始密码（至少6个字符）" />
        </Form.Item>

        <Form.Item
          label="确认密码"
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
          <Input.Password placeholder="请再次输入密码" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddStaffModal;
