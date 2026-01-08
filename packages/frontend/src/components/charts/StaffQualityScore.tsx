import React, { useState, useEffect } from 'react';
import { Card, Progress, Row, Col, Statistic, Tag, List, Spin, Alert, Tabs, message } from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { Line } from 'recharts';
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportService, type QualityScoreData } from '../../services/report.service';

interface StaffQualityScoreProps {
  staffId: string;
  showTrend?: boolean;
  showSuggestions?: boolean;
}

const StaffQualityScore: React.FC<StaffQualityScoreProps> = ({
  staffId,
  showTrend = true,
  showSuggestions = true
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<QualityScoreData | null>(null);

  useEffect(() => {
    fetchQualityScore();
  }, [staffId]);

  const fetchQualityScore = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getStaffQualityScore(staffId);
      setScoreData(data);
    } catch (err: any) {
      console.error('获取质量评分失败:', err);
      const errorMsg = err.message || '获取质量评分失败';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#52c41a';
    if (score >= 80) return '#1890ff';
    if (score >= 70) return '#faad14';
    if (score >= 60) return '#fa8c16';
    return '#f5222d';
  };

  const getScoreLevel = (score: number): string => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '中等';
    if (score >= 60) return '及格';
    return '待提升';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <RiseOutlined style={{ color: '#52c41a' }} />;
    if (score >= 60) return <CheckCircleOutlined style={{ color: '#faad14' }} />;
    return <FallOutlined style={{ color: '#f5222d' }} />;
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载质量评分数据...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  if (!scoreData) {
    return (
      <Card>
        <Alert
          message="暂无数据"
          description="该商务暂无质量评分数据"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: '综合评分',
      children: (
        <div>
          {/* 综合评分 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <Progress
                    type="circle"
                    percent={scoreData.overall}
                    format={(percent) => (
                      <div>
                        <div style={{ fontSize: 32, fontWeight: 'bold', color: getScoreColor(percent || 0) }}>
                          {percent}
                        </div>
                        <div style={{ fontSize: 14, color: '#666' }}>
                          {getScoreLevel(percent || 0)}
                        </div>
                      </div>
                    )}
                    strokeColor={getScoreColor(scoreData.overall)}
                    width={180}
                  />
                </div>
              </Col>
              <Col span={16}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title={
                          <span>
                            <ClockCircleOutlined /> 跟进频率
                          </span>
                        }
                        value={scoreData.followUpFrequency}
                        suffix="分"
                        valueStyle={{ color: getScoreColor(scoreData.followUpFrequency) }}
                        prefix={getScoreIcon(scoreData.followUpFrequency)}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title={
                          <span>
                            <CheckCircleOutlined /> 转化率
                          </span>
                        }
                        value={scoreData.conversionRate}
                        suffix="分"
                        valueStyle={{ color: getScoreColor(scoreData.conversionRate) }}
                        prefix={getScoreIcon(scoreData.conversionRate)}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title={
                          <span>
                            <DollarOutlined /> ROI 表现
                          </span>
                        }
                        value={scoreData.roi}
                        suffix="分"
                        valueStyle={{ color: getScoreColor(scoreData.roi) }}
                        prefix={getScoreIcon(scoreData.roi)}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <Statistic
                        title={
                          <span>
                            <ThunderboltOutlined /> 工作效率
                          </span>
                        }
                        value={scoreData.efficiency}
                        suffix="分"
                        valueStyle={{ color: getScoreColor(scoreData.efficiency) }}
                        prefix={getScoreIcon(scoreData.efficiency)}
                      />
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* 改进建议 */}
          {showSuggestions && scoreData.suggestions && scoreData.suggestions.length > 0 && (
            <Card
              title={
                <span>
                  <BulbOutlined /> 改进建议
                </span>
              }
            >
              <List
                dataSource={scoreData.suggestions}
                renderItem={(item, index) => (
                  <List.Item>
                    <Tag color="blue">{index + 1}</Tag>
                    {item}
                  </List.Item>
                )}
              />
            </Card>
          )}
        </div>
      )
    }
  ];

  // 如果显示趋势，添加趋势标签页
  if (showTrend && scoreData.trend && scoreData.trend.length > 0) {
    tabItems.push({
      key: 'trend',
      label: '评分趋势',
      children: (
        <Card>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={scoreData.trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="overall"
                stroke="#1890ff"
                name="综合评分"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="followUpFrequency"
                stroke="#52c41a"
                name="跟进频率"
              />
              <Line
                type="monotone"
                dataKey="conversionRate"
                stroke="#faad14"
                name="转化率"
              />
              <Line
                type="monotone"
                dataKey="roi"
                stroke="#f5222d"
                name="ROI"
              />
              <Line
                type="monotone"
                dataKey="efficiency"
                stroke="#722ed1"
                name="效率"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )
    });
  }

  return (
    <div>
      <Tabs items={tabItems} />
    </div>
  );
};

export default StaffQualityScore;
