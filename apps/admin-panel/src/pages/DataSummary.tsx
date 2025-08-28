import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Tabs, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Select, 
  Button, 
  DatePicker, 
  Space, 
  Spin,
  Alert,
  Progress,
  Typography,
  Tag,
  Divider
} from 'antd';
import {
  BarChartOutlined,
  CloudDownloadOutlined,
  SyncOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  FundProjectionScreenOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import axios from 'axios';

const { RangePicker } = DatePicker;
const { Title, Paragraph } = Typography;
const { Option } = Select;

// 汇总数据接口
interface SummaryData {
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    userGrowthRate: number;
    userTypeDistribution: {
      elderly: number;
      family: number;
      nurse: number;
      admin: number;
    }
  };
  orderMetrics: {
    totalOrders: number;
    completionRate: number;
    avgOrderValue: number;
    orderTrend: Array<{
      date: string;
      count: number;
      value: number;
    }>;
    categoryDistribution: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
  financeMetrics: {
    totalRevenue: number;
    platformFee: number;
    paidToNurses: number;
    revenueTrend: Array<{
      date: string;
      revenue: number;
    }>;
  };
  serviceMetrics: {
    totalServices: number;
    topServices: Array<{
      name: string;
      count: number;
      revenue: number;
    }>;
    serviceRating: number;
    ratingDistribution: Array<{
      rating: number;
      count: number;
    }>;
  };
}

// API数据类型
interface UserRoleData {
  _id: string;
  count: number;
}

interface OrderDateData {
  date: string;
  count: number;
  revenue: number;
}

interface ServiceData {
  _id: string;
  serviceName?: string;
  count: number;
  revenue: number;
}

interface ReviewRatingData {
  _id: number;
  count: number;
}

// 订单趋势类型
interface OrderTrendItem {
  date: string;
  count: number;
  value: number;
}

// AI分析数据接口
interface AIAnalysisData {
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
  }>;
  predictions: Array<{
    metric: string;
    current: number;
    predicted: number;
    trend: 'up' | 'down' | 'stable';
    percentChange: number;
  }>;
  insights: Array<{
    title: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  anomalies: Array<{
    metric: string;
    expected: number;
    actual: number;
    deviation: number;
    description: string;
  }>;
}

const DataSummary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [aiData, setAiData] = useState<AIAnalysisData | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [timeGranularity, setTimeGranularity] = useState<string>('day');
  const [dataSegment, setDataSegment] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // 获取汇总数据
  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange[0].format('YYYY-MM-DD');
        const endDate = dateRange[1].format('YYYY-MM-DD');
        
        // 调用后端API获取数据概览
        const overviewRes = await axios.get(`/api/analytics/overview?startDate=${startDate}&endDate=${endDate}`);
        const userRes = await axios.get(`/api/analytics/users`);
        const orderRes = await axios.get(`/api/analytics/orders?startDate=${startDate}&endDate=${endDate}`);
        const feedbackRes = await axios.get(`/api/analytics/feedback?startDate=${startDate}&endDate=${endDate}`);
        
        // 将后端数据转换为前端需要的格式
        const apiData = overviewRes.data.data;
        const userData = userRes.data.data;
        const orderData = orderRes.data.data;
        const feedbackData = feedbackRes.data.data;

        // 处理用户数据
        const userDistribution = userData.usersByRole.reduce((acc: Record<string, number>, curr: UserRoleData) => {
          acc[curr._id.toLowerCase()] = curr.count;
          return acc;
        }, { elderly: 0, family: 0, nurse: 0, admin: 0 });

        // 处理订单趋势数据
        const orderTrend = Array.isArray(orderData.ordersByDate) 
          ? orderData.ordersByDate.map((item: OrderDateData) => ({
              date: item.date,
              count: item.count,
              value: item.revenue || 0
            }))
          : [];
        
        // 处理服务分类数据
        const categoryData = Array.isArray(orderData.ordersByService) 
          ? orderData.ordersByService.map((item: ServiceData) => ({
              category: item.serviceName || item._id,
              count: item.count,
              percentage: (item.count / (orderData.totalOrders || 1)) * 100
            }))
          : [];

        // 处理评分分布数据
        const ratingData = Array.isArray(feedbackData.reviewsByRating)
          ? feedbackData.reviewsByRating.map((item: ReviewRatingData) => ({
              rating: item._id,
              count: item.count
            }))
          : [];

        // 构建综合数据对象
        const summaryData: SummaryData = {
          userMetrics: {
            totalUsers: userData.totalUsers || 0,
            activeUsers: userData.activeUsers || userData.totalUsers || 0,
            userGrowthRate: userData.growthRate || 0,
            userTypeDistribution: userDistribution
          },
          orderMetrics: {
            totalOrders: orderData.totalOrders || 0,
            completionRate: parseFloat(apiData.kpis?.orderCompletionRate) || 0,
            avgOrderValue: orderData.totalOrders ? (orderData.totalRevenue / orderData.totalOrders) : 0,
            orderTrend: orderTrend,
            categoryDistribution: categoryData
          },
          financeMetrics: {
            totalRevenue: orderData.totalRevenue || 0,
            platformFee: (orderData.totalRevenue || 0) * 0.15, // 假设平台抽成15%
            paidToNurses: (orderData.totalRevenue || 0) * 0.85, // 假设护工获得85%
            revenueTrend: orderTrend.map((item: OrderTrendItem) => ({
              date: item.date,
              revenue: item.value
            }))
          },
          serviceMetrics: {
            totalServices: orderData.totalOrders || 0,
            topServices: Array.isArray(orderData.ordersByService) 
              ? orderData.ordersByService
                  .slice(0, 5)
                  .map((item: ServiceData) => ({
                    name: item.serviceName || item._id,
                    count: item.count,
                    revenue: item.revenue || 0
                  }))
              : [],
            serviceRating: feedbackData.averageRating || 0,
            ratingDistribution: ratingData
          }
        };
        
        setSummaryData(summaryData);
      } catch (err) {
        console.error('获取数据失败:', err);
        setError('获取数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [dateRange, dataSegment]);

  // 获取AI分析数据
  const fetchAIData = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await axios.get('/api/ai/insights');
      
      // 将后端AI分析数据转换为前端需要的格式
      const apiData = res.data.data;
      
      // 构建AI分析数据对象
      const aiData: AIAnalysisData = {
        recommendations: apiData.keyInsights.map((insight: { title: string; description: string; recommendation: string }) => ({
          type: 'business',
          title: insight.title,
          description: insight.description + " " + insight.recommendation,
          confidence: 0.85
        })),
        predictions: [
          {
            metric: '用户增长',
            current: summaryData?.userMetrics.totalUsers || 0,
            predicted: Math.round((summaryData?.userMetrics.totalUsers || 0) * 1.2),
            trend: 'up',
            percentChange: 20
          },
          {
            metric: '订单完成率',
            current: summaryData?.orderMetrics.completionRate || 0,
            predicted: Math.min(100, (summaryData?.orderMetrics.completionRate || 0) * 1.1),
            trend: 'up',
            percentChange: 10
          },
          {
            metric: '平均服务评分',
            current: summaryData?.serviceMetrics.serviceRating || 0,
            predicted: Math.min(5, (summaryData?.serviceMetrics.serviceRating || 0) * 1.05),
            trend: 'up',
            percentChange: 5
          }
        ],
        insights: [
          {
            title: apiData.revenueTrends.recommendation,
            description: apiData.revenueTrends.description,
            importance: 'high'
          },
          {
            title: apiData.healthAndSafety.recommendation,
            description: apiData.healthAndSafety.description,
            importance: 'medium'
          }
        ],
        anomalies: []
      };

      setAiData(aiData);
    } catch (err) {
      console.error('获取AI分析数据失败:', err);
      setAiError('获取AI分析数据失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 当切换到AI标签页时加载AI数据
  useEffect(() => {
    if (activeTab === 'ai' && !aiData && !aiLoading) {
      fetchAIData();
    }
  }, [activeTab, aiData, aiLoading]);

  // 时间范围选择器变化处理
  const handleRangeChange = (dates: RangePickerProps['value']) => {
    if (dates && Array.isArray(dates) && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  // 粒度选择处理
  const handleGranularityChange = (value: string) => {
    setTimeGranularity(value);
  };

  // 数据段选择处理
  const handleSegmentChange = (value: string) => {
    setDataSegment(value);
  };

  // 刷新数据处理
  const handleRefresh = () => {
    if (activeTab === 'overview') {
      setSummaryData(null);
      setLoading(true);
      // 重新加载数据的逻辑会通过useEffect触发
    } else {
      setAiData(null);
      fetchAIData();
    }
  };

  // 用户分布图表选项
  const getUserChartOption = () => {
    const data = summaryData?.userMetrics.userTypeDistribution;
    if (!data) return {};

    return {
      title: {
        text: '用户类型分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        data: ['老人', '家属', '护工', '管理员']
      },
      series: [
        {
          name: '用户类型',
          type: 'pie',
          radius: '50%',
          data: [
            { value: data.elderly, name: '老人' },
            { value: data.family, name: '家属' },
            { value: data.nurse, name: '护工' },
            { value: data.admin, name: '管理员' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  // 订单趋势图表选项
  const getOrderTrendOption = () => {
    if (!summaryData?.orderMetrics.orderTrend.length) return {};

    const xAxisData = summaryData.orderMetrics.orderTrend.map(item => item.date);
    const seriesData = {
      count: summaryData.orderMetrics.orderTrend.map(item => item.count),
      value: summaryData.orderMetrics.orderTrend.map(item => item.value)
    };

    return {
      title: {
        text: '订单趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['订单数量', '订单金额'],
        top: '10%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData
      },
      yAxis: [
        {
          type: 'value',
          name: '订单数量',
          position: 'left'
        },
        {
          type: 'value',
          name: '订单金额',
          position: 'right'
        }
      ],
      series: [
        {
          name: '订单数量',
          type: 'bar',
          data: seriesData.count
        },
        {
          name: '订单金额',
          type: 'line',
          yAxisIndex: 1,
          data: seriesData.value
        }
      ]
    };
  };

  // 评分分布图表选项
  const getRatingDistributionOption = () => {
    if (!summaryData?.serviceMetrics.ratingDistribution.length) return {};

    const xAxisData = summaryData.serviceMetrics.ratingDistribution.map(item => item.rating + '星');
    const seriesData = summaryData.serviceMetrics.ratingDistribution.map(item => item.count);

    return {
      title: {
        text: '评分分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: xAxisData
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '评分数量',
          type: 'bar',
          data: seriesData,
          itemStyle: {
            color: function(params: { dataIndex: number }) {
              const colorList = ['#FF4500', '#FF8C00', '#FFD700', '#9ACD32', '#00CD00'];
              return colorList[params.dataIndex] || '#108ee9';
            }
          }
        }
      ]
    };
  };

  // 渲染数据概览内容
  const renderOverviewContent = () => {
    if (loading) {
      return <Spin size="large" tip="加载中..." />;
    }

    if (error) {
      return <Alert message="错误" description={error} type="error" showIcon />;
    }

    if (!summaryData) {
      return <Empty description="暂无数据" />;
    }

    return (
      <div>
        {/* 顶部统计卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={summaryData.userMetrics.totalUsers}
                prefix={<TeamOutlined />}
                suffix={
                  <Tag color="blue">
                    <ArrowUpOutlined /> {summaryData.userMetrics.userGrowthRate.toFixed(1)}%
                  </Tag>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={summaryData.orderMetrics.totalOrders}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={summaryData.financeMetrics.totalRevenue}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均评分"
                value={summaryData.serviceMetrics.serviceRating}
                precision={1}
                prefix={<StarOutlined />}
                suffix="/5"
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 图表区域 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="用户分布">
              <ReactECharts option={getUserChartOption()} style={{ height: '300px' }} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="订单完成率">
              <Progress
                type="dashboard"
                percent={summaryData.orderMetrics.completionRate}
                format={percent => `${percent?.toFixed(1) || '0.0'}%`}
              />
              <Paragraph>
                完成订单：{summaryData.orderMetrics.totalOrders * summaryData.orderMetrics.completionRate / 100} / 
                总订单：{summaryData.orderMetrics.totalOrders}
              </Paragraph>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 趋势图表 */}
        <Card title="订单趋势">
          <ReactECharts option={getOrderTrendOption()} style={{ height: '400px' }} />
        </Card>

        <Divider />

        {/* 服务与评价数据 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="热门服务">
              <Table
                dataSource={summaryData.serviceMetrics.topServices.map((item, index) => ({
                  key: index,
                  ...item
                }))}
                columns={[
                  { title: '服务名称', dataIndex: 'name', key: 'name' },
                  { title: '订单数量', dataIndex: 'count', key: 'count' },
                  { title: '收入', dataIndex: 'revenue', key: 'revenue', render: (value) => `${value.toFixed(2)}元` }
                ]}
                pagination={false}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="评分分布">
              <ReactECharts option={getRatingDistributionOption()} style={{ height: '300px' }} />
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // 渲染AI分析内容
  const renderAIContent = () => {
    if (aiLoading) {
      return <Spin size="large" tip="AI正在分析数据中..." />;
    }

    if (aiError) {
      return <Alert message="错误" description={aiError} type="error" showIcon />;
    }

    if (!aiData) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Button type="primary" icon={<RobotOutlined />} onClick={fetchAIData}>
            生成AI分析报告
          </Button>
        </div>
      );
    }

    return (
      <div>
        <Title level={3}>
          <RobotOutlined /> AI分析洞察
        </Title>

        {/* AI 推荐 */}
        <Card title="AI推荐" className="mb-4">
          {aiData.recommendations.map((item, index) => (
            <Alert
              key={index}
              message={item.title}
              description={item.description}
              type="info"
              showIcon
              icon={<ThunderboltOutlined />}
              action={
                <Tag color="blue">
                  置信度: {(item.confidence * 100).toFixed(0)}%
                </Tag>
              }
              className="mb-3"
            />
          ))}
        </Card>

        {/* 业务预测 */}
        <Card title="业务预测" className="mb-4">
          <Table
            dataSource={aiData.predictions.map((item, index) => ({
              key: index,
              ...item,
            }))}
            columns={[
              { title: '指标', dataIndex: 'metric', key: 'metric' },
              { title: '当前值', dataIndex: 'current', key: 'current' },
              { title: '预测值', dataIndex: 'predicted', key: 'predicted' },
              { 
                title: '趋势', 
                dataIndex: 'trend', 
                key: 'trend',
                render: (trend) => (
                  trend === 'up' ? <Tag color="green"><ArrowUpOutlined /> 上升</Tag> : 
                  trend === 'down' ? <Tag color="red"><ArrowDownOutlined /> 下降</Tag> : 
                  <Tag color="blue"><MinusOutlined /> 稳定</Tag>
                )
              },
              { 
                title: '变化率', 
                dataIndex: 'percentChange', 
                key: 'percentChange',
                render: (value) => `${value.toFixed(1)}%`
              }
            ]}
            pagination={false}
          />
        </Card>

        {/* 业务洞察 */}
        <Card title="业务洞察">
          {aiData.insights.map((item, index) => (
            <Alert
              key={index}
              message={item.title}
              description={item.description}
              type={
                item.importance === 'high' ? 'warning' : 
                item.importance === 'medium' ? 'info' : 'success'
              }
              showIcon
              className="mb-3"
            />
          ))}
        </Card>
      </div>
    );
  };

  // 需要导入的图标
  const TeamOutlined = () => <span role="img" aria-label="team">👥</span>;
  const ShoppingOutlined = () => <span role="img" aria-label="shopping">🛒</span>;
  const DollarOutlined = () => <span role="img" aria-label="dollar">💰</span>;
  const StarOutlined = () => <span role="img" aria-label="star">⭐</span>;
  const ArrowUpOutlined = () => <span role="img" aria-label="arrow-up">↑</span>;
  const ArrowDownOutlined = () => <span role="img" aria-label="arrow-down">↓</span>;
  const MinusOutlined = () => <span role="img" aria-label="minus">➖</span>;
  const Empty = ({ description }: { description: string }) => (
    <div style={{ textAlign: 'center', padding: '50px 0' }}>
      <div style={{ fontSize: '48px' }}>📊</div>
      <p>{description}</p>
    </div>
  );
  
  return (
    <div>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={2}>
            <FundProjectionScreenOutlined /> 数据汇总
          </Title>
        </Col>
        <Col>
          <Space>
            <RangePicker 
              value={dateRange}
              onChange={handleRangeChange}
              allowClear={false}
            />
            <Select 
              value={timeGranularity} 
              onChange={handleGranularityChange}
              style={{ width: 100 }}
            >
              <Option value="day">日</Option>
              <Option value="week">周</Option>
              <Option value="month">月</Option>
            </Select>
            <Select 
              value={dataSegment} 
              onChange={handleSegmentChange}
              style={{ width: 120 }}
            >
              <Option value="all">全部数据</Option>
              <Option value="users">用户数据</Option>
              <Option value="orders">订单数据</Option>
              <Option value="services">服务数据</Option>
            </Select>
            <Button 
              icon={<SyncOutlined />} 
              onClick={handleRefresh}
            >
              刷新
            </Button>
            <Button 
              icon={<CloudDownloadOutlined />}
              type="primary"
            >
              导出报告
            </Button>
          </Space>
        </Col>
      </Row>
      
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={<span><BarChartOutlined /> 数据总览</span>} 
            key="overview"
          >
            {renderOverviewContent()}
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span><RobotOutlined /> AI分析</span>} 
            key="ai"
          >
            {renderAIContent()}
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default DataSummary;
