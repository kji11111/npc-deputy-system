import { useMemo, useState } from 'react';
import { App as AntApp, Avatar, Badge, Button, Dropdown, Layout, Menu, Space, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { BellOutlined, CalendarOutlined, DashboardOutlined, FileTextOutlined, LogoutOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/AppStore';

const { Header, Sider, Content } = Layout;

const SYSTEM_NAME = '基层人大代表信息管理系统';

/**
 * 后台布局：左侧菜单 + 顶栏（我的待办 Badge / 用户角色 / 重置数据 / 退出）。
 * 菜单按角色过滤：管理员全量；承办单位仅“提案办理”；代表为“我的×”三项。
 */
export default function AdminLayout() {
  const { user, proposals, logout, resetData } = useStore();
  const { modal, message } = AntApp.useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  /** 我的待办数量：管理员=待审核+待转送+已退回；承办单位=已交办+办理中（限本单位）；代表=本人领衔且待评价 */
  const todoCount = useMemo(() => {
    if (!user) return 0;
    if (user.role === 'admin') {
      return proposals.filter((p) => p.status === '待审核' || p.status === '待转送' || p.status === '已退回').length;
    }
    if (user.role === 'handler') {
      return proposals.filter(
        (p) => p.handlerOrg === user.handlerOrg && (p.status === '已交办' || p.status === '办理中'),
      ).length;
    }
    return proposals.filter((p) => p.proposerId === user.deputyId && p.status === '已答复').length;
  }, [user, proposals]);

  if (!user) return null; // App.tsx 已做登录守卫，这里仅兜底

  const isAdmin = user.role === 'admin';
  const isHandler = user.role === 'handler';

  const items: MenuProps['items'] = isAdmin
    ? [
        { key: '/dashboard', icon: <DashboardOutlined />, label: '数据仪表盘' },
        { key: '/deputies', icon: <TeamOutlined />, label: '代表档案管理' },
        { key: '/activities', icon: <CalendarOutlined />, label: '活动管理' },
        { key: '/proposals', icon: <FileTextOutlined />, label: '提案建议交办' },
      ]
    : isHandler
      ? [{ key: '/proposals', icon: <FileTextOutlined />, label: '提案办理' }]
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

  const roleLabel = isAdmin ? '管理员' : isHandler ? '承办单位' : '人大代表';

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
          <Space>
            {/* 我的待办：点击跳转提案列表并自动按待办状态筛选（?todo=1） */}
            <Badge count={todoCount} size="small">
              <Button size="small" icon={<BellOutlined />} onClick={() => navigate('/proposals?todo=1')}>
                我的待办
              </Button>
            </Badge>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" style={{ backgroundColor: '#11685f' }} icon={<UserOutlined />} />
                <span>{user.name}</span>
                <Tag color={isAdmin ? 'geekblue' : isHandler ? 'purple' : 'green'}>{roleLabel}</Tag>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}