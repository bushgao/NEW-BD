import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Badge, Tooltip, Empty, Spin, message } from 'antd';
import { ClockCircleOutlined, BellOutlined, PauseCircleOutlined, RightOutlined, ReloadOutlined } from '@ant-design/icons';
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
  isBento?: boolean;
}

const FollowUpReminder: React.FC<FollowUpReminderProps> = ({ onRemind, onSnooze, isBento }) => {
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
        return '#C89B9C';  // 豆沙粉
      case 'medium':
        return '#D4A574';  // 驼色
      case 'low':
        return '#8EACBB';  // 雾霾蓝
      default:
        return '#B8B8B8';  // 浅灰
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

  const content = (
    <>
      {activeReminders.length === 0 ? (
        <Empty description="暂无待办" image={Empty.PRESENTED_IMAGE_SIMPLE} className="py-8" />
      ) : (
        <List
          size="small"
          dataSource={activeReminders.slice(0, 5)}
          renderItem={(item) => (
            <div
              key={item.collaborationId}
              className="p-5 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900">{item.influencerName}</span>
                  <Tag color={getPriorityColor(item.priority)} className="text-[10px] m-0 border-0 uppercase font-bold px-2">
                    {getPriorityText(item.priority)}
                  </Tag>
                </div>
                <div className="flex gap-1">
                  <Tooltip title="明日再看">
                    <Button
                      type="text"
                      size="small"
                      icon={<PauseCircleOutlined className="text-neutral-300" />}
                      onClick={() => handleSnooze(item.collaborationId, 24)}
                    />
                  </Tooltip>
                  <Button
                    type="text"
                    size="small"
                    icon={<RightOutlined className="text-brand-500" />}
                    onClick={() => handleGoToCollaboration(item.collaborationId)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-neutral-400">
                <div className="flex items-center gap-1">
                  <ClockCircleOutlined />
                  <span>{formatDate(item.lastFollowUpDate)}</span>
                </div>
                {item.daysSinceLastFollowUp > 0 && (
                  <span className={item.daysSinceLastFollowUp > 7 ? 'text-red-400 font-medium' : 'text-amber-400'}>
                    已停滞 {item.daysSinceLastFollowUp} 天
                  </span>
                )}
              </div>
            </div>
          )}
        />
      )}
      {activeReminders.length > 5 && (
        <div className="p-3 text-center border-t border-neutral-50 bg-neutral-50/30">
          <Button type="link" size="small" className="text-xs text-neutral-400 hover:text-brand-500">
            查看全部 {activeReminders.length} 条代办
          </Button>
        </div>
      )}
    </>
  );

  if (loading) {
    return <div className="py-12 text-center"><Spin /></div>;
  }

  if (isBento) {
    return (
      <div className="bento-card h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center p-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-brand-50/80 rounded-xl text-brand-600 flex items-center justify-center">
              <ClockCircleOutlined className="text-base" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-800">跟进提醒</span>
              {activeReminders.length > 0 && (
                <Badge count={activeReminders.length} size="small" style={{ backgroundColor: '#ef4444' }} />
              )}
            </div>
          </div>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined className="text-sm" />}
            onClick={fetchReminders}
            loading={loading}
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 w-8 h-8 rounded-lg"
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {content}
        </div>
      </div>
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
      style={{
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
      }}
      bodyStyle={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}
    >
      {content}
    </Card>
  );
};

export default FollowUpReminder;
