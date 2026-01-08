import { useState } from 'react';
import { Card, Segmented, Spin, Empty } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface TrendDataPoint {
  date: string;
  value: number;
  label: string;
}

interface TrendChartProps {
  title: string;
  dataType: 'gmv' | 'cost' | 'roi';
  currentData: TrendDataPoint[];
  previousData?: TrendDataPoint[];
  loading?: boolean;
  period: 'week' | 'month' | 'quarter';
  onPeriodChange: (period: 'week' | 'month' | 'quarter') => void;
  showComparison?: boolean;
  valueFormatter?: (value: number) => string;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  dataType,
  currentData,
  previousData,
  loading = false,
  period,
  onPeriodChange,
  showComparison = true,
  valueFormatter = (value) => value.toFixed(2),
}) => {
  // 颜色配置
  const colors = {
    gmv: '#52c41a',
    cost: '#ff4d4f',
    roi: '#1890ff',
  };

  const color = colors[dataType];

  // 计算总体变化
  const calculateChange = () => {
    if (!currentData.length || !previousData?.length) return null;
    
    const currentTotal = currentData.reduce((sum, d) => sum + d.value, 0);
    const previousTotal = previousData.reduce((sum, d) => sum + d.value, 0);
    
    if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
    
    const change = ((currentTotal - previousTotal) / previousTotal) * 100;
    return change;
  };

  const change = calculateChange();

  // 格式化 Tooltip
  const formatTooltip = (value: number) => {
    return valueFormatter(value);
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!currentData.length) {
    return (
      <Card title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          {change !== null && showComparison && (
            <span style={{ fontSize: 14, fontWeight: 'normal' }}>
              {change >= 0 ? (
                <span style={{ color: '#52c41a' }}>
                  <ArrowUpOutlined /> {change.toFixed(1)}%
                </span>
              ) : (
                <span style={{ color: '#ff4d4f' }}>
                  <ArrowDownOutlined /> {Math.abs(change).toFixed(1)}%
                </span>
              )}
              <span style={{ color: '#8c8c8c', marginLeft: 8 }}>环比</span>
            </span>
          )}
        </div>
      }
      extra={
        <Segmented
          options={[
            { label: '7天', value: 'week' },
            { label: '30天', value: 'month' },
            { label: '90天', value: 'quarter' },
          ]}
          value={period}
          onChange={(value) => onPeriodChange(value as 'week' | 'month' | 'quarter')}
        />
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={currentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="label" 
            style={{ fontSize: 12 }}
          />
          <YAxis 
            style={{ fontSize: 12 }}
            tickFormatter={formatTooltip}
          />
          <Tooltip 
            formatter={formatTooltip}
            contentStyle={{ borderRadius: 8 }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={title}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          {showComparison && previousData && previousData.length > 0 && (
            <Line
              type="monotone"
              data={previousData}
              dataKey="value"
              name="上期"
              stroke="#d9d9d9"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TrendChart;
