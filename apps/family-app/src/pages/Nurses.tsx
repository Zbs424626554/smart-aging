import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Nurses.module.css';

interface NurseItem {
  id: string;
  name: string;
  rating: number; // 1-5
  price: number; // 每小时
  specialties: string[];
  years: number; // 从业年限
  available: string; // 可约时间描述
}

const Nurses: React.FC = () => {
  const navigate = useNavigate();

  // 模拟护工列表
  const nurses: NurseItem[] = [
    { id: 'n1', name: '王护士', rating: 4.8, price: 80, specialties: ['基础护理', '康复训练'], years: 5, available: '今天下午、明天全天' },
    { id: 'n2', name: '李护士', rating: 4.9, price: 90, specialties: ['术后护理', '上门换药'], years: 7, available: '明天上午、后天下午' },
    { id: 'n3', name: '张护士', rating: 4.6, price: 75, specialties: ['陪护照看', '基础康复'], years: 4, available: '工作日晚上、周末全天' },
  ];

  const bookNurse = (nurse: NurseItem) => {
    // 进入既有的订单确认流程
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const orderData = {
      nurseId: nurse.id,
      nurseName: nurse.name,
      serviceHours: 2,
      serviceDate: dateStr,
      serviceTime: '15:00-17:00',
      requirements: '基础照护',
      address: '北京市朝阳区某小区 1-101',
      price: nurse.price,
      totalAmount: nurse.price * 2,
      nurseInfo: { rating: nurse.rating, specialties: nurse.specialties },
    };
    navigate('/order-confirm', { state: { orderData } });
  };

  return (
    <div className={styles.nurses}>
      <div className={styles.header}>预约护工</div>

      <div className={styles.list}>
        {nurses.map(n => (
          <div key={n.id} className={styles.card}>
            <div className={styles.avatar}>护</div>
            <div className={styles.meta}>
              <div className={styles.topRow}>
                <div className={styles.name}>{n.name}</div>
                <div className={styles.rating}>{n.rating.toFixed(1)}分</div>
              </div>
              <div className={styles.tags}>
                {n.specialties.map((s, i) => (
                  <span className={styles.tag} key={i}>{s}</span>
                ))}
              </div>
              <div className={styles.bottomRow}>
                <div className={styles.price}>¥{n.price}/小时 · {n.years}年经验</div>
                <div className={styles.available}>{n.available}</div>
              </div>
            </div>
            <button className={styles.bookBtn} onClick={() => bookNurse(n)}>预约</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Nurses;


