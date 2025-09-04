import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthService } from "../services/auth.service";
import { PrivateRoute } from "../components/PrivateRoute";
import { Login, Register } from "@smart-aging/packages";
// 老人端页面
import Layout from "../pages/Layout";
import Emergency from "../pages/Emergency";
import Orders from "../pages/Orders";
import Profile from "../pages/Profile";
import Message from "../pages/Message";
import Heath from "../pages/Health";
import Chat from "../pages/Chat";
import Community from "../pages/Community";
import Publish from "../pages/Publish";

// 根路由重定向组件
const RootRedirect: React.FC = () => {
  const isLoggedIn = AuthService.isLoggedIn();
  const currentRole = AuthService.getCurrentRole();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (currentRole === "elderly") {
    return <Navigate to="/home" replace />;
  }

  // 其他角色或异常情况，统一跳转登录页
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
          <PrivateRoute requiredRoles={["elderly"]}>
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
      </Route>
      <Route path="chat/:id" element={<Chat />} />
      <Route path="health" element={<Heath />} />
      <Route path="publish" element={<Publish />} />

      {/* 404页面 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default ElderlyRoutes;
