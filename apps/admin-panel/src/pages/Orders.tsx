import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  message,
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Input,
  DatePicker,
  Tabs,
  Form,
  InputNumber,
  Switch,
  Tooltip,
  Badge,
  Timeline,
  Drawer,
  Divider,
  Alert
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  SearchOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  FilterOutlined,
  ExportOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  nurseName: string;
  serviceType: string;
  amount: number;
  status: string;
  createdAt: string;
  scheduledTime: string;
  completedTime?: string;
  address: string;
  description: string;
  priority: string;
  disputeStatus?: string;
  disputeReason?: string;
  estimatedDuration: number;
  actualDuration?: number;
  customerPhone: string;
  nursePhone: string;
  paymentStatus: string;
  rating?: number;
  review?: string;
  orderHistory: OrderHistoryItem[];
  autoAssignEnabled: boolean;
}

interface OrderHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  operator: string;
  details: string;
}

interface AutoAssignRule {
  id: string;
  name: string;
  serviceType: string;
  priority: string;
  maxDistance: number;
  minRating: number;
  isActive: boolean;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('all');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [autoAssignModalVisible, setAutoAssignModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [autoAssignRules, setAutoAssignRules] = useState<AutoAssignRule[]>([]);
  const [ruleForm] = Form.useForm();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoading(true);
    // 模拟数据
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNo: 'ORD20240115001',
        customerName: '张阿姨',
        nurseName: '王护工',
        serviceType: '日常护理',
        amount: 120,
        status: 'completed',
        createdAt: '2024-01-15 09:00',
        scheduledTime: '2024-01-15 14:00',
        completedTime: '2024-01-15 16:00',
        address: '北京市朝阳区xxx小区',
        description: '日常护理服务，包括生活照料、康复训练等',
        priority: 'normal',
        estimatedDuration: 2,
        actualDuration: 2,
        customerPhone: '13800138001',
        nursePhone: '13800138002',
        paymentStatus: 'paid',
        rating: 5,
        review: '服务很好，护工很专业',
        orderHistory: [
          { id: '1-1', timestamp: '2024-01-15 09:00', action: '创建订单', operator: '系统', details: '用户下单' },
          { id: '1-2', timestamp: '2024-01-15 10:00', action: '派发订单', operator: '管理员', details: '手动派发给王护工' },
          { id: '1-3', timestamp: '2024-01-15 14:00', action: '开始服务', operator: '王护工', details: '到达服务地点' },
          { id: '1-4', timestamp: '2024-01-15 16:00', action: '完成服务', operator: '王护工', details: '服务完成' }
        ],
        autoAssignEnabled: false
      },
      {
        id: '2',
        orderNo: 'ORD20240115002',
        customerName: '李叔叔',
        nurseName: '待派发',
        serviceType: '医疗陪护',
        amount: 200,
        status: 'pending',
        createdAt: '2024-01-15 10:30',
        scheduledTime: '2024-01-16 09:00',
        address: '北京市海淀区xxx医院',
        description: '医院陪护服务，需要专业护理人员',
        priority: 'high',
        estimatedDuration: 4,
        customerPhone: '13800138003',
        nursePhone: '',
        paymentStatus: 'pending',
        orderHistory: [
          { id: '2-1', timestamp: '2024-01-15 10:30', action: '创建订单', operator: '系统', details: '用户下单' }
        ],
        autoAssignEnabled: true
      },
      {
        id: '3',
        orderNo: 'ORD20240115003',
        customerName: '陈奶奶',
        nurseName: '刘护工',
        serviceType: '康复训练',
        amount: 150,
        status: 'processing',
        createdAt: '2024-01-15 11:00',
        scheduledTime: '2024-01-15 15:00',
        address: '北京市西城区xxx康复中心',
        description: '康复训练服务，包括物理治疗、运动训练等',
        priority: 'normal',
        estimatedDuration: 3,
        actualDuration: 2.5,
        customerPhone: '13800138004',
        nursePhone: '13800138005',
        paymentStatus: 'paid',
        orderHistory: [
          { id: '3-1', timestamp: '2024-01-15 11:00', action: '创建订单', operator: '系统', details: '用户下单' },
          { id: '3-2', timestamp: '2024-01-15 12:00', action: '自动派发', operator: '系统', details: '根据规则自动派发' },
          { id: '3-3', timestamp: '2024-01-15 15:00', action: '开始服务', operator: '刘护工', details: '到达服务地点' }
        ],
        autoAssignEnabled: true
      },
      {
        id: '4',
        orderNo: 'ORD20240115004',
        customerName: '赵爷爷',
        nurseName: '张护工',
        serviceType: '医疗陪护',
        amount: 180,
        status: 'disputed',
        createdAt: '2024-01-15 12:00',
        scheduledTime: '2024-01-15 16:00',
        address: '北京市东城区xxx医院',
        description: '医院陪护服务',
        priority: 'urgent',
        estimatedDuration: 6,
        actualDuration: 6,
        customerPhone: '13800138006',
        nursePhone: '13800138007',
        paymentStatus: 'refunded',
        disputeStatus: 'pending',
        disputeReason: '服务质量不达标',
        orderHistory: [
          { id: '4-1', timestamp: '2024-01-15 12:00', action: '创建订单', operator: '系统', details: '用户下单' },
          { id: '4-2', timestamp: '2024-01-15 13:00', action: '派发订单', operator: '管理员', details: '手动派发' },
          { id: '4-3', timestamp: '2024-01-15 16:00', action: '开始服务', operator: '张护工', details: '到达服务地点' },
          { id: '4-4', timestamp: '2024-01-15 22:00', action: '完成服务', operator: '张护工', details: '服务完成' },
          { id: '4-5', timestamp: '2024-01-16 09:00', action: '发起争议', operator: '赵爷爷', details: '投诉服务质量' }
        ],
        autoAssignEnabled: false
      },
      {
        id: '5',
        orderNo: 'ORD20240115005',
        customerName: '孙奶奶',
        nurseName: '李护工',
        serviceType: '日常护理',
        amount: 100,
        status: 'cancelled',
        createdAt: '2024-01-15 13:00',
        scheduledTime: '2024-01-16 10:00',
        address: '北京市丰台区xxx小区',
        description: '日常护理服务',
        priority: 'normal',
        estimatedDuration: 2,
        customerPhone: '13800138008',
        nursePhone: '13800138009',
        paymentStatus: 'refunded',
        orderHistory: [
          { id: '5-1', timestamp: '2024-01-15 13:00', action: '创建订单', operator: '系统', details: '用户下单' },
          { id: '5-2', timestamp: '2024-01-15 14:00', action: '派发订单', operator: '系统', details: '自动派发' },
          { id: '5-3', timestamp: '2024-01-15 20:00', action: '取消订单', operator: '孙奶奶', details: '临时有事取消' }
        ],
        autoAssignEnabled: true
      }
    ];

    // 模拟自动派发规则
    const mockRules: AutoAssignRule[] = [
      {
        id: '1',
        name: '日常护理自动派发',
        serviceType: '日常护理',
        priority: 'normal',
        maxDistance: 10,
        minRating: 4.0,
        isActive: true
      },
      {
        id: '2',
        name: '医疗陪护自动派发',
        serviceType: '医疗陪护',
        priority: 'high',
        maxDistance: 15,
        minRating: 4.5,
        isActive: true
      },
      {
        id: '3',
        name: '康复训练自动派发',
        serviceType: '康复训练',
        priority: 'normal',
        maxDistance: 12,
        minRating: 4.2,
        isActive: false
      }
    ];
    setAutoAssignRules(mockRules);
    setOrders(mockOrders);
    setLoading(false);
  };

  const handleAssignNurse = (orderId: string) => {
    Modal.confirm({
      title: '确认派发订单？',
      content: '派发后护工将收到订单通知',
      onOk: () => {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'assigned', nurseName: '已派发护工' }
            : order
        ));
        message.success('订单派发成功');
      }
    });
  };

  const handleCompleteOrder = (orderId: string) => {
    Modal.confirm({
      title: '确认完成订单？',
      content: '完成订单后将进行结算',
      onOk: () => {
        setOrders(orders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: 'completed', 
                completedTime: new Date().toLocaleString() 
              }
            : order
        ));
        message.success('订单已完成');
      }
    });
  };

  const handleCancelOrder = (orderId: string) => {
    Modal.confirm({
      title: '确认取消订单？',
      content: '取消订单将退还用户费用',
      onOk: () => {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ));
        message.success('订单已取消');
      }
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const handleViewHistory = (order: Order) => {
    setSelectedOrder(order);
    setDrawerVisible(true);
  };

  const handleAutoAssignSettings = () => {
    setAutoAssignModalVisible(true);
  };

  const handleDisputeManagement = (order: Order) => {
    setSelectedOrder(order);
    setDisputeModalVisible(true);
  };

  const handleAddAutoAssignRule = () => {
    ruleForm.resetFields();
    setAutoAssignModalVisible(true);
  };

  const handleAutoAssignRuleSubmit = (values: any) => {
    const newRule: AutoAssignRule = {
      id: Date.now().toString(),
      ...values,
      isActive: true
    };
    setAutoAssignRules([...autoAssignRules, newRule]);
    setAutoAssignModalVisible(false);
    message.success('自动派发规则添加成功');
  };

  const handleToggleAutoAssign = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, autoAssignEnabled: !order.autoAssignEnabled }
        : order
    ));
    message.success('自动派发设置已更新');
  };

  const handleResolveDispute = (orderId: string, resolution: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: 'completed',
            disputeStatus: 'resolved',
            disputeReason: `${order.disputeReason} - 处理结果: ${resolution}`
          }
        : order
    ));
    setDisputeModalVisible(false);
    message.success('争议已处理');
  };

  const handleExportOrders = () => {
    // 模拟导出功能
    message.success('订单数据导出成功');
  };

  const handleBulkAssign = () => {
    Modal.confirm({
      title: '批量派发订单',
      content: '确认将待派发订单按规则自动派发给合适的护工？',
      onOk: () => {
        const pendingOrders = orders.filter(o => o.status === 'pending' && o.autoAssignEnabled);
        if (pendingOrders.length > 0) {
          setOrders(orders.map(order => 
            order.status === 'pending' && order.autoAssignEnabled
              ? { ...order, status: 'assigned', nurseName: '自动派发护工' }
              : order
          ));
          message.success(`成功派发 ${pendingOrders.length} 个订单`);
        } else {
          message.info('没有可自动派发的订单');
        }
      }
    });
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'orange',
      assigned: 'blue',
      processing: 'blue',
      completed: 'green',
      cancelled: 'red'
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待派发',
      assigned: '已派发',
      processing: '进行中',
      completed: '已完成',
      cancelled: '已取消',
      disputed: '争议中'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: 'blue',
      normal: 'green',
      high: 'orange',
      urgent: 'red'
    };
    return priorityMap[priority] || 'default';
  };

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: '低',
      normal: '普通',
      high: '高',
      urgent: '紧急'
    };
    return priorityMap[priority] || priority;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 120,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100,
    },
    {
      title: '护工',
      dataIndex: 'nurseName',
      key: 'nurseName',
      width: 100,
    },
    {
      title: '服务类型',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 100,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 80,
      render: (amount: number) => `¥${amount}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: Order) => (
        <div>
          <Tag color={getStatusColor(status)}>
            {getStatusText(status)}
          </Tag>
          {record.disputeStatus && (
            <Badge status="error" text="争议" />
          )}
        </div>
      ),
    },
    {
      title: '支付状态',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          paid: 'green',
          pending: 'orange',
          refunded: 'red'
        };
        const textMap: Record<string, string> = {
          paid: '已支付',
          pending: '待支付',
          refunded: '已退款'
        };
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
    },
    {
      title: '预约时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Order) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Button 
              type="link" 
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            >
              查看
            </Button>
            <Button 
              type="link" 
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleViewHistory(record)}
            >
              历史
            </Button>
          </Space>
          
          {/* 派发操作 */}
          {record.status === 'pending' && (
            <Space size="small">
              <Button 
                type="link" 
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleAssignNurse(record.id)}
              >
                派发
              </Button>
              <Tooltip title={record.autoAssignEnabled ? '关闭自动派发' : '开启自动派发'}>
                <Switch
                  size="small"
                  checked={record.autoAssignEnabled}
                  onChange={() => handleToggleAutoAssign(record.id)}
                />
              </Tooltip>
            </Space>
          )}
          
          {/* 服务操作 */}
          {record.status === 'processing' && (
            <Button 
              type="link" 
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteOrder(record.id)}
            >
              完成
            </Button>
          )}
          
          {/* 争议处理 */}
          {record.status === 'disputed' && (
            <Button 
              type="link" 
              size="small"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleDisputeManagement(record)}
            >
              处理争议
            </Button>
          )}
          
          {/* 取消操作 */}
          {(record.status === 'pending' || record.status === 'assigned') && (
            <Button 
              type="link" 
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelOrder(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNo.includes(searchText) || 
                         order.customerName.includes(searchText) ||
                         order.nurseName.includes(searchText);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTab = currentTab === 'all' || 
                      (currentTab === 'pending' && order.status === 'pending') ||
                      (currentTab === 'processing' && order.status === 'processing') ||
                      (currentTab === 'completed' && order.status === 'completed') ||
                      (currentTab === 'disputed' && order.status === 'disputed') ||
                      (currentTab === 'cancelled' && order.status === 'cancelled');
    return matchesSearch && matchesStatus && matchesTab;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    disputed: orders.filter(o => o.status === 'disputed').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0),
    avgRating: orders.filter(o => o.rating).reduce((sum, o) => sum + (o.rating || 0), 0) / orders.filter(o => o.rating).length || 0
  };

  return (
    <div>
      <h2>订单管理</h2>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={3}>
          <Card>
            <Statistic title="总订单数" value={stats.total} suffix="单" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="待派发" value={stats.pending} suffix="单" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="进行中" value={stats.processing} suffix="单" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="已完成" value={stats.completed} suffix="单" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="已取消" value={stats.cancelled} suffix="单" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="争议中" value={stats.disputed} suffix="单" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="总收入" value={stats.totalRevenue} suffix="元" />
          </Card>
        </Col>
        <Col span={3}>
          <Card>
            <Statistic title="平均评分" value={stats.avgRating.toFixed(1)} suffix="分" />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleBulkAssign}
            >
              批量派发
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<SettingOutlined />}
              onClick={handleAutoAssignSettings}
            >
              自动派发设置
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<ExportOutlined />}
              onClick={handleExportOrders}
            >
              导出数据
            </Button>
          </Col>
          <Col span={6}>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadOrders}
            >
              刷新数据
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="搜索订单号、客户、护工"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待派发</Option>
              <Option value="assigned">已派发</Option>
              <Option value="processing">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="disputed">争议中</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker placeholder={['开始日期', '结束日期']} />
          </Col>
          <Col span={4}>
            <Select placeholder="优先级" style={{ width: '100%' }}>
              <Option value="all">全部优先级</Option>
              <Option value="low">低</Option>
              <Option value="normal">普通</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button icon={<FilterOutlined />} style={{ width: '100%' }}>
              高级筛选
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 订单表格 */}
      <Card>
        <Tabs 
          activeKey={currentTab} 
          onChange={setCurrentTab}
          items={[
            { key: 'all', label: `全部订单 (${orders.length})` },
            { key: 'pending', label: `待派发 (${stats.pending})` },
            { key: 'processing', label: `进行中 (${stats.processing})` },
            { key: 'completed', label: `已完成 (${stats.completed})` },
            { key: 'disputed', label: `争议中 (${stats.disputed})` },
            { key: 'cancelled', label: `已取消 (${stats.cancelled})` }
          ]}
        />
        
        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredOrders.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
        />
      </Card>

      {/* 订单详情弹窗 */}
      <Modal
        title="订单详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>订单号:</strong> {selectedOrder.orderNo}</p>
                <p><strong>客户:</strong> {selectedOrder.customerName}</p>
                <p><strong>护工:</strong> {selectedOrder.nurseName}</p>
                <p><strong>服务类型:</strong> {selectedOrder.serviceType}</p>
                <p><strong>金额:</strong> ¥{selectedOrder.amount}</p>
                <p><strong>优先级:</strong> 
                  <Tag color={getPriorityColor(selectedOrder.priority)} style={{ marginLeft: 8 }}>
                    {getPriorityText(selectedOrder.priority)}
                  </Tag>
                </p>
                <p><strong>状态:</strong> 
                  <Tag color={getStatusColor(selectedOrder.status)} style={{ marginLeft: 8 }}>
                    {getStatusText(selectedOrder.status)}
                  </Tag>
                </p>
                <p><strong>支付状态:</strong> 
                  <Tag color={selectedOrder.paymentStatus === 'paid' ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                    {selectedOrder.paymentStatus === 'paid' ? '已支付' : '待支付'}
                  </Tag>
                </p>
              </Col>
              <Col span={12}>
                <p><strong>创建时间:</strong> {selectedOrder.createdAt}</p>
                <p><strong>预约时间:</strong> {selectedOrder.scheduledTime}</p>
                {selectedOrder.completedTime && (
                  <p><strong>完成时间:</strong> {selectedOrder.completedTime}</p>
                )}
                <p><strong>预计时长:</strong> {selectedOrder.estimatedDuration}小时</p>
                {selectedOrder.actualDuration && (
                  <p><strong>实际时长:</strong> {selectedOrder.actualDuration}小时</p>
                )}
                <p><strong>客户电话:</strong> {selectedOrder.customerPhone}</p>
                <p><strong>护工电话:</strong> {selectedOrder.nursePhone}</p>
                <p><strong>服务地址:</strong> {selectedOrder.address}</p>
                <p><strong>服务描述:</strong> {selectedOrder.description}</p>
                {selectedOrder.rating && (
                  <p><strong>评分:</strong> {selectedOrder.rating}分</p>
                )}
                {selectedOrder.review && (
                  <p><strong>评价:</strong> {selectedOrder.review}</p>
                )}
                {selectedOrder.disputeReason && (
                  <p><strong>争议原因:</strong> {selectedOrder.disputeReason}</p>
                )}
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 订单历史抽屉 */}
      <Drawer
        title="订单历史"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedOrder && (
          <div>
            <Timeline>
              {selectedOrder.orderHistory.map((item) => (
                <Timeline.Item key={item.id}>
                  <p><strong>{item.timestamp}</strong></p>
                  <p><strong>操作:</strong> {item.action}</p>
                  <p><strong>操作人:</strong> {item.operator}</p>
                  <p><strong>详情:</strong> {item.details}</p>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Drawer>

      {/* 自动派发设置弹窗 */}
      <Modal
        title="自动派发规则设置"
        open={autoAssignModalVisible}
        onCancel={() => setAutoAssignModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddAutoAssignRule}
          >
            添加规则
          </Button>
        </div>
        
        <Table
          columns={[
            { title: '规则名称', dataIndex: 'name', key: 'name' },
            { title: '服务类型', dataIndex: 'serviceType', key: 'serviceType' },
            { title: '优先级', dataIndex: 'priority', key: 'priority' },
            { title: '最大距离(km)', dataIndex: 'maxDistance', key: 'maxDistance' },
            { title: '最低评分', dataIndex: 'minRating', key: 'minRating' },
            { 
              title: '状态', 
              dataIndex: 'isActive', 
              key: 'isActive',
              render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                  {isActive ? '启用' : '停用'}
                </Tag>
              )
            }
          ]}
          dataSource={autoAssignRules}
          rowKey="id"
          pagination={false}
        />

        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={handleAutoAssignRuleSubmit}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称!' }]}
              >
                <Input placeholder="请输入规则名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serviceType"
                label="服务类型"
                rules={[{ required: true, message: '请选择服务类型!' }]}
              >
                <Select placeholder="请选择服务类型">
                  <Option value="日常护理">日常护理</Option>
                  <Option value="医疗陪护">医疗陪护</Option>
                  <Option value="康复训练">康复训练</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级!' }]}
              >
                <Select placeholder="请选择优先级">
                  <Option value="low">低</Option>
                  <Option value="normal">普通</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxDistance"
                label="最大距离(km)"
                rules={[{ required: true, message: '请输入最大距离!' }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minRating"
                label="最低评分"
                rules={[{ required: true, message: '请输入最低评分!' }]}
              >
                <InputNumber min={1} max={5} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 争议处理弹窗 */}
      <Modal
        title="争议处理"
        open={disputeModalVisible}
        onCancel={() => setDisputeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDisputeModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="resolve" 
            type="primary" 
            onClick={() => handleResolveDispute(selectedOrder?.id || '', '全额退款')}
          >
            处理争议
          </Button>
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            <Alert
              message="争议订单"
              description={`订单 ${selectedOrder.orderNo} 存在争议，需要及时处理。`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <p><strong>争议原因:</strong> {selectedOrder.disputeReason}</p>
              <p><strong>客户:</strong> {selectedOrder.customerName}</p>
              <p><strong>护工:</strong> {selectedOrder.nurseName}</p>
              <p><strong>订单金额:</strong> ¥{selectedOrder.amount}</p>
            </div>

            <Divider />

            <h4>处理建议:</h4>
            <ul>
              <li>联系客户了解详细情况</li>
              <li>核实护工服务记录</li>
              <li>根据实际情况决定退款比例</li>
              <li>记录处理过程和结果</li>
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders; 