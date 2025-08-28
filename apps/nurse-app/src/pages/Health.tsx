import React, { useState, useEffect, useRef } from 'react';
import { Typography, Row, Col, Select, Statistic, Avatar } from 'antd';
import {
  HeartOutlined,
  DropboxOutlined,
  UserOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as echarts from 'echarts';
import './Health.css';

const { Title, Text } = Typography;

interface HealthData {
  date: string;
  systolic: number; // 收缩压
  diastolic: number; // 舒张压
  bloodSugar: number; // 血糖
  heartRate: number; // 心率
  temperature: number; // 体温
  weight: number; // 体重
}

const Health: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const elderlyName = searchParams.get('name') || '张奶奶';

  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [healthData, setHealthData] = useState<HealthData[]>([]);

  const bloodPressureChartRef = useRef<HTMLDivElement>(null);
  const bloodSugarChartRef = useRef<HTMLDivElement>(null);
  const heartRateChartRef = useRef<HTMLDivElement>(null);
  const temperatureChartRef = useRef<HTMLDivElement>(null);

  // 模拟健康数据
  useEffect(() => {
    const generateHealthData = (days: number): HealthData[] => {
      const data: HealthData[] = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        data.push({
          date: date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
          systolic: Math.floor(Math.random() * 30) + 120, // 120-150
          diastolic: Math.floor(Math.random() * 20) + 70, // 70-90
          bloodSugar: Math.floor(Math.random() * 40) + 80, // 80-120
          heartRate: Math.floor(Math.random() * 30) + 60, // 60-90
          temperature: Math.floor(Math.random() * 20) / 10 + 36.5, // 36.5-37.5
          weight: Math.floor(Math.random() * 10) + 65, // 65-75
        });
      }

      return data;
    };

    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    setHealthData(generateHealthData(days));
  }, [selectedPeriod]);

  // 初始化血压图表
  useEffect(() => {
    if (bloodPressureChartRef.current && healthData.length > 0) {
      const chart = echarts.init(bloodPressureChartRef.current);

      const option: any = {
        title: {
          text: '血压趋势',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['收缩压', '舒张压'],
          bottom: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: healthData.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'mmHg',
          min: 60,
          max: 160
        },
        series: [
          {
            name: '收缩压',
            type: 'line',
            data: healthData.map(item => item.systolic),
            itemStyle: {
              color: '#ff4d4f'
            },
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 6
          },
          {
            name: '舒张压',
            type: 'line',
            data: healthData.map(item => item.diastolic),
            itemStyle: {
              color: '#1890ff'
            },
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [healthData]);

  // 初始化血糖图表
  useEffect(() => {
    if (bloodSugarChartRef.current && healthData.length > 0) {
      const chart = echarts.init(bloodSugarChartRef.current);

      const option: any = {
        title: {
          text: '血糖趋势',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: healthData.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'mg/dL',
          min: 60,
          max: 140
        },
        series: [
          {
            name: '血糖',
            type: 'line',
            data: healthData.map(item => item.bloodSugar),
            itemStyle: {
              color: '#52c41a'
            },
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 6,
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
                  { offset: 1, color: 'rgba(82, 196, 26, 0.1)' }
                ]
              }
            }
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [healthData]);

  // 初始化心率图表
  useEffect(() => {
    if (heartRateChartRef.current && healthData.length > 0) {
      const chart = echarts.init(heartRateChartRef.current);

      const option: any = {
        title: {
          text: '心率趋势',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: healthData.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: 'bpm',
          min: 50,
          max: 100
        },
        series: [
          {
            name: '心率',
            type: 'line',
            data: healthData.map(item => item.heartRate),
            itemStyle: {
              color: '#722ed1'
            },
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [healthData]);

  // 初始化体温图表
  useEffect(() => {
    if (temperatureChartRef.current && healthData.length > 0) {
      const chart = echarts.init(temperatureChartRef.current);

      const option: any = {
        title: {
          text: '体温趋势',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: healthData.map(item => item.date),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          name: '°C',
          min: 36.0,
          max: 38.0
        },
        series: [
          {
            name: '体温',
            type: 'line',
            data: healthData.map(item => item.temperature),
            itemStyle: {
              color: '#fa8c16'
            },
            lineStyle: {
              width: 3
            },
            symbol: 'circle',
            symbolSize: 6
          }
        ]
      };

      chart.setOption(option);

      return () => {
        chart.dispose();
      };
    }
  }, [healthData]);

  // 获取最新数据
  const latestData = healthData[healthData.length - 1];

  return (
    <div className="health-container">
      {/* 头部信息 */}
      <div className="health-header">
        <div className="header-left">
          <ArrowLeftOutlined
            className="back-icon"
            onClick={() => navigate('/home')}
          />
          <div className="elderly-info">
            <Avatar icon={<UserOutlined />} size={48} />
            <div className="elderly-details">
              <Title level={3} style={{ margin: 0 }}>{elderlyName}</Title>
              <Text type="secondary">健康监测</Text>
            </div>
          </div>
        </div>
        <div className="header-controls">
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: 120 }}
            options={[
              { label: '7天', value: '7d' },
              { label: '30天', value: '30d' },
              { label: '90天', value: '90d' }
            ]}
          />
        </div>
      </div>

      {/* 关键指标概览 */}
      <div className="health-overview">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <div className="metric-card" data-metric="systolic">
              <Statistic
                title="收缩压"
                value={latestData?.systolic || 0}
                suffix="mmHg"
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<HeartOutlined />}
              />
            </div>
          </Col>
          <Col span={6}>
            <div className="metric-card" data-metric="diastolic">
              <Statistic
                title="舒张压"
                value={latestData?.diastolic || 0}
                suffix="mmHg"
                valueStyle={{ color: '#1890ff' }}
                prefix={<HeartOutlined />}
              />
            </div>
          </Col>
          <Col span={6}>
            <div className="metric-card" data-metric="glucose">
              <Statistic
                title="血糖"
                value={latestData?.bloodSugar || 0}
                suffix="mg/dL"
                valueStyle={{ color: '#52c41a' }}
                prefix={<DropboxOutlined />}
              />
            </div>
          </Col>
          <Col span={6}>
            <div className="metric-card" data-metric="heartrate">
              <Statistic
                title="心率"
                value={latestData?.heartRate || 0}
                suffix="bpm"
                valueStyle={{ color: '#722ed1' }}
                prefix={<HeartOutlined />}
              />
            </div>
          </Col>
        </Row>
      </div>

      {/* 图表区域 */}
      <div className="charts-section">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="chart-card">
              <div ref={bloodPressureChartRef} style={{ height: '300px' }} />
            </div>
          </Col>
          <Col span={12}>
            <div className="chart-card">
              <div ref={bloodSugarChartRef} style={{ height: '300px' }} />
            </div>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          <Col span={12}>
            <div className="chart-card">
              <div ref={heartRateChartRef} style={{ height: '300px' }} />
            </div>
          </Col>
          <Col span={12}>
            <div className="chart-card">
              <div ref={temperatureChartRef} style={{ height: '300px' }} />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Health;
