import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Button, 
  message,
  Table,
  Space,
  Tag,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Upload,
  Radio,
  Divider,
  List,
  Tooltip,
  Popconfirm,
  Badge
} from 'antd';
import {
  SettingOutlined,
  BellOutlined,
  CustomerServiceOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  BookOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
  MessageOutlined,
  NotificationOutlined,
  MobileOutlined,
  MailOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';


const { Option } = Select;
const { TextArea } = Input;

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  targetAudience?: string;
  expireDate?: string;
  coverImage?: string;
}

interface Policy {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface Guide {
  id: string;
  title: string;
  content: string;
  targetUser: string;
  category: string;
  steps: GuideStep[];
  createdAt: string;
  updatedAt?: string;
}

interface GuideStep {
  step: number;
  title: string;
  content: string;
  image?: string;
}

interface SupportTicket {
  id: string;
  title: string;
  content: string;
  user: string;
  userId: string;
  userPhone?: string;
  status: string;
  priority: string;
  createdAt: string;
  lastReplyAt?: string;
  category: string;
  source: string;
  assignedTo?: string;
  replies?: TicketReply[];
}

interface TicketReply {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isStaff: boolean;
}

interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  type: string;
  variables: string[];
  isActive: boolean;
}

interface PushTemplate {
  id: string;
  name: string;
  title: string;
  content: string;
  type: string;
  targetUser: string;
  variables: string[];
  isActive: boolean;
}

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [pushTemplates, setPushTemplates] = useState<PushTemplate[]>([]);
  
  const [activeTab, setActiveTab] = useState('basic');
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [templateType, setTemplateType] = useState<'sms'|'push'>('sms');
  const [editingSmsTemplate, setEditingSmsTemplate] = useState<SmsTemplate | null>(null);
  const [editingPushTemplate, setEditingPushTemplate] = useState<PushTemplate | null>(null);
  
  const [announcementForm] = Form.useForm();
  const [policyForm] = Form.useForm();
  const [guideForm] = Form.useForm();
  const [ticketForm] = Form.useForm();
  const [templateForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // 模拟公告数据
    const mockAnnouncements: Announcement[] = [
      {
        id: '1',
        title: '平台服务升级通知',
        content: '为了更好地服务用户，平台将于2024年1月20日进行系统升级，期间可能影响部分功能使用。',
        type: 'notice',
        isActive: true,
        createdAt: '2024-01-15',
        createdBy: '管理员',
        targetAudience: '全部用户',
        expireDate: '2024-01-21'
      },
      {
        id: '2',
        title: '春节服务安排',
        content: '春节期间（2024年2月10日-2月17日）服务时间调整为9:00-18:00，请提前预约。',
        type: 'holiday',
        isActive: true,
        createdAt: '2024-01-10',
        createdBy: '管理员',
        targetAudience: '全部用户',
        expireDate: '2024-02-18'
      }
    ];

    // 模拟政策数据
    const mockPolicies: Policy[] = [
      {
        id: '1',
        title: '服务协议',
        content: '本协议是您与智慧养老服务平台之间的服务协议，规定了您使用本平台的权利和义务...',
        category: '用户协议',
        version: 'v1.2',
        effectiveDate: '2024-01-01',
        isActive: true,
        createdAt: '2023-12-15',
        updatedAt: '2023-12-30'
      },
      {
        id: '2',
        title: '隐私政策',
        content: '本隐私政策详细说明了我们如何收集、使用和保护您的个人信息...',
        category: '隐私政策',
        version: 'v1.1',
        effectiveDate: '2024-01-01',
        isActive: true,
        createdAt: '2023-12-15',
        updatedAt: '2023-12-30'
      }
    ];

    // 模拟指南数据
    const mockGuides: Guide[] = [
      {
        id: '1',
        title: '如何预约服务',
        content: '本指南将教您如何在平台上预约护理服务。',
        targetUser: '老人/家属',
        category: '平台使用',
        steps: [
          {
            step: 1,
            title: '登录账号',
            content: '使用您的手机号和密码登录平台。'
          },
          {
            step: 2,
            title: '选择服务',
            content: '在服务列表中选择您需要的服务类型。'
          },
          {
            step: 3,
            title: '确认下单',
            content: '填写服务地址、时间并确认订单信息。'
          }
        ],
        createdAt: '2024-01-05',
        updatedAt: '2024-01-10'
      },
      {
        id: '2',
        title: '护工接单指南',
        content: '本指南将指导护工如何接单和提供服务。',
        targetUser: '护工',
        category: '服务提供',
        steps: [
          {
            step: 1,
            title: '查看订单',
            content: '在订单列表查看可接的订单。'
          },
          {
            step: 2,
            title: '接单流程',
            content: '点击接单按钮确认接单。'
          }
        ],
        createdAt: '2024-01-08'
      }
    ];

    // 模拟工单数据
    const mockTickets: SupportTicket[] = [
      {
        id: '1',
        title: '无法预约服务',
        content: '用户反映在预约服务时出现系统错误，无法正常下单。',
        user: '张阿姨',
        userId: 'user123',
        userPhone: '13800138000',
        status: 'pending',
        priority: 'high',
        category: '系统问题',
        source: 'app',
        createdAt: '2024-01-15 10:30',
        replies: []
      },
      {
        id: '2',
        title: '护工服务质量问题',
        content: '用户投诉护工服务态度不好，服务质量不达标。',
        user: '李叔叔',
        userId: 'user456',
        userPhone: '13800138001',
        status: 'processing',
        priority: 'medium',
        category: '服务投诉',
        source: 'phone',
        createdAt: '2024-01-14 15:20',
        lastReplyAt: '2024-01-14 16:30',
        assignedTo: '客服小王',
        replies: [
          {
            id: 'r1',
            content: '您好，我们已收到您的投诉，正在调查处理。',
            createdBy: '客服小王',
            createdAt: '2024-01-14 16:30',
            isStaff: true
          }
        ]
      }
    ];

    // 模拟短信模板
    const mockSmsTemplates: SmsTemplate[] = [
      {
        id: '1',
        name: '验证码模板',
        content: '您的验证码是{code}，{expireTime}分钟内有效，请勿泄露给他人。',
        type: '验证码',
        variables: ['code', 'expireTime'],
        isActive: true
      },
      {
        id: '2',
        name: '订单确认模板',
        content: '您的订单{orderNo}已确认，服务时间{serviceTime}，请准时等候。',
        type: '订单通知',
        variables: ['orderNo', 'serviceTime'],
        isActive: true
      }
    ];

    // 模拟推送模板
    const mockPushTemplates: PushTemplate[] = [
      {
        id: '1',
        name: '订单状态变更',
        title: '订单状态更新',
        content: '您的订单{orderNo}状态已更新为{status}。',
        type: '订单通知',
        targetUser: '全部用户',
        variables: ['orderNo', 'status'],
        isActive: true
      },
      {
        id: '2',
        name: '紧急求助通知',
        title: '紧急求助',
        content: '{userName}发起了紧急求助，地址：{address}。',
        type: '紧急通知',
        targetUser: '护工',
        variables: ['userName', 'address'],
        isActive: true
      }
    ];

    setAnnouncements(mockAnnouncements);
    setPolicies(mockPolicies);
    setGuides(mockGuides);
    setTickets(mockTickets);
    setSmsTemplates(mockSmsTemplates);
    setPushTemplates(mockPushTemplates);
  };

  const handleSaveSettings = (values: any) => {
    message.success('设置保存成功');
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    announcementForm.resetFields();
    setAnnouncementModalVisible(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    announcementForm.setFieldsValue(announcement);
    setAnnouncementModalVisible(true);
  };

  const handleDeleteAnnouncement = (id: string) => {
    Modal.confirm({
      title: '确认删除公告？',
      content: '删除后该公告将无法恢复',
      onOk: () => {
        setAnnouncements(announcements.filter(a => a.id !== id));
        message.success('公告删除成功');
      }
    });
  };

  const handleSubmitAnnouncement = (values: any) => {
    if (editingAnnouncement) {
      setAnnouncements(announcements.map(a => 
        a.id === editingAnnouncement.id 
          ? { ...a, ...values }
          : a
      ));
      message.success('公告更新成功');
    } else {
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        ...values,
        isActive: true,
        createdAt: new Date().toLocaleDateString(),
        createdBy: '管理员'
      };
      setAnnouncements([...announcements, newAnnouncement]);
      message.success('公告添加成功');
    }
    setAnnouncementModalVisible(false);
  };

  const announcementColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { text: string; color: string }> = {
          notice: { text: '通知', color: 'blue' },
          holiday: { text: '节假日', color: 'orange' },
          maintenance: { text: '维护', color: 'red' }
        };
        const typeInfo = typeMap[type] || { text: type, color: 'default' };
        return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Announcement) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditAnnouncement(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAnnouncement(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const ticketColumns = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          pending: { text: '待处理', color: 'orange' },
          processing: { text: '处理中', color: 'blue' },
          resolved: { text: '已解决', color: 'green' },
          closed: { text: '已关闭', color: 'red' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const priorityMap: Record<string, { text: string; color: string }> = {
          low: { text: '低', color: 'green' },
          medium: { text: '中', color: 'orange' },
          high: { text: '高', color: 'red' }
        };
        const priorityInfo = priorityMap[priority] || { text: priority, color: 'default' };
        return <Tag color={priorityInfo.color}>{priorityInfo.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '处理人',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo: string) => assignedTo || '未分配',
    },
  ];

  return (
    <div>
      <h2>系统设置</h2>
      
      <Tabs 
        defaultActiveKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'basic',
            label: (
              <span>
                <SettingOutlined />
                基础配置
              </span>
            ),
            children: (
              <Card>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveSettings}
                  initialValues={{
                    platformName: '智慧养老服务平台',
                    contactPhone: '400-123-4567',
                    contactEmail: 'support@smart-aging.com',
                    serviceHours: '8:00-20:00',
                    maxOrderAmount: 1000,
                    commissionRate: 0.1,
                    enableSMS: true,
                    enablePush: true
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="platformName"
                        label="平台名称"
                        rules={[{ required: true, message: '请输入平台名称!' }]}
                      >
                        <Input placeholder="请输入平台名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="contactPhone"
                        label="客服电话"
                        rules={[{ required: true, message: '请输入客服电话!' }]}
                      >
                        <Input placeholder="请输入客服电话" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="contactEmail"
                        label="客服邮箱"
                        rules={[
                          { required: true, message: '请输入客服邮箱!' },
                          { type: 'email', message: '请输入有效的邮箱地址!' }
                        ]}
                      >
                        <Input placeholder="请输入客服邮箱" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="serviceHours"
                        label="服务时间"
                        rules={[{ required: true, message: '请输入服务时间!' }]}
                      >
                        <Input placeholder="请输入服务时间" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="maxOrderAmount"
                        label="最大订单金额"
                        rules={[{ required: true, message: '请输入最大订单金额!' }]}
                      >
                        <InputNumber
                          min={0}
                          placeholder="请输入最大订单金额"
                          style={{ width: '100%' }}
                          addonAfter="元"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="commissionRate"
                        label="平台佣金比例"
                        rules={[{ required: true, message: '请输入佣金比例!' }]}
                      >
                        <InputNumber
                          min={0}
                          max={1}
                          step={0.01}
                          placeholder="请输入佣金比例"
                          style={{ width: '100%' }}
                          addonAfter="%"
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="enableSMS"
                        label="启用短信通知"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="enablePush"
                        label="启用推送通知"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item>
                    <Button type="primary" htmlType="submit">
                      保存设置
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )
          },
          {
            key: 'announcements',
            label: (
              <span>
                <NotificationOutlined />
                公告管理
              </span>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={handleAddAnnouncement}
                  >
                    新增公告
                  </Button>
                </div>
                <Table
                  columns={announcementColumns}
                  dataSource={announcements}
                  rowKey="id"
                  pagination={{
                    total: announcements.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                />
              </Card>
            )
          },
          {
            key: 'policies',
            label: (
              <span>
                <FileTextOutlined />
                政策管理
              </span>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingPolicy(null);
                      policyForm.resetFields();
                      setPolicyModalVisible(true);
                    }}
                  >
                    新增政策
                  </Button>
                </div>
                <Table
                  columns={[
                    {
                      title: '标题',
                      dataIndex: 'title',
                      key: 'title',
                    },
                    {
                      title: '分类',
                      dataIndex: 'category',
                      key: 'category',
                      render: (category) => <Tag>{category}</Tag>
                    },
                    {
                      title: '版本',
                      dataIndex: 'version',
                      key: 'version',
                    },
                    {
                      title: '生效日期',
                      dataIndex: 'effectiveDate',
                      key: 'effectiveDate',
                    },
                    {
                      title: '状态',
                      dataIndex: 'isActive',
                      key: 'isActive',
                      render: (isActive) => (
                        <Tag color={isActive ? 'green' : 'red'}>
                          {isActive ? '生效中' : '已失效'}
                        </Tag>
                      ),
                    },
                    {
                      title: '创建时间',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Policy) => (
                        <Space size="middle">
                          <Button 
                            type="link" 
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingPolicy(record);
                              policyForm.setFieldsValue(record);
                              setPolicyModalVisible(true);
                            }}
                          >
                            编辑
                          </Button>
                          <Button 
                            type="link" 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: '确认删除政策？',
                                content: '删除后该政策将无法恢复',
                                onOk: () => {
                                  setPolicies(policies.filter(p => p.id !== record.id));
                                  message.success('政策删除成功');
                                }
                              });
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={policies}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                />
              </Card>
            )
          },
          {
            key: 'guides',
            label: (
              <span>
                <BookOutlined />
                操作指南
              </span>
            ),
            children: (
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingGuide(null);
                      guideForm.resetFields();
                      setGuideModalVisible(true);
                    }}
                  >
                    新增指南
                  </Button>
                </div>
                <Table
                  columns={[
                    {
                      title: '标题',
                      dataIndex: 'title',
                      key: 'title',
                    },
                    {
                      title: '目标用户',
                      dataIndex: 'targetUser',
                      key: 'targetUser',
                      render: (target) => <Tag color="blue">{target}</Tag>
                    },
                    {
                      title: '分类',
                      dataIndex: 'category',
                      key: 'category',
                    },
                    {
                      title: '步骤数',
                      key: 'steps',
                      render: (_, record) => record.steps.length
                    },
                    {
                      title: '创建时间',
                      dataIndex: 'createdAt',
                      key: 'createdAt',
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_, record: Guide) => (
                        <Space size="middle">
                          <Button 
                            type="link" 
                            icon={<EyeOutlined />}
                            onClick={() => {
                              // 查看指南详情逻辑
                            }}
                          >
                            查看
                          </Button>
                          <Button 
                            type="link" 
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingGuide(record);
                              guideForm.setFieldsValue(record);
                              setGuideModalVisible(true);
                            }}
                          >
                            编辑
                          </Button>
                          <Button 
                            type="link" 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: '确认删除操作指南？',
                                content: '删除后该指南将无法恢复',
                                onOk: () => {
                                  setGuides(guides.filter(g => g.id !== record.id));
                                  message.success('操作指南删除成功');
                                }
                              });
                            }}
                          >
                            删除
                          </Button>
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={guides}
                  rowKey="id"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                />
              </Card>
            )
          },
          {
            key: 'tickets',
            label: (
              <span>
                <CustomerServiceOutlined />
                客服工单
              </span>
            ),
            children: (
              <Card>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic title="总工单数" value={tickets.length} suffix="个" />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="待处理" 
                        value={tickets.filter(t => t.status === 'pending').length} 
                        suffix="个" 
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="处理中" 
                        value={tickets.filter(t => t.status === 'processing').length} 
                        suffix="个" 
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic 
                        title="已解决" 
                        value={tickets.filter(t => t.status === 'resolved').length} 
                        suffix="个" 
                      />
                    </Card>
                  </Col>
                </Row>
                <Table
                  columns={ticketColumns}
                  dataSource={tickets}
                  rowKey="id"
                  pagination={{
                    total: tickets.length,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true
                  }}
                />
              </Card>
            )
                      },
          {
            key: 'templates',
            label: (
              <span>
                <MessageOutlined />
                消息模板
              </span>
            ),
            children: (
              <Card>
                <Tabs
                  defaultActiveKey="sms"
                  items={[
                    {
                      key: 'sms',
                      label: '短信模板',
                      children: (
                        <>
                          <div style={{ marginBottom: 16 }}>
                            <Button 
                              type="primary" 
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setTemplateType('sms');
                                setEditingSmsTemplate(null);
                                templateForm.resetFields();
                                setTemplateModalVisible(true);
                              }}
                            >
                              新增短信模板
                            </Button>
                          </div>
                          <Table
                            columns={[
                              {
                                title: '模板名称',
                                dataIndex: 'name',
                                key: 'name',
                              },
                              {
                                title: '类型',
                                dataIndex: 'type',
                                key: 'type',
                                render: (type) => <Tag color="blue">{type}</Tag>
                              },
                              {
                                title: '内容',
                                dataIndex: 'content',
                                key: 'content',
                                ellipsis: true,
                              },
                              {
                                title: '变量',
                                key: 'variables',
                                render: (_, record) => (
                                  <>
                                    {record.variables.map((v: string) => (
                                      <Tag key={v}>{v}</Tag>
                                    ))}
                                  </>
                                )
                              },
                              {
                                title: '状态',
                                dataIndex: 'isActive',
                                key: 'isActive',
                                render: (isActive) => (
                                  <Switch checked={isActive} disabled />
                                )
                              },
                              {
                                title: '操作',
                                key: 'action',
                                render: (_, record: SmsTemplate) => (
                                  <Space>
                                    <Button 
                                      type="link" 
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        setTemplateType('sms');
                                        setEditingSmsTemplate(record);
                                        templateForm.setFieldsValue(record);
                                        setTemplateModalVisible(true);
                                      }}
                                    >
                                      编辑
                                    </Button>
                                    <Popconfirm
                                      title="确认删除此模板?"
                                      onConfirm={() => {
                                        setSmsTemplates(smsTemplates.filter(t => t.id !== record.id));
                                        message.success('模板已删除');
                                      }}
                                      okText="确认"
                                      cancelText="取消"
                                    >
                                      <Button 
                                        type="link" 
                                        danger
                                        icon={<DeleteOutlined />}
                                      >
                                        删除
                                      </Button>
                                    </Popconfirm>
                                  </Space>
                                )
                              }
                            ]}
                            dataSource={smsTemplates}
                            rowKey="id"
                          />
                        </>
                      )
                    },
                    {
                      key: 'push',
                      label: '推送模板',
                      children: (
                        <>
                          <div style={{ marginBottom: 16 }}>
                            <Button 
                              type="primary" 
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setTemplateType('push');
                                setEditingPushTemplate(null);
                                templateForm.resetFields();
                                setTemplateModalVisible(true);
                              }}
                            >
                              新增推送模板
                            </Button>
                          </div>
                          <Table
                            columns={[
                              {
                                title: '模板名称',
                                dataIndex: 'name',
                                key: 'name',
                              },
                              {
                                title: '类型',
                                dataIndex: 'type',
                                key: 'type',
                                render: (type) => <Tag color="blue">{type}</Tag>
                              },
                              {
                                title: '标题',
                                dataIndex: 'title',
                                key: 'title',
                              },
                              {
                                title: '目标用户',
                                dataIndex: 'targetUser',
                                key: 'targetUser',
                              },
                              {
                                title: '变量',
                                key: 'variables',
                                render: (_, record) => (
                                  <>
                                    {record.variables.map((v: string) => (
                                      <Tag key={v}>{v}</Tag>
                                    ))}
                                  </>
                                )
                              },
                              {
                                title: '状态',
                                dataIndex: 'isActive',
                                key: 'isActive',
                                render: (isActive) => (
                                  <Switch checked={isActive} disabled />
                                )
                              },
                              {
                                title: '操作',
                                key: 'action',
                                render: (_, record: PushTemplate) => (
                                  <Space>
                                    <Button 
                                      type="link" 
                                      icon={<EditOutlined />}
                                      onClick={() => {
                                        setTemplateType('push');
                                        setEditingPushTemplate(record);
                                        templateForm.setFieldsValue(record);
                                        setTemplateModalVisible(true);
                                      }}
                                    >
                                      编辑
                                    </Button>
                                    <Popconfirm
                                      title="确认删除此模板?"
                                      onConfirm={() => {
                                        setPushTemplates(pushTemplates.filter(t => t.id !== record.id));
                                        message.success('模板已删除');
                                      }}
                                      okText="确认"
                                      cancelText="取消"
                                    >
                                      <Button 
                                        type="link" 
                                        danger
                                        icon={<DeleteOutlined />}
                                      >
                                        删除
                                      </Button>
                                    </Popconfirm>
                                  </Space>
                                )
                              }
                            ]}
                            dataSource={pushTemplates}
                            rowKey="id"
                          />
                        </>
                      )
                    }
                  ]}
                />
              </Card>
            )
          }
        ]}
      />

      {/* 公告编辑弹窗 */}
      <Modal
        title={editingAnnouncement ? '编辑公告' : '新增公告'}
        open={announcementModalVisible}
        onCancel={() => setAnnouncementModalVisible(false)}
        onOk={() => announcementForm.submit()}
        width={600}
      >
        <Form
          form={announcementForm}
          layout="vertical"
          onFinish={handleSubmitAnnouncement}
        >
          <Form.Item
            name="title"
            label="公告标题"
            rules={[{ required: true, message: '请输入公告标题!' }]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            name="type"
            label="公告类型"
            rules={[{ required: true, message: '请选择公告类型!' }]}
          >
            <Select placeholder="请选择公告类型">
              <Option value="notice">通知</Option>
              <Option value="holiday">节假日</Option>
              <Option value="maintenance">维护</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="公告内容"
            rules={[{ required: true, message: '请输入公告内容!' }]}
          >
            <TextArea rows={6} placeholder="请输入公告内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings; 