import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaymentService } from '../services/payment.service';
import type { PaymentResponse } from '../services/payment.service';
import styles from './Payment.module.css';

interface PaymentPageProps {
  orderId?: string;
  orderNo?: string;
  amount?: number;
  subject?: string;
}

const Payment: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [countdown, setCountdown] = useState(300); // 5分钟倒计时
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'qrCode' | 'success' | 'failed'>('pending');
  const [pollingCleanup, setPollingCleanup] = useState<(() => void) | null>(null);

  // 从路由参数或location.state获取支付信息
  const orderInfo = location.state as PaymentPageProps || {
    orderId: 'order_' + Date.now(),
    orderNo: 'PAY' + Date.now(),
    amount: 160,
    subject: '护理服务'
  };

  useEffect(() => {
    // 开始倒计时
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      setPaymentStatus('failed');
    }
  }, [countdown]);

  // 组件卸载时清理轮询
  useEffect(() => {
    return () => {
      if (pollingCleanup) {
        pollingCleanup();
      }
    };
  }, [pollingCleanup]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 创建支付订单并获取二维码
      const result = await PaymentService.mockAlipayPayment(
        orderInfo.orderId!,
        orderInfo.amount!
      );

      setPaymentData(result);

      if (result.success && result.qrCode) {
        setPaymentStatus('qrCode');
        // 开始轮询支付状态
        const cleanup = startPaymentStatusPolling(orderInfo.orderId!);
        setPollingCleanup(() => cleanup);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('支付失败:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  // 长轮询支付状态
  const startPaymentStatusPolling = (orderId: string) => {
    let isPolling = true;

    const performLongPoll = async () => {
      if (!isPolling) return;

      try {
        const status = await PaymentService.queryPaymentStatus(orderId, 30000); // 30秒超时

        if (!isPolling) return; // 再次检查，防止重复处理

        if (status.status === 'paid') {
          setPaymentStatus('success');
          setPollingCleanup(null);
          // 3秒后自动跳转到订单页面
          setTimeout(() => {
            // 将支付结果写入 sessionStorage，Orders 页面 useEffect 会同步状态
            sessionStorage.setItem('orderUpdate', JSON.stringify({
              id: orderId,
              paymentStatus: 'paid',
              status: 'in_progress'
            }));
            navigate('/home/orders');
          }, 3000);
        } else if (status.status === 'failed' || status.status === 'cancelled') {
          setPaymentStatus('failed');
          setPollingCleanup(null);
        } else if (status.status === 'pending') {
          // 如果还是pending状态，继续长轮询
          if (isPolling) {
            setTimeout(performLongPoll, 1000); // 1秒后继续
          }
        }
      } catch (error) {
        console.error('长轮询查询支付状态失败:', error);
        // 如果出错，1秒后重试
        if (isPolling) {
          setTimeout(performLongPoll, 1000);
        }
      }
    };

    // 开始长轮询
    performLongPoll();

    // 5分钟后停止轮询
    const timeoutId = setTimeout(() => {
      isPolling = false;
      if (paymentStatus === 'qrCode') {
        setPaymentStatus('failed');
        setPollingCleanup(null);
      }
    }, 300000);

    // 返回清理函数
    return () => {
      isPolling = false;
      clearTimeout(timeoutId);
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBack = () => {
    // 清理轮询
    if (pollingCleanup) {
      pollingCleanup();
      setPollingCleanup(null);
    }
    navigate('/home/orders');
  };

  const handleRetry = () => {
    // 清理轮询
    if (pollingCleanup) {
      pollingCleanup();
      setPollingCleanup(null);
    }
    setPaymentStatus('pending');
    setCountdown(300);
    setPaymentData(null);
  };

  return (
    <div className={styles.paymentPage}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className={styles.title}>支付订单</div>
      </div>

      <div className={styles.content}>
        {paymentStatus === 'pending' && (
          <>
            <div className={styles.orderInfo}>
              <div className={styles.orderNo}>订单号：{orderInfo.orderNo}</div>
              <div className={styles.amount}>¥{orderInfo.amount}</div>
              <div className={styles.subject}>{orderInfo.subject}</div>
            </div>

            <div className={styles.paymentMethod}>
              <div className={styles.methodTitle}>选择支付方式</div>
              <div className={styles.methodCard}>
                <div className={styles.methodIcon}>💰</div>
                <div className={styles.methodInfo}>
                  <div className={styles.methodName}>支付宝沙箱支付</div>
                  <div className={styles.methodDesc}>推荐使用支付宝支付</div>
                </div>
                <div className={styles.methodSelected}>✓</div>
              </div>
            </div>

            <div className={styles.countdown}>
              <div className={styles.countdownText}>支付倒计时</div>
              <div className={styles.countdownTime}>{formatTime(countdown)}</div>
            </div>

            <button
              className={styles.payButton}
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? '支付中...' : `立即支付 ¥${orderInfo.amount}`}
            </button>
          </>
        )}

        {paymentStatus === 'qrCode' && (
          <div className={styles.resultContainer}>
            <div className={styles.qrCodeContainer}>
              <div className={styles.qrCodeTitle}>请使用支付宝扫码支付</div>
              {paymentData?.qrCode && (
                <img
                  src={paymentData.qrCode}
                  alt="支付二维码"
                  className={styles.qrCode}
                />
              )}
              <div className={styles.qrCodeDesc}>
                订单号：{orderInfo.orderNo}<br />
                支付金额：¥{orderInfo.amount}<br />
                请使用支付宝扫描上方二维码完成支付
              </div>
              <div className={styles.countdown}>
                <div className={styles.countdownText}>支付倒计时</div>
                <div className={styles.countdownTime}>{formatTime(countdown)}</div>
              </div>

              {/* 测试按钮 - 仅用于开发测试 */}
              <div style={{ marginTop: '20px', padding: '10px', border: '1px dashed #ccc', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>开发测试</div>
                <button
                  onClick={() => {
                    setPaymentStatus('success');
                    setTimeout(() => {
                      sessionStorage.setItem('orderUpdate', JSON.stringify({
                        id: orderInfo.orderId,
                        paymentStatus: 'paid',
                        status: 'in_progress'
                      }));
                      navigate('/home/orders');
                    }, 3000);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  模拟支付成功
                </button>
              </div>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className={styles.resultContainer}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.resultTitle}>支付成功</div>
            <div className={styles.resultDesc}>
              订单号：{orderInfo.orderNo}<br />
              交易号：{paymentData?.tradeNo}<br />
              支付金额：¥{orderInfo.amount}
            </div>
            <div className={styles.autoRedirect}>3秒后自动跳转到订单页面...</div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className={styles.resultContainer}>
            <div className={styles.failedIcon}>❌</div>
            <div className={styles.resultTitle}>支付失败</div>
            <div className={styles.resultDesc}>
              {paymentData?.message || '支付过程中出现错误，请重试'}
            </div>
            <div className={styles.actionButtons}>
              <button className={styles.retryButton} onClick={handleRetry}>
                重新支付
              </button>
              <button className={styles.backButton} onClick={handleBack}>
                返回订单
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;
