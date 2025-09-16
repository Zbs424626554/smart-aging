import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthService } from "../services/auth.service";
import { PrivateRoute } from "../components/PrivateRoute";
import { Login, Register } from "@smart-aging/packages";

// 家属端页面
import Layout from "../pages/Layout";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Elderly from "../pages/Elderly";
import ElderlyDetail from "../pages/ElderlyDetail";
import HealthReport from "../pages/HealthReport";
import Health from "../pages/Health";
import Orders from "../pages/Orders";
import Warnings from "../pages/Warnings";
import Nurses from "../pages/Nurses";
import Payment from "../pages/Payment";
import Refund from "../pages/Refund";
import Message from "../pages/Message";
import Chat from "../pages/Chat";
import Gozhifu from "../pages/Gozhifu";
import Donezhifu from "../pages/Donezhifu";

// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [resolvedRole, setResolvedRole] = useState<string | null>(AuthService.getCurrentRole());

  useEffect(() => {
    const checkLogin = async () => {
      const expectedRole = "family";

      // 1) 读取 URL 中的 ssoToken，先解析角色再决定是否写入本地
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const ssoToken = url.searchParams.get('ssoToken');
        if (ssoToken) {
          try {
            const payloadBase64 = ssoToken.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
            const payload = payloadBase64 ? JSON.parse(atob(payloadBase64)) : null;
            if (payload?.role === expectedRole) {
              localStorage.setItem('token', ssoToken);
              localStorage.setItem('userRole', payload.role);
              setResolvedRole(payload.role);
            } else {
              // 角色与当前端不匹配：清理并要求重新登录
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userInfo');
              setIsLoggedIn(false);
              url.searchParams.delete('ssoToken');
              window.history.replaceState(null, '', url.toString());
              return;
            }
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userInfo');
            setIsLoggedIn(false);
            url.searchParams.delete('ssoToken');
            window.history.replaceState(null, '', url.toString());
            return;
          }
          url.searchParams.delete('ssoToken');
          window.history.replaceState(null, '', url.toString());
        }
      }

      // 2) 若本地已有 token，解码校验角色
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
          const payload = payloadBase64 ? JSON.parse(atob(payloadBase64)) : null;
          if (payload?.role) {
            if (payload.role !== expectedRole) {
              // 跨端残留：清理并回登录
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userInfo');
              setIsLoggedIn(false);
              return;
            }
            localStorage.setItem('userRole', payload.role);
            setResolvedRole(payload.role);
          }
        } catch {
          // token 异常同样视为未登录
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userInfo');
          setIsLoggedIn(false);
          return;
        }
        // 视为已登录，但继续请求 profile 以刷新 userInfo，避免沿用旧数据
        setIsLoggedIn(true);
      }

      try {
        const res: any = await AuthService.getProfile();
        if ((res?.code === 200) || (res?.data && (res as any).status === 200)) {
          const user = (res.data?.user) || (res.data);
          if (user?.role === expectedRole) {
            localStorage.setItem('userRole', user.role);
            setResolvedRole(user.role);
            if (user) localStorage.setItem('userInfo', JSON.stringify(user));
            setIsLoggedIn(true);
          } else {
            // 服务端返回的角色也不匹配，清理并回登录
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userInfo');
            setIsLoggedIn(false);
          }
        } else if (!token) {
          setIsLoggedIn(false);
        }
      } catch {
        if (!token) setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  if (isLoggedIn === null) return null; // loading
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  // 仅当解析到本端角色时才进入首页
  if (resolvedRole === "family") return <Navigate to="/home" replace />;
  return <Navigate to="/login" replace />;
};

// 家属端路由组件
const FamilyRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 公共路由 - 使用共享的认证页面 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* 根路径重定向 */}
      <Route path="/" element={<RootRedirect />} />

      {/* 家属端主布局路由 */}
      <Route
        path="/home"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* 首页 - 默认路由 */}
        <Route index element={<Home />} />

        {/* 主要标签页路由 */}
        <Route path="health" element={<Health />} />
        <Route path="nurses" element={<Nurses />} />
        <Route path="gozhifu" element={<Gozhifu />} />
        <Route path="donezhifu" element={<Donezhifu />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payment" element={<Payment />} />
        <Route path="refund" element={<Refund />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 一级路由页面 */}
      <Route
        path="/elderly"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <Elderly />
          </PrivateRoute>
        }
      />
      <Route
        path="/message"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <Message />
          </PrivateRoute>
        }
      />
      <Route
        path="/chat/:id"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <Chat />
          </PrivateRoute>
        }
      />
      <Route
        path="/elderly/:id"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <ElderlyDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/elderly/:id/health-report"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <HealthReport />
          </PrivateRoute>
        }
      />
      <Route
        path="/warnings"
        element={
          <PrivateRoute requiredRoles={["family"]}>
            <Warnings />
          </PrivateRoute>
        }
      />

      {/* 404页面重定向到统一登录 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default FamilyRoutes;
