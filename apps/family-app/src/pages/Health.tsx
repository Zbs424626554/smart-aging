import React, { useState, useEffect, useRef } from 'react';
import { Toast } from 'antd-mobile';
import styles from './Health.module.css';
import { generateHealthAdvice } from '../services/ai.service';
import { HealthService } from '../services/health.service';
import { ElderlyService } from '../services/elderly.service';
import type { HealthData } from '../services/health.service';
import type { ElderlyUser } from '../services/elderly.service';

interface Elderly {
  id: string;
  name: string;
  status: string;
}

interface HealthAdvice {
  title: string;
  description: string;
  icon: string;
}

// 生成随机健康数据的函数
const generateRandomHealthData = (elderlyId: string, elderlyName: string): HealthData => {
  // 随机决定是否"生病"（20%概率）
  const isSick = Math.random() < 0.2;

  // 生成血压数据
  let systolic, diastolic;
  if (isSick) {
    // 生病时血压偏高
    systolic = Math.floor(Math.random() * 40) + 140; // 140-180
    diastolic = Math.floor(Math.random() * 20) + 90; // 90-110
  } else {
    // 正常血压
    systolic = Math.floor(Math.random() * 40) + 100; // 100-140
    diastolic = Math.floor(Math.random() * 20) + 60; // 60-80
  }
  const bloodPressure = `${systolic}/${diastolic}`;

  // 生成血糖数据
  let bloodSugar;
  if (isSick) {
    // 生病时血糖偏高
    bloodSugar = Math.random() * 3 + 6.5; // 6.5-9.5
  } else {
    // 正常血糖
    bloodSugar = Math.random() * 2 + 4.0; // 4.0-6.0
  }

  // 生成心率数据
  let heartRate;
  if (isSick) {
    // 生病时心率异常
    if (Math.random() < 0.5) {
      heartRate = Math.floor(Math.random() * 20) + 110; // 110-130 (偏快)
    } else {
      heartRate = Math.floor(Math.random() * 15) + 45; // 45-60 (偏慢)
    }
  } else {
    // 正常心率
    heartRate = Math.floor(Math.random() * 30) + 60; // 60-90
  }

  // 生成体温数据
  let temperature;
  if (isSick) {
    // 生病时体温偏高
    temperature = Math.random() * 2 + 37.5; // 37.5-39.5
  } else {
    // 正常体温
    temperature = Math.random() * 1 + 36.0; // 36.0-37.0
  }

  // 生成血氧数据
  const oxygenLevel = isSick ?
    Math.floor(Math.random() * 10) + 85 : // 85-95 (偏低)
    Math.floor(Math.random() * 5) + 95; // 95-100 (正常)

  // 生成更新时间
  const now = new Date();
  const lastUpdate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return {
    id: `health_${elderlyId}_${Date.now()}`,
    elderlyId,
    elderlyName,
    heartRate,
    bloodPressure,
    temperature: Math.round(temperature * 10) / 10, // 保留一位小数
    oxygenLevel,
    bloodSugar: Math.round(bloodSugar * 10) / 10, // 保留一位小数
    lastUpdate,
    status: isSick ? 'warning' : 'normal',
  };
};

