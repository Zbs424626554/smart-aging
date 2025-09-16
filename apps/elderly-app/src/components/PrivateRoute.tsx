import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import type { UserRole } from '../services/auth.service';

// 路由守卫属性接口
interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[]; // 需要的角色权限
  redirectTo?: string; // 重定向路径
}

// 路由守卫组件
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/login'
}) => {
  const location = useLocation();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isLoggedIn = !!(token || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : null));
  const currentRole = AuthService.getCurrentRole();

  // 如果未登录，重定向到登录页
  if (!isLoggedIn) {
    // 未登录先回到根路径，让 RootRedirect 执行基于 Cookie 的兜底鉴权
    return <Navigate to={"/"} state={{ from: location }} replace />;
  }

  // 如果需要特定角色权限
  if (requiredRoles.length > 0 && currentRole) {
    // 检查用户是否有访问权限
    const hasPermission = requiredRoles.includes(currentRole);

    if (!hasPermission) {
      // 先回到根路径，由 RootRedirect 统一判断是否需要跨端跳转
      return <Navigate to={'/'} replace />;
    }
  }

  // 若需要角色但当前尚未解析出角色，则回根路径等待 RootRedirect 解码 token
  if (requiredRoles.length > 0 && !currentRole) {
    return <Navigate to={'/'} replace />;
  }

  return <>{children}</>;
};

// 角色路由守卫组件
export const RoleRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRoles,
  redirectTo
}) => {
  return (
    <PrivateRoute requiredRoles={requiredRoles} redirectTo={redirectTo}>
      {children}
    </PrivateRoute>
  );
};

// 老人端路由守卫
export const ElderlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleRoute requiredRoles={['elderly']}>{children}</RoleRoute>;
};

// 家属端路由守卫
export const FamilyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleRoute requiredRoles={['family']}>{children}</RoleRoute>;
};

// 护工端路由守卫
export const NurseRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleRoute requiredRoles={['nurse']}>{children}</RoleRoute>;
};

// 管理员路由守卫
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <RoleRoute requiredRoles={['admin']}>{children}</RoleRoute>;
}; 