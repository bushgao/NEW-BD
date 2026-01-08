import { useState } from 'react';
import { Card, Select, Space, Typography, Empty, Spin, Tag } from 'antd';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { UserOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export interface StaffComparisonData {
  staffId: string;
  staffName: string;
  metrics: {
    leads: number;
    deals: number;
    gmv: number;
    roi: number;
    efficiency: number;
  };
  normalizedMetrics: {
    leads: number;
    deals: number;
    gmv: number;
    roi: number;
    efficiency: number;
  };
}

export interface StaffComparisonAnalysis {
  staffData: StaffComparisonData[];
  insights: {
    strengths: Record<string, string[]>;
    weaknesses: Record<string, string[]>;
  };
}

interface StaffComparisonChartProps {
  staffList: Array<{ id: string; name: string }>;
  comparisonData: StaffComparisonAnalysis | null;
  loading: boolean;
  onStaffSelect: (staffIds: string[]) => void;
}

const METRIC_LABELS: Record<string, string> = {
  leads: '建联数',
  deals: '成交数',
  gmv: 'GMV',
  roi: 'ROI',
  efficiency: '效率',
};

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'];

const StaffComparisonChart: React.FC<StaffComparisonChartProps> = ({
  staffList,
  comparisonData,
  loading,
  onStaffSelect,
}) => {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const handleStaffChange = (values: string[]) => {
    // 限制最多选择3个商务
    if (values.length <= 3) {
      setSelectedStaffIds(values);
      onStaffSelect(values);
    }
  };

  // 准备雷达图数据
  const radarData = comparisonData
    ? Object.keys(METRIC_LABELS).map((metric) => {
        const dataPoint: any = {
          metric: METRIC_LABELS[metric],
          fullMark: 100,
        };

        comparisonData.staffData.forEach((staff) => {
          dataPoint[staff.staffName] = staff.normalizedMetrics[metric as keyof typeof staff.normalizedMetrics];
        });

        return dataPoint;
      })
    : [];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 标题和选择器 */}
        <div>
          <Title level={5}>
            <UserOutlined /> 商务对比分析
          </Title>
          <Text type="secondary">选择2-3个商务进行多维度对比</Text>
        </div>

        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="请选择商务人员（最多3个）"
          value={selectedStaffIds}
          onChange={handleStaffChange}
          options={staffList.map((staff) => ({
            label: staff.name,
            value: staff.id,
          }))}
          maxTagCount="responsive"
        />

        {/* 加载状态 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">加载对比数据中...</Text>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!loading && selectedStaffIds.length === 0 && (
          <Empty
            description="请选择商务人员进行对比"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        {/* 雷达图 */}
        {!loading && comparisonData && comparisonData.staffData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                {comparisonData.staffData.map((staff, index) => (
                  <Radar
                    key={staff.staffId}
                    name={staff.staffName}
                    dataKey={staff.staffName}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.3}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>

            {/* 优劣势分析 */}
            <div>
              <Title level={5}>优劣势分析</Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {comparisonData.staffData.map((staff, index) => (
                  <Card
                    key={staff.staffId}
                    size="small"
                    style={{ borderLeft: `4px solid ${COLORS[index % COLORS.length]}` }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Text strong>{staff.staffName}</Text>

                      {/* 优势 */}
                      {comparisonData.insights.strengths[staff.staffId]?.length > 0 && (
                        <div>
                          <Text type="secondary">优势：</Text>
                          <div style={{ marginTop: 4 }}>
                            {comparisonData.insights.strengths[staff.staffId].map((strength, i) => (
                              <Tag key={i} color="success" style={{ marginBottom: 4 }}>
                                {strength}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 劣势 */}
                      {comparisonData.insights.weaknesses[staff.staffId]?.length > 0 && (
                        <div>
                          <Text type="secondary">待提升：</Text>
                          <div style={{ marginTop: 4 }}>
                            {comparisonData.insights.weaknesses[staff.staffId].map((weakness, i) => (
                              <Tag key={i} color="warning" style={{ marginBottom: 4 }}>
                                {weakness}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            </div>
          </>
        )}
      </Space>
    </Card>
  );
};

export default StaffComparisonChart;
