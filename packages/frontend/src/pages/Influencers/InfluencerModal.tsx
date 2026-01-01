import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, message, Alert } from 'antd';
import {
  createInfluencer,
  updateInfluencer,
  checkDuplicate,
  PLATFORM_LABELS,
  type Influencer,
  type DuplicateCheckResult,
} from '../../services/influencer.service';

interface InfluencerModalProps {
  visible: boolean;
  influencer: Influencer | null;
  onClose: (refresh?: boolean) => void;
  allCategories: string[];
  allTags: string[];
}

const InfluencerModal = ({
  visible,
  influencer,
  onClose,
  allCategories,
  allTags,
}: InfluencerModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);

  const isEdit = !!influencer;

  useEffect(() => {
    if (visible) {
      if (influencer) {
        form.setFieldsValue({
          nickname: influencer.nickname,
          platform: influencer.platform,
          platformId: influencer.platformId,
          phone: influencer.phone || '',
          categories: influencer.categories,
          tags: influencer.tags,
          notes: influencer.notes || '',
        });
      } else {
        form.resetFields();
      }
      setDuplicateWarning(null);
    }
  }, [visible, influencer, form]);

  const handleDuplicateCheck = async () => {
    const values = form.getFieldsValue(['phone', 'platform', 'platformId']);
    if (!values.platform || !values.platformId) return;

    try {
      const result = await checkDuplicate(values.phone, values.platform, values.platformId);
      if (result.isDuplicate) {
        // Don't show warning if editing the same influencer
        if (isEdit && result.existingInfluencer?.id === influencer?.id) {
          setDuplicateWarning(null);
        } else {
          setDuplicateWarning(result);
        }
      } else {
        setDuplicateWarning(null);
      }
    } catch (error) {
      console.error('Duplicate check failed:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        nickname: values.nickname,
        platform: values.platform,
        platformId: values.platformId,
        phone: values.phone || undefined,
        categories: values.categories || [],
        tags: values.tags || [],
        notes: values.notes || undefined,
      };

      if (isEdit) {
        await updateInfluencer(influencer!.id, data);
        message.success('更新成功');
      } else {
        await createInfluencer(data);
        message.success('添加成功');
      }

      onClose(true);
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        message.error(error.response.data.error.message);
      } else if (error.errorFields) {
        // Form validation error
      } else {
        message.error(isEdit ? '更新失败' : '添加失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑达人' : '添加达人'}
      open={visible}
      onOk={handleSubmit}
      onCancel={() => onClose()}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      {duplicateWarning && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`检测到重复: ${
            duplicateWarning.duplicateType === 'phone'
              ? '手机号'
              : duplicateWarning.duplicateType === 'platformId'
              ? '平台账号ID'
              : '手机号和平台账号ID'
          }已存在`}
          description={`已存在达人: ${duplicateWarning.existingInfluencer?.nickname}`}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="nickname"
          label="达人昵称"
          rules={[{ required: true, message: '请输入达人昵称' }]}
        >
          <Input placeholder="请输入达人昵称" />
        </Form.Item>

        <Form.Item
          name="platform"
          label="平台"
          rules={[{ required: true, message: '请选择平台' }]}
        >
          <Select
            placeholder="请选择平台"
            onChange={handleDuplicateCheck}
            options={Object.entries(PLATFORM_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="platformId"
          label="平台账号ID"
          rules={[{ required: true, message: '请输入平台账号ID' }]}
        >
          <Input placeholder="请输入平台账号ID" onBlur={handleDuplicateCheck} />
        </Form.Item>

        <Form.Item name="phone" label="手机号">
          <Input placeholder="请输入手机号" onBlur={handleDuplicateCheck} />
        </Form.Item>

        <Form.Item name="categories" label="类目">
          <Select
            mode="tags"
            placeholder="请选择或输入类目"
            options={allCategories.map((cat) => ({ value: cat, label: cat }))}
          />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            placeholder="请选择或输入标签"
            options={allTags.map((tag) => ({ value: tag, label: tag }))}
          />
        </Form.Item>

        <Form.Item name="notes" label="备注">
          <Input.TextArea rows={3} placeholder="请输入备注" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InfluencerModal;
