import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import PermissionDebugPanel from '../components/PermissionDebugPanel';

// 简化的Dashboard，移除TabPane以避免警告
const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟数据加载
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 权限调试面板 */}
      <PermissionDebugPanel />

      <Alert
        message="欢迎使用智慧养老管理系统"
        description="这里是系统总览页面，显示关键业务指标和数据概览。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 关键指标统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={2580}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="活跃护工"
              value={156}
              prefix={<UserOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="本月订单"
              value={892}
              prefix={<ShoppingCartOutlined />}
              suffix="单"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={125600}
              prefix={<DollarOutlined />}
              suffix="元"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据图表 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="用户分布" variant="borderless">
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <TrophyOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: 16 }} />
                <div>用户分布图表</div>
                <div style={{ color: '#666', fontSize: '12px' }}>图表组件加载中...</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="订单状态分布" variant="borderless">
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <ShoppingCartOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
                <div>订单分布图表</div>
                <div style={{ color: '#666', fontSize: '12px' }}>图表组件加载中...</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 系统健康状态 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="系统状态" variant="borderless">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>服务器性能</div>
                  <Progress percent={85} status="active" />
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>数据库连接</div>
                  <Progress percent={92} />
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>API响应时间</div>
                  <Progress percent={78} />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;