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
  // 使用本地token或userRole进行同步校验，避免跨端首落地需二次登录
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const isLoggedIn = !!(token || role);
  const currentRole = AuthService.getCurrentRole();

  // 如果未登录，重定向到登录页
  if (!isLoggedIn) {
    return <Navigate to={"/"} state={{ from: location }} replace />;
  }

  // 如果需要特定角色权限
  if (requiredRoles.length > 0 && currentRole) {
    // 检查用户是否有访问权限
    const hasPermission = requiredRoles.includes(currentRole);

    if (!hasPermission) {
      // 根据角色重定向到对应的应用
      const roleRedirectMap: Record<UserRole, string> = {
        elderly: 'http://localhost:5173',
        family: 'http://localhost:5174',
        nurse: 'http://localhost:5175',
        admin: 'http://localhost:5176'
      };

      const redirectPath = roleRedirectMap[currentRole] || '/login';

      // 如果是跨应用重定向，使用window.location
      if (redirectPath.startsWith('http')) {
        window.location.href = redirectPath;
        return null;
      }

      return <Navigate to={redirectPath} replace />;
    }
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