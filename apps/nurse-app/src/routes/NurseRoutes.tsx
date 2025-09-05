import React from "react";
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
import Healthce from "../pages/Healthce";
// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const isLoggedIn = AuthService.isLoggedIn();
  const currentRole = AuthService.getCurrentRole();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole === "nurse") {
    return <Navigate to="/home" replace />;
  }

  // 其他角色或异常情况，统一跳转登录页
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
        <Route path="healthce" element={<Healthce />} />
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
