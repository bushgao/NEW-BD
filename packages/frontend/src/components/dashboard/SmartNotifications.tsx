import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Tag, Empty, Spin, Tooltip, message } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface Alert {
  id: string;
  type: 'summary' | 'warning' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface SmartNotificationsProps {
  factoryId?: string;
  onRefresh?: () => void;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  factoryId,
  onRefresh,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 获取提醒数据
  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found, skipping alerts fetch');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/reports/dashboard/alerts${factoryId ? `?factoryId=${factoryId}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch alerts:', response.status, response.statusText);
        // 不显示错误消息，静默失败
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success && data.data) {
        setAlerts(data.data.alerts || []);
        setUnreadCount(data.data.unreadCount || 0);
      } else {
        console.warn('Invalid alerts data format:', data);
        setAlerts([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // 静默失败，不显示错误消息
      setAlerts([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 标记为已读
  const markAsRead = async (alertId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/reports/dashboard/alerts/${alertId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to mark as read:', response.status);
        return;
      }

      // 更新本地状态
      setAlerts(prev => prev.map(alert =>
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  // 全部标记为已读
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/reports/dashboard/alerts/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to mark all as read:', response.status);
        message.error('操作失败');
        return;
      }

      // 更新本地状态
      setAlerts(prev => prev.map(alert => ({ ...alert, read: true })));
      setUnreadCount(0);
      message.success('已全部标记为已读');
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('操作失败');
    }
  };

  // 初始加载
  useEffect(() => {
    // 只在有 factoryId 时才获取提醒
    if (!factoryId) {
      console.warn('No factoryId provided, skipping alerts fetch');
      return;
    }

    fetchAlerts();
    
    // 设置定时刷新（每5分钟）
    const interval = setInterval(() => {
      if (factoryId) {
        fetchAlerts();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [factoryId]);

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <CheckCircleOutlined style={{ color: '#1890ff' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'reminder':
        return <ClockCircleOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined />;
    }
  };

  // 获取类型标签
  const getTypeTag = (type: string) => {
    switch (type) {
      case 'summary':
        return <Tag color="blue">工作摘要</Tag>;
      case 'warning':
        return <Tag color="orange">异常预警</Tag>;
      case 'reminder':
        return <Tag color="purple">重要提醒</Tag>;
      default:
        return <Tag>通知</Tag>;
    }
  };

  // 处理刷新
  const handleRefresh = () => {
    fetchAlerts();
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <Card
      title={
        <span>
          <Badge count={unreadCount} offset={[10, 0]}>
            <BellOutlined style={{ marginRight: 8 }} />
          </Badge>
          智能提醒
        </span>
      }
      extra={
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button
              type="link"
              size="small"
              onClick={markAllAsRead}
            >
              全部已读
            </Button>
          )}
          <Tooltip title="刷新">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            />
          </Tooltip>
        </div>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: 0, maxHeight: 600, overflow: 'auto' }}
    >
      {loading && alerts.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : alerts.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无提醒"
          style={{ padding: 24 }}
        />
      ) : (
        <List
          dataSource={alerts}
          renderItem={(alert) => (
            <List.Item
              key={alert.id}
              style={{
                padding: '12px 16px',
                backgroundColor: alert.read ? 'transparent' : '#f0f5ff',
                borderLeft: `3px solid ${getPriorityColor(alert.priority)}`,
                cursor: 'pointer',
                opacity: alert.read ? 0.6 : 1,
              }}
              onClick={() => {
                if (!alert.read) {
                  markAsRead(alert.id);
                }
                if (alert.actionUrl) {
                  window.location.href = alert.actionUrl;
                }
              }}
            >
              <List.Item.Meta
                avatar={getTypeIcon(alert.type)}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getTypeTag(alert.type)}
                    <span style={{ fontWeight: alert.read ? 'normal' : 'bold' }}>
                      {alert.title}
                    </span>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>{alert.description}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {dayjs(alert.timestamp).fromNow()}
                    </div>
                  </div>
                }
              />
              {alert.actionLabel && (
                <Button type="link" size="small">
                  {alert.actionLabel}
                </Button>
              )}
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default SmartNotifications;
