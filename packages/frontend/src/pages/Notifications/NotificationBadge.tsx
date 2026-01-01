import { useState, useEffect, useCallback } from 'react';
import { Badge, Dropdown, List, Button, Empty, Spin, Typography, Space, Tag } from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as notificationService from '../../services/notification.service';
import type { Notification } from '../../services/notification.service';

const { Text, Paragraph } = Typography;

// 通知类型配置
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  DEADLINE_APPROACHING: {
    icon: <ClockCircleOutlined />,
    color: 'warning',
  },
  DEADLINE_OVERDUE: {
    icon: <ExclamationCircleOutlined />,
    color: 'error',
  },
  SAMPLE_NOT_RECEIVED: {
    icon: <GiftOutlined />,
    color: 'processing',
  },
  RESULT_NOT_RECORDED: {
    icon: <FileTextOutlined />,
    color: 'default',
  },
};

interface NotificationBadgeProps {
  style?: React.CSSProperties;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ style }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // 加载未读数量
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('加载未读数量失败:', error);
    }
  }, []);

  // 加载最近通知
  const loadRecentNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications({
        page: 1,
        pageSize: 5,
        isRead: false,
      });
      if (response.success && response.data) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和定时刷新
  useEffect(() => {
    loadUnreadCount();
    
    // 每分钟刷新一次未读数量
    const interval = setInterval(loadUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // 下拉框打开时加载通知
  useEffect(() => {
    if (open) {
      loadRecentNotifications();
    }
  }, [open, loadRecentNotifications]);


  // 标记为已读
  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记全部已读
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  // 查看全部
  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取类型配置
  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPE_CONFIG[type] || {
      icon: <BellOutlined />,
      color: 'default',
    };
  };

  // 下拉内容
  const dropdownContent = (
    <div
      style={{
        width: 360,
        backgroundColor: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong>通知</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllAsRead}>
            全部已读
          </Button>
        )}
      </div>

      <Spin spinning={loading}>
        {notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无未读通知"
            style={{ padding: '24px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => {
              const typeConfig = getTypeConfig(item.type);
              return (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: item.isRead ? 'transparent' : '#f6ffed',
                  }}
                  onClick={(e) => !item.isRead && handleMarkAsRead(item.id, e)}
                >
                  <List.Item.Meta
                    avatar={
                      <Tag color={typeConfig.color} style={{ margin: 0 }}>
                        {typeConfig.icon}
                      </Tag>
                    }
                    title={
                      <Space>
                        <Text
                          strong={!item.isRead}
                          style={{ fontSize: 13 }}
                          ellipsis
                        >
                          {item.title}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph
                          style={{
                            marginBottom: 4,
                            fontSize: 12,
                            color: '#666',
                          }}
                          ellipsis={{ rows: 1 }}
                        >
                          {item.content}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {formatTime(item.createdAt)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Spin>

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
        }}
      >
        <Button type="link" onClick={handleViewAll}>
          查看全部通知
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" style={style}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBadge;
