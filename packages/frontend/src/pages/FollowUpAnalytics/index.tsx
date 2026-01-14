import { useState, useEffect } from 'react';
import { Select, Spin, Row, Col, Statistic, message, Typography } from 'antd';
import { ClockCircleOutlined, RiseOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { getFollowUpAnalytics, type FollowUpAnalyticsData } from '../../services/report.service';
import { Card, CardContent, CardTitle } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';

const { Option } = Select;
const { Title } = Typography;

const FollowUpAnalyticsPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<FollowUpAnalyticsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getFollowUpAnalytics(selectedPeriod);
      setAnalytics(data);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.colors.background.secondary} 0%, ${theme.colors.background.tertiary} 100%)`,
        position: 'relative',
        padding: '40px',
        margin: '-24px',
      }}
    >
      {/* 背景装饰元素 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '400px',
        height: '400px',
        background: 'linear-gradient(135deg, rgba(90, 200, 250, 0.08), rgba(191, 90, 242, 0.08))',
        borderRadius: '50%',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08))',
        borderRadius: '50%',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>跟进效果分析</Title>
          <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 120 }}>
            <Option value="week">最近7天</Option>
            <Option value="month">最近30天</Option>
            <Option value="quarter">最近90天</Option>
          </Select>
        </div>

        <Spin spinning={loading}>
          {analytics && (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="跟进效果评分"
                        value={analytics.effectivenessScore}
                        suffix="/ 100"
                        prefix={<TrophyOutlined />}
                        valueStyle={{ color: analytics.effectivenessScore > 70 ? '#52c41a' : '#faad14' }}
                      />
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="总跟进次数"
                        value={analytics.totalFollowUps}
                        prefix={<ClockCircleOutlined />}
                      />
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="成功转化"
                        value={analytics.successfulConversions}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card variant="elevated" hoverable>
                    <CardContent>
                      <Statistic
                        title="转化率"
                        value={analytics.conversionRate}
                        suffix="%"
                        prefix={<RiseOutlined />}
                        valueStyle={{ color: analytics.conversionRate > 30 ? '#52c41a' : '#faad14' }}
                      />
                    </CardContent>
                  </Card>
                </Col>
              </Row>

              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <Card variant="elevated">
                    <CardTitle level={4}>最佳跟进时间</CardTitle>
                    <CardContent>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                        {analytics.bestTime}
                      </div>
                      <p style={{ color: '#666', margin: 0 }}>
                        在此时间段跟进，转化率最高
                      </p>
                    </CardContent>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card variant="elevated">
                    <CardTitle level={4}>最佳跟进频率</CardTitle>
                    <CardContent>
                      <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>
                        {analytics.bestFrequency}
                      </div>
                      <p style={{ color: '#666', margin: 0 }}>
                        保持此频率跟进，效果最佳
                      </p>
                    </CardContent>
                  </Card>
                </Col>
              </Row>

              <Card variant="elevated">
                <CardTitle level={4}>优化建议</CardTitle>
                <CardContent>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {analytics.suggestions.map((s, i) => (
                      <li key={i} style={{ marginBottom: 8, color: '#666' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </Spin>
      </div>
    </div>
  );
};

export default FollowUpAnalyticsPage;