import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  message,
  Typography,
  Statistic,
  DatePicker,
  Space,
  Progress,
} from 'antd';
import {
  DollarOutlined,
  SendOutlined,
  CheckCircleOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  getSampleCostReport,
  formatMoney,
  formatPercent,
  type SampleCostReport,
  type SampleCostReportItem,
} from '../../services/sample.service';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const SampleReportPage = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SampleCostReport | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = dateRange?.[0]?.format('YYYY-MM-DD');
      const endDate = dateRange?.[1]?.format('YYYY-MM-DD');
      const result = await getSampleCostReport(startDate, endDate);
      setReport(result);
    } catch (error) {
      message.error('获取报表数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  const columns: ColumnsType<SampleCostReportItem> = [
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
      width: 180,
      ellipsis: true,
    },
    {
      title: '单件成本',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 100,
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: '寄样次数',
      dataIndex: 'totalDispatchCount',
      key: 'totalDispatchCount',
      width: 90,
      align: 'center',
    },
    {
      title: '寄样数量',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 90,
      align: 'center',
    },
    {
      title: '样品成本',
      dataIndex: 'totalSampleCost',
      key: 'totalSampleCost',
      width: 110,
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: '快递成本',
      dataIndex: 'totalShippingCost',
      key: 'totalShippingCost',
      width: 100,
      render: (cost: number) => `¥${formatMoney(cost)}`,
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 110,
      render: (cost: number) => (
        <span style={{ fontWeight: 500, color: '#f5222d' }}>¥{formatMoney(cost)}</span>
      ),
    },
    {
      title: '签收率',
      dataIndex: 'receivedRate',
      key: 'receivedRate',
      width: 120,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate * 100)}
          size="small"
          status={rate >= 0.8 ? 'success' : rate >= 0.5 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '上车率',
      dataIndex: 'onboardRate',
      key: 'onboardRate',
      width: 120,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate * 100)}
          size="small"
          status={rate >= 0.5 ? 'success' : rate >= 0.3 ? 'normal' : 'exception'}
        />
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            样品成本报表
          </Title>
        </Col>
        <Col>
          <Space>
            <span>时间范围：</span>
            <RangePicker
              onChange={handleDateRangeChange}
              placeholder={['开始日期', '结束日期']}
            />
          </Space>
        </Col>
      </Row>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总寄样次数"
              value={report?.summary.totalDispatchCount || 0}
              prefix={<SendOutlined />}
              suffix="次"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总寄样数量"
              value={report?.summary.totalQuantity || 0}
              prefix={<SendOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总成本"
              value={report ? formatMoney(report.summary.totalCost) : '0.00'}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="整体签收率"
              value={report ? formatPercent(report.summary.overallReceivedRate) : '0%'}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: report && report.summary.overallReceivedRate >= 0.8 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="样品成本"
              value={report ? formatMoney(report.summary.totalSampleCost) : '0.00'}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="快递成本"
              value={report ? formatMoney(report.summary.totalShippingCost) : '0.00'}
              prefix="¥"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="整体上车率"
              value={report ? formatPercent(report.summary.overallOnboardRate) : '0%'}
              prefix={<RocketOutlined />}
              valueStyle={{ color: report && report.summary.overallOnboardRate >= 0.5 ? '#3f8600' : '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detail Table */}
      <Card title="样品明细">
        <Table
          columns={columns}
          dataSource={report?.items || []}
          rowKey="sampleId"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
          summary={() =>
            report && report.items.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <strong>合计</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="center">
                    <strong>{report.summary.totalDispatchCount}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="center">
                    <strong>{report.summary.totalQuantity}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <strong>¥{formatMoney(report.summary.totalSampleCost)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <strong>¥{formatMoney(report.summary.totalShippingCost)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7}>
                    <strong style={{ color: '#f5222d' }}>¥{formatMoney(report.summary.totalCost)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8}>
                    <strong>{formatPercent(report.summary.overallReceivedRate)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9}>
                    <strong>{formatPercent(report.summary.overallOnboardRate)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null
          }
        />
      </Card>
    </div>
  );
};

export default SampleReportPage;
