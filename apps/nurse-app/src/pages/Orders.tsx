import React, { useState, useEffect, useRef } from 'react';
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
  Empty,
  Spin
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
  status: UiOrderStatus;
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
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [myOrders, setMyOrders] = useState<ServiceOrder[]>([]);
  // const [searchText] = useState('');
  // const [selectedSkills] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');


  // 百度地图导航（JS SDK 交互式地图，脚本在 index.html 中注入）
  const [mapVisible, setMapVisible] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [navOrder, setNavOrder] = useState<ServiceOrder | null>(null);
  const mapRef = useRef<any>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const lastViewportPointsRef = useRef<any[] | null>(null);
  const navOriginRef = useRef<{ lng: number; lat: number } | null>(null);
  const navDestinationRef = useRef<{ lng: number; lat: number } | null>(null);
  const [navUrl, setNavUrl] = useState<string>('');
  // 安全区域相关
  const [safetyRadius] = useState<number>(500); // 米
  const safetyCircleRef = useRef<any>(null);
  const currentMarkerRef = useRef<any>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const hasAlertedRef = useRef<boolean>(false);

  const handleStartNavigation = () => {
    if (!navUrl) {
      message.error('导航链接生成失败');
      return;
    }
    console.log('开始导航点击:', navUrl);
    // 优先尝试通过锚点打开，兼容更多浏览器策略
    try {
      const a = document.createElement('a');
      a.href = navUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    } catch { }
    // 退化到 window.open
    try {
      const newWin = window.open(navUrl, '_blank');
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        // 可能被拦截，回退到当前页打开
        window.location.href = navUrl;
      }
    } catch {
      window.location.href = navUrl;
    }
  };

  const getBaiduAkFromPage = (): string | null => {
    try {
      const scripts = Array.from(document.getElementsByTagName('script')) as HTMLScriptElement[];
      for (const s of scripts) {
        const src = s.getAttribute('src') || '';
        if (src.includes('api.map.baidu.com/api')) {
          const url = new URL(src, window.location.origin);
          const ak = url.searchParams.get('ak');
          if (ak) return ak;
        }
      }
    } catch { }
    return null;
  };

  // 打开导航 modal，并在 Modal 渲染后初始化地图
  const openNavigation = async (order: ServiceOrder) => {
    setNavOrder(order);
    setMapVisible(true);
  };

  // 初始化地图与驾车路线
  useEffect(() => {
    const initMap = async () => {
      if (!mapVisible || !navOrder || !mapContainerRef.current) return;

      // 检查百度地图是否可用，如果不可用则尝试重新加载
      if (!(window as any).BMapGL) {
        console.log('BMapGL 未加载，尝试重新加载百度地图脚本...');

        // 尝试重新加载百度地图脚本
        const loadBaiduMap = () => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://api.map.baidu.com/api?v=1.0&type=webgl&ak=uVqZ5HJnmnA95xhBUo4fCUl2M4Pji7Ky';
            script.onload = () => {
              console.log('百度地图脚本重新加载成功');
              resolve(true);
            };
            script.onerror = () => {
              console.error('百度地图脚本重新加载失败');
              reject(new Error('地图脚本加载失败'));
            };
            document.head.appendChild(script);
          });
        };

        try {
          await loadBaiduMap();
          // 等待脚本执行
          await new Promise(resolve => setTimeout(resolve, 1000));

          if (!(window as any).BMapGL) {
            message.error('百度地图加载失败，请检查网络连接或刷新页面重试');
            setMapVisible(false);
            return;
          }
        } catch (error) {
          message.error('百度地图加载失败，请检查网络连接或刷新页面重试');
          setMapVisible(false);
          return;
        }
      }

      setMapLoading(true);
      try {
        // 确保 BMapGL 可用
        const BMapGL = (window as any).BMapGL;
        if (!BMapGL) {
          throw new Error('BMapGL 对象不可用');
        }
        const map = new BMapGL.Map(mapContainerRef.current);
        mapRef.current = map;

        // 原起点定位逻辑已移除，使用固定经纬度

        // 地址转坐标作为终点
        const getDestinationPoint = (order: ServiceOrder): Promise<any> => {
          return new Promise((resolve) => {
            // 若有经纬度优先使用
            if (order.lng != null && order.lat != null) {
              resolve(new BMapGL.Point(order.lng, order.lat));
              return;
            }
            const geocoder = new BMapGL.Geocoder();
            geocoder.getPoint(order.location, (point: any) => {
              resolve(point || null);
            }, order.city || '保定');
          });
        };

        // 固定起点坐标（lng, lat）- 若稍后拿到实时定位会替换
        let origin = new BMapGL.Point(115.488818, 38.814838);
        let destination = await getDestinationPoint(navOrder);

        // 地图初始化视野
        if (destination) {
          map.centerAndZoom(destination, 13);
        } else {
          const cityName = navOrder.city || '保定';
          const localCity = new BMapGL.LocalCity();
          // 回退到城市级定位，如果也失败再默认北京
          await new Promise<void>((resolve) => {
            try {
              localCity.get((result: any) => {
                try {
                  const name = result?.name || cityName;
                  map.centerAndZoom(name, 12);
                } catch {
                  map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
                }
                resolve();
              });
            } catch {
              map.centerAndZoom(new BMapGL.Point(116.404, 39.915), 12);
              resolve();
            }
          });
          message.warning('无法获取目标位置坐标，已回退到城市视图');
        }
        map.enableScrollWheelZoom(true);

        // 添加起终点标注并区分样式
        if (origin) {
          const startMarker = new BMapGL.Marker(origin);
          map.addOverlay(startMarker);
          // 提前记录起点坐标，避免 label 渲染异常导致坐标缺失
          try { navOriginRef.current = { lng: origin.lng, lat: origin.lat }; } catch { }
          try {
            const startLabel = new BMapGL.Label('起点', { position: origin, offset: new BMapGL.Size(10, -20) });
            startLabel.setStyle({ color: '#1677ff', fontSize: '12px', backgroundColor: 'transparent', border: 'none' });
            map.addOverlay(startLabel);
            const startCircle = new BMapGL.Circle(origin, 30, { strokeColor: '#1677ff', strokeWeight: 2, strokeOpacity: 0.7, fillColor: '#1677ff', fillOpacity: 0.3 });
            map.addOverlay(startCircle);
          } catch { }
        }
        if (destination) {
          const endMarker = new BMapGL.Marker(destination);
          map.addOverlay(endMarker);
          // 提前记录终点坐标
          try { navDestinationRef.current = { lng: destination.lng, lat: destination.lat }; } catch { }
          try {
            const endLabel = new BMapGL.Label('终点', { position: destination, offset: new BMapGL.Size(10, -20) });
            endLabel.setStyle({ color: '#ff4d4f', fontSize: '12px', backgroundColor: 'transparent', border: 'none' });
            map.addOverlay(endLabel);
          } catch { }

          // 绘制安全区域圆形
          try {
            const circle = new BMapGL.Circle(destination, safetyRadius, {
              strokeColor: '#1677ff',
              strokeWeight: 2,
              strokeOpacity: 0.9,
              fillColor: '#1677ff',
              fillOpacity: 0.2
            });
            map.addOverlay(circle);
            safetyCircleRef.current = circle;
          } catch { }
        }

        // 规划驾车路线


        // 固定起点，不进行偏差修正

        if (origin && destination && typeof BMapGL.DrivingRoute === 'function') {
          const driving = new BMapGL.DrivingRoute(map, {
            renderOptions: { map, autoViewport: true },
          });
          driving.search(origin, destination);
          lastViewportPointsRef.current = [origin, destination];
        } else if (origin && destination) {
          // 不支持 DrivingRoute 时，用直线作为简易路径提示
          try {
            const line = new BMapGL.Polyline([origin, destination], { strokeColor: '#1677ff', strokeWeight: 6, strokeOpacity: 0.8 });
            map.addOverlay(line);
            map.setViewport([origin, destination]);
            lastViewportPointsRef.current = [origin, destination];
            message.warning('当前环境不支持驾车路线规划，已显示起终点连线');
          } catch {
            message.warning('当前环境不支持驾车路线规划，已仅显示起终点');
          }
        }

        // 防止 Modal 打开时容器尺寸变化导致瓦片空白：强制触发一次 resize 并恢复视野
        requestAnimationFrame(() => {
          try {
            mapRef.current?.resize?.();
            if (lastViewportPointsRef.current) {
              mapRef.current?.setViewport(lastViewportPointsRef.current);
            }
          } catch { }
        });

        // 启动地理围栏监控：监听护士当前位置是否超出安全区域
        try {
          hasAlertedRef.current = false;
          if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
              (pos) => {
                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;
                const cur = new BMapGL.Point(lng, lat);
                // 记录并更新“我的位置”标注
                try { navOriginRef.current = { lng, lat }; } catch { }
                if (currentMarkerRef.current) {
                  try { currentMarkerRef.current.setPosition(cur); } catch { }
                } else {
                  try {
                    const m = new BMapGL.Marker(cur);
                    map.addOverlay(m);
                    const label = new BMapGL.Label('我的位置', { position: cur, offset: new BMapGL.Size(10, -20) });
                    label.setStyle({ color: '#1677ff', fontSize: '12px', backgroundColor: 'transparent', border: 'none' });
                    map.addOverlay(label);
                    currentMarkerRef.current = m;
                  } catch { }
                }

                // 计算与目的地距离
                try {
                  if (navDestinationRef.current && typeof map.getDistance === 'function') {
                    const dist = map.getDistance(cur, new BMapGL.Point(navDestinationRef.current.lng, navDestinationRef.current.lat));
                    // 超出安全半径则报警
                    if (dist > safetyRadius && !hasAlertedRef.current) {
                      hasAlertedRef.current = true;
                      try {
                        import('../services/emergency.service').then(async (mod) => {
                          try {
                            const res = await mod.EmergencyService.initiate();
                            const alertId = res.alertId;
                            await mod.EmergencyService.commit(alertId, {
                              location: { type: 'Point', coordinates: [lng, lat] }
                            } as any);
                            message.warning('已离开安全区域，已自动发出报警');
                          } catch {
                            message.error('离开安全区域，报警失败');
                          }
                        });
                      } catch { }
                    }
                  }
                } catch { }
              },
              () => { /* ignore error */ },
              { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
            );
            geoWatchIdRef.current = watchId as unknown as number;
          }
        } catch { }

        // 生成“开始导航”URL（外部页面 turn-by-turn）
        try {
          const ak = getBaiduAkFromPage();
          if (!ak) {
            setNavUrl('');
          } else {
            const region = encodeURIComponent(navOrder.city || '保定');
            const originName = 'name:%E6%88%91%E7%9A%84%E4%BD%8D%E7%BD%AE';
            let originParam = originName;
            let destinationParam = `name:${encodeURIComponent(navOrder.location)}`;
            if (navOriginRef.current) {
              originParam = `latlng:${navOriginRef.current.lat},${navOriginRef.current.lng}|name:%E6%88%91%E7%9A%84%E4%BD%8D%E7%BD%AE`;
            }
            if (navDestinationRef.current) {
              const d = navDestinationRef.current;
              destinationParam = `latlng:${d.lat},${d.lng}|name:${encodeURIComponent(navOrder.location)}`;
            }
            const url = `https://api.map.baidu.com/direction?origin=${originParam}&destination=${destinationParam}&mode=driving&region=${region}&output=html&src=elder-care&ak=${ak}`;
            setNavUrl(url);
            try { console.log('导航URL:', url); } catch { }
          }
        } catch {
          setNavUrl('');
        }
      } catch (e) {
        console.error('初始化地图失败: ', e);
        message.error('初始化地图失败');
      } finally {
        setMapLoading(false);
      }
    };

    initMap();
    // 清理函数：关闭时移除内部覆盖物（Map实例会被回收）
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.clearOverlays?.();
        }
      } catch (e) {
        // ignore
      }
      mapRef.current = null;
      setMapLoading(false);
      // 移除地理围栏监听
      try {
        if (geoWatchIdRef.current != null && navigator.geolocation) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
      } catch { }
    };
  }, [mapVisible, navOrder]);

  // 浏览器窗口变化时，触发地图 resize 防止产生空白
  useEffect(() => {
    const onResize = () => {
      try {
        mapRef.current?.resize?.();
        if (lastViewportPointsRef.current) {
          mapRef.current?.setViewport(lastViewportPointsRef.current);
        }
      } catch { }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 检测网络状态
  useEffect(() => {
    const checkNetworkStatus = () => {
      if (!navigator.onLine) {
        message.warning('网络连接已断开，地图功能可能无法正常使用');
      }
    };

    window.addEventListener('online', () => message.success('网络连接已恢复'));
    window.addEventListener('offline', checkNetworkStatus);

    // 初始检查
    checkNetworkStatus();

    return () => {
      window.removeEventListener('online', () => message.success('网络连接已恢复'));
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

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
      status: o.uiStatus,
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
      const mine = (mineRes.data || []).map(mapServerOrder);
      setMyOrders(mine);
    } catch (e) {
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
            // 从附近订单中移除并加入我的订单
            const mapped = mapServerOrder(res.data);
            setOrders(prev => prev.filter(order => order.id !== orderId));
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
        // 在更新前获取当前订单信息用于导航
        const currentOrder = myOrders.find(order => order.id === orderId) || orders.find(order => order.id === orderId);

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

            if (newStatus === 'processing' && currentOrder) {
              openNavigation(currentOrder);
            }
          })
          .catch(() => { });
      }
    });
  };





  // 筛选我的订单
  const filteredMyOrders = myOrders.filter((order) => {
    const statusValue = (order.status as unknown as string);
    switch (activeTab) {
      case 'pending':
        return order.status === 'assigned' || statusValue === 'pending';
      case 'progress':
        return order.status === 'processing' || statusValue === 'progress';
      case 'completed':
        return order.status === 'completed';
      default:
        return true;
    }
  });

  const renderOrderCard = (order: ServiceOrder, isMyOrder: boolean = false) => {
    const statusColor = order.status === 'assigned' ? 'blue' : order.status === 'processing' ? 'orange' : order.status === 'completed' ? 'green' : 'red';
    const statusLabel = order.status === 'assigned' ? '待接受' : order.status === 'processing' ? '进行中' : order.status === 'completed' ? '已完成' : '已取消';

    return (
      <div style={{
        background: 'white',
        borderRadius: 16,
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
            {isMyOrder && order.status === 'processing' && (
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
          <TabPane tab="待接受" key="pending">
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

      {/* 地图导航 */}
      <Modal
        title={null}
        open={mapVisible}
        onCancel={() => setMapVisible(false)}
        footer={null}
        width="100%"
        style={{ top: 0, paddingBottom: 0 }}
        styles={{ body: { padding: 0 } as any, content: { padding: 0 } as any }}
        rootClassName="baidu-fullscreen-modal"
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => {
              try {
                mapRef.current?.resize?.();
                if (lastViewportPointsRef.current) {
                  mapRef.current?.setViewport(lastViewportPointsRef.current);
                }
              } catch { }
            }, 50);
          }
        }}
      >
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100dvh', overflow: 'hidden' }}>
          {mapLoading && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.6)', zIndex: 2
            }}>
              <Spin tip="加载地图中..." />
            </div>
          )}
          {/* 为底部操作栏预留固定高度，避免覆盖地图 */}
          <div ref={mapContainerRef} style={{ width: '100%', height: 'calc(100% - 88px)' }} />
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 88,
              padding: '12px 16px', background: '#fff', zIndex: 3, borderTop: '1px solid #f0f0f0'
            }}
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={(e) => { e.stopPropagation(); }}
          >
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
              <Button type="primary" size="large" style={{ minWidth: 160 }} disabled={!navUrl} onClick={handleStartNavigation}>开始导航</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Orders; 