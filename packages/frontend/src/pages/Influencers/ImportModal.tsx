import { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Steps,
  Form,
  Select,
  Table,
  Tag,
  Alert,
  message,
  Result,
  Space,
  Typography,
} from 'antd';
import { UploadOutlined as _UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';
import {
  parseImportFile,
  previewImport,
  executeImport,
  PLATFORM_LABELS,
  type FieldMapping,
  type ImportPreviewRow,
  type ImportResult,
} from '../../services/influencer.service';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportModalProps {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
}

const ImportModal = ({ visible, onClose }: ImportModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<FieldMapping>>({});
  const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
  const [previewStats, setPreviewStats] = useState({ total: 0, valid: 0, error: 0, duplicate: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const resetState = () => {
    setCurrentStep(0);
    setFile(null);
    setHeaders([]);
    setMapping({});
    setPreviewData([]);
    setPreviewStats({ total: 0, valid: 0, error: 0, duplicate: 0 });
    setImportResult(null);
    form.resetFields();
  };

  const handleClose = (refresh?: boolean) => {
    resetState();
    onClose(refresh);
  };

  const handleFileUpload = async (uploadFile: UploadFile) => {
    if (!uploadFile.originFileObj) return;

    setLoading(true);
    try {
      const result = await parseImportFile(uploadFile.originFileObj);
      setFile(uploadFile.originFileObj);
      setHeaders(result.headers);
      setMapping(result.suggestedMapping);
      form.setFieldsValue(result.suggestedMapping);
      setCurrentStep(1);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '文件解析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!file) return;

      setLoading(true);
      const result = await previewImport(file, values as FieldMapping);
      setMapping(values);
      setPreviewData(result.preview);
      setPreviewStats({
        total: result.totalRows,
        valid: result.validRows,
        error: result.errorRows,
        duplicate: result.duplicateRows,
      });
      setCurrentStep(2);
    } catch (error: any) {
      if (error.response?.data?.error?.message) {
        message.error(error.response.data.error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !mapping.nickname || !mapping.platform || !mapping.platformId) return;

    setLoading(true);
    try {
      const result = await executeImport(file, mapping as FieldMapping, true);
      setImportResult(result);
      setCurrentStep(3);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  const previewColumns: ColumnsType<ImportPreviewRow> = [
    {
      title: '行号',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      width: 60,
    },
    {
      title: '昵称',
      dataIndex: ['data', 'nickname'],
      key: 'nickname',
      width: 120,
    },
    {
      title: '平台',
      dataIndex: ['data', 'platform'],
      key: 'platform',
      width: 80,
      render: (platform) => platform && PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS],
    },
    {
      title: '平台账号ID',
      dataIndex: ['data', 'platformId'],
      key: 'platformId',
      width: 120,
      ellipsis: true,
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.errors.length > 0) {
          return <Tag color="error">数据错误</Tag>;
        }
        if (record.isDuplicate) {
          return <Tag color="warning">重复</Tag>;
        }
        return <Tag color="success">有效</Tag>;
      },
    },
    {
      title: '问题',
      key: 'issues',
      render: (_, record) => {
        if (record.errors.length > 0) {
          return <Text type="danger">{record.errors.join('; ')}</Text>;
        }
        if (record.isDuplicate && record.duplicateInfo) {
          return (
            <Text type="warning">
              与已有达人"{record.duplicateInfo.existingNickname}"重复
            </Text>
          );
        }
        return '-';
      },
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Dragger
            accept=".xlsx,.xls,.csv"
            maxCount={1}
            beforeUpload={() => false}
            onChange={({ file }) => handleFileUpload(file)}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持 Excel (.xlsx, .xls) 或 CSV 文件</p>
          </Dragger>
        );

      case 1:
        return (
          <Form form={form} layout="vertical">
            <Alert
              type="info"
              message="请将文件中的列映射到系统字段"
              style={{ marginBottom: 16 }}
            />
            <Form.Item
              name="nickname"
              label="昵称列"
              rules={[{ required: true, message: '请选择昵称列' }]}
            >
              <Select
                placeholder="请选择"
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
            <Form.Item
              name="platform"
              label="平台列"
              rules={[{ required: true, message: '请选择平台列' }]}
            >
              <Select
                placeholder="请选择"
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
            <Form.Item
              name="platformId"
              label="平台账号ID列"
              rules={[{ required: true, message: '请选择平台账号ID列' }]}
            >
              <Select
                placeholder="请选择"
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
            <Form.Item name="phone" label="手机号列（可选）">
              <Select
                placeholder="请选择"
                allowClear
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
            <Form.Item name="categories" label="类目列（可选）">
              <Select
                placeholder="请选择"
                allowClear
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
            <Form.Item name="tags" label="标签列（可选）">
              <Select
                placeholder="请选择"
                allowClear
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
            <Form.Item name="notes" label="备注列（可选）">
              <Select
                placeholder="请选择"
                allowClear
                options={headers.map((h) => ({ value: h, label: h }))}
              />
            </Form.Item>
          </Form>
        );

      case 2:
        return (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="default">总计: {previewStats.total}</Tag>
              <Tag color="success">有效: {previewStats.valid}</Tag>
              <Tag color="error">错误: {previewStats.error}</Tag>
              <Tag color="warning">重复: {previewStats.duplicate}</Tag>
            </Space>
            {previewStats.duplicate > 0 && (
              <Alert
                type="warning"
                message={`检测到 ${previewStats.duplicate} 条重复数据，导入时将自动跳过`}
                style={{ marginBottom: 16 }}
              />
            )}
            <Table
              columns={previewColumns}
              dataSource={previewData}
              rowKey="rowNumber"
              size="small"
              scroll={{ y: 300 }}
              pagination={false}
            />
          </div>
        );

      case 3:
        return importResult ? (
          <Result
            status={importResult.successCount > 0 ? 'success' : 'warning'}
            title={`导入完成`}
            subTitle={
              <Space direction="vertical">
                <Text>成功导入: {importResult.successCount} 条</Text>
                <Text>跳过重复: {importResult.duplicateCount} 条</Text>
                <Text>导入失败: {importResult.errorCount} 条</Text>
                {importResult.skippedCount > 0 && (
                  <Text type="warning">因配额限制跳过: {importResult.skippedCount} 条</Text>
                )}
              </Space>
            }
          />
        ) : null;

      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (currentStep) {
      case 0:
        return [
          <Button key="cancel" onClick={() => handleClose()}>
            取消
          </Button>,
        ];
      case 1:
        return [
          <Button key="back" onClick={() => setCurrentStep(0)}>
            上一步
          </Button>,
          <Button key="next" type="primary" loading={loading} onClick={handleMappingSubmit}>
            下一步
          </Button>,
        ];
      case 2:
        return [
          <Button key="back" onClick={() => setCurrentStep(1)}>
            上一步
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={loading}
            onClick={handleImport}
            disabled={previewStats.valid === 0}
          >
            确认导入 ({previewStats.valid} 条)
          </Button>,
        ];
      case 3:
        return [
          <Button key="close" type="primary" onClick={() => handleClose(true)}>
            完成
          </Button>,
        ];
      default:
        return [];
    }
  };

  return (
    <Modal
      title="批量导入达人"
      open={visible}
      onCancel={() => handleClose()}
      footer={renderFooter()}
      width={800}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        items={[
          { title: '上传文件' },
          { title: '字段映射' },
          { title: '预览确认' },
          { title: '导入完成' },
        ]}
        style={{ marginBottom: 24 }}
      />
      {renderStepContent()}
    </Modal>
  );
};

export default ImportModal;
