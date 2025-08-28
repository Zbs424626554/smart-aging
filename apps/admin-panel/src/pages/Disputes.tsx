import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Badge,
  Steps,
  Typography,
  Descriptions,
  Rate,
  Divider,
  Avatar,
  Timeline,
  Radio,
  InputNumber,
  Empty as AntEmpty
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  MessageOutlined,
  SolutionOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CommentOutlined,
  FileSearchOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

// 纠纷数据接口
interface Dispute {
  id: string;
  orderId: string;
  orderNo: string;
  orderAmount: number;
  serviceType: string;
  elderlyId: string;
  elderlyName: string;
  nurseId: string;
  nurseName: string;
  type: 'complaint' | 'review_appeal' | 'refund';
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  evidence: string[];
  createdAt: string;
  assignedTo?: string;
  handledBy?: string;
  resolvedAt?: string;
  resolution?: string;
  compensation?: number;
  originalRating?: number;
  requestedRating?: number;
  finalRating?: number;
  timeline: DisputeEvent[];
}

// 纠纷事件时间线
interface DisputeEvent {
  id: string;
  time: string;
  type: 'create' | 'assign' | 'comment' | 'evidence' | 'resolve' | 'reject';
  content: string;
  operator: string;
  operatorRole: string;
}

// 评论/回复接口
interface Comment {
  id: string;
  disputeId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  role: 'admin' | 'elderly' | 'nurse';
}

