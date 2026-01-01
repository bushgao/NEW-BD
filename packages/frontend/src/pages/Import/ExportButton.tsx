import { useState } from 'react';
import {
  Button,
  Dropdown,
  Modal,
  Form,
  DatePicker,
  Select,
  message,
} from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import {
  exportData,
  EXPORT_TYPE_LABELS,
  type ExportType,
  type ExportOptions,
} from '../../services/import-export.service';

const { RangePicker } = DatePicker;

interface ExportButtonProps {
  types?: ExportType[];
  showDateRange?: boolean;
  showGroupBy?: boolean;
  buttonText?: string;
}

const ExportButton = ({
  types = ['influencers', 'samples', 'dispatches', 'collaborations', 'results'],
  showDateRange = true,
  showGroupBy = false,
  buttonText = '导出',
}: ExportButtonProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleExport = async (type: ExportType) => {
    // 如果需要显示日期范围或分组选项，打开模态框
    if (showDateRange || (showGroupBy && type === 'roi-report')) {
      setSelectedType(type);
      setModalVisible(true);
      return;
    }

    // 直接导出
    await doExport(type, {});
  };

  const doExport = async (type: ExportType, options: ExportOptions) => {
    setLoading(true);
    try {
      await exportData(type, options);
      message.success('导出成功');
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '导出失败');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    if (!selectedType) return;

    const values = form.getFieldsValue();
    const options: ExportOptions = {};

    if (values.dateRange) {
      options.startDate = values.dateRange[0].toISOString();
      options.endDate = values.dateRange[1].toISOString();
    }

    if (values.groupBy) {
      options.groupBy = values.groupBy;
    }

    await doExport(selectedType, options);
  };

  const menuItems: MenuProps['items'] = types.map((type) => ({
    key: type,
    label: EXPORT_TYPE_LABELS[type],
    onClick: () => handleExport(type),
  }));

  // 如果只有一个导出类型，直接显示按钮
  if (types.length === 1) {
    return (
      <>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => handleExport(types[0])}
          loading={loading}
        >
          {buttonText}
        </Button>

        <Modal
          title={`导出${selectedType ? EXPORT_TYPE_LABELS[selectedType] : ''}`}
          open={modalVisible}
          onOk={handleModalOk}
          onCancel={() => {
            setModalVisible(false);
            form.resetFields();
          }}
          confirmLoading={loading}
          okText="导出"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            {showDateRange && (
              <Form.Item name="dateRange" label="日期范围（可选）">
                <RangePicker
                  style={{ width: '100%' }}
                  presets={[
                    { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
                    { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
                    { label: '近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
                    { label: '近90天', value: [dayjs().subtract(90, 'day'), dayjs()] },
                  ]}
                />
              </Form.Item>
            )}
            {showGroupBy && selectedType === 'roi-report' && (
              <Form.Item name="groupBy" label="分组方式" initialValue="month">
                <Select
                  options={[
                    { value: 'influencer', label: '按达人' },
                    { value: 'sample', label: '按样品' },
                    { value: 'staff', label: '按商务' },
                    { value: 'month', label: '按月份' },
                  ]}
                />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </>
    );
  }

  // 多个导出类型，显示下拉菜单
  return (
    <>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Button icon={<DownloadOutlined />} loading={loading}>
          {buttonText}
        </Button>
      </Dropdown>

      <Modal
        title={`导出${selectedType ? EXPORT_TYPE_LABELS[selectedType] : ''}`}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        okText="导出"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {showDateRange && (
            <Form.Item name="dateRange" label="日期范围（可选）">
              <RangePicker
                style={{ width: '100%' }}
                presets={[
                  { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
                  { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
                  { label: '近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
                  { label: '近90天', value: [dayjs().subtract(90, 'day'), dayjs()] },
                ]}
              />
            </Form.Item>
          )}
          {showGroupBy && selectedType === 'roi-report' && (
            <Form.Item name="groupBy" label="分组方式" initialValue="month">
              <Select
                options={[
                  { value: 'influencer', label: '按达人' },
                  { value: 'sample', label: '按样品' },
                  { value: 'staff', label: '按商务' },
                  { value: 'month', label: '按月份' },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ExportButton;
