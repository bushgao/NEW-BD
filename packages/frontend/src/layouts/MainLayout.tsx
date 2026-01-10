import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, message } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  GiftOutlined,
  ProjectOutlined,
  BarChartOutlined,
  LineChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TrophyOutlined,
  SyncOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuthStore } from '../stores/authStore';
import { useAdminStore } from '../stores/adminStore';
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
    {
      key: '/app/follow-up-analytics',
      icon: <LineChartOutlined />,
      label: '跟进分析',
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
      icon: <DashboardOutlined />,
      label: '平台管理',
    },
    {
      key: '/app/admin/overview',
      icon: <BarChartOutlined />,
      label: '数据概览',
    },
    {
      key: '/app/admin/factories',
      icon: <ShopOutlined />,
      label: '工厂管理',
    },
    {
      key: '/app/admin/influencers',
      icon: <TeamOutlined />,
      label: '达人管理',
    },
    {
      key: '/app/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
  ];

  let result;
  switch (role) {
    case 'PLATFORM_ADMIN':
      result = [...adminItems];
      break;
    case 'BRAND':
      result = [...commonItems, ...businessItems, ...ownerItems];
      break;
    case 'BUSINESS':
      result = [...commonItems, ...businessItems];
      break;
    default:
      result = commonItems;
  }

  console.log('🔍 getMenuItems role:', role, 'returning:', result);
  return result;
};

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 根据路径决定使用哪个 store
  const isAdminPath = location.pathname.startsWith('/app/admin');
  const authStore = useAuthStore();
  const adminStore = useAdminStore();

  // 选择正确的用户和 token
  const user = isAdminPath ? adminStore.user : authStore.user;
  const token = isAdminPath ? adminStore.token : authStore.token;
  const logout = isAdminPath ? adminStore.logout : authStore.logout;
  const loginPath = isAdminPath ? '/admin/login' : '/login';

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate(loginPath);
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
    <Layout className="min-h-screen bg-surface-bg">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        className="border-r-0 bg-transparent !fixed h-full z-20"
        width={200}
        style={{
          background: 'transparent',
          borderRight: 'none',
        }}
      >
        <div className="flex h-16 items-center justify-start px-6">
          <Text className="text-xl font-bold tracking-tight text-neutral-900 border-l-4 border-brand-500 pl-3">
            {collapsed ? 'ICS' : 'NEW BD'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(user?.role || '')}
          onClick={handleMenuClick}
          className="bg-transparent border-r-0 px-2 space-y-1"
        />
      </Sider>
      <Layout
        className="transition-all duration-300"
        style={{ marginLeft: collapsed ? 80 : 200 }}
      >
        <Header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 px-8 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm transition-all duration-300">
          <div
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white shadow-soft transition-all hover:shadow-soft-lg"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined className="text-neutral-600" /> : <MenuFoldOutlined className="text-neutral-600" />}
          </div>
          <div className="flex items-center gap-6">
            <Button
              icon={<SyncOutlined />}
              onClick={handleSyncToExtension}
              loading={syncing}
              className="rounded-full border-none bg-white shadow-soft font-medium text-neutral-600 hover:text-brand-500"
            >
              同步插件
            </Button>
            <div className="h-8 w-[1px] bg-neutral-200" />
            <NotificationBadge />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex cursor-pointer items-center gap-3 rounded-full bg-white pl-1 pr-3 py-1 shadow-soft transition-all hover:shadow-soft-lg border border-neutral-100">
                <Avatar
                  className="bg-brand-50 text-brand-500 font-bold"
                  icon={<UserOutlined />}
                />
                <Text className="text-neutral-700 font-medium">{user?.name}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="min-h-[280px]">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
