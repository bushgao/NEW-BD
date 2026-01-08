import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Badge, Tooltip, Empty, Spin, message } from 'antd';
import { ClockCircleOutlined, BellOutlined, PauseCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface FollowUpSuggestion {
  collaborationId: string;
  influencerName: string;
  influencerPlatform: string;
  lastFollowUpDate: Date | null;
  suggestedNextDate: Date;
  daysSinceLastFollowUp: number;
  frequency: 'daily' | 'weekly' | 'biweekly';
  priority: 'low' | 'medium' | 'high';
  stage: string;
}

interface FollowUpReminderProps {
  onRemind?: (collaborationId: string) => void;
  onSnooze?: (collaborationId: string, duration: number) => void;
}

const FollowUpReminder: React.FC<FollowUpReminderProps> = ({ onRemind, onSnooze }) => {
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<FollowUpSuggestion[]>([]);
  const [snoozedIds, setSnoozedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchReminders();
    // Load snoozed IDs from localStorage
    const snoozed = localStorage.getItem('snoozedReminders');
    if (snoozed) {
      try {
        const parsed = JSON.parse(snoozed);
        setSnoozedIds(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse snoozed reminders:', e);
      }
    }
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/collaborations/follow-up-reminders');
      setReminders(response.data.data || []);
    } catch (error: any) {
      console.error('Failed to fetch follow-up reminders:', error);
      message.error('获取跟进提醒失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = (collaborationId: string, hours: number) => {
    const newSnoozed = new Set(snoozedIds);
    newSnoozed.add(collaborationId);
    setSnoozedIds(newSnoozed);
    localStorage.setItem('snoozedReminders', JSON.stringify(Array.from(newSnoozed)));
    
    // Auto-remove from snoozed after specified hours
    setTimeout(() => {
      const updated = new Set(snoozedIds);
      updated.delete(collaborationId);
      setSnoozedIds(updated);
      localStorage.setItem('snoozedReminders', JSON.stringify(Array.from(updated)));
    }, hours * 60 * 60 * 1000);

    message.success(`已暂停提醒 ${hours} 小时`);
    
    if (onSnooze) {
      onSnooze(collaborationId, hours);
    }
  };

  const handleGoToCollaboration = (collaborationId: string) => {
    navigate(`/app/pipeline?highlight=${collaborationId}`);
    
    if (onRemind) {
      onRemind(collaborationId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '紧急';
      case 'medium':
        return '重要';
      case 'low':
        return '普通';
      default:
        return '';
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return '每日跟进';
      case 'weekly':
        return '每周跟进';
      case 'biweekly':
        return '两周跟进';
      default:
        return '';
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '从未跟进';
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    return `${Math.floor(diffDays / 30)}个月前`;
  };

  const activeReminders = reminders.filter(r => !snoozedIds.has(r.collaborationId));

  if (loading) {
    return (
      <Card title={<><BellOutlined /> 跟进提醒</>} style={{ height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            <BellOutlined /> 跟进提醒
            {activeReminders.length > 0 && (
              <Badge 
                count={activeReminders.length} 
                style={{ marginLeft: 8 }}
              />
            )}
          </span>
          <Button type="link" size="small" onClick={fetchReminders}>
            刷新
          </Button>
        </div>
      }
      style={{ height: '100%' }}
    >
      {activeReminders.length === 0 ? (
        <Empty 
          description="暂无需要跟进的合作"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={activeReminders}
          renderItem={(item) => (
            <List.Item
              key={item.collaborationId}
              actions={[
                <Tooltip title="暂停1小时">
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={() => handleSnooze(item.collaborationId, 1)}
                  />
                </Tooltip>,
                <Tooltip title="暂停24小时">
                  <Button
                    type="text"
                    size="small"
                    onClick={() => handleSnooze(item.collaborationId, 24)}
                  >
                    暂停
                  </Button>
                </Tooltip>,
                <Button
                  type="link"
                  size="small"
                  icon={<RightOutlined />}
                  onClick={() => handleGoToCollaboration(item.collaborationId)}
                >
                  去跟进
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{item.influencerName}</span>
                    <Tag color={getPriorityColor(item.priority)}>
                      {getPriorityText(item.priority)}
                    </Tag>
                    <Tag>{item.stage}</Tag>
                  </div>
                }
                description={
                  <div style={{ fontSize: 12, color: '#666' }}>
                    <div style={{ marginBottom: 4 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      上次跟进：{formatDate(item.lastFollowUpDate)}
                      {item.daysSinceLastFollowUp > 0 && (
                        <span style={{ color: item.daysSinceLastFollowUp > 7 ? '#ff4d4f' : '#faad14' }}>
                          （已{item.daysSinceLastFollowUp}天）
                        </span>
                      )}
                    </div>
                    <div>
                      建议频率：{getFrequencyText(item.frequency)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default FollowUpReminder;
