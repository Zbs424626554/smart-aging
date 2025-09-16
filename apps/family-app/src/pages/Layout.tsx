import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import WebSocketService from '../services/websocket.service';
import { AuthService } from '../services/auth.service';
const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      key: '/home',
      title: '首页',
      icon: <i className="fas fa-home"></i>,
    },
    {
      key: '/home/health',
      title: '健康',
      icon: <i className="fas fa-heartbeat"></i>,
    },
    {
      key: '/home/orders',
      title: '订单',
      icon: <i className="fas fa-list-alt"></i>,
    },
    {
      key: '/home/profile',
      title: '我的',
      icon: <i className="fas fa-user"></i>,
    },
  ];

  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/home') return '/home';
    return path;
  };

  const handleTabChange = (key: string) => {
    navigate(key);
  };
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    const username = (user as any)?.username;
    if (username) {
      try { void WebSocketService.connect(username); } catch { }
    }

    const onEmergencyUpdated = (payload: any) => {
      const status = payload?.status;
      if ((status === 'calling' || status === 'pending') && location.pathname !== '/warnings') {
        navigate('/warnings');
      }
    };
    try { WebSocketService.addEventListener('emergency:updated', onEmergencyUpdated); } catch { }
    return () => {
      try { WebSocketService.removeEventListener('emergency:updated', onEmergencyUpdated); } catch { }
    };
  }, [location.pathname, navigate]);

  return (
    <>
      <div className={styles.wrap}>
        <Outlet />
      </div>

      {/* 底部标签栏 */}
      <div className={styles['tab-bar-container']}>
        <div className={styles['tab-bar']}>
          {tabs.map((item) => (
            <div
              key={item.key}
              className={`${styles['tab-item']} ${getActiveKey() === item.key ? styles.active : ''}`}
              onClick={() => handleTabChange(item.key)}
            >
              <div className={styles['tab-icon']}>{item.icon}</div>
              <div className={styles['tab-title']}>{item.title}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Layout;