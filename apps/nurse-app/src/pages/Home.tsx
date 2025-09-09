import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Avatar, Tag, Button } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  StarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  HeartOutlined,
  RightOutlined
} from '@ant-design/icons';
import { AuthService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const { Title } = Typography;

interface ScheduleItem {
  id: string;
  time: string;
  elderlyName: string;
  location: string;
  service: string;
  status: 'upcoming' | 'in-progress' | 'completed';
}

// interface NearbyRequest {
//   id: string;
//   title: string;
//   distance: number;
//   price: number;
//   elderlyName: string;
//   urgent: boolean;
// }

const Home: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  // const [nearbyRequests, setNearbyRequests] = useState<NearbyRequest[]>([]);

  // 模拟数据
  useEffect(() => {
    // 今日排班数据
    setTodaySchedule([
      {
        id: '1',
        time: '08:00 - 12:00',
        elderlyName: '张奶奶',
        location: '朝阳区建国门外大街45号',
        service: '日常护理',
        status: 'completed'
      },
      {
        id: '2',
        time: '14:00 - 18:00',
        elderlyName: '李爷爷',
        location: '海淀区中关村南大街5号',
        service: '康复训练',
        status: 'in-progress'
      },
      {
        id: '3',
        time: '19:30 - 21:30',
        elderlyName: '王奶奶',
        location: '西城区西单北大街',
        service: '晚间陪护',
        status: 'upcoming'
      }
    ]);

    // 附近服务需求（未在本页面展示，保留接口示例）
    // setNearbyRequests([...])
  }, []);

  // 获取当前时间
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // 格式化日期为"8月5日星期二"格式
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'numeric',
      day: 'numeric',
      weekday: 'long'
    };
    return now.toLocaleDateString('zh-CN', options);
  };

  // 获取问候语
  const getGreeting = () => {
    if (hours < 12) {
      return '早上好';
    } else if (hours < 18) {
      return '下午好';
    } else {
      return '晚上好';
    }
  };

  // 渲染排班状态标签
  const renderStatusTag = (status: ScheduleItem['status']) => {
    switch (status) {
      case 'upcoming':
        return <Tag className="status-tag">待开始</Tag>;
      case 'in-progress':
        return <Tag className="status-tag in-progress">进行中</Tag>;
      case 'completed':
        return <Tag className="status-tag completed">已完成</Tag>;
      default:
        return null;
    }
  };

  return (
    <div className="home-container">
      {/* 问候语和日期 */}
      <div className="greeting-section">
        <Title level={2} className="greeting-title">
          {getGreeting()}，{currentUser?.realname || currentUser?.username}
        </Title>
        <div className="date-time">
          <span className="date">{getFormattedDate()}</span>
          <span className="time">{formattedTime}</span>
        </div>
      </div>

      {/* 工作统计 */}
      <div className="stats-section">
        <Row gutter={0}>
          <Col span={6} className="stat-item">
            <div className="stat-icon calendar">
              <CalendarOutlined />
            </div>
            <div className="stat-value">2</div>
            <div className="stat-label">今日订单</div>
          </Col>
          <Col span={6} className="stat-item">
            <div className="stat-icon dollar">
              <DollarOutlined />
            </div>
            <div className="stat-value">2,860</div>
            <div className="stat-label">本月收入<span className="stat-unit">元</span></div>
          </Col>
          <Col span={6} className="stat-item">
            <div className="stat-icon clock">
              <ClockCircleOutlined />
            </div>
            <div className="stat-value">126</div>
            <div className="stat-label">服务时长<span className="stat-unit">小时</span></div>
          </Col>
          <Col span={6} className="stat-item">
            <div className="stat-icon star">
              <StarOutlined />
            </div>
            <div className="stat-value">4.8</div>
            <div className="stat-label">服务评分<span className="stat-unit">/5</span></div>
          </Col>
        </Row>
      </div>

      {/* 今日排班 */}
      <div className="schedule-section">
        <div className="section-header">
          <div className="section-title">今日排班</div>
          <Button type="link" size="small" className="section-action-btn" onClick={() => navigate('/home/schedule')}>
            查看全部 <RightOutlined />
          </Button>
        </div>

        {todaySchedule.length > 0 ? (
          <div className="schedule-list">
            {todaySchedule.map((item) => (
              <div
                key={item.id}
                className={`schedule-item ${item.status === 'in-progress' ? 'active-schedule' : ''}`}
                onClick={() => navigate(`/home/heath?name=${item.elderlyName}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="schedule-avatar">
                  <Avatar icon={<UserOutlined />} />
                </div>
                <div className="schedule-content">
                  <div className="schedule-header">
                    <span className="elderly-name">{item.elderlyName}</span>
                    {renderStatusTag(item.status)}
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-time">
                      <ClockCircleOutlined /> {item.time}
                    </div>
                    <div className="schedule-location">
                      <EnvironmentOutlined /> {item.location}
                    </div>
                    <div className="schedule-service">
                      <HeartOutlined /> {item.service}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-schedule">今日暂无排班</div>
        )}
      </div>



    </div>
  );
};

export default Home; 