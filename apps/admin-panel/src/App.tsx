import React, { useState, useEffect } from 'react';
import { ConfigProvider, Spin, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthService } from './services/AuthService';

// 页面导入
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Services from './pages/Services';
import Settings from './pages/Settings';
import ReviewsAndComplaints from './pages/ReviewsAndComplaints';
import Approve from './pages/Approve';
import Payments from './pages/Payments';
import Disputes from './pages/Disputes';
import DataSummary from './pages/DataSummary';
import NotAuthorized from './pages/NotAuthorized';
import Permissions from './pages/Permissions';
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // 初始化应用
  useEffect(() => {
    // 清除特定的会话存储，但保留AuthService需要的状态
    sessionStorage.removeItem('auth_checking');

    // 初始化AuthService
    AuthService.initialize();

    try {
      // 检查登录状态
      const loggedIn = AuthService.isLoggedIn();

      if (loggedIn) {
        const user = AuthService.getCurrentUser();
        if (user) {
          // 归一化角色（admin 视为 admin_super）
          setUserRole(AuthService.getCurrentRole() || '');
          setUserPermissions(user.pagePermissions || []);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('初始化失败:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 处理登录
  const handleLogin = async (username: string, password: string) => {
    setLoading(true);

    try {
      // App: 尝试登录

      // 使用AuthService进行登录
      await AuthService.login(username, password);

      // 获取登录后的用户信息
      const user = AuthService.getCurrentUser();

      if (user) {
        // 登录成功，用户信息
        // 归一化角色（admin 视为 admin_super）
        setUserRole(AuthService.getCurrentRole() || '');
        setUserPermissions(user.pagePermissions || []);
        setIsLoggedIn(true);
        message.success('登录成功');
      } else {
        console.error('登录成功但未获取到用户信息');
        message.error('登录失败，未获取到用户信息');
        setIsLoggedIn(false);
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理登出
  const handleLogout = async () => {
    setLoading(true);

    try {
      await AuthService.logout();
      setIsLoggedIn(false);
      setUserRole('');
      setUserPermissions([]);
      message.success('已退出登录');
    } catch (error) {
      console.error('登出失败:', error);
      message.error('登出失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 检查页面访问权限
  // 已移除页面访问拦截，统一放行
  const checkAccess = (_requiredRoles: string[], _path: string) => true;

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>应用加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* 公共路由 */}
            <Route path="/login" element={
              isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/register" element={<Register />} />

            {/* 根路径重定向 */}
            <Route path="/" element={
              isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />

            {/* 管理后台路由 */}
            <Route path="/dashboard" element={
              isLoggedIn ? (
                <Layout onLogout={handleLogout} userRole={userRole} userPermissions={userPermissions} />
              ) : (
                <Navigate to="/login" replace />
              )
            }>
              <Route index element={<Dashboard />} />
              <Route path="users" element={
                checkAccess(['admin_super', 'admin', 'system_admin'], '/dashboard/users') ?
                  <Users /> : <NotAuthorized />
              } />
              <Route path="approve" element={
                checkAccess(['admin_super', 'reviewer'], '/dashboard/approve') ?
                  <Approve /> : <NotAuthorized />
              } />
              <Route path="orders" element={
                checkAccess(['admin_super', 'admin', 'cs_manager', 'finance'], '/dashboard/orders') ?
                  <Orders /> : <NotAuthorized />
              } />
              <Route path="payments" element={
                checkAccess(['admin_super', 'finance'], '/dashboard/payments') ?
                  <Payments /> : <NotAuthorized />
              } />
              <Route path="services" element={
                checkAccess(['admin_super', 'admin', 'cs_manager'], '/dashboard/services') ?
                  <Services /> : <NotAuthorized />
              } />
              <Route path="disputes" element={
                checkAccess(['admin_super', 'cs_manager'], '/dashboard/disputes') ?
                  <Disputes /> : <NotAuthorized />
              } />
              <Route path="reviews-complaints" element={
                checkAccess(['admin_super', 'cs_manager', 'reviewer'], '/dashboard/reviews-complaints') ?
                  <ReviewsAndComplaints /> : <NotAuthorized />
              } />
              <Route path="data-summary" element={
                checkAccess(['admin_super', 'finance'], '/dashboard/data-summary') ?
                  <DataSummary /> : <NotAuthorized />
              } />
              <Route path="settings" element={
                checkAccess(['admin_super', 'system_admin'], '/dashboard/settings') ?
                  <Settings /> : <NotAuthorized />
              } />
              <Route path="permissions" element={
                checkAccess(['admin_super', 'system_admin'], '/dashboard/permissions') ?
                  <Permissions /> : <NotAuthorized />
              } />
            </Route>

            {/* 404页面 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App; 