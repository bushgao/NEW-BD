import { useState, useEffect } from 'react';
import { Card, Space, Tag, Button, Spin, Empty, Tooltip, Typography } from 'antd';
import { 
  BulbOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined, 
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import type { Influencer } from '../../services/influencer.service';

const { Text, Title } = Typography;

export interface RecommendedInfluencer extends Influencer {
  reason: 'history' | 'roi' | 'recent';
  score: number;
  details: string;
}

interface SmartRecommendationsProps {
  recommendations: RecommendedInfluencer[];
  loading: boolean;
  onRefresh: () => void;
  onViewInfluencer: (influencer: Influencer) => void;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  recommendations,
  loading,
  onRefresh,
  onViewInfluencer,
}) => {
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'history':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'roi':
        return <TrophyOutlined style={{ color: '#52c41a' }} />;
      case 'recent':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <BulbOutlined />;
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'history':
        return '历史合作';
      case 'roi':
        return '高ROI';
      case 'recent':
        return '最近联系';
      default:
        return '推荐';
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'history':
        return 'blue';
      case 'roi':
        return 'green';
      case 'recent':
        return 'orange';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <BulbOutlined style={{ color: '#1890ff' }} />
            <span>智能推荐</span>
          </Space>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin tip="正在分析推荐..." />
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <BulbOutlined style={{ color: '#1890ff' }} />
            <span>智能推荐</span>
          </Space>
        }
        extra={
          <Button 
            type="link" 
            size="small" 
            icon={<ReloadOutlined />} 
            onClick={onRefresh}
          >
            刷新
          </Button>
        }
      >
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description="暂无推荐达人"
          style={{ padding: '20px 0' }}
        />
      </Card>
    );
  }

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      title={
        <Space>
          <BulbOutlined style={{ color: '#1890ff' }} />
          <span>智能推荐</span>
          <Tag color="blue">{recommendations.length} 个</Tag>
        </Space>
      }
      extra={
        <Button 
          type="link" 
          size="small" 
          icon={<ReloadOutlined />} 
          onClick={onRefresh}
        >
          刷新
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {recommendations.slice(0, 5).map((influencer) => (
          <div
            key={influencer.id}
            style={{
              padding: '8px 12px',
              background: '#fafafa',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fafafa';
            }}
            onClick={() => onViewInfluencer(influencer)}
          >
            <Space direction="vertical" size={2} style={{ flex: 1 }}>
              <Space size="small">
                {getReasonIcon(influencer.reason)}
                <Text strong style={{ fontSize: 13 }}>
                  {influencer.nickname}
                </Text>
                <Tag color={getReasonColor(influencer.reason)} style={{ fontSize: 11 }}>
                  {getReasonLabel(influencer.reason)}
                </Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {influencer.details}
              </Text>
            </Space>
            <RightOutlined style={{ color: '#999', fontSize: 12 }} />
          </div>
        ))}
        
        {recommendations.length > 5 && (
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              还有 {recommendations.length - 5} 个推荐达人
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default SmartRecommendations;
