import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Space, Tag, Button, Spin, message, Modal } from 'antd';
import { EnvironmentOutlined, DollarOutlined, LeftOutlined } from '@ant-design/icons';
import { OrderService } from '../services/order.service';
import type { OrderRecord, UiOrderStatus } from '../services/order.service';

const statusText: Record<UiOrderStatus, string> = {
    assigned: '待接收',
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

    // 显示错误信息
    if (error) {
        return (
            <div style={{ padding: 16 }}>
                <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
                <Card style={{ marginTop: 16 }}>
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
                <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                    <Spin size="large" tip="加载订单详情中..." />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ padding: 16 }}>
                <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
                <Card style={{ marginTop: 16 }}>
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

    return (
        <div style={{ padding: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Button icon={<LeftOutlined />} onClick={() => navigate(-1)}>返回</Button>

                <Card>
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ fontSize: 18, fontWeight: 600 }}>{order.serviceName || '上门服务'}</div>
                            <Tag color={statusColorValue}>{statusTextValue}</Tag>
                        </Space>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <EnvironmentOutlined />
                            <span>{addressText || '未填写地址'}</span>
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
                        <Descriptions.Item label="备注">{order.requirements || '-'}</Descriptions.Item>
                    </Descriptions>
                </Card>
            </Space>
        </div>
    );
}


