import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const NotAuthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="无权访问"
      subTitle="抱歉，您没有权限访问此页面。"
      extra={
        <Button type="primary" onClick={() => navigate('/dashboard')}>
          返回仪表盘
        </Button>
      }
    />
  );
};

export default NotAuthorized; 