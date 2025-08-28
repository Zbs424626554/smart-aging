import React, { useState, useMemo } from 'react';
import { Layout as AntLayout, Menu, Button, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { AuthService } from '../services/AuthService';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MessageOutlined,
  SafetyOutlined,
  AccountBookOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  FundOutlined,
  KeyOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = AntLayout;

// 菜单图标映射
const menuIconMap: Record<string, React.ReactNode> = {
  '/dashboard': <DashboardOutlined />,
  '/dashboard/users': <UserOutlined />,
  '/dashboard/permissions': <KeyOutlined />,
  '/dashboard/approve': <SafetyOutlined />,
  '/dashboard/orders': <FileTextOutlined />,
  '/dashboard/payments': <AccountBookOutlined />,
  '/dashboard/services': <ToolOutlined />,
  '/dashboard/disputes': <ExclamationCircleOutlined />,
  '/dashboard/reviews-complaints': <MessageOutlined />,
  '/dashboard/data-summary': <FundOutlined />,
  '/dashboard/settings': <SettingOutlined />,
  '/dashboard/announcements': <MessageOutlined />,
  '/dashboard/support-tickets': <MessageOutlined />,
  '/dashboard/config': <ToolOutlined />,
};

const Layout: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { permissions, role, loading } = usePermissions();

  // 根据用户角色和权限过滤菜单
  const menuItems = useMemo(() => {
    // 导航来源：根据角色默认页面 + 用户 pagePermissions 白名单过滤
    const items = permissions.map(p => ({
      key: p.key,
      icon: menuIconMap[p.key] || <FileTextOutlined />,
      label: p.label,
    }));
    if (!items.find(i => i.key === '/dashboard')) {
      items.unshift({ key: '/dashboard', icon: menuIconMap['/dashboard'], label: '仪表盘' });
    }
    return items;
  }, [permissions]);

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    // 防止重复点击
    if (isLoggingOut) return;
    
    try {
      setIsLoggingOut(true);
      message.loading('正在退出登录...', 0.5);
      
      // 调用登出逻辑
      if (onLogout) {
        onLogout();
      } else {
        // 后备：直接通过 AuthService 登出
        AuthService.logout().finally(() => navigate('/login'));
      }
      
      // 显示成功消息
      message.success('退出成功');
    } catch (error) {
      console.error('退出登录失败:', error);
      message.error('退出失败，请重试');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="dark"
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          智慧养老管理系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            loading={isLoggingOut}
          >
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff' }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 