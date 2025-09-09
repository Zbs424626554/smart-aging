import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Tag, Toast, Empty, NavBar } from 'antd-mobile';
import { LeftOutline, UserOutline, PhonebookOutline, CalendarOutline } from 'antd-mobile-icons';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './ElderlyDetail.module.css';
import { ElderlyService } from '../services/elderly.service';
import type { ElderlyUser } from '../services/elderly.service';

interface ElderlyDetail extends ElderlyUser {
  healthStatus?: string;
  bloodPressure?: string;
  bloodSugar?: string;
  heartRate?: string;
  temperature?: number;
  oxygenLevel?: number;
  lastHealthUpdate?: string;
  // 新增病例相关字段
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  allergies?: string[];
  medications?: string[];
  medicalHistory?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  recentHealthEvents?: Array<{
    date: string;
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

const ElderlyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [elderly, setElderly] = useState<ElderlyDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchElderlyDetail();
    }
  }, [id]);

  const fetchElderlyDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await ElderlyService.getElderlyDetail(id);

      if (response.code === 200 && response.data) {
        const elderlyData = {
          ...response.data.elderly,
          healthStatus: '良好', // 默认值，实际应该从健康记录获取
          bloodPressure: '120/80',
          bloodSugar: '5.2',
          heartRate: '72',
          temperature: 36.5,
          oxygenLevel: 98,
          lastHealthUpdate: new Date().toLocaleDateString(),
        };
        setElderly(elderlyData);
      } else {
        Toast.show({
          content: response.message || '获取老人详情失败',
          position: 'center',
        });
      }
    } catch (error) {
      console.error('获取老人详情失败:', error);
      Toast.show({
        content: '获取老人详情失败',
        position: 'center',
      });
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case '良好':
        return 'success';
      case '需关注':
        return 'warning';
      case '异常':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>加载中...</div>
      </div>
    );
  }

  if (!elderly) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="老人信息不存在" />
      </div>
    );
  }

  return (
    <div className={styles.elderlyDetail}>
      {/* 导航栏 */}
      <NavBar onBack={() => navigate(-1)}>老人详情</NavBar>

      {/* 基本信息 */}
      <Card className={styles.basicInfoCard}>
        <div className={styles.avatarSection}>
          <Avatar
            className={styles.avatar}
            src={elderly.avatar || ''}
            fallback={<UserOutline style={{ fontSize: 48 }} />}
          />
          <div className={styles.nameSection}>
            <h2 className={styles.name}>{elderly.realname || elderly.username}</h2>
            <p className={styles.username}>用户名：{elderly.username}</p>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <PhonebookOutline className={styles.infoIcon} />
            <span className={styles.infoLabel}>手机号</span>
            <span className={styles.infoValue}>{elderly.phone}</span>
          </div>
          <div className={styles.infoItem}>
            <CalendarOutline className={styles.infoIcon} />
            <span className={styles.infoLabel}>绑定时间</span>
            <span className={styles.infoValue}>{formatDate(elderly.createdTime)}</span>
          </div>
        </div>
      </Card>

      {/* 健康状态概览 */}
      <Card className={styles.healthCard}>
        <h3 className={styles.cardTitle}>健康状态概览</h3>
        <div className={styles.healthStatus}>
          <span className={styles.statusLabel}>当前状态：</span>
          <Tag color={getHealthStatusColor(elderly.healthStatus || '良好')}>
            {elderly.healthStatus || '良好'}
          </Tag>
        </div>
        <div className={styles.lastUpdate}>
          最后更新：{elderly.lastHealthUpdate}
        </div>
      </Card>

      {/* 健康指标 */}
      <Card className={styles.metricsCard}>
        <h3 className={styles.cardTitle}>健康指标</h3>
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>血压</div>
            <div className={styles.metricValue}>{elderly.bloodPressure}</div>
            <div className={styles.metricUnit}>mmHg</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>血糖</div>
            <div className={styles.metricValue}>{elderly.bloodSugar}</div>
            <div className={styles.metricUnit}>mmol/L</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>心率</div>
            <div className={styles.metricValue}>{elderly.heartRate}</div>
            <div className={styles.metricUnit}>次/分</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>体温</div>
            <div className={styles.metricValue}>{elderly.temperature}</div>
            <div className={styles.metricUnit}>°C</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>血氧</div>
            <div className={styles.metricValue}>{elderly.oxygenLevel}</div>
            <div className={styles.metricUnit}>%</div>
          </div>
        </div>
      </Card>

      {/* 基本信息 */}
      <Card className={styles.basicInfoCard}>
        <h3 className={styles.cardTitle}>基本信息</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>年龄</span>
            <span className={styles.infoValue}>{elderly.age || '75'}岁</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>性别</span>
            <span className={styles.infoValue}>{elderly.gender || '男'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>身高</span>
            <span className={styles.infoValue}>{elderly.height || '170'}cm</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>体重</span>
            <span className={styles.infoValue}>{elderly.weight || '65'}kg</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>BMI</span>
            <span className={styles.infoValue}>{elderly.bmi || '22.5'}</span>
          </div>
        </div>
      </Card>

      {/* 过敏史 */}
      <Card className={styles.allergiesCard}>
        <h3 className={styles.cardTitle}>过敏史</h3>
        <div className={styles.tagList}>
          {(elderly.allergies || ['青霉素', '海鲜']).map((allergy, index) => (
            <Tag key={index} color="danger" fill="outline" className={styles.allergyTag}>
              {allergy}
            </Tag>
          ))}
        </div>
      </Card>

      {/* 用药记录 */}
      <Card className={styles.medicationsCard}>
        <h3 className={styles.cardTitle}>当前用药</h3>
        <div className={styles.medicationList}>
          {(elderly.medications || ['阿司匹林', '钙片', '维生素D']).map((medication, index) => (
            <div key={index} className={styles.medicationItem}>
              <span className={styles.medicationName}>{medication}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 病史 */}
      <Card className={styles.historyCard}>
        <h3 className={styles.cardTitle}>病史</h3>
        <div className={styles.historyList}>
          {(elderly.medicalHistory || ['高血压', '糖尿病', '骨质疏松']).map((history, index) => (
            <div key={index} className={styles.historyItem}>
              <span className={styles.historyName}>{history}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 紧急联系人 */}
      <Card className={styles.emergencyCard}>
        <h3 className={styles.cardTitle}>紧急联系人</h3>
        <div className={styles.emergencyInfo}>
          <div className={styles.emergencyItem}>
            <span className={styles.emergencyLabel}>姓名：</span>
            <span className={styles.emergencyValue}>
              {elderly.emergencyContact?.name || '张小明'}
            </span>
          </div>
          <div className={styles.emergencyItem}>
            <span className={styles.emergencyLabel}>电话：</span>
            <span className={styles.emergencyValue}>
              {elderly.emergencyContact?.phone || '13800138000'}
            </span>
          </div>
          <div className={styles.emergencyItem}>
            <span className={styles.emergencyLabel}>关系：</span>
            <span className={styles.emergencyValue}>
              {elderly.emergencyContact?.relationship || '儿子'}
            </span>
          </div>
        </div>
      </Card>

      {/* 近期健康事件 */}
      <Card className={styles.eventsCard}>
        <h3 className={styles.cardTitle}>近期健康事件</h3>
        <div className={styles.eventsList}>
          {(elderly.recentHealthEvents || [
            {
              date: '2024-01-15',
              type: '血压异常',
              description: '血压偏高，已调整用药',
              severity: 'medium'
            },
            {
              date: '2024-01-10',
              type: '血糖检查',
              description: '血糖控制良好',
              severity: 'low'
            },
            {
              date: '2024-01-05',
              type: '跌倒事件',
              description: '轻微跌倒，无大碍',
              severity: 'low'
            }
          ]).map((event, index) => (
            <div key={index} className={styles.eventItem}>
              <div className={styles.eventHeader}>
                <span className={styles.eventDate}>{event.date}</span>
                <Tag
                  color={event.severity === 'high' ? 'danger' : event.severity === 'medium' ? 'warning' : 'success'}
                  fill="outline"
                >
                  {event.type}
                </Tag>
              </div>
              <div className={styles.eventDescription}>{event.description}</div>
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
          onClick={() => navigate(`/elderly/${id}/health-report`)}
        >
          查看健康报告
        </Button>
        <Button
          className={styles.actionBtn}
          color="default"
          fill="outline"
          onClick={() => navigate(-1)}
        >
          返回列表
        </Button>
      </div>
    </div>
  );
};

export default ElderlyDetail;
