import { useState } from 'react';
import { Card, Select, Typography, Empty, Spin } from 'antd';
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

const { Text } = Typography;

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
  isBento?: boolean;
}

const METRIC_LABELS: Record<string, string> = {
  leads: '建联数',
  deals: '成交数',
  gmv: 'GMV',
  roi: 'ROI',
  efficiency: '效率',
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const StaffComparisonChart: React.FC<StaffComparisonChartProps> = ({
  staffList,
  comparisonData,
  loading,
  onStaffSelect,
  isBento = false,
}) => {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  const handleStaffChange = (values: string[]) => {
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

  const mainContent = (
    <div className="flex flex-col h-full">
      {/* 顶部标题和选择器 */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-1">
            {isBento && <Text strong className="text-sm text-neutral-800">商务效率对比</Text>}
            <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider">
              {isBento ? "多维度数值对比" : "选择2-3个商务进行多维度对比"}
            </Text>
          </div>
          {!isBento && <UserOutlined className="text-xl text-neutral-200" />}
        </div>

        <Select
          mode="multiple"
          className="w-full bento-select"
          placeholder="请选择商务人员（最多3个）"
          value={selectedStaffIds}
          onChange={handleStaffChange}
          options={staffList.map((staff) => ({
            label: staff.name,
            value: staff.id,
          }))}
          maxTagCount="responsive"
          size={isBento ? "small" : "middle"}
          dropdownClassName="bento-select-dropdown"
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full py-12">
            <Spin size="large" />
            <Text type="secondary" className="mt-4 text-xs">正在分析对比数据...</Text>
          </div>
        ) : selectedStaffIds.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full py-12 opacity-50">
            <Empty description="请在上方选择商务人员进行多维对比" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : comparisonData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 雷达图 */}
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                  <PolarGrid stroke="#F1F5F9" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={false}
                    axisLine={false}
                  />
                  {comparisonData.staffData.map((staff, index) => (
                    <Radar
                      key={staff.staffId}
                      name={staff.staffName}
                      dataKey={staff.staffName}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ paddingTop: 20 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 优劣势分析 */}
            <div className="space-y-4">
              <Text strong className="text-xs text-neutral-400 uppercase tracking-widest block mb-2">深度洞察</Text>
              {comparisonData.staffData.map((staff, index) => (
                <div
                  key={staff.staffId}
                  className="bg-neutral-50/50 p-4 rounded-2xl border-l-4 transition-all"
                  style={{ borderLeftColor: COLORS[index % COLORS.length] }}
                >
                  <Text strong className="text-sm block mb-3">{staff.staffName}</Text>

                  <div className="space-y-3">
                    {/* 优势 */}
                    {comparisonData.insights.strengths[staff.staffId]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.insights.strengths[staff.staffId].map((strength, i) => (
                          <div key={i} className="px-2 py-0.5 bg-emerald-100/50 text-emerald-700 rounded text-[10px] font-bold">
                            {strength}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 劣势 */}
                    {comparisonData.insights.weaknesses[staff.staffId]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {comparisonData.insights.weaknesses[staff.staffId].map((weakness, i) => (
                          <div key={i} className="px-2 py-0.5 bg-rose-100/50 text-rose-700 rounded text-[10px] font-bold">
                            {weakness}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isBento) return mainContent;

  return (
    <Card className="staff-comparison-card">
      {mainContent}
    </Card>
  );
};

export default StaffComparisonChart;
