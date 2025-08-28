import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const SupportTickets: React.FC = () => {
  return (
    <div>
      <Title level={2}>客服工单</Title>
      <p>在此页面管理用户提交的客服工单和请求。</p>
    </div>
  );
};

export default SupportTickets; 