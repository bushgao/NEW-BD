import React, { useState } from 'react';
import { Modal, Form, Radio, Input, message } from 'antd';
import type { InfluencerWithDetails } from '@ics/shared';
import * as platformInfluencerService from '../../services/platform-influencer.service';

interface VerificationModalProps {
  open: boolean;
  influencer: InfluencerWithDetails | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerificationModal({
  open,
  influencer,
  onClose,
  onSuccess,
}: VerificationModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await platformInfluencerService.verifyInfluencer(
        influencer!.id,
        values.status,
        values.note
      );

      message.success('认证操作成功');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(error.message || '认证操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="达人认证"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="提交"
      cancelText="取消"
      width={500}
    >
      {influencer && (
        <div style={{ marginBottom: 24 }}>
          <p><strong>达人昵称：</strong>{influencer.nickname}</p>
          <p><strong>平台：</strong>{influencer.platform}</p>
          <p><strong>账号ID：</strong>{influencer.platformId}</p>
          <p><strong>所属品牌：</strong>{influencer.factoryName}</p>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: 'VERIFIED' }}
      >
        <Form.Item
          name="status"
          label="认证结果"
          rules={[{ required: true, message: '请选择认证结果' }]}
        >
          <Radio.Group onChange={(e) => setStatus(e.target.value)}>
            <Radio value="VERIFIED">通过</Radio>
            <Radio value="REJECTED">拒绝</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="note"
          label="备注"
          rules={[
            {
              required: status === 'REJECTED',
              message: '拒绝时必须填写原因',
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder={
              status === 'REJECTED'
                ? '请填写拒绝原因（必填）'
                : '可选填写备注信息'
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
