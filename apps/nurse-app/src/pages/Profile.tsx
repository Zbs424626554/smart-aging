import React, { useState, useEffect } from 'react';
import { Avatar, Typography, List } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  CalendarOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { AuthService, type UserInfo } from '../services/auth.service';
import './Profile.css';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    setUserInfo(currentUser);
  }, []);

  const handleMenuClick = (title: string) => {
    switch (title) {
      case '排班管理':
        navigate('/home/schedule');
        break;
      case '收入统计':
        navigate('/home/income');
        break;
      case '资质认证':
        navigate('/home/certification');
        break;
      case '联系记录':
        navigate('/home/message');
        break;
      default:

    }
  };

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      icon: <CalendarOutlined style={{ color: '#ff6b35' }} />,
      title: '排班管理',
      count: 8,
      color: '#ff6b35'
    },
    {
      icon: <MessageOutlined style={{ color: '#1890ff' }} />,
      title: '联系记录',
      count: 2,
      color: '#1890ff'
    },
    {
      icon: <DollarOutlined style={{ color: '#faad14' }} />,
      title: '收入统计',
      count: 0,
      color: '#faad14'
    },
    {
      icon: <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
      title: '资质认证',
      count: null,
      color: '#52c41a'
    }
  ];

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-edit" onClick={handleLogout} title="退出登录" style={{ cursor: 'pointer' }}>
          <img src="../imgs/退出登录.png" alt="退出登录" />
        </div>
        <div className="profile-avatar">
          <Avatar
            size={80}
            src="/imgs/nurse.png"
          />
        </div>
        <div className="profile-info">
          <Title level={3} style={{ color: 'black', margin: 0 }}>
            {userInfo?.realname || userInfo?.username}
          </Title>
          <Text style={{ color: 'black', opacity: 0.9 }}>
            专业护理，用心服务每一位老人
          </Text>
        </div>
      </div>

      {/* Menu Items */}
      <div className="menu-container">
        <List
          dataSource={menuItems}
          renderItem={(item) => (
            <List.Item className="menu-item">
              <div
                className="menu-item-content"
                onClick={() => handleMenuClick(item.title)}
              >
                <div className="menu-icon">
                  {item.icon}
                </div>
                <div className="menu-text">
                  <span className="menu-title">{item.title}</span>
                  {item.count !== null && (
                    <span className="menu-count">({item.count})</span>
                  )}
                </div>
                <div className="menu-arrow">&gt;</div>
              </div>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default Profile; 