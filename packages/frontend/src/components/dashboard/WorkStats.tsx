import React, { useState, useEffect } from 'react';
import { Card, Select, Spin, Alert, Row, Col, Statistic, Progress, Tag, Tooltip } from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Line } from 'recharts';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWorkStats } from '../../services/report.service';

const { Option } = Select;

interface WorkStatsProps {
  period?: 'today' | 'week' | 'month';
  showTrend?: boolean;
}

interface WorkStats {
  leadsAdded: number;
  collaborationsCreated: number;
  samplesDispatched: number;
  followUpsCompleted: number;
  dealsCompleted: number;
  gmv: number;
  goalProgress: number;
  rankChange: number;
}

interface TrendData {
  date: string;
  leadsAdded: number;
  collaborationsCreated: number;
  dealsCompleted: number;
  gmv: number;
}

const WorkStats: React.FC<WorkStatsProps> = ({ period: initialPeriod = 'week', showTrend = true }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>(initialPeriod);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WorkStats | null>(null);
  const [trend, setTrend] = useState<TrendData[]>([]);

  useEffect(() => {
    fetchWorkStats();
  }, [period]);

  const fetchWorkStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWorkStats(period);
      setStats(response.stats);
      setTrend(response.trend || []);
    } catch (err: any) {
      console.error('获取工作统计失败:', err);
      setError(err.message || '获取工作统计失败');
    } finally {
      setLoading(false);
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (change < 0) return <FallOutlined style={{ color: '#ff4d4f' }} />;
    return <MinusOutlined style={{ color: '#8c8c8c' }} />;
  };

  const getRankChangeText = (change: number) => {
    if (change > 0) return `上升 ${change} 名`;
    if (change < 0) return `下降 ${Math.abs(change)} 名`;
    return '排名不变';
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return '今日';
      case 'week':
        return '本周';
      case 'month':
        return '本月';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card title="工作统计" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="工作统计" style={{ marginBottom: 24 }}>
        <Alert message="加载失败" description={error} type="error" showIcon />
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card
      title="工作统计"
      extra={
        <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
          <Option value="today">今日</Option>
          <Option value="week">本周</Option>
          <Option value="month">本月</Option>
        </Select>
      }
      style={{ marginBottom: 24 }}
    >
      {/* 关键指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered={false} style={{ background: '#f0f5ff' }}>
            <Statistic
              title={`${getPeriodLabel()}建联数`}
              value={stats.leadsAdded}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered={false} style={{ background: '#f6ffed' }}>
            <Statistic
              title={`${getPeriodLabel()}成交数`}
              value={stats.dealsCompleted}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size="small" bordered={false} style={{ background: '#fff7e6' }}>
            <Statistic
              title={`${getPeriodLabel()}GMV`}
              value={stats.gmv / 100}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 次要指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="创建合作"
            value={stats.collaborationsCreated}
            suffix="个"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="寄样次数"
            value={stats.samplesDispatched}
            suffix="次"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="跟进次数"
            value={stats.followUpsCompleted}
            suffix="次"
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="效率分析"
            value={stats.followUpsCompleted > 0 ? Math.round((stats.dealsCompleted / stats.followUpsCompleted) * 100) : 0}
            suffix="%"
            prefix={<ThunderboltOutlined />}
          />
        </Col>
      </Row>

      {/* 目标完成度 */}
      <Card size="small" title="目标完成度" style={{ marginBottom: 24 }}>
        <Progress
          percent={stats.goalProgress}
          status={stats.goalProgress >= 100 ? 'success' : stats.goalProgress >= 80 ? 'active' : 'normal'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          {stats.goalProgress >= 100 ? (
            <Tag color="success">已完成目标 🎉</Tag>
          ) : stats.goalProgress >= 80 ? (
            <Tag color="processing">接近目标</Tag>
          ) : stats.goalProgress >= 50 ? (
            <Tag color="warning">进度正常</Tag>
          ) : (
            <Tag color="error">需要加油</Tag>
          )}
        </div>
      </Card>

      {/* 排名变化 */}
      <Card size="small" title="排名变化" style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {getRankChangeIcon(stats.rankChange)}
          </div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>
            {getRankChangeText(stats.rankChange)}
          </div>
          <Tooltip title="基于本周期GMV排名">
            <TrophyOutlined style={{ fontSize: 16, color: '#8c8c8c', marginTop: 8 }} />
          </Tooltip>
        </div>
      </Card>

      {/* 趋势图 */}
      {showTrend && trend.length > 0 && (
        <Card size="small" title={`${getPeriodLabel()}趋势`}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <RechartsTooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="leadsAdded"
                stroke="#1890ff"
                name="建联数"
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="collaborationsCreated"
                stroke="#52c41a"
                name="创建合作"
                strokeWidth={2}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="dealsCompleted"
                stroke="#fa8c16"
                name="成交数"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="gmv"
                stroke="#722ed1"
                name="GMV (元)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </Card>
  );
};

export default WorkStats;
