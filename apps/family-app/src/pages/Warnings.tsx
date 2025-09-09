import React, { useEffect, useState, useRef } from 'react';
import styles from './Warnings.module.css';
import { socket, registerUser } from '../socket';
import { AuthService } from '../services/auth.service';
import request from '../utils/request';
import PageHeader from '../components/PageHeader';
import { MessageService } from '../services/message.service';
import { useNavigate } from 'react-router-dom';

interface Warning {
  id: string;
  title: string;
  description: string;
  type: 'emergency' | 'warning' | 'reminder';
  time: string;
  elderlyName: string;
  elderlyAvatar?: string;
  status: 'unread' | 'read' | 'handled';
  priority: 'high' | 'medium' | 'low';
  location?: string;
  contactInfo?: string;
  transcript?: string;
}

const Warnings: React.FC = () => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [selected, setSelected] = useState<Warning | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationLocation, setNavigationLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    const uid = user?.id || (user as any)?._id;
    if (uid) {
      registerUser(uid);
    }
    // 初始化拉取历史
    request.get('/emergency/family').then((resp: any) => {
      const arr = Array.isArray(resp.data) ? resp.data : [];
      const mapped = arr.map((p: any) => {
        const risk = parseRiskLevel(p.aiAnalysis); // 'low'|'medium'|'high'|undefined
        const { t, pr } = riskToTypePriority(risk);
        return {
          id: String(p._id || p.alertId || Date.now()),
          title: p.status === 'calling' ? '外呼中' : '紧急求助',
          description: p.aiAnalysis ? safeSummary(p.aiAnalysis) : '老人发起紧急呼叫',
          type: t,
          time: new Date(p.createdAt || Date.now()).toLocaleString(),
          elderlyName: p.elderlyName || String(p.userId || '老人'),
          status: p.status === 'falseAlarm' ? 'handled' : 'unread',
          priority: pr,
          location: p.location ? JSON.stringify(p.location) : undefined,
          contactInfo: p.contactPhone || '',
          transcript: p.transcript,
          raw: p
        } as Warning;
      });
      setWarnings(mapped);
    }).catch(() => void 0);
    const handler = (payload: any) => {
      // 仅处理紧急事件
      const now = new Date();
      const risk = parseRiskLevel(payload.aiAnalysis);
      const { t, pr } = riskToTypePriority(risk);
      const newItem: Warning = {
        id: payload.alertId,
        title: payload.status === 'calling' ? (payload.callStatus === 'connected' ? '通话中' : payload.callStatus === 'not_answered' ? '未接通' : '外呼中') : '紧急求助',
        description: payload.aiAnalysis
          ? (() => {
            try { return safeSummary(payload.aiAnalysis); } catch { return '老人发起紧急呼叫'; }
          })()
          : '老人发起紧急呼叫',
        type: t,
        time: now.toLocaleString(),
        elderlyName: payload.elderlyName || '老人',
        status: payload.status === 'falseAlarm' ? 'handled' : 'unread',
        priority: pr,
        location: payload.location ? JSON.stringify(payload.location) : undefined,
        contactInfo: payload.contactPhone,
        transcript: payload.transcript,
      };
      setWarnings(prev => {
        const others = prev.filter(w => w.id !== newItem.id);
        // 若同一告警已存在，则合并更新（状态、描述、定位、联系人等）
        const existing = prev.find(w => w.id === newItem.id);
        if (existing) {
          const merged: Warning = { ...existing, ...newItem };
          return [merged, ...others];
        }
        return [newItem, ...prev];
      });
    };
    socket.off('emergency:updated');
    socket.on('emergency:updated', handler);
    return () => { socket.off('emergency:updated', handler); };
  }, []);

  const getWarningColor = (type: string) => {
    switch (type) {
      case 'emergency':
        return '#ff6b6b';
      case 'warning':
        return '#ffa726';
      case 'reminder':
        return '#42a5f5';
      default:
        return '#999';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#ffa726';
      case 'low':
        return '#66bb6a';
      default:
        return '#999';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '未知';
    }
  };

  const handleWarningAction = (warning: Warning) => {
    // 标记为已处理
    setWarnings(warnings.map(w =>
      w.id === warning.id ? { ...w, status: 'handled' } : w
    ));
  };

  const handleContact = (warning: Warning) => {
    startVoiceCall(warning).catch(() => {
      // 失败时退化为电话
      if (warning.contactInfo) window.location.href = `tel:${warning.contactInfo}`;
    });
  };

  async function startVoiceCall(warning: Warning) {
    // 使用聊天通道发起应用内语音通话：创建或获取对话并跳转 Chat
    const me = AuthService.getCurrentUser();
    const myUsername = (me as any)?.username || (me as any)?.realname || '';
    const elderUsername = warning.elderlyName; // elderlyName 已兜底为老人 username/realname
    if (!myUsername || !elderUsername) throw new Error('缺少用户名');

    console.log('[Warnings] creating conversation...', { myUsername, elderUsername, alertId: warning.id });
    const createRes: any = await MessageService.createConversation({
      participants: [
        { username: myUsername, role: (me as any)?.role || 'family' },
        { username: elderUsername, role: 'elderly' }
      ],
      initialMessage: {
        content: JSON.stringify({ kind: 'voice_call_invite', alertId: warning.id }),
        type: 'voice_call'
      }
    });
    const conversationId = createRes?.data?.conversationId || createRes?.conversationId || createRes?.id;
    console.log('[Warnings] conversation result=', createRes, 'conversationId=', conversationId);
    if (conversationId) {
      navigate(`/chat/${conversationId}?call=1&alertId=${warning.id}`);
    } else {
      throw new Error('创建会话失败');
    }
  }

  function safeSummary(aiAnalysis: string): string {
    try {
      const obj = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;
      return obj?.summary || '老人发起紧急呼叫';
    } catch {
      return '老人发起紧急呼叫';
    }
  }

  // 从 aiAnalysis(JSON字符串) 中解析 riskLevel: 'low' | 'medium' | 'high'
  function parseRiskLevel(aiAnalysis?: string): 'low' | 'medium' | 'high' | undefined {
    if (!aiAnalysis) return undefined;
    try {
      const obj = typeof aiAnalysis === 'string' ? JSON.parse(aiAnalysis) : aiAnalysis;
      const level = (obj?.riskLevel || obj?.RiskLevel || '').toLowerCase();
      if (level === 'low' || level === 'medium' || level === 'high') return level;
      return undefined;
    } catch {
      return undefined;
    }
  }

  // 将 riskLevel 转成页面的 type/priority
  function riskToTypePriority(level?: 'low' | 'medium' | 'high') {
    switch (level) {
      case 'high':
        return { t: 'emergency' as const, pr: 'high' as const };
      case 'medium':
        // 简化为两级：medium 并入提醒
        return { t: 'reminder' as const, pr: 'low' as const };
      case 'low':
        return { t: 'reminder' as const, pr: 'low' as const };
      default:
        return { t: 'emergency' as const, pr: 'high' as const };
    }
  }

  function formatLocation(location: any): string {
    if (!location) return '无';

    try {
      // 如果是字符串，尝试解析JSON
      const loc = typeof location === 'string' ? JSON.parse(location) : location;

      if (loc && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        const [lng, lat] = loc.coordinates;
        // 检查坐标是否有效
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          // 添加精度信息（如果有的话）
          const accuracy = loc.accuracy ? ` (精度: ${Math.round(loc.accuracy)}m)` : '';
          return `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}${accuracy}`;
        } else {
          return '坐标无效';
        }
      }

      return '定位数据格式错误';
    } catch (error) {
      console.error('定位数据解析失败:', error);
      return '定位数据解析失败';
    }
  }

  async function fetchAndPlay(id: string) {
    try {
      const resp: any = await request.get(`/emergency/${id}`);
      const base64 = resp?.data?.audioClip as string | undefined;
      if (!base64) return;
      const audio = new Audio(base64);
      audio.play();
    } catch { }
  }

  // 保定理工东院固定位置
  const BAODING_FIXED_LOCATION = { lng: 115.488818, lat: 38.814838 };

  // 解析定位信息
  function parseLocation(location: any): { lng: number; lat: number } | null {
    if (!location) return null;

    try {
      const loc = typeof location === 'string' ? JSON.parse(location) : location;
      if (loc && loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        const [lng, lat] = loc.coordinates;
        if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
          return { lng, lat };
        }
      }
    } catch (error) {
      console.error('定位数据解析失败:', error);
    }
    return null;
  }

  // 获取当前位置或固定位置
  function getCurrentOrFixedLocation(): Promise<{ lng: number; lat: number }> {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lng: position.coords.longitude,
              lat: position.coords.latitude
            });
          },
          (error) => {
            // console.log('获取当前位置失败，使用固定位置:', error);
            resolve(BAODING_FIXED_LOCATION);
          },
          { timeout: 5000, enableHighAccuracy: true }
        );
      } else {
        resolve(BAODING_FIXED_LOCATION);
      }
    });
  }

  // 打开导航
  const openNavigation = (warning: Warning) => {
    const location = parseLocation(warning.location);
    if (!location) {
      alert('无法获取有效的定位信息');
      return;
    }
    setNavigationLocation(location);
    setShowNavigation(true);
  };

  // 初始化地图
  useEffect(() => {
    if (!showNavigation || !navigationLocation || !mapContainerRef.current) return;

    const initMap = async () => {
      setMapLoading(true);
      try {
        // 检查百度地图是否可用
        if (!(window as any).BMapGL) {
          alert('百度地图加载失败，请刷新页面重试');
          setShowNavigation(false);
          return;
        }

        const BMapGL = (window as any).BMapGL;
        const map = new BMapGL.Map(mapContainerRef.current);
        mapRef.current = map;

        // 设置地图中心点和缩放级别
        const destination = new BMapGL.Point(navigationLocation.lng, navigationLocation.lat);
        map.centerAndZoom(destination, 15);
        map.enableScrollWheelZoom(true);

        // 添加终点标记
        const endMarker = new BMapGL.Marker(destination);
        map.addOverlay(endMarker);

        // 添加终点标签
        const endLabel = new BMapGL.Label('老人位置', {
          position: destination,
          offset: new BMapGL.Size(10, -20)
        });
        endLabel.setStyle({
          color: '#ff4d4f',
          fontSize: '12px',
          backgroundColor: 'transparent',
          border: 'none'
        });
        map.addOverlay(endLabel);

        // 获取当前位置作为起点
        getCurrentOrFixedLocation().then((currentPos) => {
          const currentLocation = new BMapGL.Point(
            currentPos.lng,
            currentPos.lat
          );

          // 添加起点标记
          const startMarker = new BMapGL.Marker(currentLocation);
          map.addOverlay(startMarker);

          const startLabel = new BMapGL.Label('我的位置', {
            position: currentLocation,
            offset: new BMapGL.Size(10, -20)
          });
          startLabel.setStyle({
            color: '#1677ff',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: 'none'
          });
          map.addOverlay(startLabel);

          // 规划路线
          if (typeof BMapGL.DrivingRoute === 'function') {
            const driving = new BMapGL.DrivingRoute(map, {
              renderOptions: { map, autoViewport: true },
            });
            driving.search(currentLocation, destination);
          } else {
            // 如果不支持路线规划，显示直线
            const line = new BMapGL.Polyline([currentLocation, destination], {
              strokeColor: '#1677ff',
              strokeWeight: 6,
              strokeOpacity: 0.8
            });
            map.addOverlay(line);
            map.setViewport([currentLocation, destination]);
          }
        }).catch((error) => {
          console.error('获取当前位置失败:', error);
          // 如果获取当前位置失败，只显示终点
          map.centerAndZoom(destination, 15);
        });

        setMapLoading(false);
      } catch (error) {
        console.error('地图初始化失败:', error);
        alert('地图初始化失败，请重试');
        setShowNavigation(false);
        setMapLoading(false);
      }
    };

    initMap();

    // 清理函数
    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [showNavigation, navigationLocation]);

  const unreadCount = warnings.filter(w => w.status === 'unread').length;

  return (
    <div className={styles.warnings}>
      <PageHeader title="健康预警" />
      {/* 预警统计 */}
      <div className={styles['warning-stats']}>
        <div className={styles['stats-header']}>
          <div className={styles['stats-title']}>
            <i className="fas fa-user stats-icon"></i>
            <span>预警统计</span>
          </div>
        </div>
        <div className={styles['stats-content']}>
          <div className={styles['stat-item']}>
            <div className={styles['stat-number']} style={{ color: '#ff4d4f' }}>{warnings.filter(w => w.type === 'emergency').length}</div>
            <div className={styles['stat-label']} style={{ color: '#ff4d4f' }}>紧急预警</div>
          </div>
          <div className={styles['stat-item']}>
            <div className={styles['stat-number']} style={{ color: '#42a5f5' }}>{warnings.filter(w => w.type === 'reminder').length}</div>
            <div className={styles['stat-label']} style={{ color: '#42a5f5' }}>提醒事项</div>
          </div>
        </div>
      </div>

      {/* 预警列表 */}
      <div className={styles['warnings-list']}>
        {warnings.map((warning) => (
          <div key={warning.id} className={`${styles['warning-card']} ${styles[warning.status]} ${styles[warning.type]}`}>
            <div className={styles['warning-header']}>
              <div className={styles['warning-info']}>
                <div className={styles['warning-title']}>{warning.title}</div>
                <div className={styles['warning-time']}>{warning.time}</div>
              </div>
              <div className={styles['warning-tags']}>
                <span className={styles['warning-tag']} style={{ backgroundColor: getWarningColor(warning.type) }}>
                  {warning.type === 'emergency' ? '紧急' :
                    warning.type === 'warning' ? '一般' : '提醒'}
                </span>
                <span className={styles['warning-tag']} style={{ backgroundColor: getPriorityColor(warning.priority) }}>
                  {warning.priority === 'high' ? '高优先级' :
                    warning.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>
            </div>

            <div className={styles['warning-content']}>
              <div className={styles['warning-description']}>
                {warning.description}
              </div>

              <div className={styles['elderly-info']}>
                <div className={styles['elderly-avatar']}>
                  {warning.elderlyAvatar ? (
                    <img src={warning.elderlyAvatar} alt="头像" />
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </div>
                <span className={styles['elderly-name']}>{warning.elderlyName}</span>
                {warning.location && (
                  <span
                    className={styles['warning-location']}
                    onClick={() => openNavigation(warning)}
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    📍 {formatLocation(warning.location)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles['warning-actions']}>
              {warning.type === 'emergency' && (
                <button
                  className={`${styles['action-btn']} ${styles['emergency-btn']}`}
                  onClick={() => handleContact(warning)}
                >
                  <i className="fas fa-phone"></i>
                  立即联系
                </button>
              )}
              {warning.type === 'reminder' && (
                <button
                  className={`${styles['action-btn']} ${styles['reminder-btn']}`}
                  onClick={() => handleContact(warning)}
                >
                  <i className="fas fa-phone"></i>
                  立即联系
                </button>
              )}
              <button
                className={`${styles['action-btn']} ${styles['detail-btn']}`}
                onClick={() => { setSelected(warning); setShowModal(true); }}
              >
                查看详情
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 空状态 */}
      {warnings.length === 0 && (
        <div className={styles['empty-state']}>
          <div className={styles['empty-icon']}>🔔</div>
          <div className={styles['empty-text']}>暂无预警信息</div>
          <div className={styles['empty-desc']}>您的老人目前都很安全</div>
        </div>
      )}

      {/* 模态框 */}
      {showModal && (
        <div className={styles['modal-overlay']} onClick={() => setShowModal(false)}>
          <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3>详情</h3>
              <button className={styles['modal-close']} onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles['modal-body']}>
              <div className={styles['modal-item']}>
                <span className={styles['modal-label']}>定位:</span>
                <span className={styles['modal-value']}>{formatLocation(selected?.location)}</span>
              </div>
              <div className={styles['modal-item']}>
                <span className={styles['modal-label']}>摘要:</span>
                <span className={styles['modal-value']}>{selected?.description}</span>
              </div>
              {selected?.transcript && (
                <div className={styles['modal-item']}>
                  <span className={styles['modal-label']}>语音内容:</span>
                  <span className={styles['modal-value']}>{selected.transcript}</span>
                </div>
              )}
            </div>
            <div className={styles['modal-footer']}>
              <button className={`${styles['modal-btn']} ${styles['secondary']}`} onClick={() => setShowModal(false)}>
                关闭
              </button>
              {selected?.location && (
                <button
                  className={`${styles['modal-btn']} ${styles['primary']}`}
                  onClick={() => {
                    setShowModal(false);
                    openNavigation(selected);
                  }}
                >
                  导航到位置
                </button>
              )}
              <button
                className={`${styles['modal-btn']} ${styles['primary']}`}
                onClick={() => selected && fetchAndPlay(selected.id)}
              >
                播放录音
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导航模态框 */}
      {showNavigation && (
        <div className={styles['modal-overlay']} onClick={() => setShowNavigation(false)}>
          <div className={styles['modal-content']} onClick={(e) => e.stopPropagation()} style={{ width: '90vw', height: '80vh', maxWidth: 'none' }}>
            <div className={styles['modal-header']}>
              <h3>导航到老人位置</h3>
              <button className={styles['modal-close']} onClick={() => setShowNavigation(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles['modal-body']} style={{ height: 'calc(100% - 120px)', padding: 0 }}>
              {mapLoading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  fontSize: '16px',
                  color: '#666'
                }}>
                  正在加载地图...
                </div>
              ) : (
                <div
                  ref={mapContainerRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '8px'
                  }}
                />
              )}
            </div>
            <div className={styles['modal-footer']}>
              <button className={`${styles['modal-btn']} ${styles['secondary']}`} onClick={() => setShowNavigation(false)}>
                关闭
              </button>
              {navigationLocation && (
                <button
                  className={`${styles['modal-btn']} ${styles['primary']}`}
                  onClick={() => {
                    // 打开外部导航应用
                    const url = `https://api.map.baidu.com/direction?origin=&destination=${navigationLocation.lat},${navigationLocation.lng}&mode=driving&region=全国`;
                    window.open(url, '_blank');
                  }}
                >
                  打开百度地图
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warnings;