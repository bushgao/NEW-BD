import { Card, Spin, Empty, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';

const { Text } = Typography;

// 管道阶段数据
export interface PipelineStageData {
  stage: string;
  stageName: string;
  count: number;
  conversionRate: number; // 相对于上一阶段的转化率
  dropRate: number; // 相对于上一阶段的流失率
}

export interface PipelineFunnelData {
  stages: PipelineStageData[];
  totalCount: number;
  overallConversionRate: number; // 从第一阶段到最后阶段的总转化率
}

interface PipelineFunnelChartProps {
  data: PipelineFunnelData | null;
  loading?: boolean;
  onStageClick?: (stage: string) => void;
  isBento?: boolean;
}

const PipelineFunnelChart: React.FC<PipelineFunnelChartProps> = ({
  data,
  loading = false,
  onStageClick,
  isBento = false,
}) => {
  // 颜色配置 - 更加极致轻巧的配色
  const COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
    '#f97316', // Orange
    '#10b981', // Emerald
  ];

  if (loading) {
    return <div className="flex justify-center items-center py-20 bg-white rounded-3xl"><Spin /></div>;
  }

  if (!data || !data.stages.length) {
    return <div className="py-20 bg-white rounded-3xl text-center"><Empty description="暂无漏斗数据" /></div>;
  }

  // 准备漏斗图数据
  const funnelData = data.stages.map((stage, index) => ({
    name: stage.stageName,
    value: stage.count,
    stage: stage.stage,
    conversionRate: stage.conversionRate,
    dropRate: stage.dropRate,
    fill: COLORS[index] || COLORS[COLORS.length - 1],
  }));

  // 自定义标签 - 极致精简版
  const renderLabel = (entry: any) => {
    if (entry.height < 30) return null;
    return (
      <text
        x={entry.x + entry.width / 2}
        y={entry.y + entry.height / 2}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em' }}
      >
        {entry.name}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-neutral-100 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: d.fill }}></div>
            <Text strong className="text-xs">{d.name}</Text>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between gap-6">
              <Text type="secondary">数量</Text>
              <Text strong>{d.value} 个</Text>
            </div>
            {d.conversionRate > 0 && (
              <div className="flex justify-between gap-6">
                <Text type="secondary">转化</Text>
                <Text strong className="text-emerald-600">{d.conversionRate.toFixed(1)}%</Text>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const mainContent = (
    <div className="flex flex-col gap-6">
      {/* 移除内部标题，使用外部容器标题 */}

      {/* 顶部统计面板 - 更紧致的横向展示 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '总项目', value: data.totalCount, color: 'indigo' },
          { label: '转化率', value: `${data.overallConversionRate.toFixed(1)}%`, color: 'emerald' },
          { label: '已发布', value: data.stages[data.stages.length - 1]?.count || 0, color: 'violet' }
        ].map((stat, i) => (
          <div key={i} className={`bg-${stat.color}-50/40 border border-${stat.color}-100/30 p-3 rounded-2xl`}>
            <Text type="secondary" className="text-[9px] uppercase font-bold tracking-tighter opacity-60 block mb-0.5">{stat.label}</Text>
            <Text strong className={`text-xl text-${stat.color}-600 leading-tight block`}>{stat.value}</Text>
          </div>
        ))}
      </div>

      {/* 核心漏斗区域 - 左右布局 */}
      <div className="flex flex-col lg:flex-row gap-8 items-center min-h-[320px]">
        {/* 左侧：漏斗图形 - 赋予固定高度确保稳定渲染 */}
        <div className="w-full lg:w-1/2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
              <RechartsTooltip content={<CustomTooltip />} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
                onClick={(d) => onStageClick && onStageClick(d.stage)}
                style={{ cursor: onStageClick ? 'pointer' : 'default' }}
              >
                <LabelList position="center" content={renderLabel} />
                {funnelData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth={1}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        {/* 右侧：精细化列表 */}
        <div className="w-full lg:w-1/2 space-y-1.5 self-start">
          <Text strong className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-3 pl-1">数据穿透</Text>
          {data.stages.map((stage, index) => (
            <div
              key={stage.stage}
              className="group flex items-center justify-between p-2.5 hover:bg-neutral-50/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-neutral-100"
              onClick={() => onStageClick && onStageClick(stage.stage)}
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-4 rounded-full" style={{ background: COLORS[index] }} />
                <div className="flex flex-col">
                  <Text strong className="text-[13px] leading-none mb-0.5">{stage.stageName}</Text>
                  <Text className="text-[10px] text-neutral-400">{stage.count} 项目</Text>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                {stage.conversionRate > 0 && (
                  <div className="text-right">
                    <Text className="text-[9px] text-neutral-400 block leading-none mb-0.5">转化率</Text>
                    <Text strong className="text-[11px] text-emerald-600 leading-none">{stage.conversionRate.toFixed(1)}%</Text>
                  </div>
                )}
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-200 group-hover:bg-brand-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-neutral-50/50 rounded-2xl border border-neutral-100 flex gap-2.5 items-start">
        <div className="p-1 bg-white rounded-lg shadow-sm">
          <InfoCircleOutlined className="text-brand-500 text-xs block" />
        </div>
        <Text className="text-[11px] text-neutral-500 leading-relaxed">
          <strong>数据模型：</strong> 转化率按上级阶段递减计算。已排除重复项目，反映当前业务管道最真实流转效率。
        </Text>
      </div>
    </div>
  );

  if (isBento) return mainContent;

  return (
    <Card className="bento-card overflow-hidden">
      {mainContent}
    </Card>
  );
};

export default PipelineFunnelChart;
