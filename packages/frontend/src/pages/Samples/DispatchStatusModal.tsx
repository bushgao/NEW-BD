import { useEffect } from 'react';
import { Modal, Form, Select, message, Descriptions } from 'antd';
import type { ReceivedStatus, OnboardStatus } from '@ics/shared';
import {
  updateDispatchStatus,
  formatMoney,
  RECEIVED_STATUS_LABELS,
  ONBOARD_STATUS_LABELS,
  type SampleDispatch,
} from '../../services/sample.service';

interface DispatchStatusModalProps {
  visible: boolean;
  dispatch: SampleDispatch | null;
  onClose: (refresh?: boolean) => void;
}

interface FormValues {
  receivedStatus: ReceivedStatus;
  onboardStatus: OnboardStatus;
}

const DispatchStatusModal = ({ visible, dispatch, onClose }: DispatchStatusModalProps) => {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (visible && dispatch) {
      form.setFieldsValue({
        receivedStatus: dispatch.receivedStatus,
        onboardStatus: dispatch.onboardStatus,
      });
    }
  }, [visible, dispatch, form]);

  const handleSubmit = async () => {
    if (!dispatch) return;

    try {
      const values = await form.validateFields();
      
      await updateDispatchStatus(dispatch.id, {
        receivedStatus: values.receivedStatus,
        onboardStatus: values.onboardStatus,
      });
      
      message.success('状态更新成功');
      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        return; // Form validation error
      }
      message.error(error.response?.data?.error?.message || '更新失败');
    }
  };

  if (!dispatch) return null;

  return (
    <Modal
      title="更新寄样状态"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      okText="保存"
      cancelText="取消"
      width={500}
      destroyOnClose
    >
      <Descriptions column={1} style={{ marginBottom: 24 }} bordered size="small">
        <Descriptions.Item label="样品">{dispatch.sample.name}</Descriptions.Item>
        <Descriptions.Item label="达人">{dispatch.collaboration?.influencer?.nickname || '-'}</Descriptions.Item>
        <Descriptions.Item label="数量">{dispatch.quantity}</Descriptions.Item>
        <Descriptions.Item label="总成本">¥{formatMoney(dispatch.totalCost)}</Descriptions.Item>
        <Descriptions.Item label="快递单号">{dispatch.trackingNumber || '-'}</Descriptions.Item>
        <Descriptions.Item label="寄样时间">
          {new Date(dispatch.dispatchedAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item
          name="receivedStatus"
          label="签收状态"
          rules={[{ required: true, message: '请选择签收状态' }]}
        >
          <Select
            placeholder="请选择签收状态"
            options={Object.entries(RECEIVED_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="onboardStatus"
          label="上车状态"
          rules={[{ required: true, message: '请选择上车状态' }]}
        >
          <Select
            placeholder="请选择上车状态"
            options={Object.entries(ONBOARD_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DispatchStatusModal;