const Disputes: React.FC = () => {
  // 状态
  const [activeTab, setActiveTab] = useState<string>('all');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [resolutionModalVisible, setResolutionModalVisible] = useState<boolean>(false);
  const [commentModalVisible, setCommentModalVisible] = useState<boolean>(false);
  
  const [resolutionForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  
  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 过滤数据
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredDisputes(disputes);
    } else {
      setFilteredDisputes(disputes.filter(dispute => {
        if (activeTab === 'pending') return dispute.status === 'pending';
        if (activeTab === 'processing') return dispute.status === 'processing';
        if (activeTab === 'resolved') return dispute.status === 'resolved' || dispute.status === 'rejected';
        if (activeTab === 'complaints') return dispute.type === 'complaint';
        if (activeTab === 'appeals') return dispute.type === 'review_appeal';
        if (activeTab === 'refunds') return dispute.type === 'refund';
        return true;
      }));
    }
  }, [activeTab, disputes]);

  const loadData = () => {
    // 模拟纠纷数据
    const mockDisputes: Dispute[] = [
      {
        id: 'd1',
        orderId: 'order001',
        orderNo: 'O20231201001',
        orderAmount: 200,
        serviceType: '日常照护',
        elderlyId: 'elderly001',
        elderlyName: '张老太',
        nurseId: 'nurse001',
        nurseName: '李护工',
        type: 'complaint',
        status: 'pending',
        priority: 'high',
        title: '护工服务态度差',
        description: '护工态度恶劣，说话很不礼貌，要求给予处理。',
        evidence: [
          'https://placeholder.pics/svg/300x200/DEDEDE/555555/证据照片1', 
          'https://placeholder.pics/svg/300x200/DEDEDE/555555/证据照片2'
        ],
        createdAt: '2023-12-01 10:30:00',
        timeline: [
          {
            id: 'e1',
            time: '2023-12-01 10:30:00',
            type: 'create',
            content: '创建投诉',
            operator: '张老太',
            operatorRole: 'elderly'
          }
        ]
      },
      {
        id: 'd2',
        orderId: 'order002',
        orderNo: 'O20231202001',
        orderAmount: 150,
        serviceType: '专业护理',
        elderlyId: 'elderly002',
        elderlyName: '李老先生',
        nurseId: 'nurse002',
        nurseName: '王护工',
        type: 'review_appeal',
        status: 'processing',
        priority: 'medium',
        title: '评价申诉',
        description: '老人给出的1星评价不符合实际服务情况，请求修改。',
        evidence: [
          'https://placeholder.pics/svg/300x200/DEDEDE/555555/服务照片1'
        ],
        createdAt: '2023-12-02 14:20:00',
        assignedTo: '客服小王',
        originalRating: 1,
        requestedRating: 4,
        timeline: [
          {
            id: 'e2-1',
            time: '2023-12-02 14:20:00',
            type: 'create',
            content: '创建评价申诉',
            operator: '王护工',
            operatorRole: 'nurse'
          },
          {
            id: 'e2-2',
            time: '2023-12-02 16:30:00',
            type: 'assign',
            content: '分配给客服小王处理',
            operator: '系统管理员',
            operatorRole: 'admin'
          }
        ]
      },
      {
        id: 'd3',
        orderId: 'order003',
        orderNo: 'O20231203001',
        orderAmount: 300,
        serviceType: '临终关怀',
        elderlyId: 'elderly003',
        elderlyName: '王奶奶',
        nurseId: 'nurse003',
        nurseName: '张护工',
        type: 'refund',
        status: 'resolved',
        priority: 'high',
        title: '服务未完成要求退款',
        description: '护工中途离开未完成服务，要求全额退款。',
        evidence: [
          'https://placeholder.pics/svg/300x200/DEDEDE/555555/聊天记录'
        ],
        createdAt: '2023-12-03 09:15:00',
        assignedTo: '客服小李',
        handledBy: '运营主管',
        resolvedAt: '2023-12-04 11:30:00',
        resolution: '经核实，护工确实因私人原因提前离开，同意退款50%作为补偿。',
        compensation: 150,
        timeline: [
          {
            id: 'e3-1',
            time: '2023-12-03 09:15:00',
            type: 'create',
            content: '创建退款申请',
            operator: '王奶奶',
            operatorRole: 'elderly'
          },
          {
            id: 'e3-2',
            time: '2023-12-03 10:20:00',
            type: 'assign',
            content: '分配给客服小李处理',
            operator: '系统管理员',
            operatorRole: 'admin'
          },
          {
            id: 'e3-3',
            time: '2023-12-03 14:15:00',
            type: 'comment',
            content: '已与双方沟通，护工承认服务中断，建议部分退款。',
            operator: '客服小李',
            operatorRole: 'admin'
          },
          {
            id: 'e3-4',
            time: '2023-12-04 11:30:00',
            type: 'resolve',
            content: '同意退款50%作为补偿，金额¥150.00',
            operator: '运营主管',
            operatorRole: 'admin'
          }
        ]
      }
    ];

    // 模拟评论数据
    const mockComments: Comment[] = [
      {
        id: 'c1',
        disputeId: 'd2',
        content: '我已经联系了老人了解情况，请护工提供更多服务细节。',
        createdAt: '2023-12-02 17:15:00',
        createdBy: '客服小王',
        role: 'admin'
      },
      {
        id: 'c2',
        disputeId: 'd2',
        content: '我已上传了服务过程的照片和老人签字的服务单，请查看。',
        createdAt: '2023-12-03 09:30:00',
        createdBy: '王护工',
        role: 'nurse'
      }
    ];

    setDisputes(mockDisputes);
    setComments(mockComments);
  };

  // 显示纠纷详情
  const showDisputeDetail = (record: Dispute) => {
    setSelectedDispute(record);
    setDetailModalVisible(true);
  };

  // 显示处理对话框
  const showResolutionModal = () => {
    if (selectedDispute) {
      resolutionForm.setFieldsValue({
        status: 'resolved',
        resolution: '',
        compensation: selectedDispute.type === 'refund' ? selectedDispute.orderAmount / 2 : 0,
        finalRating: selectedDispute.type === 'review_appeal' ? selectedDispute.requestedRating : undefined
      });
      setResolutionModalVisible(true);
    }
  };

  // 显示评论对话框
  const showCommentModal = () => {
    commentForm.resetFields();
    setCommentModalVisible(true);
  };

  // 处理评论提交
  const handleCommentSubmit = () => {
    commentForm.validateFields().then(values => {
      if (selectedDispute) {
        // 创建新评论
        const newComment: Comment = {
          id: `c${Date.now()}`,
          disputeId: selectedDispute.id,
          content: values.comment,
          createdAt: new Date().toLocaleString(),
          createdBy: '当前管理员',
          role: 'admin'
        };
        
        // 更新评论列表
        setComments([...comments, newComment]);

        // 更新纠纷的时间线
        const newTimelineEvent: DisputeEvent = {
          id: `e${Date.now()}`,
          time: new Date().toLocaleString(),
          type: 'comment',
          content: values.comment,
          operator: '当前管理员',
          operatorRole: 'admin'
        };

        const updatedDisputes = disputes.map(dispute => 
          dispute.id === selectedDispute.id 
            ? { 
                ...dispute, 
                timeline: [...dispute.timeline, newTimelineEvent],
                status: dispute.status === 'pending' ? 'processing' : dispute.status,
                assignedTo: dispute.assignedTo || '当前管理员'
              } 
            : dispute
        );
        
        setDisputes(updatedDisputes);
        setSelectedDispute({
          ...selectedDispute,
          timeline: [...selectedDispute.timeline, newTimelineEvent],
          status: selectedDispute.status === 'pending' ? 'processing' : selectedDispute.status,
          assignedTo: selectedDispute.assignedTo || '当前管理员'
        });

        message.success('评论已提交');
        setCommentModalVisible(false);
      }
    });
  };

  // 处理纠纷解决
  const handleResolution = () => {
    resolutionForm.validateFields().then(values => {
      if (selectedDispute) {
        const { status, resolution, compensation, finalRating } = values;
        
        // 创建时间线事件
        const newTimelineEvent: DisputeEvent = {
          id: `e${Date.now()}`,
          time: new Date().toLocaleString(),
          type: status === 'resolved' ? 'resolve' : 'reject',
          content: status === 'resolved' 
            ? `解决方案: ${resolution}${compensation > 0 ? `，补偿金额: ¥${compensation}` : ''}${finalRating ? `，最终评分: ${finalRating}星` : ''}`
            : `拒绝理由: ${resolution}`,
          operator: '当前管理员',
          operatorRole: 'admin'
        };

        // 更新纠纷状态
        const updatedDisputes = disputes.map(dispute => 
          dispute.id === selectedDispute.id 
            ? { 
                ...dispute, 
                status,
                resolution,
                compensation: compensation || undefined,
                finalRating: finalRating || undefined,
                handledBy: '当前管理员',
                resolvedAt: new Date().toLocaleString(),
                timeline: [...dispute.timeline, newTimelineEvent]
              } 
            : dispute
        );
        
        setDisputes(updatedDisputes);
        setSelectedDispute({
          ...selectedDispute,
          status,
          resolution,
          compensation: compensation || undefined,
          finalRating: finalRating || undefined,
          handledBy: '当前管理员',
          resolvedAt: new Date().toLocaleString(),
          timeline: [...selectedDispute.timeline, newTimelineEvent]
        });

        message.success(status === 'resolved' ? '纠纷已解决' : '纠纷已驳回');
        setResolutionModalVisible(false);
      }
    });
  };

  // 获取纠纷类型标签
  const getDisputeTypeTag = (type: string) => {
    switch (type) {
      case 'complaint':
        return <Tag color="red">投诉</Tag>;
      case 'review_appeal':
        return <Tag color="blue">评价申诉</Tag>;
      case 'refund':
        return <Tag color="orange">退款请求</Tag>;
      default:
        return <Tag>未知类型</Tag>;
    }
  };

  // 获取纠纷状态标签
  const getDisputeStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge status="warning" text="待处理" />;
      case 'processing':
        return <Badge status="processing" text="处理中" />;
      case 'resolved':
        return <Badge status="success" text="已解决" />;
      case 'rejected':
        return <Badge status="error" text="已驳回" />;
      default:
        return <Badge status="default" text="未知状态" />;
    }
  };

  // 获取优先级标签
  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Tag color="red">高</Tag>;
      case 'medium':
        return <Tag color="orange">中</Tag>;
      case 'low':
        return <Tag color="green">低</Tag>;
      default:
        return <Tag>未定义</Tag>;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getDisputeTypeTag(type)
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '老人',
      dataIndex: 'elderlyName',
      key: 'elderlyName'
    },
    {
      title: '护工',
      dataIndex: 'nurseName',
      key: 'nurseName'
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo'
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => getPriorityTag(priority),
      filters: [
        { text: '高', value: 'high' },
        { text: '中', value: 'medium' },
        { text: '低', value: 'low' }
      ],
      onFilter: (value: any, record: Dispute) => record.priority === value
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getDisputeStatusBadge(status),
      filters: [
        { text: '待处理', value: 'pending' },
        { text: '处理中', value: 'processing' },
        { text: '已解决', value: 'resolved' },
        { text: '已驳回', value: 'rejected' }
      ],
      onFilter: (value: any, record: Dispute) => record.status === value
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: Dispute, b: Dispute) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Dispute) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<FileSearchOutlined />}
            onClick={() => showDisputeDetail(record)}
          >
            查看详情
          </Button>
        </Space>
      )
    }
  ];

  // 过滤当前纠纷相关的评论
  const getDisputeComments = () => {
    return selectedDispute ? comments.filter(comment => comment.disputeId === selectedDispute.id) : [];
  };

  // 获取当前纠纷的处理阶段
  const getDisputeCurrentStep = (dispute: Dispute) => {
    if (dispute.status === 'resolved' || dispute.status === 'rejected') return 3;
    if (dispute.status === 'processing') return 1;
    return 0;
  };

  return (
    <div className="disputes-page">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            <span>纠纷处理中心</span>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={<span><FileTextOutlined />全部纠纷</span>} 
            key="all" 
          />
          <Tabs.TabPane 
            tab={
              <span>
                <QuestionCircleOutlined />
                待处理
                <Badge 
                  count={disputes.filter(d => d.status === 'pending').length} 
                  style={{ marginLeft: 8 }}
                />
              </span>
            } 
            key="pending" 
          />
          <Tabs.TabPane 
            tab={<span><SolutionOutlined />处理中</span>} 
            key="processing" 
          />
          <Tabs.TabPane 
            tab={<span><CheckCircleOutlined />已完结</span>} 
            key="resolved" 
          />
          <Tabs.TabPane 
            tab={<span><CloseCircleOutlined />投诉</span>} 
            key="complaints" 
          />
          <Tabs.TabPane 
            tab={<span><CommentOutlined />评价申诉</span>} 
            key="appeals" 
          />
          <Tabs.TabPane 
            tab={<span><DollarOutlined />退款请求</span>} 
            key="refunds" 
          />
        </Tabs>

        <Table 
          columns={columns} 
          dataSource={filteredDisputes}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />

        {/* 纠纷详情弹窗 */}
        <Modal
          title="纠纷详情"
          open={detailModalVisible}
          width={800}
          footer={[
            <Button key="back" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
            selectedDispute && (selectedDispute.status === 'pending' || selectedDispute.status === 'processing') && (
              <Button key="comment" type="default" onClick={showCommentModal}>
                添加评论
              </Button>
            ),
            selectedDispute && (selectedDispute.status === 'pending' || selectedDispute.status === 'processing') && (
              <Button key="resolve" type="primary" onClick={showResolutionModal}>
                处理纠纷
              </Button>
            )
          ]}
          onCancel={() => setDetailModalVisible(false)}
        >
          {selectedDispute && (
            <div>
              <Row gutter={16}>
                <Col span={24}>
                  <Steps 
                    current={getDisputeCurrentStep(selectedDispute)} 
                    status={selectedDispute.status === 'rejected' ? 'error' : undefined}
                  >
                    <Step title="提交" description="用户提交" />
                    <Step title="处理中" description={selectedDispute.assignedTo || '待分配'} />
                    <Step title="完成" description={selectedDispute.status === 'resolved' ? '已解决' : selectedDispute.status === 'rejected' ? '已驳回' : '处理中'} />
                  </Steps>
                </Col>
              </Row>

              <Divider />

              <Descriptions bordered column={2} title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>
                    {getDisputeTypeTag(selectedDispute.type)} {selectedDispute.title}
                  </Title>
                </div>
              }>
                <Descriptions.Item label="纠纷ID">{selectedDispute.id}</Descriptions.Item>
                <Descriptions.Item label="订单编号">{selectedDispute.orderNo}</Descriptions.Item>
                <Descriptions.Item label="老人信息">{selectedDispute.elderlyName}</Descriptions.Item>
                <Descriptions.Item label="护工信息">{selectedDispute.nurseName}</Descriptions.Item>
                <Descriptions.Item label="服务类型">{selectedDispute.serviceType}</Descriptions.Item>
                <Descriptions.Item label="订单金额">¥{selectedDispute.orderAmount.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="状态">{getDisputeStatusBadge(selectedDispute.status)}</Descriptions.Item>
                <Descriptions.Item label="优先级">{getPriorityTag(selectedDispute.priority)}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{selectedDispute.createdAt}</Descriptions.Item>
                {selectedDispute.resolvedAt && (
                  <Descriptions.Item label="解决时间">{selectedDispute.resolvedAt}</Descriptions.Item>
                )}
                {selectedDispute.assignedTo && (
                  <Descriptions.Item label="处理人员">{selectedDispute.assignedTo}</Descriptions.Item>
                )}
                {selectedDispute.handledBy && (
                  <Descriptions.Item label="处理人员">{selectedDispute.handledBy}</Descriptions.Item>
                )}
                <Descriptions.Item label="纠纷描述" span={2}>
                  {selectedDispute.description}
                </Descriptions.Item>
                
                {selectedDispute.type === 'review_appeal' && (
                  <>
                    <Descriptions.Item label="原始评分">
                      <Rate disabled defaultValue={selectedDispute.originalRating || 0} />
                    </Descriptions.Item>
                    <Descriptions.Item label="申请评分">
                      <Rate disabled defaultValue={selectedDispute.requestedRating || 0} />
                    </Descriptions.Item>
                    {selectedDispute.finalRating && (
                      <Descriptions.Item label="最终评分">
                        <Rate disabled defaultValue={selectedDispute.finalRating} />
                      </Descriptions.Item>
                    )}
                  </>
                )}
                
                {selectedDispute.type === 'refund' && selectedDispute.compensation && (
                  <Descriptions.Item label="赔偿金额">
                    ¥{selectedDispute.compensation.toFixed(2)}
                  </Descriptions.Item>
                )}
                
                {selectedDispute.resolution && (
                  <Descriptions.Item label="解决方案" span={2}>
                    {selectedDispute.resolution}
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider orientation="left">证据材料</Divider>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                {selectedDispute.evidence.map((evidence, index) => (
                  <img 
                    key={index}
                    src={evidence} 
                    alt={`证据${index + 1}`} 
                    style={{ width: '150px', height: '100px', objectFit: 'cover' }}
                  />
                ))}
              </div>

              <Divider orientation="left">处理记录</Divider>

              <Timeline>
                {selectedDispute.timeline.map((event) => (
                  <Timeline.Item 
                    key={event.id}
                    color={
                      event.type === 'resolve' ? 'green' : 
                      event.type === 'reject' ? 'red' : 
                      event.type === 'comment' ? 'blue' : 'gray'
                    }
                  >
                    <p>
                      <Text strong>{event.time}</Text> - 
                      <Text type={
                        event.operatorRole === 'admin' ? 'success' : 
                        event.operatorRole === 'nurse' ? 'warning' : 'danger'
                      }>
                        {' '}{event.operator}
                      </Text>
                    </p>
                    <p>{event.content}</p>
                  </Timeline.Item>
                ))}
              </Timeline>

              <Divider orientation="left">评论区</Divider>

              {getDisputeComments().length > 0 ? (
                <div className="comments-list">
                  {getDisputeComments().map(comment => (
                    <div key={comment.id} style={{ marginBottom: 16, background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <Avatar 
                          icon={<UserOutlined />} 
                          style={{ 
                            backgroundColor: 
                              comment.role === 'admin' ? '#1890ff' : 
                              comment.role === 'nurse' ? '#52c41a' : 
                              '#f5222d' 
                          }} 
                        />
                        <span style={{ marginLeft: 8, fontWeight: 'bold' }}>{comment.createdBy}</span>
                        <span style={{ marginLeft: 8, color: '#999' }}>
                          {comment.role === 'admin' ? '(管理员)' : 
                           comment.role === 'nurse' ? '(护工)' : '(老人/家属)'}
                        </span>
                        <span style={{ marginLeft: 16, color: '#999' }}>{comment.createdAt}</span>
                      </div>
                      <div>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <CustomEmpty description="暂无评论" />
              )}
            </div>
          )}
        </Modal>

        {/* 处理纠纷弹窗 */}
        <Modal
          title="处理纠纷"
          open={resolutionModalVisible}
          onOk={handleResolution}
          onCancel={() => setResolutionModalVisible(false)}
          width={600}
        >
          <Form
            form={resolutionForm}
            layout="vertical"
          >
            <Form.Item
              name="status"
              label="处理结果"
              rules={[{ required: true, message: '请选择处理结果' }]}
            >
              <Radio.Group>
                <Radio value="resolved">通过/解决</Radio>
                <Radio value="rejected">驳回</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="resolution"
              label="处理方案/驳回理由"
              rules={[{ required: true, message: '请输入处理方案或驳回理由' }]}
            >
              <TextArea rows={4} placeholder="请详细说明处理方案或驳回理由..." />
            </Form.Item>

            {selectedDispute && selectedDispute.type === 'refund' && (
              <Form.Item
                name="compensation"
                label="赔偿金额(元)"
                rules={[{ required: true, message: '请输入赔偿金额' }]}
              >
                <InputNumber 
                  min={0} 
                  max={selectedDispute.orderAmount}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  addonBefore="¥"
                />
              </Form.Item>
            )}

            {selectedDispute && selectedDispute.type === 'review_appeal' && (
              <Form.Item
                name="finalRating"
                label="最终评分"
                rules={[{ required: true, message: '请选择最终评分' }]}
              >
                <Rate />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* 添加评论弹窗 */}
        <Modal
          title="添加评论"
          open={commentModalVisible}
          onOk={handleCommentSubmit}
          onCancel={() => setCommentModalVisible(false)}
        >
          <Form
            form={commentForm}
            layout="vertical"
          >
            <Form.Item
              name="comment"
              rules={[{ required: true, message: '请输入评论内容' }]}
            >
              <TextArea rows={4} placeholder="请输入评论内容..." />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

const CustomEmpty = ({ description }: { description: string }) => (
  <div style={{ textAlign: 'center', padding: '20px 0' }}>
    <MessageOutlined style={{ fontSize: 32, color: '#ccc' }} />
    <p style={{ color: '#999', marginTop: 8 }}>{description}</p>
  </div>
);

export default Disputes; 