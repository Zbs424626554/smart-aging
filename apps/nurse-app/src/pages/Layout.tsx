import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Badge, TabBar } from "antd-mobile";
import { UserOutline, MessageOutline, TextOutline } from "antd-mobile-icons";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    {
      key: "/home",
      title: "首页",
      icon: <HomeOutlined />,
      badge: Badge.dot,
    },
    {
      key: "/home/orders",
      title: "订单",
      icon: <TextOutline />,
      badge: "5",
    },
    {
      key: "/home/message",
      title: "消息",
      icon: <MessageOutline />,
      badge: "99+",
    },
    {
      key: "/home/profile",
      icon: <UserOutline />,
      title: "我的",
    },
  ];
  const [activeKey, setActiveKey] = useState(location.pathname);

  const jumpPage = (e: string) => {
    setActiveKey(e);
    navigate(e);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative",
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: "auto",
          paddingBottom: "50px", // 为TabBar留出空间
        }}
      >
        <Outlet />
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: "#fff",
          borderTop: "1px solid #f0f0f0",
        }}
      >
        <TabBar
          activeKey={activeKey}
          onChange={(e: string) => {
            jumpPage(e);
          }}
        >
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  );
}
