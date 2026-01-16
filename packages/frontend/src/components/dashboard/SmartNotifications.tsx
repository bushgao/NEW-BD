import React, { useState, useEffect } from 'react';
import { Card, List, Badge, Button, Empty, Spin, Tooltip, message } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
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
  brandId?: string;
  onRefresh?: () => void;
  isBento?: boolean;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  brandId,
  onRefresh,
  isBento,
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

      const response = await fetch(`/api/reports/dashboard/alerts${brandId ? `?brandId=${brandId}` : ''}`, {
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
    // 只在有 brandId 时才获取提醒
    if (!brandId) {
      console.warn('No brandId provided, skipping alerts fetch');
      return;
    }

    fetchAlerts();

    // 设置定时刷新（每5分钟）
    const interval = setInterval(() => {
      if (brandId) {
        fetchAlerts();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [brandId]);

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#C89B9C';  // 豆沙粉
      case 'medium':
        return '#D4A574';  // 驼色
      case 'low':
        return '#9CAF88';  // 橄榄绿
      default:
        return '#B8B8B8';  // 浅灰
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'summary':
        return <CheckCircleOutlined style={{ color: '#8EACBB' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#D4A574' }} />;
      case 'reminder':
        return <ClockCircleOutlined style={{ color: '#A89BB9' }} />;
      default:
        return <BellOutlined />;
    }
  };

  // 处理刷新
  // 处理刷新
  const handleRefresh = () => {
    fetchAlerts();
    if (onRefresh) {
      onRefresh();
    }
  };

  const content = (
    <>
      {loading && alerts.length === 0 ? (
        <div className="py-8 text-center"><Spin /></div>
      ) : alerts.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无提醒" className="py-8" />
      ) : (
        <List
          size="small"
          dataSource={alerts.slice(0, 5)}
          className="bg-transparent"
          renderItem={(alert) => (
            <div
              key={alert.id}
              className={`p-5 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer relative overflow-hidden ${alert.read ? 'opacity-60' : ''}`}
              style={{ borderLeft: `4px solid ${getPriorityColor(alert.priority)}` }}
              onClick={() => {
                if (!alert.read) markAsRead(alert.id);
                if (alert.actionUrl) window.location.href = alert.actionUrl;
              }}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 text-lg">{getTypeIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-tighter">
                      {alert.type === 'summary' ? '摘要' : alert.type === 'warning' ? '异常' : '提醒'}
                    </span>
                    <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                      {dayjs(alert.timestamp).fromNow()}
                    </span>
                  </div>
                  <h5 className={`text-sm mb-1 truncate ${alert.read ? 'font-normal text-neutral-500' : 'font-bold text-neutral-900'}`}>
                    {alert.title}
                  </h5>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      )}
      {alerts.length > 5 && (
        <div className="p-3 text-center border-t border-neutral-50 bg-neutral-50/30">
          <Button type="link" size="small" className="text-xs text-neutral-400 hover:text-brand-500">
            查看全部 {alerts.length} 条提醒
          </Button>
        </div>
      )}
    </>
  );
  if (isBento) {
    return (

      <div className="bento-card h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center p-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-50/80 rounded-xl text-indigo-600 flex items-center justify-center">
              <BellOutlined className="text-base" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-neutral-800">智能提醒</span>
              {unreadCount > 0 && (
                <Badge count={unreadCount} size="small" style={{ backgroundColor: '#ef4444' }} />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                type="text"
                size="small"
                onClick={markAllAsRead}
                className="text-xs text-neutral-400 hover:text-indigo-600 hover:bg-neutral-50 px-2 h-7"
              >
                全部已读
              </Button>
            )}
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined className="text-sm" />}
              onClick={handleRefresh}
              loading={loading}
              className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 w-8 h-8 rounded-lg"
            />
          </div>
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
      style={{
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: '100%',
      }}
      bodyStyle={{ padding: 0, maxHeight: 400, overflow: 'auto' }}
    >
      {content}
    </Card>
  );
};

export default SmartNotifications;
