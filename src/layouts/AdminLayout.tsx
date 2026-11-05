import { useState } from 'react';
import { App as AntApp, Avatar, Dropdown, Layout, Menu, Space, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { CalendarOutlined, DashboardOutlined, FileTextOutlined, LogoutOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';

const { Header, Sider, Content } = Layout;

const SYSTEM_NAME = '基层人大代表信息管理系统';

/** 后台布局：左侧菜单 + 顶栏（用户/角色/重置数据/退出）；代表角色只显示“我的×”三项菜单 */
export default function AdminLayout() {
  const { user, logout, resetData } = useStore();
  const { modal, message } = AntApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null; // App.tsx 已做登录守卫，这里仅兜底

  const isAdmin = user.role === 'admin';

  const items: MenuProps['items'] = isAdmin
    ? [
        { key: '/dashboard', icon: <DashboardOutlined />, label: '数据仪表盘' },
        { key: '/deputies', icon: <TeamOutlined />, label: '代表档案管理' },
        { key: '/activities', icon: <CalendarOutlined />, label: '活动管理' },
        { key: '/proposals', icon: <FileTextOutlined />, label: '提案建议交办' },
      ]
    : [
        { key: '/deputies', icon: <TeamOutlined />, label: '我的档案' },
        { key: '/activities', icon: <CalendarOutlined />, label: '我的活动' },
        { key: '/proposals', icon: <FileTextOutlined />, label: '我的提案' },
      ];

  const onReset = () => {
    modal.confirm({
      title: '重置演示数据',
      content: '将清空本机修改，恢复为初始 mock 数据，确定继续吗？',
      okText: '重置',
      cancelText: '取消',
      onOk: () => {
        resetData();
        message.success('已恢复初始演示数据');
      },
    });
  };

  const userMenu: MenuProps['items'] = [
    { key: 'reset', icon: <ReloadOutlined />, label: '重置演示数据', onClick: onReset },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" style={{ borderRight: '1px solid #e0e9e6' }}>
        <div className="sider-logo">{collapsed ? '代表' : SYSTEM_NAME}</div>
        <Menu
          mode="inline"
          items={items}
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e9e6',
          }}
        >
          <Space>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{SYSTEM_NAME}</span>
            <Tag color="green">演示版</Tag>
          </Space>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" style={{ backgroundColor: '#11685f' }} icon={<UserOutlined />} />
              <span>{user.name}</span>
              <Tag color={isAdmin ? 'geekblue' : 'green'}>{isAdmin ? '管理员' : '人大代表'}</Tag>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}