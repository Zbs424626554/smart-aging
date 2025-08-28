import React, { useState, useEffect } from 'react';
import { Card, Button, List, Tag, Toast, NavBar } from 'antd-mobile';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckOutline, ClockOutline, LocationOutline, UserOutline } from 'antd-mobile-icons';
import styles from './OrderConfirm.module.css';

interface OrderData {
  nurseId: string;
  nurseName: string;
  serviceHours: number;
  serviceDate: string;
  serviceTime: string;
  requirements: string;
  address: string;
  price: number;
  totalAmount: number;
  nurseInfo: any;
}

const OrderConfirm: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
    } else {
      // 如果没有订单数据，跳转回护工选择页面
      navigate('/nurses');
    }
  }, [location.state, navigate]);

  const handleSubmitOrder = async () => {
    if (!orderData) return;

    setIsSubmitting(true);

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 构建完整的订单数据
      const fullOrderData = {
        ...orderData,
        orderNo: `ORD${Date.now()}`,
        status: 'pending_assignment',
        paymentStatus: 'unpaid',
        createdAt: new Date().toISOString(),
        // 这里可以添加更多字段
      };

      // 提交订单数据

      // 显示成功提示
      Toast.show({
        content: '订单创建成功！正在为您匹配护工...',
        position: 'center',
        duration: 2000,
      });

      // 跳转到订单状态页面
      setTimeout(() => {
        navigate('/order-status', {
          state: { orderData: fullOrderData }
        });
      }, 2000);

    } catch (error) {
      Toast.show({
        content: '订单创建失败，请重试',
        position: 'center',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/nurses');
  };

  if (!orderData) {
    return <div>加载中...</div>;
  }

  return (
    <div className={styles.orderConfirm}>
      <NavBar onBack={handleBack}>订单确认</NavBar>

      <div className={styles.container}>
        {/* 护工信息卡片 */}
        <Card className={styles.nurseCard}>
          <div className={styles.nurseHeader}>
            <div className={styles.nurseAvatar}>
              <UserOutline fontSize={24} />
            </div>
            <div className={styles.nurseInfo}>
              <div className={styles.nurseName}>{orderData.nurseName}</div>
              <div className={styles.nurseSpecialties}>
                {orderData.nurseInfo.specialties?.map((specialty: string, index: number) => (
                  <Tag key={index} color="primary" fill="outline" size="small">
                    {specialty}
                  </Tag>
                ))}
              </div>
            </div>
            <div className={styles.nurseRating}>
              <div className={styles.ratingScore}>{orderData.nurseInfo.rating}</div>
              <div className={styles.ratingText}>分</div>
            </div>
          </div>
        </Card>

        {/* 服务详情 */}
        <Card className={styles.serviceCard}>
          <div className={styles.cardTitle}>
            <ClockOutline />
            <span>服务详情</span>
          </div>
          <List>
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

        {/* 费用明细 */}
        <Card className={styles.priceCard}>
          <div className={styles.cardTitle}>
            <CheckOutline />
            <span>费用明细</span>
          </div>
          <div className={styles.priceDetails}>
            <div className={styles.priceRow}>
              <span>单价</span>
              <span>¥{orderData.price}/小时</span>
            </div>
            <div className={styles.priceRow}>
              <span>时长</span>
              <span>{orderData.serviceHours}小时</span>
            </div>
            <div className={styles.priceDivider}></div>
            <div className={styles.priceRowTotal}>
              <span>总价</span>
              <span className={styles.totalAmount}>¥{orderData.totalAmount}</span>
            </div>
          </div>
        </Card>

        {/* 服务说明 */}
        <Card className={styles.noticeCard}>
          <div className={styles.cardTitle}>
            <span>服务说明</span>
          </div>
          <div className={styles.noticeContent}>
            <p>• 订单提交后，系统将自动为您匹配最合适的护工</p>
            <p>• 护工确认接单后，您将收到通知</p>
            <p>• 服务完成后，请及时支付费用</p>
            <p>• 如有疑问，请联系客服</p>
          </div>
        </Card>

        {/* 提交按钮 */}
        <div className={styles.submitSection}>
          <Button
            block
            color="primary"
            size="large"
            loading={isSubmitting}
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
          >
            {isSubmitting ? '正在提交...' : '确认提交订单'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirm;
