import { Card, Segmented, Spin, Empty, Typography } from 'antd';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Text } = Typography;

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
  isBento?: boolean;
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
  isBento = false,
}) => {
  // 颜色和配置映射
  const config = {
    gmv: {
      color: '#6366f1', // Indigo 500
      gradientId: 'gradientGmv',
      label: 'GMV 趋势',
    },
    cost: {
      color: '#f43f5e', // Rose 500
      gradientId: 'gradientCost',
      label: '成本趋势',
    },
    roi: {
      color: '#10b981', // Emerald 500
      gradientId: 'gradientRoi',
      label: 'ROI 趋势',
    }
  }[dataType];

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

  // 格式化 Tooltip 和 YAxis
  const formatValue = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return valueFormatter(numericValue);
  };

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

  if (!currentData.length) {
    if (isBento) return <div className="py-12"><Empty description="暂无数据" /></div>;
    return (
      <Card title={title}>
        <Empty description="暂无数据" />
      </Card>
    );
  }

  const mainContent = (
    <div className="flex flex-col h-full">
      {/* 顶部标题和控制器 */}
      <div className="flex justify-between items-start mb-4 px-1">
        <div className="flex flex-col gap-1">
          {isBento && <Text strong className="text-sm text-neutral-800">{title}</Text>}
          {change !== null && showComparison && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit ${change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {change >= 0 ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />}
              {Math.abs(change).toFixed(1)}%
              <span className="opacity-60 text-[10px] font-medium font-sans">环比</span>
            </div>
          )}
        </div>
        <Segmented
          options={[
            { label: '7天', value: 'week' },
            { label: '30天', value: 'month' },
            { label: '90天', value: 'quarter' },
          ]}
          value={period}
          onChange={(value) => onPeriodChange(value as 'week' | 'month' | 'quarter')}
          size="small"
          className="bg-neutral-100/50 p-0.5 rounded-lg shrink-0"
        />
      </div>

      <div className="flex-1 min-h-[260px] relative -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
              style={{ fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8' }}
              dy={10}
            />
            <YAxis
              style={{ fontSize: 10, fontWeight: 500 }}
              tickFormatter={formatValue}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8' }}
              hide={isBento && currentData.every(d => d.value === 0)}
            />
            <Tooltip
              formatter={(value: any) => [formatValue(value), title]}
              labelStyle={{ fontWeight: 'bold', marginBottom: 4, color: '#1E293B' }}
              contentStyle={{
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                padding: '12px'
              }}
              cursor={{ stroke: config.color, strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name={title}
              stroke={config.color}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${config.gradientId})`}
              isAnimationActive={true}
              animationDuration={1500}
            />
            {showComparison && previousData && previousData.length > 0 && (
              <Area
                type="monotone"
                data={previousData}
                dataKey="value"
                name="上期"
                stroke="#CBD5E1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="transparent"
                isAnimationActive={true}
              />
            )}
            {/* 零基准线 */}
            <ReferenceLine y={0} stroke="#E2E8F0" strokeWidth={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (isBento) return mainContent;

  return (
    <Card
      title={
        <div className="flex justify-between items-center">
          <span>{title}</span>
          {change !== null && showComparison && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {change >= 0 ? <ArrowUpOutlined className="text-[10px]" /> : <ArrowDownOutlined className="text-[10px]" />}
              {Math.abs(change).toFixed(1)}%
              <span className="opacity-60 text-[10px] font-medium font-sans">环比</span>
            </div>
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
      <div className="h-[300px]">
        {mainContent}
      </div>
    </Card>
  );
};

export default TrendChart;
