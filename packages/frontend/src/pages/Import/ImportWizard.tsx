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
  Radio,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';
import {
  parseImportFile,
  previewImport,
  executeImport,
  IMPORT_TYPE_LABELS,
  type ImportType,
  type FieldMapping,
  type ImportPreviewRow,
  type ImportResult,
} from '../../services/import-export.service';
import { PLATFORM_LABELS } from '../../services/influencer.service';
import type { Platform } from '@ics/shared';

const { Dragger } = Upload;
const { Text } = Typography;

interface ImportWizardProps {
  visible: boolean;
  onClose: (refresh?: boolean) => void;
  defaultType?: ImportType;
  allowTypeChange?: boolean;
}

const ImportWizard = ({ 
  visible, 
  onClose, 
  defaultType = 'influencers',
  allowTypeChange = true,
}: ImportWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [importType, setImportType] = useState<ImportType>(defaultType);
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
      const result = await parseImportFile(uploadFile.originFileObj, importType);
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
      const result = await previewImport(file, values as FieldMapping, importType);
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
    if (!file) return;

    setLoading(true);
    try {
      const result = await executeImport(file, mapping as FieldMapping, importType, true);
      setImportResult(result);
      setCurrentStep(3);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  // 达人预览列
  const influencerPreviewColumns: ColumnsType<ImportPreviewRow> = [
    { title: '行号', dataIndex: 'rowNumber', key: 'rowNumber', width: 60 },
    { title: '昵称', dataIndex: ['data', 'nickname'], key: 'nickname', width: 120 },
    {
      title: '平台',
      dataIndex: ['data', 'platform'],
      key: 'platform',
      width: 80,
      render: (platform) => platform && PLATFORM_LABELS[platform as Platform],
    },
    { title: '平台账号ID', dataIndex: ['data', 'platformId'], key: 'platformId', width: 120, ellipsis: true },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.errors.length > 0) return <Tag color="error">数据错误</Tag>;
        if (record.isDuplicate) return <Tag color="warning">重复</Tag>;
        return <Tag color="success">有效</Tag>;
      },
    },
    {
      title: '问题',
      key: 'issues',
      render: (_, record) => {
        if (record.errors.length > 0) return <Text type="danger">{record.errors.join('; ')}</Text>;
        if (record.isDuplicate && record.duplicateInfo) {
          return <Text type="warning">与已有数据"{record.duplicateInfo.existingName}"重复</Text>;
        }
        return '-';
      },
    },
  ];

  // 样品预览列
  const samplePreviewColumns: ColumnsType<ImportPreviewRow> = [
    { title: '行号', dataIndex: 'rowNumber', key: 'rowNumber', width: 60 },
    { title: 'SKU', dataIndex: ['data', 'sku'], key: 'sku', width: 100 },
    { title: '名称', dataIndex: ['data', 'name'], key: 'name', width: 150 },
    {
      title: '单件成本',
      dataIndex: ['data', 'unitCost'],
      key: 'unitCost',
      width: 100,
      render: (v) => v ? `¥${(v / 100).toFixed(2)}` : '-',
    },
    {
      title: '建议零售价',
      dataIndex: ['data', 'retailPrice'],
      key: 'retailPrice',
      width: 100,
      render: (v) => v ? `¥${(v / 100).toFixed(2)}` : '-',
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.errors.length > 0) return <Tag color="error">数据错误</Tag>;
        if (record.isDuplicate) return <Tag color="warning">重复</Tag>;
        return <Tag color="success">有效</Tag>;
      },
    },
    {
      title: '问题',
      key: 'issues',
      render: (_, record) => {
        if (record.errors.length > 0) return <Text type="danger">{record.errors.join('; ')}</Text>;
        if (record.isDuplicate && record.duplicateInfo) {
          return <Text type="warning">SKU与已有样品"{record.duplicateInfo.existingName}"重复</Text>;
        }
        return '-';
      },
    },
  ];

  const previewColumns = importType === 'samples' ? samplePreviewColumns : influencerPreviewColumns;

  // 渲染达人字段映射表单
  const renderInfluencerMappingForm = () => (
    <>
      <Form.Item name="nickname" label="昵称列" rules={[{ required: true, message: '请选择昵称列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="platform" label="平台列" rules={[{ required: true, message: '请选择平台列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="platformId" label="平台账号ID列" rules={[{ required: true, message: '请选择平台账号ID列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="phone" label="手机号列（可选）">
        <Select placeholder="请选择" allowClear options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="categories" label="类目列（可选）">
        <Select placeholder="请选择" allowClear options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="tags" label="标签列（可选）">
        <Select placeholder="请选择" allowClear options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="notes" label="备注列（可选）">
        <Select placeholder="请选择" allowClear options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
    </>
  );

  // 渲染样品字段映射表单
  const renderSampleMappingForm = () => (
    <>
      <Form.Item name="sku" label="SKU列" rules={[{ required: true, message: '请选择SKU列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="name" label="名称列" rules={[{ required: true, message: '请选择名称列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="unitCost" label="单件成本列（元）" rules={[{ required: true, message: '请选择单件成本列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="retailPrice" label="建议零售价列（元）" rules={[{ required: true, message: '请选择建议零售价列' }]}>
        <Select placeholder="请选择" options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="canResend" label="可复寄列（可选）">
        <Select placeholder="请选择" allowClear options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
      <Form.Item name="notes" label="备注列（可选）">
        <Select placeholder="请选择" allowClear options={headers.map((h) => ({ value: h, label: h }))} />
      </Form.Item>
    </>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            {allowTypeChange && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>选择导入类型：</Text>
                <Radio.Group
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  style={{ marginLeft: 16 }}
                >
                  <Radio.Button value="influencers">达人</Radio.Button>
                  <Radio.Button value="samples">样品</Radio.Button>
                </Radio.Group>
              </div>
            )}
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
          </div>
        );

      case 1:
        return (
          <Form form={form} layout="vertical">
            <Alert
              type="info"
              message={`请将文件中的列映射到${IMPORT_TYPE_LABELS[importType]}字段`}
              style={{ marginBottom: 16 }}
            />
            {importType === 'samples' ? renderSampleMappingForm() : renderInfluencerMappingForm()}
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
            title="导入完成"
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
      title={`批量导入${IMPORT_TYPE_LABELS[importType]}`}
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

export default ImportWizard;
