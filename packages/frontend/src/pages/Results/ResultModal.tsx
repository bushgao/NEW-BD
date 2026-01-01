import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Descriptions,
  Tag,
  Divider,
  message,
  Spin,
} from 'antd';
import {
  createResult,
  updateResult,
  getResult,
  CONTENT_TYPE_LABELS,
  PROFIT_STATUS_LABELS,
  PROFIT_STATUS_COLORS,
  formatMoney,
  type CollaborationResult,
} from '../../services/result.service';
import { getCollaborations, type Collaboration } from '../../services/collaboration.service';
import { PLATFORM_LABELS } from '../../services/influencer.service';
import dayjs from 'dayjs';

interface ResultModalProps {
  visible: boolean;
  result: CollaborationResult | null;
  onClose: (refresh?: boolean) => void;
}

const ResultModal = ({ visible, result, onClose }: ResultModalProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState<Collaboration | null>(null);
  const [fullResult, setFullResult] = useState<CollaborationResult | null>(null);

  const isEdit = !!result;

  useEffect(() => {
    if (visible) {
      if (result) {
        // 编辑模式：加载完整结果数据
        fetchFullResult();
      } else {
        // 新建模式：加载可录入结果的合作列表
        fetchCollaborations();
      }
    }
  }, [visible, result]);

  const fetchFullResult = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const data = await getResult(result.id);
      setFullResult(data);
      form.setFieldsValue({
        contentType: data.contentType,
        publishedAt: dayjs(data.publishedAt),
        salesQuantity: data.salesQuantity,
        salesGmv: data.salesGmv / 100, // 转换为元
        commissionRate: data.commissionRate,
        pitFee: data.pitFee / 100, // 转换为元
        actualCommission: data.actualCommission / 100, // 转换为元
        willRepeat: data.willRepeat,
        notes: data.notes,
      });
    } catch (error) {
      message.error('获取结果详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborations = async () => {
    setLoading(true);
    try {
      // 获取已发布但未录入结果的合作
      const data = await getCollaborations({
        stage: 'PUBLISHED',
        pageSize: 100,
      });
      setCollaborations(data.data);
    } catch (error) {
      message.error('获取合作列表失败');
    } finally {
      setLoading(false);
    }
  };


  const handleCollaborationChange = (collaborationId: string) => {
    const collab = collaborations.find((c) => c.id === collaborationId);
    setSelectedCollaboration(collab || null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 转换金额为分
      const data = {
        ...values,
        publishedAt: values.publishedAt.toISOString(),
        salesGmv: Math.round(values.salesGmv * 100),
        pitFee: values.pitFee ? Math.round(values.pitFee * 100) : 0,
        actualCommission: Math.round(values.actualCommission * 100),
      };

      if (isEdit && result) {
        await updateResult(result.id, data);
        message.success('更新成功');
      } else {
        await createResult(data);
        message.success('录入成功');
      }

      form.resetFields();
      setSelectedCollaboration(null);
      setFullResult(null);
      onClose(true);
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.error?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setSelectedCollaboration(null);
    setFullResult(null);
    onClose();
  };

  // 计算样品总成本
  const getSampleCost = () => {
    if (fullResult) {
      return fullResult.totalSampleCost;
    }
    if (selectedCollaboration?.dispatches) {
      return selectedCollaboration.dispatches.reduce((sum, d) => sum + d.totalCost, 0);
    }
    return 0;
  };

  return (
    <Modal
      title={isEdit ? '编辑合作结果' : '录入合作结果'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={submitting}
      width={600}
      okText={isEdit ? '保存' : '录入'}
      cancelText="取消"
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            contentType: 'SHORT_VIDEO',
            willRepeat: false,
            pitFee: 0,
          }}
        >
          {/* 选择合作（新建时） */}
          {!isEdit && (
            <Form.Item
              name="collaborationId"
              label="选择合作"
              rules={[{ required: true, message: '请选择合作' }]}
            >
              <Select
                showSearch
                placeholder="搜索并选择合作"
                optionFilterProp="children"
                onChange={handleCollaborationChange}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={collaborations.map((c) => ({
                  value: c.id,
                  label: `${c.influencer.nickname} (${PLATFORM_LABELS[c.influencer.platform as keyof typeof PLATFORM_LABELS]})`,
                }))}
              />
            </Form.Item>
          )}


          {/* 显示合作信息 */}
          {(selectedCollaboration || fullResult) && (
            <>
              <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="达人">
                  {fullResult?.collaboration?.influencer.nickname || selectedCollaboration?.influencer.nickname}
                </Descriptions.Item>
                <Descriptions.Item label="样品成本">
                  ¥{formatMoney(getSampleCost())}
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '12px 0' }} />
            </>
          )}

          {/* 编辑时显示当前状态 */}
          {isEdit && fullResult && (
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="当前 ROI">
                {fullResult.roi.toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="回本状态">
                <Tag color={PROFIT_STATUS_COLORS[fullResult.profitStatus]}>
                  {PROFIT_STATUS_LABELS[fullResult.profitStatus]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}

          <Form.Item
            name="contentType"
            label="内容类型"
            rules={[{ required: true, message: '请选择内容类型' }]}
          >
            <Select
              options={Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="publishedAt"
            label="发布时间"
            rules={[{ required: true, message: '请选择发布时间' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="salesQuantity"
            label="销售件数"
            rules={[{ required: true, message: '请输入销售件数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入销售件数" />
          </Form.Item>

          <Form.Item
            name="salesGmv"
            label="销售 GMV（元）"
            rules={[{ required: true, message: '请输入销售 GMV' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入销售 GMV"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item name="commissionRate" label="佣金比例（%）">
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入佣金比例"
              suffix="%"
            />
          </Form.Item>

          <Form.Item name="pitFee" label="坑位费（元）">
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入坑位费"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            name="actualCommission"
            label="实付佣金（元）"
            rules={[{ required: true, message: '请输入实付佣金' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入实付佣金"
              prefix="¥"
            />
          </Form.Item>

          <Form.Item name="willRepeat" label="是否复投" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ResultModal;
