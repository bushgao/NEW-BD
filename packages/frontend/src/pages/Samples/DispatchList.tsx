import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Select,
  Space,
  Tag,
  Card,
  Row,
  Col,
  message,
  Typography,
  Tooltip,
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { ReceivedStatus, OnboardStatus } from '@ics/shared';
import {
  getDispatches,
  formatMoney,
  RECEIVED_STATUS_LABELS,
  ONBOARD_STATUS_LABELS,
  type SampleDispatch,
  type DispatchFilter,
} from '../../services/sample.service';
import DispatchStatusModal from './DispatchStatusModal';

const { Title } = Typography;

const DispatchList = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SampleDispatch[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [filter, setFilter] = useState<DispatchFilter>({});

  // Modal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingDispatch, setEditingDispatch] = useState<SampleDispatch | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDispatches({
        ...filter,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('获取寄样记录失败');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination({
      page: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    });
  };

  const handleReceivedStatusFilter = (status: ReceivedStatus | undefined) => {
    setFilter((prev) => ({ ...prev, receivedStatus: status }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleOnboardStatusFilter = (status: OnboardStatus | undefined) => {
    setFilter((prev) => ({ ...prev, onboardStatus: status }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEditStatus = (record: SampleDispatch) => {
    setEditingDispatch(record);
    setStatusModalVisible(true);
  };

  const handleStatusModalClose = (refresh?: boolean) => {
    setStatusModalVisible(false);
    setEditingDispatch(null);
    if (refresh) {
      fetchData();
    }
  };

  const getReceivedStatusColor = (status: ReceivedStatus): string => {
    const colors: Record<ReceivedStatus, string> = {
      PENDING: 'default',
      RECEIVED: 'success',
      LOST: 'error',
    };
    return colors[status];
  };

  const getOnboardStatusColor = (status: OnboardStatus): string => {
    const colors: Record<OnboardStatus, string> = {
      UNKNOWN: 'default',
      ONBOARD: 'success',
      NOT_ONBOARD: 'warning',
    };
    return colors[status];
  };

  const columns: ColumnsType<SampleDispatch> = [
    {
      title: '样品',
      key: 'sample',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.sample.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.sample.sku}</div>
        </div>
      ),
    },
    {
      title: '达人',
      key: 'influencer',
      width: 150,
      render: (_, record) => record.collaboration?.influencer?.nickname || '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
    },
    {
      title: '样品成本',
      dataIndex: 'totalSampleCost',
      key: 'totalSampleCost',
      width: 100,
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: '快递费',
      dataIndex: 'shippingCost',
      key: 'shippingCost',
      width: 100,
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 100,
      render: (cost: number) => (
        <span style={{ fontWeight: 500, color: '#f5222d' }}>¥{formatMoney(cost)}</span>
      ),
    },
    {
      title: '快递单号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      width: 140,
      ellipsis: true,
      render: (num: string | null) => num || '-',
    },
    {
      title: '签收状态',
      dataIndex: 'receivedStatus',
      key: 'receivedStatus',
      width: 100,
      render: (status: ReceivedStatus) => (
        <Tag color={getReceivedStatusColor(status)}>{RECEIVED_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '上车状态',
      dataIndex: 'onboardStatus',
      key: 'onboardStatus',
      width: 100,
      render: (status: OnboardStatus) => (
        <Tag color={getOnboardStatusColor(status)}>{ONBOARD_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '寄样时间',
      dataIndex: 'dispatchedAt',
      key: 'dispatchedAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '商务',
      key: 'businessStaff',
      width: 100,
      render: (_, record) => record.businessStaff?.name || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="更新状态">
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleEditStatus(record)}
            >
              更新状态
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            寄样记录
          </Title>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="签收状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleReceivedStatusFilter}
              options={Object.entries(RECEIVED_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="上车状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleOnboardStatusFilter}
              options={Object.entries(ONBOARD_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
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
        scroll={{ x: 1400 }}
      />

      <DispatchStatusModal
        visible={statusModalVisible}
        dispatch={editingDispatch}
        onClose={handleStatusModalClose}
      />
    </div>
  );
};

export default DispatchList;
