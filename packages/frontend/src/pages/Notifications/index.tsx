import { useState, useEffect, useCallback } from 'react';
import {
  List,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Spin,
  message,
  Popconfirm,
  Tabs,
  Badge,
} from 'antd';
import { Card, CardTitle, CardContent } from '../../components/ui/Card';
import { useTheme } from '../../theme/ThemeProvider';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  GiftOutlined,
  FileTextOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import * as notificationService from '../../services/notification.service';
import type { Notification } from '../../services/notification.service';

const { Text, Paragraph } = Typography;

// 通知类型配置
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  DEADLINE_APPROACHING: {
    icon: <ClockCircleOutlined />,
    color: 'warning',
    label: '即将到期',
  },
  DEADLINE_OVERDUE: {
    icon: <ExclamationCircleOutlined />,
    color: 'error',
    label: '已超期',
  },
  SAMPLE_NOT_RECEIVED: {
    icon: <GiftOutlined />,
    color: 'processing',
    label: '样品未签收',
  },
  RESULT_NOT_RECORDED: {
    icon: <FileTextOutlined />,
    color: 'default',
    label: '待录入结果',
  },
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  // 加载通知列表
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const filter: notificationService.NotificationFilter = {
        page,
        pageSize,
      };

      if (activeTab === 'unread') {
        filter.isRead = false;
      }

      const response = await notificationService.getNotifications(filter);
      if (response.success && response.data) {
        setNotifications(response.data.data);
        setTotal(response.data.total);
      }
    } catch (error) {
      message.error('加载通知失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTab]);

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

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);


  // 标记单个为已读
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        message.success('已标记为已读');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 标记全部为已读
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        message.success(response.data?.message || '已全部标记为已读');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除单个通知
  const handleDelete = async (id: string) => {
    try {
      const response = await notificationService.deleteNotification(id);
      if (response.success) {
        const deletedNotification = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setTotal((prev) => prev - 1);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        message.success('通知已删除');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 清空已读通知
  const handleClearRead = async () => {
    try {
      const response = await notificationService.clearReadNotifications();
      if (response.success) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
        loadNotifications();
        message.success(response.data?.message || '已清空已读通知');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取通知类型配置
  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPE_CONFIG[type] || {
      icon: <BellOutlined />,
      color: 'default',
      label: '通知',
    };
  };


  // 渲染通知项
  const renderNotificationItem = (item: Notification) => {
    const typeConfig = getTypeConfig(item.type);

    return (
      <List.Item
        style={{
          backgroundColor: item.isRead ? 'transparent' : '#f6ffed',
          padding: '16px',
          borderRadius: 8,
          marginBottom: 8,
        }}
        actions={[
          !item.isRead && (
            <Button
              key="read"
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleMarkAsRead(item.id)}
            >
              标记已读
            </Button>
          ),
          <Popconfirm
            key="delete"
            title="确定删除此通知？"
            onConfirm={() => handleDelete(item.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>,
        ].filter(Boolean)}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: `var(--ant-color-${typeConfig.color}-bg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: `var(--ant-color-${typeConfig.color})`,
              }}
            >
              {typeConfig.icon}
            </div>
          }
          title={
            <Space>
              <Text strong={!item.isRead}>{item.title}</Text>
              <Tag color={typeConfig.color}>{typeConfig.label}</Tag>
              {!item.isRead && <Badge status="processing" />}
            </Space>
          }
          description={
            <div>
              <Paragraph
                style={{ marginBottom: 4, color: item.isRead ? '#999' : '#333' }}
                ellipsis={{ rows: 2 }}
              >
                {item.content}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formatTime(item.createdAt)}
              </Text>
            </div>
          }
        />
      </List.Item>
    );
  };

  const tabItems = [
    {
      key: 'all',
      label: '全部通知',
    },
    {
      key: 'unread',
      label: (
        <Badge count={unreadCount} offset={[10, 0]}>
          未读通知
        </Badge>
      ),
    },
  ];

  const { theme } = useTheme();

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
        <Card
          variant="elevated"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <CardTitle level={4} style={{ margin: 0 }}>
              <Space>
                <BellOutlined />
                <span>通知中心</span>
              </Space>
            </CardTitle>
            <Space>
              <Button
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                全部已读
              </Button>
              <Popconfirm
                title="确定清空所有已读通知？"
                onConfirm={handleClearRead}
                okText="确定"
                cancelText="取消"
              >
                <Button icon={<ClearOutlined />}>清空已读</Button>
              </Popconfirm>
            </Space>
          </div>

          <CardContent>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key as 'all' | 'unread');
                setPage(1);
              }}
              items={tabItems}
            />

            <Spin spinning={loading}>
              {notifications.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={activeTab === 'unread' ? '暂无未读通知' : '暂无通知'}
                />
              ) : (
                <List
                  dataSource={notifications}
                  renderItem={renderNotificationItem}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: setPage,
                    showSizeChanger: false,
                    showTotal: (total) => `共 ${total} 条通知`,
                  }}
                />
              )}
            </Spin>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPage;
