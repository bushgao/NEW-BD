import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Tag,
  Typography,
  Statistic,
  message,
} from 'antd';
import {
  PlusOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { ContentType, ProfitStatus } from '@ics/shared';
import {
  getResults,
  getResultStats,
  CONTENT_TYPE_LABELS,
  PROFIT_STATUS_LABELS,
  PROFIT_STATUS_COLORS,
  formatMoney,
  formatRoi,
  type CollaborationResult,
  type ResultFilter,
  type ResultStats,
} from '../../services/result.service';
import { PLATFORM_LABELS } from '../../services/influencer.service';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import ResultModal from './ResultModal';
import RoiReportModal from './RoiReportModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ResultsPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CollaborationResult[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
  const [filter, setFilter] = useState<ResultFilter>({});
  const [stats, setStats] = useState<ResultStats | null>(null);

  // Modal states
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [editingResult, setEditingResult] = useState<CollaborationResult | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getResults({
        ...filter,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      message.error('获取合作结果列表失败');
    } finally {
      setLoading(false);
    }
  }, [filter, pagination]);

  const fetchStats = useCallback(async () => {
    try {
      const dateRange = filter.startDate && filter.endDate
        ? { startDate: filter.startDate, endDate: filter.endDate }
        : undefined;
      const statsData = await getResultStats(dateRange);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [filter.startDate, filter.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);


  const handleTableChange = (paginationConfig: TablePaginationConfig) => {
    setPagination({
      page: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilter((prev) => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      }));
    } else {
      setFilter((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }));
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleProfitStatusFilter = (status: ProfitStatus | undefined) => {
    setFilter((prev) => ({ ...prev, profitStatus: status }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleContentTypeFilter = (type: ContentType | undefined) => {
    setFilter((prev) => ({ ...prev, contentType: type }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleEdit = (record: CollaborationResult) => {
    setEditingResult(record);
    setResultModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setResultModalVisible(false);
    setEditingResult(null);
    if (refresh) {
      fetchData();
      fetchStats();
    }
  };

  const columns: ColumnsType<CollaborationResult> = [
    {
      title: '达人',
      key: 'influencer',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.collaboration?.influencer.nickname}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {PLATFORM_LABELS[record.collaboration?.influencer.platform as keyof typeof PLATFORM_LABELS]}
          </Text>
        </div>
      ),
    },
    {
      title: '内容类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type: ContentType) => CONTENT_TYPE_LABELS[type],
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '销售件数',
      dataIndex: 'salesQuantity',
      key: 'salesQuantity',
      width: 100,
      align: 'right',
    },
    {
      title: '销售GMV',
      dataIndex: 'salesGmv',
      key: 'salesGmv',
      width: 120,
      align: 'right',
      render: (gmv: number) => `¥${formatMoney(gmv)}`,
    },
    {
      title: '总成本',
      dataIndex: 'totalCollaborationCost',
      key: 'totalCollaborationCost',
      width: 120,
      align: 'right',
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      width: 80,
      align: 'right',
      render: (roi: number) => formatRoi(roi),
    },
    {
      title: '回本状态',
      dataIndex: 'profitStatus',
      key: 'profitStatus',
      width: 100,
      render: (status: ProfitStatus) => (
        <Tag color={PROFIT_STATUS_COLORS[status]}>
          {PROFIT_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '复投',
      dataIndex: 'willRepeat',
      key: 'willRepeat',
      width: 80,
      render: (willRepeat: boolean) => (
        <Tag color={willRepeat ? 'green' : 'default'}>
          {willRepeat ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '负责商务',
      key: 'staff',
      width: 100,
      render: (_, record) => record.collaboration?.businessStaff.name,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          详情
        </Button>
      ),
    },
  ];


  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '24px',
      }}
    >
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.08), rgba(191, 90, 242, 0.08))',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            合作结果
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<BarChartOutlined />} onClick={() => setReportModalVisible(true)}>
              ROI 报表
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setResultModalVisible(true)}>
              录入结果
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="合作数量"
                  value={stats.totalCount}
                  suffix="个"
                />
              </CardContent>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="总 GMV"
                  value={stats.totalGmv / 100}
                  precision={2}
                  prefix="¥"
                />
              </CardContent>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="总成本"
                  value={stats.totalCost / 100}
                  precision={2}
                  prefix="¥"
                />
              </CardContent>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card variant="elevated" hoverable>
              <CardContent>
                <Statistic
                  title="整体 ROI"
                  value={stats.overallRoi}
                  precision={2}
                  valueStyle={{ color: stats.overallRoi >= 1 ? '#52c41a' : '#ff4d4f' }}
                />
              </CardContent>
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选条件 */}
      <Card variant="elevated" style={{ marginBottom: 16 }}>
        <CardContent>
          <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateRangeChange}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="回本状态"
              allowClear
              style={{ width: '100%' }}
              onChange={handleProfitStatusFilter}
              options={Object.entries(PROFIT_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="内容类型"
              allowClear
              style={{ width: '100%' }}
              onChange={handleContentTypeFilter}
              options={Object.entries(CONTENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Col>
        </Row>
        </CardContent>
      </Card>

      {/* 数据表格 */}
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
        scroll={{ x: 1200 }}
      />

      {/* 结果录入/编辑弹窗 */}
      <ResultModal
        visible={resultModalVisible}
        result={editingResult}
        onClose={handleModalClose}
      />

      {/* ROI 报表弹窗 */}
      <RoiReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
      />
      </div>
    </div>
  );
};

export default ResultsPage;
