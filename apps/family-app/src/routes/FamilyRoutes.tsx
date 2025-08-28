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

// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const currentRole = AuthService.getCurrentRole();

  useEffect(() => {
    AuthService.isLoggedIn().then(setIsLoggedIn);
  }, []);

  if (isLoggedIn === null) return null; // loading
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (currentRole === "family") return <Navigate to="/home" replace />;
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
