import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/AuthService';
import { canAccessRoute } from '../config/permissions';
import { Spin } from 'antd';

// 认证状态接口
interface AuthState {
  isAuthenticated: boolean;
  setAuthStatus: (status: boolean) => void;
}

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  authState: AuthState;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRoles = [],
  authState
}) => {
  const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated } = authState;
  
  useEffect(() => {
    // 防止循环重定向
    const redirectAttempt = sessionStorage.getItem('route_redirect_attempt');
    let attempts = 0;
    
    if (redirectAttempt) {
      attempts = parseInt(redirectAttempt, 10);
      if (attempts > 3) {
        console.warn('检测到可能的重定向循环，强制授权访问');
        sessionStorage.removeItem('route_redirect_attempt');
        setStatus('authorized');
        return;
      }
      sessionStorage.setItem('route_redirect_attempt', (attempts + 1).toString());
    } else {
      sessionStorage.setItem('route_redirect_attempt', '1');
    }
    
    // 使用一个标志来防止组件卸载后的状态更新
    let isMounted = true;
    
    const checkAuth = () => {
      try {
        // 检查是否已登录
        if (!isAuthenticated) {
          if (isMounted) {
            setRedirectTo('/login');
            setStatus('unauthorized');
          }
          return;
        }
        
        const currentRole = AuthService.getCurrentRole();
        // 仅做登录与角色基本校验，不再做页面级拦截
        if (requiredRoles.length > 0 && !requiredRoles.includes(currentRole || '')) {
          if (isMounted) {
            setRedirectTo('/');
            setStatus('unauthorized');
          }
          return;
        }

        // 通过检查，授权访问
        if (isMounted) {
          setStatus('authorized');
          // 清除重定向计数
          sessionStorage.removeItem('route_redirect_attempt');
        }
      } catch (error) {
        console.error('权限检查出错:', error);
        if (isMounted) {
          setRedirectTo('/login');
          setStatus('unauthorized');
        }
      }
    };
    
    // 延迟检查，避免闪烁
    const timer = setTimeout(checkAuth, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [location.pathname, requiredRoles, isAuthenticated]);
  
  if (status === 'checking') {
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
          <div style={{ marginTop: 16 }}>加载中...</div>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthorized' && redirectTo) {
    // 清除重定向计数，避免在目标页面继续计数
    sessionStorage.removeItem('route_redirect_attempt');
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }
  
  return <>{children}</>;
}; 