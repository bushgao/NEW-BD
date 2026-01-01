import { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Statistic,
  Spin,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  getRoiReport,
  formatMoney,
  formatRoi,
  type RoiReport,
  type RoiReportItem,
} from '../../services/result.service';

const { RangePicker } = DatePicker;

interface RoiReportModalProps {
  visible: boolean;
  onClose: () => void;
}

const GROUP_BY_OPTIONS = [
  { value: 'influencer', label: '按达人' },
  { value: 'sample', label: '按样品' },
  { value: 'staff', label: '按商务' },
  { value: 'month', label: '按月份' },
];

const RoiReportModal = ({ visible, onClose }: RoiReportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<'influencer' | 'sample' | 'staff' | 'month'>('influencer');
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | undefined>();
  const [report, setReport] = useState<RoiReport | null>(null);

  useEffect(() => {
    if (visible) {
      fetchReport();
    }
  }, [visible, groupBy, dateRange]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await getRoiReport(groupBy, dateRange);
      setReport(data);
    } catch (error) {
      message.error('获取报表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      setDateRange(undefined);
    }
  };

  const columns: ColumnsType<RoiReportItem> = [
    {
      title: groupBy === 'influencer' ? '达人' :
             groupBy === 'sample' ? '样品' :
             groupBy === 'staff' ? '商务' : '月份',
      dataIndex: 'groupName',
      key: 'groupName',
      width: 150,
    },
    {
      title: '合作数',
      dataIndex: 'collaborationCount',
      key: 'collaborationCount',
      width: 80,
      align: 'right',
    },
    {
      title: '总 GMV',
      dataIndex: 'totalGmv',
      key: 'totalGmv',
      width: 120,
      align: 'right',
      render: (gmv: number) => `¥${formatMoney(gmv)}`,
    },
    {
      title: '总成本',
      dataIndex: 'totalCost',
      key: 'totalCost',
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
      render: (roi: number) => (
        <span style={{ color: roi >= 1 ? '#52c41a' : '#ff4d4f' }}>
          {formatRoi(roi)}
        </span>
      ),
    },
    {
      title: '回本率',
      key: 'profitRate',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const rate = record.collaborationCount > 0
          ? (record.profitCount / record.collaborationCount * 100).toFixed(1)
          : '0.0';
        return `${rate}%`;
      },
    },
  ];


  return (
    <Modal
      title="ROI 报表"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <Spin spinning={loading}>
        {/* 筛选条件 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Select
              value={groupBy}
              onChange={setGroupBy}
              style={{ width: '100%' }}
              options={GROUP_BY_OPTIONS}
            />
          </Col>
          <Col span={16}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              onChange={handleDateRangeChange}
            />
          </Col>
        </Row>

        {/* 汇总统计 */}
        {report && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="合作总数"
                  value={report.summary.totalCollaborations}
                  suffix="个"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总 GMV"
                  value={report.summary.totalGmv / 100}
                  precision={2}
                  prefix="¥"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="整体 ROI"
                  value={report.summary.overallRoi}
                  precision={2}
                  valueStyle={{
                    color: report.summary.overallRoi >= 1 ? '#52c41a' : '#ff4d4f',
                  }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="回本率"
                  value={report.summary.profitRate}
                  precision={1}
                  suffix="%"
                  valueStyle={{
                    color: report.summary.profitRate >= 50 ? '#52c41a' : '#ff4d4f',
                  }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={report?.items || []}
          rowKey="groupKey"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />
      </Spin>
    </Modal>
  );
};

export default RoiReportModal;
