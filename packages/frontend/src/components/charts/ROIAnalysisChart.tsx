import { useState } from 'react';
import { Card, Segmented, Spin, Empty, Space, Typography } from 'antd';
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
}

const ROIAnalysisChart: React.FC<ROIAnalysisChartProps> = ({ data, loading = false }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'scatter'>('bar');

  // 颜色配置
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card title="ROI 分析">
        <Empty description="暂无数据" />
      </Card>
    );
  }

  // 渲染柱状图 - 各商务 ROI 对比
  const renderBarChart = () => {
    if (!data.byStaff.length) {
      return <Empty description="暂无商务数据" />;
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data.byStaff} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="staffName" style={{ fontSize: 12 }} />
          <YAxis yAxisId="left" orientation="left" stroke="#1890ff" style={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#52c41a" style={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'GMV' || name === '成本') {
                return `¥${(value / 100).toFixed(2)}`;
              }
              return value.toFixed(2);
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="totalGmv" name="GMV" fill="#1890ff" />
          <Bar yAxisId="left" dataKey="totalCost" name="成本" fill="#ff4d4f" />
          <Bar yAxisId="right" dataKey="roi" name="ROI" fill="#52c41a" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 渲染饼图 - 成本构成分析
  const renderPieChart = () => {
    const pieData = [
      { name: '样品成本', value: data.costBreakdown.sampleCost, color: '#1890ff' },
      { name: '合作成本', value: data.costBreakdown.collaborationCost, color: '#52c41a' },
      { name: '其他成本', value: data.costBreakdown.otherCost, color: '#faad14' },
    ].filter(item => item.value > 0);

    if (!pieData.length) {
      return <Empty description="暂无成本数据" />;
    }

    const total = pieData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={(entry) => {
                const percent = ((entry.value / total) * 100).toFixed(1);
                return `${entry.name}: ${percent}%`;
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `¥${(value / 100).toFixed(2)}`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space direction="vertical" size={4}>
            <Text strong style={{ fontSize: 16 }}>总成本</Text>
            <Text style={{ fontSize: 20, color: '#1890ff' }}>
              ¥{(total / 100).toFixed(2)}
            </Text>
          </Space>
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
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="cost"
            name="成本"
            unit="元"
            style={{ fontSize: 12 }}
            tickFormatter={(value) => `¥${(value / 100).toFixed(0)}`}
          />
          <YAxis
            type="number"
            dataKey="revenue"
            name="收益"
            unit="元"
            style={{ fontSize: 12 }}
            tickFormatter={(value) => `¥${(value / 100).toFixed(0)}`}
          />
          <ZAxis type="number" dataKey="roi" range={[50, 400]} name="ROI" />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value: number, name: string) => {
              if (name === '成本' || name === '收益') {
                return `¥${(value / 100).toFixed(2)}`;
              }
              return value.toFixed(2);
            }}
            labelFormatter={(label) => {
              const point = data.costVsRevenue.find(p => p.cost === label);
              return point ? point.name : '';
            }}
          />
          <Legend />
          <Scatter
            name="商务数据"
            data={data.costVsRevenue}
            fill="#1890ff"
          >
            {data.costVsRevenue.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.roi >= 1 ? '#52c41a' : '#ff4d4f'}
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
            fill="#d9d9d9"
            line={{ stroke: '#d9d9d9', strokeWidth: 2, strokeDasharray: '5 5' }}
            shape={() => null}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card
      title="ROI 分析"
      extra={
        <Segmented
          options={[
            { label: '柱状图', value: 'bar' },
            { label: '饼图', value: 'pie' },
            { label: '散点图', value: 'scatter' },
          ]}
          value={chartType}
          onChange={(value) => setChartType(value as 'bar' | 'pie' | 'scatter')}
        />
      }
    >
      {chartType === 'bar' && renderBarChart()}
      {chartType === 'pie' && renderPieChart()}
      {chartType === 'scatter' && renderScatterChart()}
    </Card>
  );
};

export default ROIAnalysisChart;
