import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const Income: React.FC = () => {
  return (
    <div>
      <Title level={2}>收入统计</Title>
      <Card>
        <p>收入统计页面，具体功能待开发...</p>
      </Card>
    </div>
  );
};

export default Income; 