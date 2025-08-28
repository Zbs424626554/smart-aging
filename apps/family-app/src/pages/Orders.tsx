import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Orders.module.css';

interface Order {
  id: string;
  orderNo: string;
  serviceType: string;
  serviceName: string;
  nurseName?: string;
  nurseId?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  price: number;
  serviceHours: number;
  totalAmount: number;
  address: string;
  requirements: string;
  createdAt: string;
  appointmentTime: string;
  serviceTime: string;
  progress?: number; // 0-100，仅进行中使用
  etaText?: string;  // 预计剩余时间，仅进行中使用
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed' | 'cancelled'>('all');

  const initialOrders: Order[] = [
    {
      id: '1',
      orderNo: '20240115001',
      serviceType: '居家护理',
      serviceName: '王护士',
      nurseName: '王护士',
      nurseId: 'nurse001',
      status: 'in_progress',
      paymentStatus: 'paid',
      price: 80,
      serviceHours: 4,
      totalAmount: 320,
      address: '北京市朝阳区某小区 1-101',
      requirements: '日常护理 + 简单康复训练',
      createdAt: '2024-01-15 09:00:00',
      appointmentTime: '今天',
      serviceTime: '14:00-18:00',
      progress: 72,
      etaText: '预计剩余 1小时30分钟'
    },
    {
      id: '2',
      orderNo: '20240114002',
      serviceType: '医疗护理',
      serviceName: '李护士',
      nurseName: '李护士',
      nurseId: 'nurse002',
      status: 'completed',
      paymentStatus: 'paid',
      price: 90,
      serviceHours: 6,
      totalAmount: 540,
      address: '北京市海淀区 X 路 88 号',
      requirements: '术后护理，按时换药',
      createdAt: '2024-01-14 09:00:00',
      appointmentTime: '昨天',
      serviceTime: '09:00-15:00'
    },
    {
      id: '3',
      orderNo: '20240113003',
      serviceType: '康复护理',
      serviceName: '张护士',
      nurseName: '张护士',
      nurseId: 'nurse003',
      status: 'cancelled',
      paymentStatus: 'refunded',
      price: 80,
      serviceHours: 3,
      totalAmount: 240,
      address: '北京市朝阳区 Z 路 18 号',
      requirements: '康复训练 + 陪护',
      createdAt: '2024-01-13 10:00:00',
      appointmentTime: '前天',
      serviceTime: '10:00-13:00'
    },
    {
      id: '4',
      orderNo: '20240116004',
      serviceType: '居家护理',
      serviceName: '周护士',
      nurseName: '周护士',
      nurseId: 'nurse004',
      status: 'in_progress',
      paymentStatus: 'unpaid',
      price: 80,
      serviceHours: 2,
      totalAmount: 160,
      address: '北京市通州区 XX 路',
      requirements: '基础照护',
      createdAt: '2024-01-16 10:00:00',
      appointmentTime: '今天',
      serviceTime: '16:00-18:00',
      progress: 0,
      etaText: '待支付后开始服务'
    }
  ];

  const [orders, setOrders] = useState<Order[]>(initialOrders);

  // 从 sessionStorage 同步支付/退款结果并更新按钮与状态
  useEffect(() => {
    const raw = sessionStorage.getItem('orderUpdate');
    if (raw) {
      try {
        const update = JSON.parse(raw) as Partial<Order> & { id: string };
        setOrders(prev => prev.map(o => (
          o.id === update.id
            ? {
              ...o,
              ...(update.paymentStatus ? { paymentStatus: update.paymentStatus } : {}),
              ...(update.status ? { status: update.status as Order['status'] } : {}),
            }
            : o
        )));
      } catch { }
      sessionStorage.removeItem('orderUpdate');
    }
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter(o => o.status === activeTab);
  }, [activeTab, orders]);

