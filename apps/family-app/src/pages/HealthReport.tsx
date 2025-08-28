import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Toast, Empty, NavBar } from 'antd-mobile';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './HealthReport.module.css';
import { ElderlyService } from '../services/elderly.service';

interface HealthData {
  date: string;
  bloodPressure: string;
  bloodSugar: number;
  heartRate: number;
  temperature: number;
  oxygenLevel: number;
  status: 'normal' | 'warning' | 'danger';
}

interface HealthReportData {
  elderlyId: string;
  elderlyName: string;
  currentStatus: string;
  trend: 'improving' | 'stable' | 'declining';
  lastWeekData: HealthData[];
  recommendations: string[];
}

const HealthReport: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [healthData, setHealthData] = useState<HealthReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchHealthReport();
    }
  }, [id]);

  const fetchHealthReport = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await ElderlyService.getElderlyHealthData(id);

      if (response.code === 200 && response.data) {
        // 模拟健康报告数据
        const mockData: HealthReportData = {
          elderlyId: id,
          elderlyName: response.data.elderlyName || '老人',
          currentStatus: '良好',
          trend: 'stable',
          lastWeekData: [
            {
              date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              bloodPressure: '118/78',
              bloodSugar: 5.1,
              heartRate: 70,
              temperature: 36.4,
              oxygenLevel: 98,
              status: 'normal'
            },
            {
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              bloodPressure: '122/82',
              bloodSugar: 5.3,
              heartRate: 72,
              temperature: 36.5,
              oxygenLevel: 97,
              status: 'normal'
            },
            {
              date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              bloodPressure: '125/85',
              bloodSugar: 5.5,
              heartRate: 75,
              temperature: 36.6,
              oxygenLevel: 96,
              status: 'warning'
            },
            {
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              bloodPressure: '120/80',
              bloodSugar: 5.2,
              heartRate: 71,
              temperature: 36.4,
              oxygenLevel: 98,
              status: 'normal'
            },
            {
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              bloodPressure: '118/78',
              bloodSugar: 5.0,
              heartRate: 69,
              temperature: 36.3,
              oxygenLevel: 99,
              status: 'normal'
            },
            {
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              bloodPressure: '115/75',
              bloodSugar: 4.9,
              heartRate: 68,
              temperature: 36.4,
              oxygenLevel: 98,
              status: 'normal'
            },
            {
              date: new Date().toLocaleDateString(),
              bloodPressure: '120/80',
              bloodSugar: 5.2,
              heartRate: 72,
              temperature: 36.5,
              oxygenLevel: 98,
              status: 'normal'
            }
          ],
          recommendations: [
            '血压控制良好，建议继续保持低盐饮食',
            '血糖水平正常，建议适量运动，控制碳水化合物摄入',
            '心率稳定，建议保持规律作息',
            '体温正常，血氧饱和度良好',
            '建议定期进行健康检查，保持良好生活习惯'
          ]
        };
        setHealthData(mockData);
      } else {
        Toast.show({
          content: response.message || '获取健康报告失败',
          position: 'center',
        });
      }
    } catch (error) {
      console.error('获取健康报告失败:', error);
      Toast.show({
        content: '获取健康报告失败',
        position: 'center',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <span style={{ color: '#52c41a' }}>↗</span>;
      case 'declining':
        return <span style={{ color: '#ff4d4f' }}>↘</span>;
      default:
        return <span style={{ color: '#1890ff' }}>→</span>;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '改善中';
      case 'declining':
        return '需关注';
      default:
        return '稳定';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>加载中...</div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="健康报告不存在" />
      </div>
    );
  }

  return (
    <div className={styles.healthReport}>
      {/* 导航栏 */}
      <NavBar onBack={() => navigate(-1)}>健康报告</NavBar>

      {/* 概览卡片 */}
      <Card className={styles.overviewCard}>
        <h2 className={styles.elderlyName}>{healthData.elderlyName} 的健康报告</h2>
        <div className={styles.statusOverview}>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>当前状态：</span>
            <Tag color="success">{healthData.currentStatus}</Tag>
          </div>
          <div className={styles.statusItem}>
            <span className={styles.statusLabel}>健康趋势：</span>
            <div className={styles.trendInfo}>
              {getTrendIcon(healthData.trend)}
              <span className={styles.trendText}>{getTrendText(healthData.trend)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 一周趋势 */}
      <Card className={styles.trendCard}>
        <h3 className={styles.cardTitle}>一周健康趋势</h3>
        <div className={styles.trendChart}>
          {healthData.lastWeekData.map((data, index) => (
            <div key={index} className={styles.trendItem}>
              <div className={styles.trendDate}>{data.date}</div>
              <div className={styles.trendMetrics}>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>血压:</span>
                  <span className={styles.metricValue}>{data.bloodPressure}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>血糖:</span>
                  <span className={styles.metricValue}>{data.bloodSugar}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>心率:</span>
                  <span className={styles.metricValue}>{data.heartRate}</span>
                </div>
              </div>
              <Tag
                color={getStatusColor(data.status)}
                className={styles.statusTag}
              >
                {data.status === 'normal' ? '正常' : data.status === 'warning' ? '注意' : '异常'}
              </Tag>
            </div>
          ))}
        </div>
      </Card>

      {/* 健康建议 */}
      <Card className={styles.recommendationsCard}>
        <h3 className={styles.cardTitle}>健康建议</h3>
        <div className={styles.recommendationsList}>
          {healthData.recommendations.map((recommendation, index) => (
            <div key={index} className={styles.recommendationItem}>
              <div className={styles.recommendationNumber}>{index + 1}</div>
              <div className={styles.recommendationText}>{recommendation}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 操作按钮 */}
      <div className={styles.actionButtons}>
        <Button
          className={styles.actionBtn}
          color="primary"
          fill="outline"
          onClick={() => navigate(`/elderly/${id}`)}
        >
          返回详情
        </Button>
        <Button
          className={styles.actionBtn}
          color="default"
          fill="outline"
          onClick={() => navigate('/elderly')}
        >
          返回列表
        </Button>
      </div>
    </div>
  );
};

export default HealthReport;
