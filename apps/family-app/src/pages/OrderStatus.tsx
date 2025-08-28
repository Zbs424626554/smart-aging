import React, { useState, useEffect } from 'react';
import { Card, Button, List, Tag, NavBar, Progress, Toast } from 'antd-mobile';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClockOutline, CheckOutline, UserOutline, PhoneOutline } from 'antd-mobile-icons';
import styles from './OrderStatus.module.css';

interface OrderData {
  orderNo: string;
  nurseId: string;
  nurseName: string;
  serviceHours: number;
  serviceDate: string;
  serviceTime: string;
  requirements: string;
  address: string;
  price: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  nurseInfo: any;
}

const OrderStatus: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [nurseAccepted, setNurseAccepted] = useState(false);

  useEffect(() => {
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
      // 模拟护工接单过程
      simulateNurseAcceptance();
    } else {
      navigate('/nurses');
    }
  }, [location.state, navigate]);

  // 模拟护工接单过程
  const simulateNurseAcceptance = () => {
    setTimeout(() => {
      setCurrentStep(2);
      setNurseAccepted(true);
      Toast.show({
        content: '护工已接单！',
        position: 'center',
      });
    }, 3000); // 3秒后护工接单
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: number) => {
    const status = getStepStatus(step);
    if (status === 'completed') return <CheckOutline color="#52c41a" />;
    if (status === 'current') return <ClockOutline color="#1677ff" />;
    return <ClockOutline color="#d9d9d9" />;
  };

  const getStepText = (step: number) => {
    const status = getStepStatus(step);
    if (status === 'completed') return '已完成';
    if (status === 'current') return '进行中';
    return '待开始';
  };

  const handleContactNurse = () => {
    Toast.show({
      content: '联系护工功能开发中...',
      position: 'center',
    });
  };

  const handleGoToPayment = () => {
    navigate('/payment', {
      state: { orderData }
    });
  };

  const handleBack = () => {
    navigate('/nurses');
  };

  if (!orderData) {
    return <div>加载中...</div>;
  }

  return (
    <div className={styles.orderStatus}>
      <NavBar onBack={handleBack}>订单状态</NavBar>

      <div className={styles.container}>
        {/* 订单进度 */}
        <Card className={styles.progressCard}>
          <div className={styles.progressTitle}>订单进度</div>
          <div className={styles.progressSteps}>
            <div className={`${styles.step} ${styles[getStepStatus(1)]}`}>
              <div className={styles.stepIcon}>
                {getStepIcon(1)}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>订单创建</div>
                <div className={styles.stepStatus}>{getStepText(1)}</div>
              </div>
            </div>

            <div className={`${styles.step} ${styles[getStepStatus(2)]}`}>
              <div className={styles.stepIcon}>
                {getStepIcon(2)}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>护工接单</div>
                <div className={styles.stepStatus}>{getStepText(2)}</div>
              </div>
            </div>

            <div className={`${styles.step} ${styles[getStepStatus(3)]}`}>
              <div className={styles.stepIcon}>
                {getStepIcon(3)}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>开始服务</div>
                <div className={styles.stepStatus}>{getStepText(3)}</div>
              </div>
            </div>

            <div className={`${styles.step} ${styles[getStepStatus(4)]}`}>
              <div className={styles.stepIcon}>
                {getStepIcon(4)}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>服务完成</div>
                <div className={styles.stepStatus}>{getStepText(4)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 护工信息 */}
        {nurseAccepted && (
          <Card className={styles.nurseCard}>
            <div className={styles.cardTitle}>
              <UserOutline />
              <span>护工信息</span>
            </div>
            <div className={styles.nurseInfo}>
              <div className={styles.nurseAvatar}>
                <UserOutline fontSize={24} />
              </div>
              <div className={styles.nurseDetails}>
                <div className={styles.nurseName}>{orderData.nurseName}</div>
                <div className={styles.nurseRating}>
                  评分：{orderData.nurseInfo.rating}分
                </div>
                <div className={styles.nurseSpecialties}>
                  {orderData.nurseInfo.specialties?.map((specialty: string, index: number) => (
                    <Tag key={index} color="primary" fill="outline" size="small">
                      {specialty}
                    </Tag>
                  ))}
                </div>
              </div>
              <Button
                size="small"
                fill="outline"
                onClick={handleContactNurse}
                className={styles.contactBtn}
              >
                <PhoneOutline />
                联系护工
              </Button>
            </div>
          </Card>
        )}

        {/* 服务详情 */}
        <Card className={styles.serviceCard}>
          <div className={styles.cardTitle}>
            <ClockOutline />
            <span>服务详情</span>
          </div>
          <List>
            <List.Item
              title="订单编号"
              extra={orderData.orderNo}
            />
            <List.Item
              title="服务时长"
              extra={`${orderData.serviceHours}小时`}
            />
            <List.Item
              title="服务日期"
              extra={orderData.serviceDate}
            />
            <List.Item
              title="服务时间"
              extra={orderData.serviceTime}
            />
            <List.Item
              title="服务地址"
              extra={orderData.address}
            />
            {orderData.requirements && (
              <List.Item
                title="特殊要求"
                extra={orderData.requirements}
              />
            )}
          </List>
        </Card>

        {/* 费用信息 */}
        <Card className={styles.priceCard}>
          <div className={styles.cardTitle}>
            <span>费用信息</span>
          </div>
          <div className={styles.priceInfo}>
            <div className={styles.priceRow}>
              <span>服务费用</span>
              <span>¥{orderData.totalAmount}</span>
            </div>
            <div className={styles.paymentStatus}>
              <span>支付状态</span>
              <Tag color={orderData.paymentStatus === 'paid' ? 'success' : 'warning'}>
                {orderData.paymentStatus === 'paid' ? '已支付' : '待支付'}
              </Tag>
            </div>
          </div>
        </Card>

        {/* 操作按钮 */}
        <div className={styles.actionSection}>
          {orderData.paymentStatus === 'unpaid' && nurseAccepted && (
            <Button
              block
              color="primary"
              size="large"
              onClick={handleGoToPayment}
            >
              立即支付
            </Button>
          )}

          {!nurseAccepted && (
            <div className={styles.waitingMessage}>
              <ClockOutline />
              <span>正在为您匹配护工，请稍候...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
