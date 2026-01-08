const fs = require('fs');
const path = require('path');

const componentCode = `import React, { useState, useEffect } from 'react';
import { Card, Select, Spin, Alert, Row, Col, Statistic } from 'antd';
import { ClockCircleOutlined, RiseOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';

const { Option } = Select;

const FollowUpAnalytics = ({ staffId, period = 'month' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (staffId) params.append('staffId', staffId);
        params.append('period', selectedPeriod);
        const response = await fetch(\`/api/collaborations/follow-up-analytics?\${params}\`, {
          headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
        });
        if (!response.ok) throw new Error('获取跟进分析数据失败');
        const result = await response.json();
        setAnalytics(result.data);
      } catch (err) {
        setError(err.message || '未知错误');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [staffId, selectedPeriod]);

  if (loading) return <Card><div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /><p style={{ marginTop: 16 }}>加载跟进分析数据...</p></div></Card>;
  if (error) return <Card><Alert message="加载失败" description={error} type="error" showIcon /></Card>;
  if (!analytics) return null;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>跟进效果分析</h2>
        <Select value={selectedPeriod} onChange={setSelectedPeriod} style={{ width: 120 }}>
          <Option value="week">最近7天</Option>
          <Option value="month">最近30天</Option>
          <Option value="quarter">最近90天</Option>
        </Select>
      </div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="跟进效果评分" value={analytics.effectivenessScore} suffix="/ 100" prefix={<TrophyOutlined />} valueStyle={{ color: analytics.effectivenessScore > 70 ? '#52c41a' : '#faad14' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="总跟进次数" value={analytics.totalFollowUps} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="成功转化" value={analytics.successfulConversions} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card><Statistic title="转化率" value={analytics.conversionRate} suffix="%" prefix={<RiseOutlined />} valueStyle={{ color: analytics.conversionRate > 30 ? '#52c41a' : '#faad14' }} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}><Card title="最佳跟进时间"><div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>{analytics.bestTime}</div><p style={{ color: '#666', margin: 0 }}>在此时间段跟进，转化率最高</p></Card></Col>
        <Col xs={24} md={12}><Card title="最佳跟进频率"><div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a', marginBottom: 8 }}>{analytics.bestFrequency}</div><p style={{ color: '#666', margin: 0 }}>保持此频率跟进，效果最佳</p></Card></Col>
      </Row>
      <Card title="优化建议"><ul style={{ paddingLeft: 20, margin: 0 }}>{analytics.suggestions.map((s, i) => <li key={i} style={{ marginBottom: 8, color: '#666' }}>{s}</li>)}</ul></Card>
    </div>
  );
};

export default FollowUpAnalytics;`;

const filePath = path.join(__dirname, 'packages', 'frontend', 'src', 'components', 'charts', 'FollowUpAnalytics.tsx');
fs.writeFileSync(filePath, componentCode, 'utf8');
console.log('Component file created successfully!');
console.log('File size:', fs.statSync(filePath).size, 'bytes');
