import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tabs,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Rate,
  Descriptions,
  Timeline,
  Divider,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  StarOutlined,
  FileTextOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { AdminService } from '../services/AdminService';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName: string;
  revieweeName: string;
  rating: number;
  content: string;
  createdAt: string;
  status: 'normal' | 'appealed' | 'resolved';
  appealReason?: string;
  appealStatus?: 'pending' | 'approved' | 'rejected';
}

interface Complaint {
  id: string;
  userId: string;
  userName: string;
  type: 'complaint' | 'inquiry' | 'emergency' | 'other';
  orderId?: string;
  content: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  attachments?: string[];
  history: ComplaintHistory[];
}

interface ComplaintHistory {
  id: string;
  action: string;
  operator: string;
  comment: string;
  timestamp: string;
}

const ReviewsAndComplaints: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [complaintModalVisible, setComplaintModalVisible] = useState(false);
  const [appealModalVisible, setAppealModalVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [responseForm] = Form.useForm();

  // 统计数据
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalComplaints: 0,
    pendingAppeals: 0,
    pendingComplaints: 0,
    avgRating: 0,
    resolutionRate: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取评价数据
      const reviewsResponse = await AdminService.getReviews();
      if (reviewsResponse.code === 200) {
        const apiReviews = reviewsResponse.data.reviews;
        const formattedReviews: Review[] = apiReviews.map((review: any) => ({
          id: review._id,
          orderId: review.orderId?._id || review.orderId,
          reviewerId: review.reviewerId?._id || review.reviewerId,
          revieweeId: review.revieweeId?._id || review.revieweeId,
          reviewerName: review.reviewerId?.name || '未知用户',
          revieweeName: review.revieweeId?.name || '未知用户',
          rating: review.rating,
          content: review.content,
          createdAt: new Date(review.createdAt).toLocaleString(),
          status: review.hasAppeal ? 'appealed' : 'normal',
          appealReason: review.appealContent,
          appealStatus: review.appealStatus
        }));
        setReviews(formattedReviews);
      }

      // 获取投诉数据
      const complaintsResponse = await AdminService.getComplaints();
      if (complaintsResponse.code === 200) {
        const apiComplaints = complaintsResponse.data.complaints;
        const formattedComplaints: Complaint[] = apiComplaints.map((complaint: any) => ({
          id: complaint._id,
          userId: complaint.complainantId?._id || complaint.complainantId,
          userName: complaint.complainantId?.name || '未知用户',
          type: complaint.type,
          orderId: complaint.orderId?._id || complaint.orderId,
          content: complaint.description,
          status: complaint.status,
          createdAt: new Date(complaint.createdAt).toLocaleString(),
          resolvedAt: complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : undefined,
          priority: complaint.priority || 'medium',
          category: complaint.title,
          history: [
            {
              id: '1',
              action: '创建投诉',
              operator: complaint.complainantId?.name || '系统',
              comment: complaint.description,
              timestamp: new Date(complaint.createdAt).toLocaleString()
            }
          ]
        }));
        setComplaints(formattedComplaints);
      }
      
      // 计算统计数据
      const totalReviews = reviews.length;
      const totalComplaints = complaints.length;
      const pendingAppeals = reviews.filter(r => r.status === 'appealed' && r.appealStatus === 'pending').length;
      const pendingComplaints = complaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length;
      const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
      const resolutionRate = complaints.length > 0 ? (complaints.filter(c => c.status === 'resolved').length / totalComplaints) * 100 : 0;

      setStats({
        totalReviews,
        totalComplaints,
        pendingAppeals,
        pendingComplaints,
        avgRating: Math.round(avgRating * 10) / 10,
        resolutionRate: Math.round(resolutionRate)
      });
    } catch (error) {
      console.error('数据加载失败:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAppeal = async (reviewId: string, action: 'approve' | 'reject', reason: string) => {
    try {
      await AdminService.handleReviewAppeal(reviewId, action, reason);
      message.success('申诉处理成功');
      setAppealModalVisible(false);
      loadData();
    } catch (error) {
      message.error('申诉处理失败');
    }
  };

  const handleComplaint = async (complaintId: string, action: string, response: string) => {
    try {
      await AdminService.handleComplaint(complaintId, action, response);
      message.success('投诉处理成功');
      setResponseModalVisible(false);
      loadData();
    } catch (error) {
      message.error('投诉处理失败');
    }
  };

  const reviewColumns = [
    {
      title: '订单号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 120
    },
    {
      title: '评价人',
      dataIndex: 'reviewerName',
      key: 'reviewerName',
      width: 100
    },
    {
      title: '被评人',
      dataIndex: 'revieweeName',
      key: 'revieweeName',
      width: 100
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => <Rate disabled defaultValue={rating} />
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        if (status === 'appealed') {
          return (
            <Tag color="orange">
              <ExclamationCircleOutlined /> 申诉中
            </Tag>
          );
        } else if (status === 'resolved') {
          return (
            <Tag color="green">
              <CheckCircleOutlined /> 已处理
            </Tag>
          );
        }
        return (
          <Tag color="blue">
            <ClockCircleOutlined /> 正常
          </Tag>
        );
      }
    },
    {
      title: '评价时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Review) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedReview(record);
              setReviewModalVisible(true);
            }}
          >
            查看详情
          </Button>
          {record.status === 'appealed' && record.appealStatus === 'pending' && (
            <Button
              type="link"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedReview(record);
                setAppealModalVisible(true);
              }}
            >
              处理申诉
            </Button>
          )}
        </Space>
      )
    }
  ];

  const complaintColumns = [
    {
      title: '投诉编号',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '投诉人',
      dataIndex: 'userName',
      key: 'userName',
      width: 120
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap = {
          complaint: { text: '投诉', color: 'red' },
          inquiry: { text: '咨询', color: 'blue' },
          emergency: { text: '紧急', color: 'orange' },
          other: { text: '其他', color: 'default' }
        };
        const config = typeMap[type as keyof typeof typeMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const priorityMap = {
          low: { text: '低', color: 'green' },
          medium: { text: '中', color: 'orange' },
          high: { text: '高', color: 'red' }
        };
        const config = priorityMap[priority as keyof typeof priorityMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          pending: { text: '待处理', color: 'orange' },
          in_progress: { text: '处理中', color: 'blue' },
          resolved: { text: '已解决', color: 'green' },
          closed: { text: '已关闭', color: 'default' }
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Complaint) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedComplaint(record);
              setComplaintModalVisible(true);
            }}
          >
            查看详情
          </Button>
          {(record.status === 'pending' || record.status === 'in_progress') && (
            <Button
              type="link"
              icon={<MessageOutlined />}
              onClick={() => {
                setSelectedComplaint(record);
                setResponseModalVisible(true);
              }}
            >
              处理
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总评价数"
              value={stats.totalReviews}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总投诉数"
              value={stats.totalComplaints}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理申诉"
              value={stats.pendingAppeals}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.avgRating}
              prefix={<StarOutlined />}
              suffix="/5"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="待处理投诉"
              value={stats.pendingComplaints}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>投诉解决率</div>
              <Progress
                type="circle"
                percent={stats.resolutionRate}
                format={percent => `${percent}%`}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="评价与投诉管理" extra={
        <Space>
          <Button icon={<HistoryOutlined />} onClick={loadData}>
            刷新数据
          </Button>
        </Space>
      }>
        <Tabs defaultActiveKey="reviews">
          <TabPane tab="用户评价" key="reviews">
            <Table
              columns={reviewColumns}
              dataSource={reviews}
              rowKey="id"
              loading={loading}
              pagination={{
                total: reviews.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条评价`
              }}
            />
          </TabPane>
          <TabPane tab="投诉管理" key="complaints">
            <Table
              columns={complaintColumns}
              dataSource={complaints}
              rowKey="id"
              loading={loading}
              pagination={{
                total: complaints.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条投诉`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* 评价详情模态框 */}
      <Modal
        title="评价详情"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedReview && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="订单号">{selectedReview.orderId}</Descriptions.Item>
            <Descriptions.Item label="评价时间">{selectedReview.createdAt}</Descriptions.Item>
            <Descriptions.Item label="评价人">{selectedReview.reviewerName}</Descriptions.Item>
            <Descriptions.Item label="被评人">{selectedReview.revieweeName}</Descriptions.Item>
            <Descriptions.Item label="评分">
              <Rate disabled defaultValue={selectedReview.rating} />
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              {selectedReview.status === 'appealed' ? (
                <Tag color="orange">申诉中</Tag>
              ) : (
                <Tag color="blue">正常</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="评价内容" span={2}>
              {selectedReview.content}
            </Descriptions.Item>
            {selectedReview.appealReason && (
              <Descriptions.Item label="申诉理由" span={2}>
                {selectedReview.appealReason}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* 申诉处理模态框 */}
      <Modal
        title="处理申诉"
        open={appealModalVisible}
        onCancel={() => setAppealModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedReview && (
          <Form form={form} layout="vertical">
            <Form.Item label="申诉理由">
              <TextArea
                value={selectedReview.appealReason}
                disabled
                rows={3}
              />
            </Form.Item>
            <Form.Item
              name="action"
              label="处理结果"
              rules={[{ required: true, message: '请选择处理结果' }]}
            >
              <Select placeholder="请选择处理结果">
                <Option value="approve">同意申诉</Option>
                <Option value="reject">驳回申诉</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="reason"
              label="处理说明"
              rules={[{ required: true, message: '请输入处理说明' }]}
            >
              <TextArea rows={4} placeholder="请输入处理说明" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={async () => {
                    const values = await form.validateFields();
                    await handleReviewAppeal(selectedReview.id, values.action, values.reason);
                  }}
                >
                  确认处理
                </Button>
                <Button onClick={() => setAppealModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 投诉详情模态框 */}
      <Modal
        title="投诉详情"
        open={complaintModalVisible}
        onCancel={() => setComplaintModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedComplaint && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="投诉编号">{selectedComplaint.id}</Descriptions.Item>
              <Descriptions.Item label="投诉人">{selectedComplaint.userName}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={selectedComplaint.type === 'complaint' ? 'red' : 'blue'}>
                  {selectedComplaint.type === 'complaint' ? '投诉' : '咨询'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={selectedComplaint.priority === 'high' ? 'red' : 'orange'}>
                  {selectedComplaint.priority === 'high' ? '高' : '中'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="分类">{selectedComplaint.category}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedComplaint.status === 'pending' ? 'orange' : 'green'}>
                  {selectedComplaint.status === 'pending' ? '待处理' : '已处理'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedComplaint.createdAt}</Descriptions.Item>
              {selectedComplaint.resolvedAt && (
                <Descriptions.Item label="解决时间">{selectedComplaint.resolvedAt}</Descriptions.Item>
              )}
              <Descriptions.Item label="投诉内容" span={2}>
                {selectedComplaint.content}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider>处理历史</Divider>
            <Timeline>
              {selectedComplaint.history.map((item) => (
                <Timeline.Item key={item.id}>
                  <p><strong>{item.action}</strong> - {item.operator}</p>
                  <p>{item.comment}</p>
                  <p style={{ color: '#999', fontSize: '12px' }}>{item.timestamp}</p>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Modal>

      {/* 投诉处理模态框 */}
      <Modal
        title="处理投诉"
        open={responseModalVisible}
        onCancel={() => setResponseModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedComplaint && (
          <Form form={responseForm} layout="vertical">
            <Form.Item label="投诉内容">
              <TextArea
                value={selectedComplaint.content}
                disabled
                rows={3}
              />
            </Form.Item>
            <Form.Item
              name="action"
              label="处理动作"
              rules={[{ required: true, message: '请选择处理动作' }]}
            >
              <Select placeholder="请选择处理动作">
                <Option value="in_progress">开始处理</Option>
                <Option value="resolved">标记解决</Option>
                <Option value="closed">关闭投诉</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="response"
              label="处理回复"
              rules={[{ required: true, message: '请输入处理回复' }]}
            >
              <TextArea rows={4} placeholder="请输入处理回复" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={async () => {
                    const values = await responseForm.validateFields();
                    await handleComplaint(selectedComplaint.id, values.action, values.response);
                  }}
                >
                  确认处理
                </Button>
                <Button onClick={() => setResponseModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ReviewsAndComplaints; 