const Health: React.FC = () => {
  const [selectedElderly, setSelectedElderly] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<HealthAdvice[]>([]);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [showAiAdvice, setShowAiAdvice] = useState(false);
  const [elderlyList, setElderlyList] = useState<Elderly[]>([]);
  const [loading, setLoading] = useState(false);
  const [healthDataMap, setHealthDataMap] = useState<Map<string, HealthData>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取绑定的老人列表
  const fetchBoundElderly = async () => {
    try {
      setLoading(true);
      const response = await ElderlyService.getElderlyList();

      if (response.code === 200 && response.data) {
        const boundElderly = response.data.list.map((user: ElderlyUser) => ({
          id: user.id,
          name: user.realname || user.username,
          status: '健康状态良好' // 这里可以根据实际健康数据动态设置
        }));

        setElderlyList(boundElderly);

        // 为每个老人生成随机健康数据
        const newHealthDataMap = new Map<string, HealthData>();
        boundElderly.forEach(elderly => {
          newHealthDataMap.set(elderly.id, generateRandomHealthData(elderly.id, elderly.name));
        });
        setHealthDataMap(newHealthDataMap);

        // 如果有绑定的老人，默认选择第一个
        if (boundElderly.length > 0 && !selectedElderly) {
          setSelectedElderly(boundElderly[0].id);
        }
      } else {
        console.error('获取绑定老人列表失败:', response.message);
        Toast.show({
          content: '获取老人列表失败',
          position: 'center',
        });
      }
    } catch (error) {
      console.error('获取绑定老人列表失败:', error);
      Toast.show({
        content: '获取老人列表失败',
        position: 'center',
      });
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取绑定的老人列表
  useEffect(() => {
    fetchBoundElderly();
  }, []);

  const currentHealthData = healthDataMap.get(selectedElderly);
  const currentElderly = elderlyList.find(elderly => elderly.id === selectedElderly);

  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleElderlySelect = (elderlyId: string) => {
    setSelectedElderly(elderlyId);
    setShowDropdown(false);
    // 切换老人时重置AI建议
    setAiAdvice([]);
    setShowAiAdvice(false);
  };

  // 刷新当前老人的健康数据
  const refreshHealthData = () => {
    if (selectedElderly && currentElderly) {
      const newHealthData = generateRandomHealthData(selectedElderly, currentElderly.name);
      setHealthDataMap(prev => new Map(prev).set(selectedElderly, newHealthData));
      Toast.show({
        content: '健康数据已刷新',
        position: 'center',
      });
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // 获取AI健康建议
  const handleGetAiAdvice = async () => {
    if (!currentHealthData || !currentElderly) return;

    setIsLoadingAdvice(true);
    try {
      const advice = await generateHealthAdvice(currentHealthData, currentElderly.name);
      setAiAdvice(advice);
      setShowAiAdvice(true);
    } catch (error) {
      console.error('获取AI建议失败:', error);
      // 使用默认建议
      setAiAdvice([
        {
          title: "定期运动",
          description: "建议每天进行30分钟轻度运动，如散步、太极拳等，有助于改善血液循环和心肺功能。",
          icon: "💡"
        },
        {
          title: "均衡饮食",
          description: "注意营养搭配，少盐少油，多摄入蔬菜水果，控制血糖和血压。",
          icon: "🥗"
        },
        {
          title: "充足睡眠",
          description: "保证7-8小时优质睡眠，有助于身体恢复和免疫系统功能。",
          icon: "😴"
        }
      ]);
      setShowAiAdvice(true);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '正常';
      case 'warning':
        return '注意';
      case 'danger':
        return '异常';
      default:
        return '未知';
    }
  };

  const getHeartRateStatus = (rate: number) => {
    if (rate < 60) return 'danger';
    if (rate > 100) return 'warning';
    return 'normal';
  };

  const getBloodSugarStatus = (sugar: number) => {
    if (sugar < 3.9 || sugar > 6.1) return 'warning';
    return 'normal';
  };

  const getBloodPressureStatus = (pressure: string) => {
    const [systolic, diastolic] = pressure.split('/');
    const systolicNum = parseInt(systolic, 10);
    const diastolicNum = parseInt(diastolic, 10);

    if (systolicNum > 140 || diastolicNum > 90) return 'danger';
    if (systolicNum > 120 || diastolicNum > 80) return 'warning';
    return 'normal';
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp > 37.5) return 'danger';
    if (temp > 37.2) return 'warning';
    return 'normal';
  };

  return (
    <div className={styles.health}>
      {/* 老人选择器 */}
      <div
        ref={dropdownRef}
        className={`${styles.elderlySelector} ${showDropdown ? styles.active : ''}`}
        onClick={toggleDropdown}
      >
        {loading ? (
          <div className={styles.elderlyInfo}>
            <div className={styles.elderlyAvatar}>...</div>
            <div className={styles.elderlyDetails}>
              <div className={styles.elderlyName}>加载中...</div>
              <div className={styles.elderlyStatus}>请稍候</div>
            </div>
            <i className={`fas fa-chevron-down ${styles.selectorArrow}`}></i>
          </div>
        ) : elderlyList.length > 0 ? (
          <div className={styles.elderlyInfo}>
            <div className={styles.elderlyAvatar}>{currentElderly?.name?.slice(0, 1) || '长'}</div>
            <div className={styles.elderlyDetails}>
              <div className={styles.elderlyName}>{currentElderly?.name || '请选择老人'}</div>
              <div className={styles.elderlyStatus}>{currentElderly?.status || '健康状态良好'}</div>
            </div>
            <i className={`fas fa-chevron-down ${styles.selectorArrow}`}></i>
          </div>
        ) : (
          <div className={styles.elderlyInfo}>
            <div className={styles.elderlyAvatar}>👴</div>
            <div className={styles.elderlyDetails}>
              <div className={styles.elderlyName}>暂未绑定老人</div>
              <div className={styles.elderlyStatus}>请先绑定老人</div>
            </div>
            <i className={`fas fa-chevron-down ${styles.selectorArrow}`}></i>
          </div>
        )}

        {/* 下拉选项 */}
        {showDropdown && (
          <div className={styles.elderlyDropdown}>
            {elderlyList.length > 0 ? (
              elderlyList.map((elderly) => (
                <div
                  key={elderly.id}
                  className={`${styles.elderlyOption} ${elderly.id === selectedElderly ? styles.selected : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElderlySelect(elderly.id);
                  }}
                >
                  <div className={styles.elderlyOptionAvatar}>{elderly.name.slice(0, 1)}</div>
                  <div className={styles.elderlyOptionInfo}>
                    <div className={styles.elderlyOptionName}>{elderly.name}</div>
                    <div className={styles.elderlyOptionStatus}>{elderly.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noElderlyMessage}>
                <div className={styles.noElderlyIcon}>👴</div>
                <div className={styles.noElderlyText}>
                  <div className={styles.noElderlyTitle}>暂未绑定老人</div>
                  <div className={styles.noElderlyDesc}>
                    您还没有绑定任何老人，请先到老人管理页面绑定老人
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 今日健康数据 */}
      <div className={styles.healthDataCard}>
        <div className={styles.healthDataHeader}>
          <h3>今日健康数据</h3>
          <div className={styles.healthDataActions}>
            <div className={styles.healthDate}>{currentHealthData?.lastUpdate || '暂无数据'}</div>
            {selectedElderly && elderlyList.length > 0 && (
              <button
                className={styles.refreshHealthButton}
                onClick={refreshHealthData}
                title="刷新健康数据"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            )}
          </div>
        </div>

        {!selectedElderly || elderlyList.length === 0 ? (
          <div className={styles.noHealthData}>
            <div className={styles.noHealthDataIcon}>📊</div>
            <div className={styles.noHealthDataText}>
              <div className={styles.noHealthDataTitle}>暂无健康数据</div>
              <div className={styles.noHealthDataDesc}>
                {elderlyList.length === 0
                  ? '请先绑定老人以查看健康数据'
                  : '请选择老人查看健康数据'
                }
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.healthMetricsGrid}>
            {/* 血压 */}
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>
                <i className="fas fa-heartbeat"></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>血压</div>
                <div className={styles.metricValue}>{currentHealthData?.bloodPressure || '--'}</div>
                <div className={styles.metricUnit}>mmHg</div>
              </div>
              <div className={styles.metricStatusContainer}>
                {(() => {
                  const status = getBloodPressureStatus(currentHealthData?.bloodPressure || '0/0');
                  return (
                    <span className={`${styles.metricStatus} ${status === 'normal' ? styles.statusNormal : status === 'warning' ? styles.statusWarning : styles.statusDanger}`}>
                      {getStatusText(status)}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* 血糖 */}
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>
                <i className="fas fa-cubes"></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>血糖</div>
                <div className={styles.metricValue}>{currentHealthData?.bloodSugar || '--'}</div>
                <div className={styles.metricUnit}>mmol/L</div>
              </div>
              <div className={styles.metricStatusContainer}>
                {(() => {
                  const status = getBloodSugarStatus(currentHealthData?.bloodSugar || 0);
                  return (
                    <span className={`${styles.metricStatus} ${status === 'normal' ? styles.statusNormal : styles.statusWarning}`}>
                      {getStatusText(status)}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* 心率 */}
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>
                <i className="fas fa-heart"></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>心率</div>
                <div className={styles.metricValue}>{currentHealthData?.heartRate || '--'}</div>
                <div className={styles.metricUnit}>bpm</div>
              </div>
              <div className={styles.metricStatusContainer}>
                {(() => {
                  const status = getHeartRateStatus(currentHealthData?.heartRate || 0);
                  return (
                    <span className={`${styles.metricStatus} ${status === 'normal' ? styles.statusNormal : status === 'warning' ? styles.statusWarning : styles.statusDanger}`}>
                      {getStatusText(status)}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* 体温 */}
            <div className={styles.metricCard}>
              <div className={styles.metricIcon}>
                <i className="fas fa-thermometer-half"></i>
              </div>
              <div className={styles.metricContent}>
                <div className={styles.metricLabel}>体温</div>
                <div className={styles.metricValue}>{currentHealthData?.temperature || '--'}</div>
                <div className={styles.metricUnit}>°C</div>
              </div>
              <div className={styles.metricStatusContainer}>
                {(() => {
                  const status = getTemperatureStatus(currentHealthData?.temperature || 0);
                  return (
                    <span className={`${styles.metricStatus} ${status === 'normal' ? styles.statusNormal : status === 'warning' ? styles.statusWarning : styles.statusDanger}`}>
                      {getStatusText(status)}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI健康建议 */}
      <div className={styles.healthAdvice}>
        <div className={styles.adviceHeader}>
          <h3>AI健康建议</h3>
          <div className={styles.adviceActions}>
            {showAiAdvice && (
              <button
                className={styles.refreshButton}
                onClick={handleGetAiAdvice}
                disabled={isLoadingAdvice}
                title="重新生成建议"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            )}
            {!showAiAdvice && (
              <button
                className={styles.aiAdviceButton}
                onClick={handleGetAiAdvice}
                disabled={isLoadingAdvice}
              >
                {isLoadingAdvice ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    生成中...
                  </>
                ) : (
                  <>
                    <i className="fas fa-robot"></i>
                    查看AI建议
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {showAiAdvice && aiAdvice.length > 0 ? (
          <div className={styles.adviceList}>
            {aiAdvice.map((advice, index) => (
              <div key={index} className={styles.adviceItem}>
                <div className={styles.adviceIcon}>{advice.icon}</div>
                <div className={styles.adviceContent}>
                  <div className={styles.adviceTitle}>{advice.title}</div>
                  <div className={styles.adviceDesc}>{advice.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : !showAiAdvice ? (
          <div className={styles.advicePlaceholder}>
            <div className={styles.placeholderIcon}>🤖</div>
            <div className={styles.placeholderText}>点击"查看AI建议"获取个性化健康建议</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Health;