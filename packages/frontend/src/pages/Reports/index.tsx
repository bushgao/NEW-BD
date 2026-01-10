import { useState, useEffect } from 'react';
import {
  Table,
  DatePicker,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Spin,
  Typography,
} from 'antd';
import {
  DownloadOutlined,
  ReloadOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  getStaffPerformance,
  exportStaffPerformance,
  formatMoney,
  formatRoi,
  type StaffPerformanceItem,
  type StaffPerformanceReport,
  type DateRange,
} from '../../services/report.service';
import { Card, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ReportsPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState<StaffPerformanceReport | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const range: DateRange | undefined = dateRange
        ? {
          startDate: dateRange[0].startOf('day').toISOString(),
          endDate: dateRange[1].endOf('day').toISOString(),
        }
        : undefined;

      const data = await getStaffPerformance(range);
      setReport(data);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 导出报表
  const handleExport = async () => {
    setExporting(true);
    try {
      const range: DateRange | undefined = dateRange
        ? {
          startDate: dateRange[0].startOf('day').toISOString(),
          endDate: dateRange[1].endOf('day').toISOString(),
        }
        : undefined;

      await exportStaffPerformance(range);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 表格列定义
  const columns: ColumnsType<StaffPerformanceItem> = [
    {
      title: '商务姓名',
      dataIndex: 'staffName',
      key: 'staffName',
      fixed: 'left',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'staffEmail',
      key: 'staffEmail',
      width: 180,
      ellipsis: true,
    },
    {
      title: '建联数量',
      dataIndex: 'contactedCount',
      key: 'contactedCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.contactedCount - b.contactedCount,
    },
    {
      title: '推进数量',
      dataIndex: 'progressedCount',
      key: 'progressedCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.progressedCount - b.progressedCount,
    },
    {
      title: '成交数量',
      dataIndex: 'closedCount',
      key: 'closedCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.closedCount - b.closedCount,
    },
    {
      title: '总GMV（元）',
      dataIndex: 'totalGmv',
      key: 'totalGmv',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalGmv - b.totalGmv,
      render: (value: number) => `¥${formatMoney(value)}`,
    },
    {
      title: '总成本（元）',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.totalCost - b.totalCost,
      render: (value: number) => `¥${formatMoney(value)}`,
    },
    {
      title: '平均ROI',
      dataIndex: 'averageRoi',
      key: 'averageRoi',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.averageRoi - b.averageRoi,
      render: (value: number) => (
        <span style={{ color: value >= 1 ? '#52c41a' : '#ff4d4f' }}>
          {formatRoi(value)}
        </span>
      ),
    },
    {
      title: '寄样数量',
      dataIndex: 'dispatchCount',
      key: 'dispatchCount',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.dispatchCount - b.dispatchCount,
    },
    {
      title: '寄样成本（元）',
      dataIndex: 'dispatchCost',
      key: 'dispatchCost',
      width: 130,
      align: 'right',
      sorter: (a, b) => a.dispatchCost - b.dispatchCost,
      render: (value: number) => `¥${formatMoney(value)}`,
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '40px',
        margin: '-24px',
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
        <Title level={4} style={{ marginBottom: 24 }}>
          商务绩效报表
        </Title>

        {/* 筛选和操作栏 */}
        <Card variant="elevated" style={{ marginBottom: 24 }}>
          <CardContent>
            <Space size="middle" wrap>
              <span>时间范围：</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                placeholder={['开始日期', '结束日期']}
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadData}
                loading={loading}
              >
                查询
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exporting}
              >
                导出Excel
              </Button>
            </Space>
          </CardContent>
        </Card>

        {/* 汇总统计卡片 */}
        {report && (
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="商务人数"
                    value={report.summary.totalStaff}
                    prefix={<TeamOutlined />}
                    suffix="人"
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="总成交数"
                    value={report.summary.totalClosedCount}
                    prefix={<ShoppingOutlined />}
                    suffix="单"
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="总GMV"
                    value={Number(formatMoney(report.summary.totalGmv))}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    precision={2}
                  />
                </CardContent>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <Statistic
                    title="整体ROI"
                    value={report.summary.overallRoi}
                    prefix={<RiseOutlined />}
                    precision={2}
                    valueStyle={{
                      color: report.summary.overallRoi >= 1 ? '#52c41a' : '#ff4d4f',
                    }}
                  />
                </CardContent>
              </Card>
            </Col>
          </Row>
        )}

        {/* 绩效明细表格 */}
        <Card variant="elevated">
          <CardContent>
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={report?.items || []}
                rowKey="staffId"
                scroll={{ x: 1200 }}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                summary={() =>
                  report ? (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>
                          <strong>汇总</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} />
                        <Table.Summary.Cell index={2} align="right">
                          <strong>{report.summary.totalContactedCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <strong>{report.summary.totalProgressedCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          <strong>{report.summary.totalClosedCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">
                          <strong>¥{formatMoney(report.summary.totalGmv)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="right">
                          <strong>¥{formatMoney(report.summary.totalCost)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7} align="right">
                          <strong
                            style={{
                              color: report.summary.overallRoi >= 1 ? '#52c41a' : '#ff4d4f',
                            }}
                          >
                            {formatRoi(report.summary.overallRoi)}
                          </strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">
                          <strong>{report.summary.totalDispatchCount}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9} align="right">
                          <strong>¥{formatMoney(report.summary.totalDispatchCost)}</strong>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  ) : null
                }
              />
            </Spin>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
