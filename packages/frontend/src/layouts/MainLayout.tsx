import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd';
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
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
  ];

  const businessItems = [
    {
      key: '/influencers',
      icon: <TeamOutlined />,
      label: '达人管理',
    },
    {
      key: '/pipeline',
      icon: <ProjectOutlined />,
      label: '合作管道',
    },
    {
      key: '/results',
      icon: <TrophyOutlined />,
      label: '合作结果',
    },
  ];

  const ownerItems = [
    {
      key: '/samples',
      icon: <GiftOutlined />,
      label: '样品管理',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: '数据报表',
    },
  ];

  const adminItems = [
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '平台管理',
    },
  ];

  switch (role) {
    case 'PLATFORM_ADMIN':
      return [...commonItems, ...adminItems];
    case 'FACTORY_OWNER':
      return [...commonItems, ...businessItems, ...ownerItems];
    case 'BUSINESS_STAFF':
      return [...commonItems, ...businessItems];
    default:
      return commonItems;
  }
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
