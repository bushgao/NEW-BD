import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, message } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  GiftOutlined,
  ProjectOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TrophyOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../stores/authStore';
import NotificationBadge from '../pages/Notifications/NotificationBadge';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// Menu items based on role
const getMenuItems = (role: string): MenuProps['items'] => {
  const commonItems = [
    {
      key: '/app/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
  ];

  const businessItems = [
    {
      key: '/app/influencers',
      icon: <TeamOutlined />,
      label: '达人管理',
    },
    {
      key: '/app/pipeline',
      icon: <ProjectOutlined />,
      label: '合作管道',
    },
    {
      key: '/app/results',
      icon: <TrophyOutlined />,
      label: '合作结果',
    },
  ];

  const ownerItems = [
    {
      key: '/app/samples',
      icon: <GiftOutlined />,
      label: '样品管理',
    },
    {
      key: '/app/reports',
      icon: <BarChartOutlined />,
      label: '数据报表',
    },
    {
      key: '/app/team',
      icon: <TeamOutlined />,
      label: '团队管理',
    },
  ];

  const adminItems = [
    {
      key: '/app/admin',
      icon: <SettingOutlined />,
      label: '平台管理',
    },
  ];

  let result;
  switch (role) {
    case 'PLATFORM_ADMIN':
      result = [...commonItems, ...adminItems];
      break;
    case 'FACTORY_OWNER':
      result = [...commonItems, ...businessItems, ...ownerItems];
      break;
    case 'BUSINESS_STAFF':
      result = [...commonItems, ...businessItems];
      break;
    default:
      result = commonItems;
  }
  
  console.log('🔍 getMenuItems returning:', result);
  return result;
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuthStore();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 复制 Token 到剪贴板（用于同步到 Chrome 插件）
  const handleSyncToExtension = async () => {
    if (!token) {
      message.error('未找到登录令牌');
      return;
    }

    setSyncing(true);
    try {
      // 复制 Token 到剪贴板
      await navigator.clipboard.writeText(token.accessToken);
      
      // 显示成功提示
      message.success({
        content: (
          <div>
            <div>✅ Token 已复制到剪贴板！</div>
            <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>
              请打开 Chrome 插件 → 点击"设置" → 粘贴到"登录令牌"输入框 → 保存
            </div>
          </div>
        ),
        duration: 5,
      });
      
      console.log('✅ Token 已复制，当前用户:', user?.name);
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败，请手动复制');
    } finally {
      setSyncing(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Text strong style={{ fontSize: collapsed ? 14 : 16 }}>
            {collapsed ? 'ICS' : '达人合作系统'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(user?.role || '')}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div style={{ cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button 
              icon={<SyncOutlined />} 
              onClick={handleSyncToExtension}
              loading={syncing}
              size="small"
            >
              同步插件
            </Button>
            <NotificationBadge />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{user?.name}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
