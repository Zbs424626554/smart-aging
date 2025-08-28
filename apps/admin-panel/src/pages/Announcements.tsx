import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const Announcements: React.FC = () => {
  return (
    <div>
      <Title level={2}>内容管理</Title>
      <p>在此页面管理系统公告、新闻和其他内容。</p>
    </div>
  );
};

export default Announcements; 