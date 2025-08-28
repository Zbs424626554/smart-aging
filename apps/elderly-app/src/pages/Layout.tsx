import React from "react";
import { TabBar } from "antd-mobile";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppOutline,
  UnorderedListOutline,
  MessageOutline,
  UserOutline,
} from "antd-mobile-icons";

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { key: "/home/call", title: "呼叫", icon: <AppOutline /> },
    { key: "/home/orders", title: "订单", icon: <UnorderedListOutline /> },
    { key: "/home/message", title: "消息", icon: <MessageOutline /> },
    { key: "/home/mine", title: "我的", icon: <UserOutline /> },
  ];

  const currentKey =
    tabs.find((t) => location.pathname.startsWith(t.key))?.key || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1, overflow: "auto", paddingBottom: "1.36rem" }}>
        <Outlet />
      </div>
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: "1px solid #000",
          background: "#000",
        }}
      >
        <TabBar
          style={{ height: "1.36rem", background: "#000" }}
          safeArea
          activeKey={currentKey}
          onChange={(key) => navigate(key)}
        >
          {tabs.map((item) => (
            <TabBar.Item
              key={item.key}
              icon={
                <div
                  style={{
                    fontSize: "0.52rem",
                    color: currentKey === item.key ? "#ff4d4f" : "#fff",
                  }}
                >
                  {item.icon}
                </div>
              }
              title={
                <span
                  style={{
                    fontSize: "0.38rem",
                    fontWeight: 700,
                    color: currentKey === item.key ? "#ff4d4f" : "#fff",
                    marginTop: "0.08rem",
                    display: "inline-block",
                  }}
                >
                  {item.title}
                </span>
              }
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default Layout;
