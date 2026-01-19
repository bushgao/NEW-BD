/**
 * 达人端口布局组件
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Typography, Button, Space } from 'antd';
import {
  HomeOutlined,
  GiftOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ChromeOutlined,
} from '@ant-design/icons';
import { useInfluencerPortalStore, getContactTypeName } from '../stores/influencerPortalStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const InfluencerPortalLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { contact, logout } = useInfluencerPortalStore();

  const displayName = contact?.name || contact?.phone || '达人用户';
  const typeName = contact?.contactType ? getContactTypeName(contact.contactType) : '';

  const menuItems = [
    {
      key: '/influencer-portal',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/influencer-portal/samples',
      icon: <GiftOutlined />,
      label: '我的样品',
    },
    {
      key: '/influencer-portal/collaborations',
      icon: <TeamOutlined />,
      label: '合作进度',
    },
    {
      key: '/influencer-portal/settings',
      icon: <SettingOutlined />,
      label: '账号设置',
    },
    {
      key: '/influencer-portal/plugin',
      icon: <ChromeOutlined />,
      label: '插件使用',
    },
  ];

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账号设置',
      onClick: () => navigate('/influencer-portal/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/influencer-portal/login', { replace: true });
      },
    },
  ];

  const getSelectedKey = () => {
    const path = location.pathname;
    const item = menuItems.find(
      (item) => path === item.key || (item.key !== '/influencer-portal' && path.startsWith(item.key))
    );
    return item?.key || '/influencer-portal';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Text
            strong
            style={{
              fontSize: collapsed ? 16 : 18,
              color: '#722ed1',
              whiteSpace: 'nowrap',
            }}
          >
            {collapsed ? '达人' : '达人端口'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
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
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Space>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#722ed1' }}
                />
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ display: 'block' }}>
                    {displayName}
                  </Text>
                  {typeName && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {typeName}
                    </Text>
                  )}
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            minHeight: 280,
            background: 'transparent',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default InfluencerPortalLayout;
