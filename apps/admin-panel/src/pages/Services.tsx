import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Select,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  hourlyRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = () => {
    setLoading(true);
    // 模拟数据
    const mockServices: Service[] = [
      {
        id: '1',
        name: '日常护理',
        category: '生活照料',
        description: '包括生活照料、个人卫生、饮食照料等基础护理服务',
        basePrice: 80,
        hourlyRate: 20,
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      },
      {
        id: '2',
        name: '医疗陪护',
        category: '医疗护理',
        description: '医院陪护服务，包括病情观察、用药提醒、康复指导等',
        basePrice: 150,
        hourlyRate: 30,
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      },
      {
        id: '3',
        name: '康复训练',
        category: '康复护理',
        description: '专业康复训练服务，包括物理治疗、运动训练、功能恢复等',
        basePrice: 120,
        hourlyRate: 25,
        isActive: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      },
      {
        id: '4',
        name: '心理疏导',
        category: '心理护理',
        description: '专业心理咨询和疏导服务，帮助老人保持心理健康',
        basePrice: 100,
        hourlyRate: 20,
        isActive: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      }
    ];
    setServices(mockServices);
    setLoading(false);
  };

  const handleAddService = () => {
    setEditingService(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setModalVisible(true);
  };

  const handleDeleteService = (serviceId: string) => {
    Modal.confirm({
      title: '确认删除服务？',
      content: '删除后该服务将无法恢复',
      onOk: () => {
        setServices(services.filter(s => s.id !== serviceId));
        message.success('服务删除成功');
      }
    });
  };

  const handleToggleStatus = (serviceId: string, currentStatus: boolean) => {
    const action = currentStatus ? '停用' : '启用';
    Modal.confirm({
      title: `确认${action}服务？`,
      content: `${action}后该服务将${currentStatus ? '无法' : '可以'}被用户选择`,
      onOk: () => {
        setServices(services.map(s => 
          s.id === serviceId ? { ...s, isActive: !currentStatus } : s
        ));
        message.success(`服务${action}成功`);
      }
    });
  };

  const handleSubmit = async (values: any) => {
    if (editingService) {
      // 编辑服务
      setServices(services.map(s => 
        s.id === editingService.id 
          ? { ...s, ...values, updatedAt: new Date().toLocaleDateString() }
          : s
      ));
      message.success('服务更新成功');
    } else {
      // 新增服务
      const newService: Service = {
        id: Date.now().toString(),
        ...values,
        isActive: true,
        createdAt: new Date().toLocaleDateString(),
        updatedAt: new Date().toLocaleDateString()
      };
      setServices([...services, newService]);
      message.success('服务添加成功');
    }
    setModalVisible(false);
  };

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryMap: Record<string, { text: string; color: string }> = {
          '生活照料': { text: '生活照料', color: 'blue' },
          '医疗护理': { text: '医疗护理', color: 'green' },
          '康复护理': { text: '康复护理', color: 'orange' },
          '心理护理': { text: '心理护理', color: 'purple' }
        };
        const categoryInfo = categoryMap[category] || { text: category, color: 'default' };
        return <Tag color={categoryInfo.color}>{categoryInfo.text}</Tag>;
      },
    },
    {
      title: '基础价格',
      dataIndex: 'basePrice',
      key: 'basePrice',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '小时费率',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      render: (rate: number) => `¥${rate}/小时`,
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
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Service) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleEditService(record)}
          >
            查看
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditService(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteService(record.id)}
          >
            删除
          </Button>
          <Switch
            checked={record.isActive}
            onChange={() => handleToggleStatus(record.id, record.isActive)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    inactive: services.filter(s => !s.isActive).length,
    categories: new Set(services.map(s => s.category)).size
  };

  return (
    <div>
      <h2>服务管理</h2>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="总服务数" value={stats.total} suffix="个" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="启用服务" value={stats.active} suffix="个" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="停用服务" value={stats.inactive} suffix="个" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="服务分类" value={stats.categories} suffix="类" />
          </Card>
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAddService}
        >
          新增服务
        </Button>
      </Card>

      {/* 服务表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={services}
          loading={loading}
          rowKey="id"
          pagination={{
            total: services.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
        />
      </Card>

      {/* 新增/编辑服务弹窗 */}
      <Modal
        title={editingService ? '编辑服务' : '新增服务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称!' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="服务分类"
            rules={[{ required: true, message: '请选择服务分类!' }]}
          >
            <Select placeholder="请选择服务分类">
              <Option value="生活照料">生活照料</Option>
              <Option value="医疗护理">医疗护理</Option>
              <Option value="康复护理">康复护理</Option>
              <Option value="心理护理">心理护理</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="服务描述"
            rules={[{ required: true, message: '请输入服务描述!' }]}
          >
            <TextArea rows={4} placeholder="请输入服务描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="basePrice"
                label="基础价格"
                rules={[{ required: true, message: '请输入基础价格!' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="请输入基础价格"
                  style={{ width: '100%' }}
                  addonAfter="元"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hourlyRate"
                label="小时费率"
                rules={[{ required: true, message: '请输入小时费率!' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="请输入小时费率"
                  style={{ width: '100%' }}
                  addonAfter="元/小时"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Services; 