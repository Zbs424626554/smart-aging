import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { PrivateRoute } from '../components/PrivateRoute';

// 公共页面
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';


// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const isLoggedIn = AuthService.isLoggedIn();
  const currentRole = AuthService.getCurrentRole();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 根据角色重定向到对应的应用
  const roleRedirectMap: Record<string, string> = {
    elderly: 'http://localhost:5174',
    family: 'http://localhost:5173',
    nurse: 'http://localhost:5175',
    admin: 'http://localhost:5176'
  };

  const redirectPath = roleRedirectMap[currentRole || ''] || '/login';
  window.location.href = redirectPath;
  return null;
};

// 主路由组件
const MainRouter: React.FC = () => {
  return (
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 根路径重定向 */}
        <Route path="/" element={<RootRedirect />} />

      
        {/* 404页面 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
};

export default MainRouter; 