import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaymentService } from '../services/payment.service';
import styles from './Refund.module.css';

interface RefundPageProps {
  orderId?: string;
  orderNo?: string;
  amount?: number;
  subject?: string;
}

const Refund: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [refundStatus, setRefundStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [refundNo, setRefundNo] = useState('');

  // 从路由参数或location.state获取退款信息
  const orderInfo = location.state as RefundPageProps || {
    orderId: 'order_' + Date.now(),
    orderNo: 'REFUND' + Date.now(),
    amount: 160,
    subject: '护理服务'
  };

  const refundReasons = [
    '服务时间冲突',
    '护工临时有事',
    '老人身体不适',
    '服务不满意',
    '其他原因'
  ];

  const handleRefund = async () => {
    if (!reason.trim()) {
      alert('请选择退款原因');
      return;
    }

    setLoading(true);
    try {
      const result = await PaymentService.mockRefund(
        orderInfo.orderId!,
        orderInfo.amount!
      );

      if (result.success) {
        setRefundNo(result.refundNo!);
        setRefundStatus('success');
        // 3秒后自动跳转到订单页面
        setTimeout(() => {
          // 写入订单更新：已退款
          if (orderInfo.orderId) {
            sessionStorage.setItem('orderUpdate', JSON.stringify({
              id: orderInfo.orderId,
              paymentStatus: 'refunded',
              status: 'cancelled'
            }));
          }
          navigate('/home/orders');
        }, 3000);
      } else {
        setRefundStatus('failed');
      }
    } catch (error) {
      console.error('退款申请失败:', error);
      setRefundStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/home/orders');
  };

  const handleRetry = () => {
    setRefundStatus('pending');
    setReason('');
    setRefundNo('');
  };

  return (
    <div className={styles.refundPage}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className={styles.title}>申请退款</div>
      </div>

      <div className={styles.content}>
        {refundStatus === 'pending' && (
          <>
            <div className={styles.orderInfo}>
              <div className={styles.orderNo}>订单号：{orderInfo.orderNo}</div>
              <div className={styles.amount}>¥{orderInfo.amount}</div>
              <div className={styles.subject}>{orderInfo.subject}</div>
            </div>

            <div className={styles.refundForm}>
              <div className={styles.formTitle}>退款原因</div>
              <div className={styles.reasonList}>
                {refundReasons.map((r, index) => (
                  <label key={index} className={styles.reasonItem}>
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <span className={styles.reasonText}>{r}</span>
                  </label>
                ))}
              </div>

              {reason === '其他原因' && (
                <div className={styles.customReason}>
                  <textarea
                    placeholder="请详细说明退款原因..."
                    className={styles.reasonInput}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className={styles.refundPolicy}>
              <div className={styles.policyTitle}>退款说明</div>
              <div className={styles.policyContent}>
                <p>• 退款将在1-3个工作日内处理完成</p>
                <p>• 退款金额将原路返回至支付账户</p>
                <p>• 如有疑问请联系客服：400-123-4567</p>
              </div>
            </div>

            <button
              className={styles.refundButton}
              onClick={handleRefund}
              disabled={loading || !reason.trim()}
            >
              {loading ? '申请中...' : '确认申请退款'}
            </button>
          </>
        )}

        {refundStatus === 'success' && (
          <div className={styles.resultContainer}>
            <div className={styles.successIcon}>✅</div>
            <div className={styles.resultTitle}>退款申请成功</div>
            <div className={styles.resultDesc}>
              订单号：{orderInfo.orderNo}<br />
              退款单号：{refundNo}<br />
              退款金额：¥{orderInfo.amount}<br />
              预计到账：1-3个工作日
            </div>
            <div className={styles.autoRedirect}>3秒后自动跳转到订单页面...</div>
          </div>
        )}

        {refundStatus === 'failed' && (
          <div className={styles.resultContainer}>
            <div className={styles.failedIcon}>❌</div>
            <div className={styles.resultTitle}>退款申请失败</div>
            <div className={styles.resultDesc}>
              申请过程中出现错误，请重试或联系客服
            </div>
            <div className={styles.actionButtons}>
              <button className={styles.retryButton} onClick={handleRetry}>
                重新申请
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

export default Refund;
