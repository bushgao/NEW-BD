import { useState } from 'react';
import { Card, Segmented, Spin, Empty, Typography } from 'antd';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from 'recharts';

const { Text } = Typography;

// 商务 ROI 数据
export interface StaffROIData {
  staffId: string;
  staffName: string;
  totalGmv: number;
  totalCost: number;
  roi: number;
  collaborationCount: number;
}

// 成本构成数据
export interface CostBreakdown {
  sampleCost: number;
  collaborationCost: number;
  otherCost: number;
}

// 散点图数据
export interface ScatterDataPoint {
  cost: number;
  revenue: number;
  roi: number;
  name: string;
}

export interface ROIAnalysisData {
  byStaff: StaffROIData[];
  costBreakdown: CostBreakdown;
  costVsRevenue: ScatterDataPoint[];
}

interface ROIAnalysisChartProps {
  data: ROIAnalysisData | null;
  loading?: boolean;
  isBento?: boolean;
}

const ROIAnalysisChart: React.FC<ROIAnalysisChartProps> = ({ data, loading = false, isBento = false }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'scatter'>('bar');

  if (loading) {
    if (isBento) return <div className="flex justify-center items-center py-12"><Spin /></div>;
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) {
    if (isBento) return <div className="py-12"><Empty description="暂无数据" /></div>;
    return (
      <Card title="ROI 分析">
        <Empty description="暂无数据" />
      </Card>
    );
  }

  // 格式化函数
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return `¥${(numericValue / 100).toFixed(2)}`;
  };

  const formatROI = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return numericValue.toFixed(2);
  };

  // 渲染柱状图 - 各商务 ROI 对比
  const renderBarChart = () => {
    if (!data.byStaff.length) {
      return <Empty description="暂无商务数据" />;
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data.byStaff} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="staffName" style={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
          <YAxis yAxisId="left" orientation="left" stroke="#6366f1" style={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `¥${(v / 100).toFixed(0)}`} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: any, name: any) => {
              if (name === 'GMV' || name === '成本') {
                return [formatCurrency(value), name];
              }
              return [formatROI(value), name];
            }}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar yAxisId="left" dataKey="totalGmv" name="GMV" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="totalCost" name="成本" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="roi" name="ROI" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 渲染饼图 - 成本构成分析
  const renderPieChart = () => {
    const pieData = [
      { name: '样品成本', value: data.costBreakdown.sampleCost, color: '#6366f1' },
      { name: '合作成本', value: data.costBreakdown.collaborationCost, color: '#10b981' },
      { name: '其他成本', value: data.costBreakdown.otherCost, color: '#f59e0b' },
    ].filter(item => item.value > 0);

    if (!pieData.length) {
      return <Empty description="暂无成本数据" />;
    }

    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-4 p-4 bg-neutral-50 rounded-2xl w-full max-w-[200px]">
          <Text type="secondary" className="text-xs mb-1 block">总成本</Text>
          <Text strong className="text-xl text-indigo-600 block leading-tight">
            {formatCurrency(total)}
          </Text>
        </div>
      </div>
    );
  };

  // 渲染散点图 - 成本-收益关系
  const renderScatterChart = () => {
    if (!data.costVsRevenue.length) {
      return <Empty description="暂无数据" />;
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            type="number"
            dataKey="cost"
            name="成本"
            unit="元"
            style={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `¥${(value / 100).toFixed(0)}`}
          />
          <YAxis
            type="number"
            dataKey="revenue"
            name="收益"
            unit="元"
            style={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `¥${(value / 100).toFixed(0)}`}
          />
          <ZAxis type="number" dataKey="roi" range={[60, 400]} name="ROI" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: any, name: any) => {
              if (name === '成本' || name === '收益') {
                return [formatCurrency(value), name];
              }
              return [formatROI(value), name];
            }}
            labelFormatter={(label) => {
              const point = data.costVsRevenue.find(p => p.cost === label);
              return point ? point.name : '';
            }}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Scatter
            name="商务数据"
            data={data.costVsRevenue}
          >
            {data.costVsRevenue.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.roi >= 1 ? '#10b981' : '#f43f5e'}
                stroke="none"
              />
            ))}
          </Scatter>
          {/* 添加 ROI=1 的参考线（成本=收益线） */}
          <Scatter
            name="盈亏平衡线"
            data={[
              { cost: 0, revenue: 0 },
              {
                cost: Math.max(...data.costVsRevenue.map(d => d.cost)),
                revenue: Math.max(...data.costVsRevenue.map(d => d.cost)),
              },
            ]}
            fill="#CBD5E1"
            line={{ stroke: '#CBD5E1', strokeWidth: 1.5, strokeDasharray: '5 5' }}
            shape={() => <rect width={0} height={0} />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const mainContent = (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        {isBento && <Text strong className="text-sm text-neutral-800">ROI 对比分析</Text>}
        <Segmented
          options={[
            { label: '对比', value: 'bar' },
            { label: '构成', value: 'pie' },
            { label: '关系', value: 'scatter' },
          ]}
          value={chartType}
          onChange={(value) => setChartType(value as 'bar' | 'pie' | 'scatter')}
          size="small"
          className="bg-neutral-100/50 p-0.5 rounded-lg ml-auto"
        />
      </div>
      <div className="flex-1">
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'pie' && renderPieChart()}
        {chartType === 'scatter' && renderScatterChart()}
      </div>
    </div>
  );

  if (isBento) {
    return mainContent;
  }

  return (
    <Card
      title="ROI 分析"
    >
      <div className="min-h-[400px]">
        {mainContent}
      </div>
    </Card>
  );
};

export default ROIAnalysisChart;
