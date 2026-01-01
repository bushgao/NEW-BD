import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import {
  createSample,
  updateSample,
  formatMoney,
  parseMoney,
  type Sample,
  type CreateSampleInput,
  type UpdateSampleInput,
} from '../../services/sample.service';

interface SampleModalProps {
  visible: boolean;
  sample: Sample | null;
  onClose: (refresh?: boolean) => void;
}

interface FormValues {
  sku: string;
  name: string;
  unitCost: number; // 元
  retailPrice: number; // 元
  canResend: boolean;
  notes?: string;
}

const SampleModal = ({ visible, sample, onClose }: SampleModalProps) => {
  const [form] = Form.useForm<FormValues>();
  const isEdit = !!sample;

  useEffect(() => {
    if (visible) {
      if (sample) {
        form.setFieldsValue({
          sku: sample.sku,
          name: sample.name,
          unitCost: parseFloat(formatMoney(sample.unitCost)),
          retailPrice: parseFloat(formatMoney(sample.retailPrice)),
          canResend: sample.canResend,
          notes: sample.notes || undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ canResend: true });
      }
    }
  }, [visible, sample, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        sku: values.sku,
        name: values.name,
        unitCost: parseMoney(values.unitCost),
        retailPrice: parseMoney(values.retailPrice),
        canResend: values.canResend,
        notes: values.notes,
      };

      if (isEdit) {
        await updateSample(sample.id, data as UpdateSampleInput);
        message.success('更新成功');
      } else {
        await createSample(data as CreateSampleInput);
        message.success('创建成功');
      }
      onClose(true);
    } catch (error: any) {
      if (error.errorFields) {
        return; // Form validation error
      }
      message.error(error.response?.data?.error?.message || '操作失败');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑样品' : '添加样品'}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ canResend: true }}
      >
        <Form.Item
          name="sku"
          label="SKU"
          rules={[{ required: true, message: '请输入 SKU' }]}
        >
          <Input placeholder="请输入样品 SKU" maxLength={50} />
        </Form.Item>

        <Form.Item
          name="name"
          label="样品名称"
          rules={[{ required: true, message: '请输入样品名称' }]}
        >
          <Input placeholder="请输入样品名称" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="unitCost"
          label="单件成本（元）"
          rules={[
            { required: true, message: '请输入单件成本' },
            { type: 'number', min: 0, message: '成本不能为负数' },
          ]}
        >
          <InputNumber
            placeholder="请输入单件成本"
            style={{ width: '100%' }}
            precision={2}
            min={0}
            prefix="¥"
          />
        </Form.Item>

        <Form.Item
          name="retailPrice"
          label="建议零售价（元）"
          rules={[
            { required: true, message: '请输入建议零售价' },
            { type: 'number', min: 0, message: '价格不能为负数' },
          ]}
        >
          <InputNumber
            placeholder="请输入建议零售价"
            style={{ width: '100%' }}
            precision={2}
            min={0}
            prefix="¥"
          />
        </Form.Item>

        <Form.Item
          name="canResend"
          label="是否可复寄"
          valuePropName="checked"
        >
          <Switch checkedChildren="是" unCheckedChildren="否" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="备注"
        >
          <Input.TextArea
            placeholder="请输入备注信息"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SampleModal;
