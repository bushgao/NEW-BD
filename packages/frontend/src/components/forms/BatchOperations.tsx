import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Progress,
  Alert,
  Typography,
  Divider,
  List,
} from 'antd';
import {
  SendOutlined,
  EditOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { getSamples, type Sample } from '../../services/sample.service';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { Option } = Select;

export interface BatchOperationsProps {
  visible: boolean;
  selectedIds: string[];
  onClose: () => void;
  onExecute: (operation: string, data: any) => Promise<{ updated: number; failed: number; errors: any[] }>;
}

interface OperationResult {
  success: boolean;
  updated: number;
  failed: number;
  errors: any[];
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  visible,
  selectedIds,
  onClose,
  onExecute,
}) => {
  const [form] = Form.useForm();
  const [operation, setOperation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<OperationResult | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchSamples();
    }
  }, [visible]);

  const fetchSamples = async () => {
    setLoadingSamples(true);
    try {
      // Fetch all samples (paginated)
      let allSamples: Sample[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const result = await getSamples({ page, pageSize: 100 });
        allSamples = [...allSamples, ...result.data];
        hasMore = page < result.totalPages;
        page++;
      }

      setSamples(allSamples);
    } catch (error) {
      console.error('Failed to fetch samples:', error);
    } finally {
      setLoadingSamples(false);
    }
  };

  const handleOperationChange = (value: string) => {
    setOperation(value);
    form.resetFields(['data']);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      setLoading(true);
      setProgress(0);
      setResult(null);

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 执行批量操作
      const operationResult = await onExecute(operation, values.data);

      clearInterval(progressInterval);
      setProgress(100);

      setResult({
        success: operationResult.failed === 0,
        updated: operationResult.updated,
        failed: operationResult.failed,
        errors: operationResult.errors,
      });
    } catch (error: any) {
      console.error('Batch operation failed:', error);
      setResult({
        success: false,
        updated: 0,
        failed: selectedIds.length,
        errors: [{ message: error.message || '操作失败' }],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setOperation('');
    setProgress(0);
    setResult(null);
    onClose();
  };

  const renderOperationForm = () => {
    switch (operation) {
      case 'dispatch':
        return (
          <Form.Item
            name={['data', 'sampleId']}
            label="选择样品"
            rules={[{ required: true, message: '请选择样品' }]}
          >
            <Select 
              placeholder="请选择要寄送的样品" 
              loading={loadingSamples}
              showSearch
              optionFilterProp="children"
            >
              {samples.map((sample) => (
                <Option key={sample.id} value={sample.id}>
                  {sample.name} ({sample.sku})
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'updateStage':
        return (
          <Form.Item
            name={['data', 'stage']}
            label="目标阶段"
            rules={[{ required: true, message: '请选择目标阶段' }]}
          >
            <Select placeholder="请选择要更新到的阶段">
              <Option value="LEAD">线索达人</Option>
              <Option value="CONTACTED">已联系</Option>
              <Option value="QUOTED">已报价</Option>
              <Option value="SAMPLED">已寄样</Option>
              <Option value="SCHEDULED">已排期</Option>
              <Option value="PUBLISHED">已发布</Option>
              <Option value="REVIEWED">已复盘</Option>
            </Select>
          </Form.Item>
        );

      case 'setDeadline':
        return (
          <Form.Item
            name={['data', 'deadline']}
            label="截止时间"
            rules={[{ required: true, message: '请选择截止时间' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              placeholder="选择截止时间"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      title="批量操作"
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={null}
    >
      <Alert
        message={`已选择 ${selectedIds.length} 个合作记录`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {!result ? (
        <>
          <Form form={form} layout="vertical">
            <Form.Item
              name="operation"
              label="操作类型"
              rules={[{ required: true, message: '请选择操作类型' }]}
            >
              <Select
                placeholder="请选择要执行的操作"
                onChange={handleOperationChange}
                size="large"
              >
                <Option value="dispatch">
                  <Space>
                    <SendOutlined />
                    批量寄样
                  </Space>
                </Option>
                <Option value="updateStage">
                  <Space>
                    <EditOutlined />
                    批量更新状态
                  </Space>
                </Option>
                <Option value="setDeadline">
                  <Space>
                    <ClockCircleOutlined />
                    批量设置截止日期
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            {operation && (
              <>
                <Divider />
                {renderOperationForm()}
              </>
            )}
          </Form>

          {loading && (
            <div style={{ marginTop: 24 }}>
              <Text type="secondary">正在处理...</Text>
              <Progress percent={progress} status="active" />
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClose} disabled={loading}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={!operation}
              >
                执行操作
              </Button>
            </Space>
          </div>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {result.success ? (
              <>
                <CheckCircleOutlined
                  style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }}
                />
                <Title level={4}>操作完成</Title>
                <Text type="secondary">
                  成功处理 {result.updated} 条记录
                </Text>
              </>
            ) : (
              <>
                <CloseCircleOutlined
                  style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }}
                />
                <Title level={4}>操作部分失败</Title>
                <Space direction="vertical" size="small">
                  <Text>成功: {result.updated} 条</Text>
                  <Text type="danger">失败: {result.failed} 条</Text>
                </Space>
              </>
            )}
          </div>

          {result.errors && result.errors.length > 0 && (
            <>
              <Divider />
              <Alert
                message="错误详情"
                description={
                  <List
                    size="small"
                    dataSource={result.errors}
                    renderItem={(error: any) => (
                      <List.Item>
                        <Text type="danger">{error.message || '未知错误'}</Text>
                      </List.Item>
                    )}
                  />
                }
                type="error"
                showIcon
              />
            </>
          )}

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" onClick={handleClose}>
              关闭
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default BatchOperations;
