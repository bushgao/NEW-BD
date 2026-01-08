import { Card, Spin, Empty, Space, Typography, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';

const { Text, Title } = Typography;

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
}

const PipelineFunnelChart: React.FC<PipelineFunnelChartProps> = ({
  data,
  loading = false,
  onStageClick,
}) => {
  // 颜色配置 - 从深到浅的渐变色
  const COLORS = [
    '#1890ff', // 初步接触 - 蓝色
    '#52c41a', // 寄样阶段 - 绿色
    '#faad14', // 谈判中 - 橙色
    '#ff7a45', // 合作确认 - 橙红色
    '#f5222d', // 内容制作 - 红色
    '#722ed1', // 已发布 - 紫色
  ];

  if (loading) {
    return (
      <Card title="合作管道漏斗">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data || !data.stages.length) {
    return (
      <Card title="合作管道漏斗">
        <Empty description="暂无数据" />
      </Card>
    );
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

  // 自定义标签
  const renderLabel = (entry: any) => {
    const { name, value, conversionRate } = entry;
    return (
      <text
        x={entry.x + entry.width / 2}
        y={entry.y + entry.height / 2}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 14, fontWeight: 'bold' }}
      >
        <tspan x={entry.x + entry.width / 2} dy="-0.5em">
          {name}
        </tspan>
        <tspan x={entry.x + entry.width / 2} dy="1.5em">
          {value} 个
        </tspan>
        {conversionRate > 0 && (
          <tspan x={entry.x + entry.width / 2} dy="1.2em" style={{ fontSize: 12 }}>
            转化率 {conversionRate.toFixed(1)}%
          </tspan>
        )}
      </text>
    );
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: '#fff',
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            padding: '8px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ marginBottom: 4, fontWeight: 'bold' }}>{data.name}</div>
          <div>数量: {data.value} 个</div>
          {data.conversionRate > 0 && (
            <div style={{ color: '#52c41a' }}>
              转化率: {data.conversionRate.toFixed(1)}%
            </div>
          )}
          {data.dropRate > 0 && (
            <div style={{ color: '#ff4d4f' }}>
              流失率: {data.dropRate.toFixed(1)}%
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title={
        <Space>
          <span>合作管道漏斗</span>
          <Tooltip title="展示合作从初步接触到发布的各阶段数量和转化情况">
            <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
          </Tooltip>
        </Space>
      }
    >
      {/* 总体统计 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: 24,
          padding: '16px 0',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>总合作数</Text>
          <div>
            <Text strong style={{ fontSize: 24, color: '#1890ff' }}>
              {data.totalCount}
            </Text>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>总转化率</Text>
          <div>
            <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
              {data.overallConversionRate.toFixed(1)}%
            </Text>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>已发布</Text>
          <div>
            <Text strong style={{ fontSize: 24, color: '#722ed1' }}>
              {data.stages[data.stages.length - 1]?.count || 0}
            </Text>
          </div>
        </div>
      </div>

      {/* 漏斗图 */}
      <ResponsiveContainer width="100%" height={400}>
        <FunnelChart>
          <RechartsTooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive
            onClick={(data) => {
              if (onStageClick) {
                onStageClick(data.stage);
              }
            }}
            style={{ cursor: onStageClick ? 'pointer' : 'default' }}
          >
            <LabelList position="center" content={renderLabel} />
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      {/* 阶段详情列表 */}
      <div style={{ marginTop: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>阶段详情</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.stages.map((stage, index) => (
            <div
              key={stage.stage}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#fafafa',
                borderRadius: 4,
                cursor: onStageClick ? 'pointer' : 'default',
              }}
              onClick={() => onStageClick && onStageClick(stage.stage)}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: COLORS[index],
                  marginRight: 12,
                }}
              />
              <div style={{ flex: 1 }}>
                <Text strong>{stage.stageName}</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  {stage.count} 个
                </Text>
              </div>
              {stage.conversionRate > 0 && (
                <div style={{ marginRight: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>转化率</Text>
                  <Text style={{ marginLeft: 4, color: '#52c41a', fontWeight: 'bold' }}>
                    {stage.conversionRate.toFixed(1)}%
                  </Text>
                </div>
              )}
              {stage.dropRate > 0 && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>流失率</Text>
                  <Text style={{ marginLeft: 4, color: '#ff4d4f', fontWeight: 'bold' }}>
                    {stage.dropRate.toFixed(1)}%
                  </Text>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 提示信息 */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: '#e6f7ff',
          borderRadius: 4,
          fontSize: 12,
          color: '#0050b3',
        }}
      >
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        转化率 = (当前阶段数量 / 上一阶段数量) × 100%，流失率 = 100% - 转化率
      </div>
    </Card>
  );
};

export default PipelineFunnelChart;