  const statusChip = (status: Order['status']) => {
    const map: Record<Order['status'], string> = {
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return <span className={`${styles.statusChip} ${styles[`status_${status}`]}`}>{map[status]}</span>;
  };

  const paymentChip = (paymentStatus: Order['paymentStatus']) => {
    const map: Record<Order['paymentStatus'], string> = {
      unpaid: '待支付',
      paid: '已支付',
      refunded: '已退款'
    };
    return <span className={`${styles.payChip} ${styles[`pay_${paymentStatus}`]}`}>{map[paymentStatus]}</span>;
  };

  const handleContact = (o: Order) => { alert(`联系护工：${o.nurseName || o.serviceName}`); };
  const handleDetail = (o: Order) => { alert(`查看订单详情：${o.orderNo}`); };
  const handleRate = (o: Order) => { alert(`评价订单：${o.orderNo}`); };

  const handleRefund = (o: Order) => {
    navigate('/home/refund', {
      state: {
        orderId: o.id,
        orderNo: o.orderNo,
        amount: o.totalAmount,
        subject: `${o.serviceType} - ${o.serviceHours}小时`
      }
    });
  };

  const handlePay = (o: Order) => {
    navigate('/home/payment', {
      state: {
        orderId: o.id,
        orderNo: o.orderNo,
        amount: o.totalAmount,
        subject: `${o.serviceType} - ${o.serviceHours}小时`
      }
    });
  };

  const goCreateOrder = () => {
    // 跳转到预约护工页，用户选择后进入订单确认
    navigate('/home/nurses');
  };

  const renderActions = (o: Order) => {
    // 进行中（已支付）
    if (o.status === 'in_progress' && o.paymentStatus !== 'unpaid') {
      return (
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleContact(o)}>联系护工</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleDetail(o)}>查看详情</button>
        </div>
      );
    }

    // 待支付
    if (o.paymentStatus === 'unpaid') {
      return (
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handlePay(o)}>立即支付</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleDetail(o)}>查看详情</button>
        </div>
      );
    }

    // 已完成（已支付）
    if (o.status === 'completed' && o.paymentStatus === 'paid') {
      return (
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleRate(o)}>评价服务</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleDetail(o)}>查看详情</button>
        </div>
      );
    }

    // 已取消
    if (o.status === 'cancelled') {
      // 已退款：不再显示退款按钮
      if (o.paymentStatus === 'refunded') {
        return (
          <div className={styles.actions}>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleDetail(o)}>查看详情</button>
          </div>
        );
      }
      // 未退款：允许申请退款
      return (
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleRefund(o)}>申请退款</button>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleDetail(o)}>查看详情</button>
        </div>
      );
    }

    // 兜底
    return (
      <div className={styles.actions}>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => handleDetail(o)}>查看详情</button>
      </div>
    );
  };

  return (
    <div className={styles.orders}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTitle}>订单管理</div>
      </div>

      {/* 顶部标签 */}
      <div className={styles.tabs}>
        {[
          { key: 'all', label: '全部' },
          { key: 'in_progress', label: '进行中' },
          { key: 'completed', label: '已完成' },
          { key: 'cancelled', label: '已取消' }
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.tabBtn} ${activeTab === (t.key as any) ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.ordersList}>
        {filteredOrders.map(o => (
          <div className={styles.orderCard} key={o.id}>
            <div className={styles.cardHeader}>
              <div className={styles.orderNo}>订单号：{o.orderNo}</div>
              <div className={styles.headerRight}>
                {statusChip(o.status)}
              </div>
            </div>

            <div className={styles.nurseRow}>
              <div className={styles.avatar}>护</div>
              <div className={styles.nurseMeta}>
                <div className={styles.nurseName}>{o.nurseName || '-'}</div>
                <div className={styles.serviceMeta}>{o.serviceType} · {o.serviceHours}小时</div>
              </div>
              <div className={styles.amountBox}>
                <div className={styles.amount}>¥{o.totalAmount}</div>
              </div>
            </div>

            {o.status === 'in_progress' && (
              <div className={styles.progressBlock}>
                <div className={styles.progressHeader}>
                  <span>服务进度</span>
                  <span className={styles.etaText}>{o.etaText || ''}</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressInner} style={{ width: `${o.progress || 0}%` }} />
                </div>
              </div>
            )}

            <div className={styles.infoRow}>
              <div className={styles.infoItem}><span>服务时间：</span>{o.appointmentTime} {o.serviceTime}</div>
              <div className={styles.infoItem}><span>地址：</span>{o.address}</div>
              <div className={styles.infoItem}><span>要求：</span>{o.requirements}</div>
            </div>

            <div className={styles.chipsRow}>
              {paymentChip(o.paymentStatus)}
            </div>

            {renderActions(o)}
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className={styles.emptyBox}>暂无订单</div>
        )}
      </div>

      {/* 发布订单浮动按钮 */}
      <button className={styles.fabCreateOrder} onClick={goCreateOrder} aria-label="发布订单">
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default Orders;