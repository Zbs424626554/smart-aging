import React from "react";
import { ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";
import zhCN from "antd/locale/zh_CN";
import ElderlyRoutes from "./routes/ElderlyRoutes";
import MedicationReminder from "./components/MedicationReminder";
// import AppContent from './routes';
import "./App.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <>
          <MedicationReminder />
          <ElderlyRoutes />
        </>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default App;
