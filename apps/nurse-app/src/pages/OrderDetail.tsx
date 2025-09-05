import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Space, Tag, Button, Spin, message, Modal } from 'antd';
import { EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { OrderService } from '../services/order.service';
import { MessageService } from '../services/message.service';
import type { OrderRecord, UiOrderStatus } from '../services/order.service';

const statusText: Record<UiOrderStatus, string> = {
    assigned: '待接受',
    processing: '进行中',
    completed: '已完成',
    cancelled: '已取消',
};

const statusColor: Record<UiOrderStatus, string> = {
    assigned: 'blue',
    processing: 'orange',
    completed: 'green',
    cancelled: 'red',
};

// 支付状态文案映射
const paymentTextMap: Record<string, string> = {
    paid: '已支付',
    pending: '未支付',
    unpaid: '未支付',
    refunded: '已退款',
};

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<OrderRecord | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 地图相关状态（复制并适配自订单列表）
    const [mapVisible, setMapVisible] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<any>(null);
    const [mapLoading, setMapLoading] = useState(false);
    const lastViewportPointsRef = useRef<any[] | null>(null);
    const navOriginRef = useRef<{ lng: number; lat: number } | null>(null);
    const navDestinationRef = useRef<{ lng: number; lat: number } | null>(null);
    const [navUrl, setNavUrl] = useState<string>('');
    const [safetyRadius] = useState<number>(500);
    const safetyCircleRef = useRef<any>(null);
    const currentMarkerRef = useRef<any>(null);
    const geoWatchIdRef = useRef<number | null>(null);
    const hasAlertedRef = useRef<boolean>(false);

    const handleStartNavigation = () => {
        if (!navUrl) {
            message.error('导航链接生成失败');
            return;
        }
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
        try {
            const newWin = window.open(navUrl, '_blank');
            if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
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

    const openNavigation = () => {
        setMapVisible(true);
    };

    useEffect(() => {
        const run = async () => {
            if (!id) {
                setError('订单ID不能为空');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                console.log('正在获取订单详情，ID:', id);

                const res = await OrderService.getDetail(id);
                console.log('订单详情响应:', res);

                if (res.code !== 200) {
                    throw new Error(res.message || '获取订单详情失败');
                }

                if (!res.data) {
                    throw new Error('订单数据为空');
                }

                // 确保uiStatus字段存在
                if (!res.data.uiStatus) {
                    console.warn('订单数据缺少uiStatus字段:', res.data);
                    // 根据status字段推断uiStatus
                    const status = res.data.status;
                    if (status === 'started') {
                        res.data.uiStatus = 'processing';
                    } else if (status === 'completed' || status === 'confirmed') {
                        res.data.uiStatus = 'completed';
                    } else if (status === 'canceled') {
                        res.data.uiStatus = 'cancelled';
                    } else {
                        res.data.uiStatus = 'assigned';
                    }
                }

                setOrder(res.data);
            } catch (e: any) {
                console.error('获取订单详情失败:', e);
                setError(e.message || '获取订单详情失败');
                message.error(e.message || '获取订单详情失败');
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [id]);

    // 初始化地图（基于订单详情数据）
    useEffect(() => {
        const initMap = async () => {
            if (!mapVisible || !order || !mapContainerRef.current) return;

            if (!(window as any).BMapGL) {
                const loadBaiduMap = () => {
                    return new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://api.map.baidu.com/api?v=1.0&type=webgl&ak=uVqZ5HJnmnA95xhBUo4fCUl2M4Pji7Ky';
                        script.onload = () => resolve(true);
                        script.onerror = () => reject(new Error('地图脚本加载失败'));
                        document.head.appendChild(script);
                    });
                };
                try {
                    await loadBaiduMap();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (!(window as any).BMapGL) {
                        message.error('百度地图加载失败，请检查网络');
                        setMapVisible(false);
                        return;
                    }
                } catch {
                    message.error('百度地图加载失败，请检查网络');
                    setMapVisible(false);
                    return;
                }
            }

            setMapLoading(true);
            try {
                const BMapGL = (window as any).BMapGL;
                if (!BMapGL) throw new Error('BMapGL 不可用');
                const map = new BMapGL.Map(mapContainerRef.current);
                mapRef.current = map;

                // 终点：来自订单详情地址
                const rawAddr: any = (order as any).address;
                let address = '' as string;
                if (typeof rawAddr === 'string') {
                    address = rawAddr;
                } else if (rawAddr && typeof rawAddr === 'object') {
                    address = rawAddr.formatted || [rawAddr.province, rawAddr.city, rawAddr.district].filter(Boolean).join('');
                }
                if (!address) address = '未填写地址';

                const getDestinationPoint = (): Promise<any> => {
                    return new Promise((resolve) => {
                        if (rawAddr?.location?.coordinates) {
                            const lng = rawAddr.location.coordinates[0];
                            const lat = rawAddr.location.coordinates[1];
                            resolve(new BMapGL.Point(lng, lat));
                            return;
                        }
                        const geocoder = new BMapGL.Geocoder();
                        geocoder.getPoint(address, (point: any) => {
                            resolve(point || null);
                        }, rawAddr?.city || '保定');
                    });
                };

                let origin = new BMapGL.Point(115.488818, 38.814838);
                let destination = await getDestinationPoint();

                if (destination) {
                    map.centerAndZoom(destination, 13);
                } else {
                    const cityName = rawAddr?.city || '保定';
                    const localCity = new BMapGL.LocalCity();
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
                    message.warning('无法定位目标，已回退到城市视图');
                }
                map.enableScrollWheelZoom(true);

                if (origin) {
                    const startMarker = new BMapGL.Marker(origin);
                    map.addOverlay(startMarker);
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
                    try { navDestinationRef.current = { lng: destination.lng, lat: destination.lat }; } catch { }
                    try {
                        const endLabel = new BMapGL.Label('终点', { position: destination, offset: new BMapGL.Size(10, -20) });
                        endLabel.setStyle({ color: '#ff4d4f', fontSize: '12px', backgroundColor: 'transparent', border: 'none' });
                        map.addOverlay(endLabel);
                    } catch { }

                    try {
                        const circle = new BMapGL.Circle(destination, safetyRadius, {
                            strokeColor: '#1677ff', strokeWeight: 2, strokeOpacity: 0.9, fillColor: '#1677ff', fillOpacity: 0.2
                        });
                        map.addOverlay(circle);
                        safetyCircleRef.current = circle;
                    } catch { }
                }

                if (origin && destination && typeof BMapGL.DrivingRoute === 'function') {
                    const driving = new BMapGL.DrivingRoute(map, { renderOptions: { map, autoViewport: true } });
                    driving.search(origin, destination);
                    lastViewportPointsRef.current = [origin, destination];
                } else if (origin && destination) {
                    try {
                        const line = new BMapGL.Polyline([origin, destination], { strokeColor: '#1677ff', strokeWeight: 6, strokeOpacity: 0.8 });
                        map.addOverlay(line);
                        map.setViewport([origin, destination]);
                        lastViewportPointsRef.current = [origin, destination];
                        message.warning('环境不支持驾车路线，已显示连线');
                    } catch {
                        message.warning('环境不支持驾车路线，仅显示起终点');
                    }
                }

                requestAnimationFrame(() => {
                    try {
                        mapRef.current?.resize?.();
                        if (lastViewportPointsRef.current) {
                            mapRef.current?.setViewport(lastViewportPointsRef.current);
                        }
                    } catch { }
                });

                try {
                    hasAlertedRef.current = false;
                    if (navigator.geolocation) {
                        const watchId = navigator.geolocation.watchPosition(
                            (pos) => {
                                const lng = pos.coords.longitude;
                                const lat = pos.coords.latitude;
                                const cur = new BMapGL.Point(lng, lat);
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

                                try {
                                    if (navDestinationRef.current && typeof map.getDistance === 'function') {
                                        const dist = map.getDistance(cur, new BMapGL.Point(navDestinationRef.current.lng, navDestinationRef.current.lat));
                                        if (dist > safetyRadius && !hasAlertedRef.current) {
                                            hasAlertedRef.current = true;
                                            try {
                                                import('../services/emergency.service').then(async (mod) => {
                                                    try {
                                                        const res = await mod.EmergencyService.initiate();
                                                        const alertId = res.alertId;
                                                        await mod.EmergencyService.commit(alertId, { location: { type: 'Point', coordinates: [lng, lat] } } as any);
                                                        message.warning('已离开安全区域，已自动报警');
                                                    } catch {
                                                        message.error('离开安全区域，报警失败');
                                                    }
                                                });
                                            } catch { }
                                        }
                                    }
                                } catch { }
                            },
                            () => { /* ignore */ },
                            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
                        );
                        geoWatchIdRef.current = watchId as unknown as number;
                    }
                } catch { }

                try {
                    const ak = getBaiduAkFromPage();
                    if (!ak) {
                        setNavUrl('');
                    } else {
                        const region = encodeURIComponent(rawAddr?.city || '保定');
                        const originName = 'name:%E6%88%91%E7%9A%84%E4%BD%8D%E7%BD%AE';
                        let originParam = originName;
                        let destinationParam = `name:${encodeURIComponent(address)}`;
                        if (navOriginRef.current) {
                            originParam = `latlng:${navOriginRef.current.lat},${navOriginRef.current.lng}|name:%E6%88%91%E7%9A%84%E4%BD%8D%E7%BD%AE`;
                        }
                        if (navDestinationRef.current) {
                            const d = navDestinationRef.current;
                            destinationParam = `latlng:${d.lat},${d.lng}|name:${encodeURIComponent(address)}`;
                        }
                        const url = `https://api.map.baidu.com/direction?origin=${originParam}&destination=${destinationParam}&mode=driving&region=${region}&output=html&src=elder-care&ak=${ak}`;
                        setNavUrl(url);
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
        return () => {
            try {
                if (mapRef.current) {
                    mapRef.current.clearOverlays?.();
                }
            } catch { }
            mapRef.current = null;
            setMapLoading(false);
            try {
                if (geoWatchIdRef.current != null && navigator.geolocation) {
                    navigator.geolocation.clearWatch(geoWatchIdRef.current);
                    geoWatchIdRef.current = null;
                }
            } catch { }
        };
    }, [mapVisible, order]);

    // 监听窗口与网络状态
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

    useEffect(() => {
        const checkNetworkStatus = () => {
            if (!navigator.onLine) {
                message.warning('网络连接已断开，地图功能可能受影响');
            }
        };
        const onOnline = () => message.success('网络连接已恢复');
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', checkNetworkStatus);
        checkNetworkStatus();
        return () => {
            window.removeEventListener('online', onOnline);
            window.removeEventListener('offline', checkNetworkStatus);
        };
    }, []);

    const handleAccept = async () => {
        if (!order) return;
        const orderId = order.id || (order as any)._id || id;
        if (!orderId) {
            message.error('订单ID缺失');
            return;
        }
        try {
            await OrderService.updateStatus(String(orderId), 'processing');
            setOrder({ ...order, uiStatus: 'processing' });
            message.success('已接受该订单，');
        } catch (e: any) {
            message.error(e?.message || '操作失败');
        }
    };

    const getCurrentUser = () => {
        const userInfo = localStorage.getItem('userInfo');
        if (!userInfo) return null;
        try {
            return JSON.parse(userInfo);
        } catch {
            return null;
        }
    };

    const startChatWith = async (targetUsername: string, targetRole: 'family' | 'elderly', initialMessage = '你好') => {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser.username) {
                message.error('未登录，无法发起聊天');
                return;
            }
            const res = await MessageService.createConversation({
                participants: [
                    { username: String(currentUser.username), realname: currentUser.realname || currentUser.username, role: currentUser.role },
                    { username: targetUsername, realname: targetUsername, role: targetRole },
                ],
                initialMessage: { content: initialMessage, type: 'text' },
            });
            if (res && res.conversationId) {
                navigate(`/chat/${res.conversationId}`);
            } else {
                message.error(res?.message || '创建对话失败');
            }
        } catch (e: any) {
            message.error(e?.message || '创建对话失败');
        }
    };

    // 显示错误信息
    if (error) {
        return (
            <div style={{ padding: 16 }}>
                <Card>
                    <div style={{ textAlign: 'center', color: '#ff4d4f' }}>
                        <p>加载失败: {error}</p>
                        <Button type="primary" onClick={() => window.location.reload()}>重新加载</Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <Spin size="large" tip="加载订单详情中..." />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: 16 }}>
                <Card>
                    <div style={{ textAlign: 'center', color: '#999' }}>
                        <p>订单不存在或已被删除</p>
                    </div>
                </Card>
            </div>
        );
    }

    // 安全地获取地址信息
    const addr: any = order.address;
    const addressText = typeof addr === 'string' ? addr : (addr?.formatted || [addr?.province, addr?.city, addr?.district].filter(Boolean).join(''));

    // 安全地获取状态信息
    const orderStatus = order.uiStatus || 'assigned';
    const statusTextValue = statusText[orderStatus] || '未知状态';
    const statusColorValue = statusColor[orderStatus] || 'default';
    // 电话信息暂未使用，如后续需要可从order中读取：
    // const familyPhone = (order as any)?.familyPhone || (order as any)?.contactPhone || (order as any)?.userPhone || (order as any)?.phone || '';
    // const elderlyPhone = (order as any)?.elderlyPhone || '';

    return (
        <div style={{ padding: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Card>
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{order.serviceName || '上门服务'}</div>
                            <Tag color={statusColorValue}>{statusTextValue}</Tag>
                        </Space>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} title="点击查看地图" onClick={openNavigation}>
                            <EnvironmentOutlined />
                            <span style={{ textDecoration: 'underline' }}>{addressText || '未填写地址'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <DollarOutlined style={{ color: '#faad14' }} />
                            <span style={{ color: '#faad14', fontWeight: 600 }}>¥{order.price || 0}</span>
                            <span style={{ color: '#999' }}>/天</span>
                            {typeof order.duration !== 'undefined' && (
                                <span style={{ color: '#999', marginLeft: 12 }}>{order.duration} 小时</span>
                            )}
                        </div>
                    </Space>
                </Card>

                <Card title="详细信息">
                    <Descriptions column={1}>
                        <Descriptions.Item label="订单编号">{order.id || (order as any)._id || '-'}</Descriptions.Item>
                        <Descriptions.Item label="下单时间">{order.startTime ? new Date(order.startTime).toLocaleString() : '-'}</Descriptions.Item>
                        <Descriptions.Item label="支付状态">{paymentTextMap[(order.paymentStatus || '').toLowerCase()] || (order.paymentStatus || '-')}</Descriptions.Item>
                        <Descriptions.Item label="备注">{(order as any).requirements || (order as any).remarks || '-'}</Descriptions.Item>
                    </Descriptions>
                </Card>
                {orderStatus === 'processing' && (
                    <Card>
                        <Button type="dashed" onClick={() => {
                            const eid = (order as any).elderlyId || '';
                            navigate(`/home/healthce${eid ? `?elderlyId=${eid}` : ''}`);
                        }}>健康档案</Button>
                    </Card>
                )}

                {orderStatus === 'assigned' ? (
                    <Card>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Space>
                                <Button type="primary" onClick={handleAccept}>接受订单</Button>
                            </Space>
                        </div>
                    </Card>
                ) : (
                    <Card title="联系方式">
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: 24 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} onClick={() => startChatWith('son', 'family')}>
                                <img src="/imgs/家属.png" alt="家属" style={{ width: 80, height: 80, objectFit: 'contain', cursor: 'pointer' }} />
                                <div style={{ fontSize: 14, color: '#595959' }}>联系家属</div>

                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }} onClick={() => startChatWith('laotou', 'elderly')}>
                                <img src="/imgs/老人.png" alt="老人" style={{ width: 80, height: 80, objectFit: 'contain', cursor: 'pointer' }} />
                                <div style={{ fontSize: 14, color: '#595959' }}>联系老人</div>

                            </div>
                        </div>
                    </Card>
                )}
                {/* 地图导航弹窗 */}
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
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.6)', zIndex: 2 }}>
                                <Spin tip="加载地图中..." />
                            </div>
                        )}
                        <div ref={mapContainerRef} style={{ width: '100%', height: 'calc(100% - 88px)' }} />
                        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 88, padding: '12px 16px', background: '#fff', zIndex: 3, borderTop: '1px solid #f0f0f0' }}
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                                <Button type="primary" size="large" style={{ minWidth: 160 }} disabled={!navUrl} onClick={handleStartNavigation}>开始导航</Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            </Space>
        </div>
    );
}


