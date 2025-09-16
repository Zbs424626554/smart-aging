import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthService } from "../services/auth.service";
import { PrivateRoute } from "../components/PrivateRoute";
import { Login, Register } from "@smart-aging/packages";
// 老人端页面
import Layout from '../pages/Layout';
import Emergency from '../pages/Emergency';
import Orders from '../pages/Orders';
import Profile from '../pages/Profile';
import Message from "../pages/Message";
import Heath from "../pages/Health";
import Chat from "../pages/Chat";
import Community from "../pages/Community";
import Publish from "../pages/Publish";
import AddFriends from "../pages/AddFriends";

// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [resolvedRole, setResolvedRole] = useState<string | null>(AuthService.getCurrentRole());

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const expectedRole = "elderly";
        // 1) 优先处理 URL 携带的 ssoToken（跨端跳转时注入）
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const ssoToken = url.searchParams.get('ssoToken');
          if (ssoToken) {
            localStorage.setItem('token', ssoToken);
            try {
              const payloadBase64 = ssoToken.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
              if (payloadBase64) {
                const payload = JSON.parse(atob(payloadBase64));
                if (payload?.role) {
                  localStorage.setItem('userRole', payload.role);
                  setResolvedRole(payload.role);
                  // 若角色与本端不一致，则不再发 profile，避免写入他端 userInfo
                  if (payload.role !== expectedRole) {
                    localStorage.removeItem('userInfo');
                    // 视为已登录但角色不匹配，交由渲染分支跳回登录
                    setIsLoggedIn(true);
                    // 清理 URL 参数并提前返回
                    url.searchParams.delete('ssoToken');
                    window.history.replaceState(null, '', url.toString());
                    return;
                  }
                }
              }
            } catch { }
            // 清理 URL 参数
            url.searchParams.delete('ssoToken');
            window.history.replaceState(null, '', url.toString());
          }
        }

        // 2) 若本地已有 token，优先从 token 解出 role
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          try {
            const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
            if (payloadBase64) {
              const payload = JSON.parse(atob(payloadBase64));
              if (payload?.role) {
                localStorage.setItem('userRole', payload.role);
                setResolvedRole(payload.role);
                if (payload.role !== expectedRole) {
                  localStorage.removeItem('userInfo');
                  setIsLoggedIn(true);
                  return;
                }
              }
            }
          } catch { }
          // 立即视为登录，同时继续发起 profile 请求以写入 userInfo，避免沿用旧信息
          setIsLoggedIn(true);
        }
        const res: any = await AuthService.getProfile();
        if ((res?.code === 200) || (res?.data && (res as any).status === 200)) {
          // 服务端已识别登录（Cookie），视为已登录，并补写本地 userRole/userInfo
          const user = (res.data?.user) || (res.data);
          if (user?.role) {
            localStorage.setItem('userRole', user.role);
            setResolvedRole(user.role);
          }
          if (user) {
            localStorage.setItem('userInfo', JSON.stringify(user));
          }
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  if (isLoggedIn === null) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  // 仅当解析到本端角色时才进入首页，避免误判为其他端
  if (resolvedRole === "elderly") return <Navigate to="/home" replace />;
  return <Navigate to="/login" replace />;
};

// 老人端路由组件
const ElderlyRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 公共路由 - 使用共享的认证页面 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 根路径重定向 */}
      <Route path="/" element={<RootRedirect />} />

      {/* 老人端路由 */}
      <Route
        path="/home"
        element={
          <PrivateRoute requiredRoles={['elderly']}>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Emergency />} />
        <Route path="call" element={<Emergency />} />
        {/* <Route path="orders" element={<Orders />} /> */}
        <Route path="community" element={<Community />} />
        <Route path="message" element={<Message />} />
        <Route path="mine" element={<Profile />} />
        <Route path="health" element={<Heath />} />
      </Route>
      <Route path="chat/:id" element={<Chat />} />
      <Route path="health" element={<Heath />} />
      <Route path="publish" element={<Publish />} />
      <Route path="addFriends" element={<AddFriends />} />

      {/* 404页面 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default ElderlyRoutes; 