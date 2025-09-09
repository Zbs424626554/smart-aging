import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthService } from "../services/auth.service";
import { PrivateRoute } from "../components/PrivateRoute";
import { Login, Register } from "@smart-aging/packages";

// 护工端页面
import Layout from "../pages/Layout";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Certification from "../pages/Certification";
import Orders from "../pages/Orders";
import Income from "../pages/Income";
import Schedule from "../pages/Schedule";

import Message from "../pages/Message";
import Health from "../pages/Health";
import OrderDetail from "../pages/OrderDetail";
import Chat from "../pages/Chat";

// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [resolvedRole, setResolvedRole] = useState<string | null>(AuthService.getCurrentRole());

  useEffect(() => {
    const checkLogin = async () => {
      try {
        // 1) 读取 URL 中的 ssoToken 并写入本地
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const ssoToken = url.searchParams.get('ssoToken');
          if (ssoToken) {
            localStorage.setItem('token', ssoToken);
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
              if (payload?.role) { localStorage.setItem('userRole', payload.role); setResolvedRole(payload.role); }
            }
          } catch { }
          // 视为已登录，但继续请求 profile 以刷新 userInfo
          setIsLoggedIn(true);
        }
        const res: any = await AuthService.getProfile();
        if ((res?.code === 200) || (res?.data && (res as any).status === 200)) {
          const user = (res.data?.user) || (res.data);
          if (user?.role) { localStorage.setItem('userRole', user.role); setResolvedRole(user.role); }
          if (user) localStorage.setItem('userInfo', JSON.stringify(user));
          setIsLoggedIn(true);
        } else if (!token) {
          setIsLoggedIn(false);
        }
      } catch {
        if (!token) setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  if (isLoggedIn === null) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (resolvedRole === "nurse") return <Navigate to="/home" replace />;
  return <Navigate to="/login" replace />;
};

// 护工端路由组件
const NurseRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 公共路由 - 使用共享的认证页面 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 根路径重定向 */}
      <Route path="/" element={<RootRedirect />} />

      {/* 护工端路由 */}
      <Route
        path="/home"
        element={
          <PrivateRoute requiredRoles={["nurse"]}>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="certification" element={<Certification />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="income" element={<Income />} />
        <Route path="schedule" element={<Schedule />} />

        <Route path="message" element={<Message />} />
        <Route path="health" element={<Health />} />
      </Route>
      <Route
        path="/chat/:id"
        element={
          <PrivateRoute requiredRoles={["nurse"]}>
            <Chat />
          </PrivateRoute>
        }
      />

      {/* 404页面 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default NurseRoutes;
