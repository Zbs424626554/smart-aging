import React from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { BrowserRouter } from "react-router-dom";
import FamilyRoutes from "./routes/FamilyRoutes";
import "./App.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <FamilyRoutes />
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
