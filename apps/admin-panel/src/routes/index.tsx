import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService } from '../services/AuthService';
import { PrivateRoute } from '../components/PrivateRoute';
import { canAccessRoute } from '../config/permissions';
import { Spin } from 'antd';

// 公共页面
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// 管理后台页面
import Layout from '../pages/Layout';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/Users';
import Orders from '../pages/Orders';
import Services from '../pages/Services';
import Settings from '../pages/Settings';
import ReviewsAndComplaints from '../pages/ReviewsAndComplaints';
import Approve from '../pages/Approve';
import Payments from '../pages/Payments';
import Disputes from '../pages/Disputes';
import DataSummary from '../pages/DataSummary';
import NotAuthorized from '../pages/NotAuthorized';
import Permissions from '../pages/Permissions';
import Announcements from '../pages/Announcements';
import SupportTickets from '../pages/SupportTickets';
import Config from '../pages/Config';

// 认证状态接口
interface AuthState {
  isAuthenticated: boolean;
  setAuthStatus: (status: boolean) => void;
}

// 路由组件映射
const routeComponentMap = {
  '/dashboard': Dashboard,
  '/dashboard/users': Users,
  '/dashboard/permissions': Permissions,
  '/dashboard/approve': Approve,
  '/dashboard/orders': Orders,
  '/dashboard/payments': Payments,
  '/dashboard/services': Services,
  '/dashboard/disputes': Disputes,
  '/dashboard/reviews-complaints': ReviewsAndComplaints,
  '/dashboard/data-summary': DataSummary,
  '/dashboard/settings': Settings,
};

// 根路由重定向组件
const RootRedirect: React.FC<{ authState: AuthState }> = ({ authState }) => {
  const { isAuthenticated } = authState;
  const currentRole = AuthService.getCurrentRole();
  
  // 如果未登录，重定向到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 检查是否是管理员角色
  if (!['admin_super', 'admin', 'cs_manager', 'reviewer', 'finance', 'content_manager', 'system_admin'].includes(currentRole)) {
    // 如果不是管理员角色，重定向到对应的应用
    const roleRedirectMap: Record<string, string> = {
      elderly: 'http://localhost:5174',
      family: 'http://localhost:5173',
      nurse: 'http://localhost:5175'
    };

    const redirectPath = roleRedirectMap[currentRole || ''] || '/login';
    window.location.href = redirectPath;
    return null;
  }
  
  // 是管理员，重定向到仪表盘
  return <Navigate to="/dashboard" replace />;
};

// 页面组件包装器：取消页面级拦截，直接渲染
const ProtectedPage: React.FC<{ component: React.ComponentType, path: string }> = ({ component: Component }) => {
  return <Component />;
};

// 管理后台路由组件
const AdminRouter: React.FC<{ authState: AuthState }> = ({ authState }) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={<Login authState={authState} />} />
        <Route path="/register" element={<Register />} />

        {/* 根路径重定向 */}
        <Route path="/" element={<RootRedirect authState={authState} />} />

        {/* 管理后台路由 */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute authState={authState} requiredRoles={['admin_super', 'admin', 'cs_manager', 'reviewer', 'finance', 'content_manager', 'system_admin']}>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<ProtectedPage component={Users} path="/dashboard/users" />} />
          <Route path="permissions" element={<ProtectedPage component={Permissions} path="/dashboard/permissions" />} />
          <Route path="approve" element={<ProtectedPage component={Approve} path="/dashboard/approve" />} />
          <Route path="orders" element={<ProtectedPage component={Orders} path="/dashboard/orders" />} />
          <Route path="payments" element={<ProtectedPage component={Payments} path="/dashboard/payments" />} />
          <Route path="services" element={<ProtectedPage component={Services} path="/dashboard/services" />} />
          <Route path="disputes" element={<ProtectedPage component={Disputes} path="/dashboard/disputes" />} />
          <Route path="reviews-complaints" element={<ProtectedPage component={ReviewsAndComplaints} path="/dashboard/reviews-complaints" />} />
          <Route path="data-summary" element={<ProtectedPage component={DataSummary} path="/dashboard/data-summary" />} />
          <Route path="settings" element={<ProtectedPage component={Settings} path="/dashboard/settings" />} />
          <Route path="announcements" element={<ProtectedPage component={Announcements} path="/dashboard/announcements" />} />
          <Route path="support-tickets" element={<ProtectedPage component={SupportTickets} path="/dashboard/support-tickets" />} />
          <Route path="config" element={<ProtectedPage component={Config} path="/dashboard/config" />} />
        </Route>

        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AdminRouter; 