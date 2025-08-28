import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Config: React.FC = () => {
  return (
    <div>
      <Title level={2}>基础配置</Title>
      <p>在此页面管理系统基础配置和参数设置。</p>
    </div>
  );
};

export default Config; 