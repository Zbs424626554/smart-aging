import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom'

// import AppRouter from './routes';
import NurseRoutes from './routes/NurseRoutes';
import './App.css';

const App: React.FC = () => {
  return (
      <ConfigProvider locale={zhCN}>
        <NurseRoutes />
      </ConfigProvider>
  );
};

export default App;
