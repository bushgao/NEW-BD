import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  Row,
  Col,
  message,
  Popconfirm,
  Typography,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  BarChartOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
  getSamples,
  deleteSample,
  formatMoney,
  type Sample,
  type SampleFilter,
} from '../../services/sample.service';
import SampleModal from './SampleModal';
import DispatchList from './DispatchList';
import SampleReport from './SampleReport';
import { ImportWizard, ExportButton } from '../Import';

const { Title } = Typography;

const SamplesPage = () => {
  const [activeTab, setActiveTab] = useState('samples');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Sample[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [filter, setFilter] = useState<SampleFilter>({});

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSamples({
        ...filter,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('获取样品列表失败');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination]);

  useEffect(() => {
    if (activeTab === 'samples') {
      fetchData();
    }
  }, [fetchData, activeTab]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination({
      page: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    });
  };

  const handleSearch = (keyword: string) => {
    setFilter((prev) => ({ ...prev, keyword }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCanResendFilter = (canResend: boolean | undefined) => {
    setFilter((prev) => ({ ...prev, canResend }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSample(id);
      message.success('删除成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '删除失败');
    }
  };

  const handleEdit = (record: Sample) => {
    setEditingSample(record);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingSample(null);
    setModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalVisible(false);
    setEditingSample(null);
    if (refresh) {
      fetchData();
    }
  };

  const handleImportClose = (refresh?: boolean) => {
    setImportModalVisible(false);
    if (refresh) {
      fetchData();
    }
  };

  const columns: ColumnsType<Sample> = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      ellipsis: true,
    },
    {
      title: '样品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '单件成本',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 120,
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: '建议零售价',
      dataIndex: 'retailPrice',
      key: 'retailPrice',
      width: 120,
      render: (price: number) => `¥${formatMoney(price)}`,
    },
    {
      title: '可复寄',
      dataIndex: 'canResend',
      key: 'canResend',
      width: 80,
      render: (canResend: boolean) => (
        <Tag color={canResend ? 'green' : 'default'}>{canResend ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (notes: string | null) => notes || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该样品吗？"
            description="删除后无法恢复，且该样品不能有寄样记录"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'samples',
      label: (
        <span>
          <SendOutlined />
          样品列表
        </span>
      ),
      children: (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                样品管理
              </Title>
            </Col>
            <Col>
              <Space>
                <ExportButton types={['samples']} buttonText="导出" showDateRange={false} />
                <Button icon={<UploadOutlined />} onClick={() => setImportModalVisible(true)}>
                  批量导入
                </Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  添加样品
                </Button>
              </Space>
            </Col>
          </Row>

          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Input.Search
                  placeholder="搜索 SKU 或样品名称"
                  allowClear
                  enterButton={<SearchOutlined />}
                  onSearch={handleSearch}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="是否可复寄"
                  allowClear
                  style={{ width: '100%' }}
                  onChange={handleCanResendFilter}
                  options={[
                    { value: true, label: '可复寄' },
                    { value: false, label: '不可复寄' },
                  ]}
                />
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
          />
        </>
      ),
    },
    {
      key: 'dispatches',
      label: (
        <span>
          <SendOutlined />
          寄样记录
        </span>
      ),
      children: <DispatchList />,
    },
    {
      key: 'report',
      label: (
        <span>
          <BarChartOutlined />
          成本报表
        </span>
      ),
      children: <SampleReport />,
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <SampleModal
        visible={modalVisible}
        sample={editingSample}
        onClose={handleModalClose}
      />

      <ImportWizard
        visible={importModalVisible}
        onClose={handleImportClose}
        defaultType="samples"
        allowTypeChange={false}
      />
    </div>
  );
};

export default SamplesPage;
