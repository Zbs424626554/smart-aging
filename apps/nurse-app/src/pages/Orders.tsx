import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Tag,
  Space,
  // Avatar,
  // Badge,
  Tabs,
  // Input,
  // Select,
  message,
  Modal,
  Divider,
  Empty
} from 'antd';
// 评价系统已移除
import {
  EnvironmentOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { OrderService } from '../services/order.service.ts';
import type { UiOrderStatus, OrderRecord } from '../services/order.service.ts';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
// const { Search } = Input;
const { TabPane } = Tabs;

interface ServiceOrder {
  id: string;
  title: string;
  location: string;
  distance: number;
  price: number;
  duration: string;
  skills: string[];
  elderlyInfo: {
    name: string;
    age: number;
    gender: string;
    avatar?: string;
  };
  familyInfo: {
    name: string;
    phone: string;
    rating: number;
  };
  // 后端返回的真实状态：published | assigned | in_progress | completed | cancelled
  // 为兼容历史前端状态（processing），此处使用 string
  status: string;
  createdAt: string;
  urgent: boolean;
  completedAt?: string;
  canRate?: boolean;
  hasRated?: boolean;
  // 可选：若后端提供经纬度/城市，优先使用，避免地理编码不确定性
  lng?: number;
  lat?: number;
  city?: string;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [myOrders, setMyOrders] = useState<ServiceOrder[]>([]);
  // const [searchText] = useState('');
  // const [selectedSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');


  // 已移除地图与导航模块

  // 将后端订单映射到前端展示结构
  const mapServerOrder = (o: OrderRecord): ServiceOrder => {
    // address 支持三种结构：string | { formatted } | { city, district, ... }
    let address = '' as string;
    const rawAddr: any = (o as any).address;
    if (typeof rawAddr === 'string') {
      address = rawAddr;
    } else if (rawAddr && typeof rawAddr === 'object') {
      address = rawAddr.formatted || [rawAddr.province, rawAddr.city, rawAddr.district]
        .filter(Boolean)
        .join('');
    }
    if (!address) address = '未填写地址';
    return {
      id: o.id || (o as any)._id || '',
      title: o.serviceName || '上门服务',
      location: address,
      distance: 0,
      price: o.price || 0,
      duration: o.duration != null ? `${o.duration}小时` : '—',
      skills: [],
      elderlyInfo: { name: o.userName || '客户', age: 0, gender: '—' },
      familyInfo: { name: o.userName || '客户', phone: '', rating: 5 },
      // 优先使用后端真实状态，其次回退到 uiStatus（兼容旧接口）
      status: (o.status as any) || (o.uiStatus as any),
      createdAt: o.orderTime ? new Date(o.orderTime).toLocaleString() : '',
      urgent: false,
      lng: (rawAddr?.location?.coordinates?.[0] as any),
      lat: (rawAddr?.location?.coordinates?.[1] as any),
      city: rawAddr?.city
    } as ServiceOrder;
  };

  // 远程加载订单（仅加载“我的订单”）
  const loadOrders = async () => {
    try {
      const mineRes = await OrderService.listMine();
      console.log('[Orders] listMine raw:', mineRes);
      const mine = (mineRes.data || []).map(mapServerOrder);
      setMyOrders(mine);
    } catch (e) {
      console.warn('[Orders] listMine failed:', e);
      // 忽略
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);


  const handleAcceptAssignment = (orderId: string) => {
    Modal.confirm({
      title: '确认接受派单',
      content: '平台为您分配了这个订单，是否接受？',
      onOk: () => {
        return OrderService.assignToMe(orderId)
          .then((res) => {
            // 加入我的订单
            const mapped = mapServerOrder(res.data);
            setMyOrders(prev => [...prev, mapped]);
            message.success('已接受派单！');
          })
          .catch(() => { });
      }
    });
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: UiOrderStatus) => {
    const statusText = newStatus === 'processing' ? '开始服务' : newStatus === 'completed' ? '完成服务' : '更新状态';
    Modal.confirm({
      title: `确认${statusText}`,
      content: `确定要${statusText}吗？`,
      onOk: () => {
        return OrderService.updateStatus(orderId, newStatus)
          .then(() => {
            const updatedData = newStatus === 'completed'
              ? {
                status: newStatus,
                completedAt: new Date().toISOString(),
                canRate: true,
                hasRated: false
              }
              : { status: newStatus };

            setMyOrders(prev => prev.map(order => order.id === orderId ? { ...order, ...updatedData } : order));
            message.success(`已${statusText}！`);
          })
          .catch(() => { });
      }
    });
  };





  // 筛选我的订单
  const filteredMyOrders = myOrders.filter((order) => {
    switch (activeTab) {
      case 'assigned':
        return order.status === 'assigned';
      case 'progress':
        // 进行中：后端为 in_progress，兼容旧前端 processing
        return order.status === 'in_progress' || order.status === 'processing';
      case 'completed':
        return order.status === 'completed';
      default:
        return true;
    }
  });

  const renderOrderCard = (order: ServiceOrder, isMyOrder: boolean = false) => {
    const isInProgress = order.status === 'in_progress' || order.status === 'processing';
    const statusColor = order.status === 'assigned' ? 'blue' : isInProgress ? 'orange' : order.status === 'completed' ? 'green' : 'red';
    const statusLabel = order.status === 'assigned' ? '待接受' : isInProgress ? '进行中' : order.status === 'completed' ? '已完成' : '已取消';

    return (
      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
        padding: 20,
        marginBottom: 16,
        border: order.urgent ? '2px solid #ff4d4f' : '1px solid #e8e8e8',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title level={4} style={{ margin: 0, color: '#262626' }}>{order.title}</Title>
            <Tag color="green" style={{ borderRadius: '6px' }}>派单</Tag>
            {order.urgent ? <Tag color="red" style={{ borderRadius: '6px' }}>紧急</Tag> : null}
          </div>
          <Tag color={statusColor} style={{ borderRadius: '6px', fontWeight: '500' }}>{statusLabel}</Tag>
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, cursor: 'default' }}
        >
          <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />
          <Text style={{ color: '#595959', fontSize: '14px' }}>{order.location}</Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
          <DollarOutlined style={{ color: 'red', fontSize: '16px' }} />
          <Text strong style={{ color: 'red', fontSize: '18px' }}>¥{order.price}</Text>
          <Text type="secondary" style={{ fontSize: '14px' }}>/天</Text>

        </div>

        <Divider style={{ margin: '20px 0', borderColor: '#f0f0f0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '14px', color: '#8c8c8c' }}>家属：{order.familyInfo.name}</Text>
            <br />
          </div>

          <Space size="small">
            {isMyOrder && (order.status === 'in_progress' || order.status === 'processing') && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                style={{ borderRadius: '8px', fontWeight: '500' }}
              >
                完成服务
              </Button>
            )}
            {!isMyOrder && (
              <Button
                type="primary"
                size="small"
                onClick={() => handleAcceptAssignment(order.id)}
                disabled={order.status !== 'assigned'}
                style={{ borderRadius: '8px', fontWeight: '500' }}
              >
                接受派单
              </Button>
            )}
            <Button
              size="small"
              onClick={() => navigate(`/home/orders/${order.id}`)}
              style={{ borderRadius: '8px', borderColor: '#d9d9d9' }}
            >
              查看详情
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '16px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <Title level={2} style={{ marginBottom: '24px', color: '#262626' }}>服务订单</Title>



      {/* 订单列表 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e8e8e8',
        overflow: 'hidden'
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          centered
          tabBarGutter={48}
          tabBarStyle={{ display: 'flex', justifyContent: 'center' }}
        >
          <TabPane tab="全部" key="all">
            {filteredMyOrders.length > 0 ? (
              <div style={{ padding: '16px' }} >
                {filteredMyOrders.map(order => (
                  <div key={order.id}>
                    {renderOrderCard(order, true)}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无我的订单"
                style={{ padding: '40px 16px' }}
              />
            )}
          </TabPane>
          <TabPane tab="待接受" key="assigned">
            {filteredMyOrders.length > 0 ? (
              <div style={{ padding: '16px' }} >
                {filteredMyOrders.map(order => (
                  <div key={order.id}>
                    {renderOrderCard(order, true)}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无我的订单"
                style={{ padding: '40px 16px' }}
              />
            )}
          </TabPane>
          <TabPane tab="进行中" key="progress">
            {filteredMyOrders.length > 0 ? (
              <div style={{ padding: '16px' }} >
                {filteredMyOrders.map(order => (
                  <div key={order.id}>
                    {renderOrderCard(order, true)}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无我的订单"
                style={{ padding: '40px 16px' }}
              />
            )}
          </TabPane>
          <TabPane tab="已完成" key="completed">
            {filteredMyOrders.length > 0 ? (
              <div style={{ padding: '16px' }} >
                {filteredMyOrders.map(order => (
                  <div key={order.id}>
                    {renderOrderCard(order, true)}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                description="暂无我的订单"
                style={{ padding: '40px 16px' }}
              />
            )}
          </TabPane>
        </Tabs>
      </div>

    </div>
  );
};

export default Orders; 