import React, { useEffect } from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter, useNavigate } from "react-router-dom";
import FamilyRoutes from "./routes/FamilyRoutes";
import "./App.css";
import WebSocketService from "./services/websocket.service";

const WsBootstrap: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // 统一的回调引用，便于移除监听
    const handleInvite = (data: any) => {
      // 这里的回调收到的是 message.data，而不是完整的 message
      console.log('[App] call_invite received:', data);
      const cid = data?.conversationId;
      if (cid) {
        const alertId = data?.alertId || "";
        navigate(`/chat/${cid}?call=1&alertId=${alertId}`);
      } else {
        console.warn('[App] call_invite missing conversationId');
      }
    };

    try {
      const user = JSON.parse(localStorage.getItem("userInfo") || "null");
      const username = user?.username;
      if (!username) return;
      WebSocketService.addEventListener("call_invite", handleInvite);
      void WebSocketService.connect(username);
    } catch { }
    return () => {
      try {
        WebSocketService.removeEventListener("call_invite", handleInvite);
      } catch { }
    };
  }, [navigate]);
  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <WsBootstrap />
        <FamilyRoutes />
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
