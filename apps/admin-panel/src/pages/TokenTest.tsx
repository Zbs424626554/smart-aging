import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Alert, Descriptions } from 'antd';
import { TokenManager } from '../utils/TokenManager';
import { AuthService } from '../services/AuthService';

const { Title, Text } = Typography;

const TokenTest: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshTokenInfo = () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const payload = TokenManager.getTokenPayload(token);
      const isExpired = TokenManager.isTokenExpired(token);
      const isExpiringSoon = TokenManager.isTokenExpiringSoon(token);
      const isValidFormat = TokenManager.isValidTokenFormat(token);
      
      setTokenInfo({
        token: token.substring(0, 20) + '...',
        payload,
        isExpired,
        isExpiringSoon,
        isValidFormat,
        expiresAt: payload?.exp ? new Date(payload.exp * 1000).toLocaleString() : '未知',
        issuedAt: payload?.iat ? new Date(payload.iat * 1000).toLocaleString() : '未知'
      });
    } else {
      setTokenInfo(null);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const success = await TokenManager.refreshAccessToken();
      if (success) {
        refreshTokenInfo();
        alert('令牌刷新成功！');
      } else {
        alert('令牌刷新失败！');
      }
    } catch (error) {
      console.error('刷新令牌时出错:', error);
      alert('刷新令牌时出错');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearTokens = () => {
    TokenManager.clearAllTokens();
    setTokenInfo(null);
    alert('所有令牌已清除');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setTokenInfo(null);
    alert('已登出');
  };

  useEffect(() => {
    refreshTokenInfo();
    const interval = setInterval(refreshTokenInfo, 5000); // 每5秒更新一次
    return () => clearInterval(interval);
  }, []);

  if (!AuthService.isLoggedIn()) {
    return (
      <Card>
        <Alert 
          message="请先登录" 
          description="您需要先登录才能查看令牌信息" 
          type="warning" 
          showIcon 
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>令牌管理测试页面</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="操作按钮">
          <Space>
            <Button onClick={refreshTokenInfo}>刷新信息</Button>
            <Button 
              type="primary" 
              loading={refreshing}
              onClick={handleRefreshToken}
            >
              手动刷新令牌
            </Button>
            <Button danger onClick={handleClearTokens}>
              清除所有令牌
            </Button>
            <Button onClick={handleLogout}>
              登出
            </Button>
          </Space>
        </Card>

        {tokenInfo ? (
          <Card title="访问令牌信息">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="令牌片段">
                <Text code>{tokenInfo.token}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="格式有效性">
                {tokenInfo.isValidFormat ? 
                  <Text type="success">有效</Text> : 
                  <Text type="danger">无效</Text>
                }
              </Descriptions.Item>
              <Descriptions.Item label="过期状态">
                {tokenInfo.isExpired ? 
                  <Text type="danger">已过期</Text> : 
                  <Text type="success">未过期</Text>
                }
              </Descriptions.Item>
              <Descriptions.Item label="即将过期">
                {tokenInfo.isExpiringSoon ? 
                  <Text type="warning">是（5分钟内）</Text> : 
                  <Text type="success">否</Text>
                }
              </Descriptions.Item>
              <Descriptions.Item label="颁发时间">
                {tokenInfo.issuedAt}
              </Descriptions.Item>
              <Descriptions.Item label="过期时间">
                {tokenInfo.expiresAt}
              </Descriptions.Item>
              <Descriptions.Item label="用户ID">
                {tokenInfo.payload?.id || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="用户角色">
                {tokenInfo.payload?.role || '未知'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ) : (
          <Card>
            <Alert 
              message="没有访问令牌" 
              description="当前没有有效的访问令牌" 
              type="info" 
              showIcon 
            />
          </Card>
        )}

        <Card title="说明">
          <ul>
            <li>此页面用于测试令牌管理功能</li>
            <li>信息每5秒自动更新一次</li>
            <li>当令牌在5分钟内过期时，API请求会自动触发后台刷新</li>
            <li>当令牌已过期时，API请求会尝试刷新令牌</li>
            <li>如果刷新失败，会自动跳转到登录页面</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
};

export default TokenTest;
