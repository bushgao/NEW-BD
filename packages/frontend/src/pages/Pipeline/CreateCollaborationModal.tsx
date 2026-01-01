import { useState } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
} from 'antd';
import {
  createCollaboration,
  STAGE_LABELS,
  STAGE_ORDER,
} from '../../services/collaboration.service';
import { PLATFORM_LABELS, type Influencer } from '../../services/influencer.service';
import dayjs from 'dayjs';

interface CreateCollaborationModalProps {
  visible: boolean;
  influencers: Influencer[];
  onClose: (refresh?: boolean) => void;
}

const CreateCollaborationModal = ({
  visible,
  influencers,
  onClose,
}: CreateCollaborationModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await createCollaboration({
        influencerId: values.influencerId,
        stage: values.stage,
        deadline: values.deadline?.toISOString(),
        notes: values.notes,
      });

      message.success('合作记录已创建');
      form.resetFields();
      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      message.error(error.response?.data?.error?.message || '创建失败');
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
      title="新建合作"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="创建"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          stage: 'LEAD',
        }}
      >
        <Form.Item
          name="influencerId"
          label="选择达人"
          rules={[{ required: true, message: '请选择达人' }]}
        >
          <Select
            showSearch
            placeholder="搜索并选择达人"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={influencers.map((inf) => ({
              value: inf.id,
              label: `${inf.nickname} (${PLATFORM_LABELS[inf.platform]} - ${inf.platformId})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="stage"
          label="初始阶段"
          rules={[{ required: true, message: '请选择初始阶段' }]}
        >
          <Select
            options={STAGE_ORDER.map((stage) => ({
              value: stage,
              label: STAGE_LABELS[stage],
            }))}
          />
        </Form.Item>

        <Form.Item name="deadline" label="截止时间">
          <DatePicker
            showTime
            placeholder="选择截止时间（可选）"
            style={{ width: '100%' }}
            format="YYYY-MM-DD HH:mm"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea
            placeholder="输入备注信息（可选）"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateCollaborationModal;
