import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Form,
  Input,
  Select,
  Tabs,
  Divider,
  TreeSelect,
  DatePicker,
  Empty,
  Alert,
  Dropdown,
  Descriptions,
  Avatar,
  Typography
} from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EditOutlined,
  MoreOutlined,
  UserOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { AdminService } from '../services/AdminService';


const { Option } = Select;
const { TreeNode } = TreeSelect;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

interface User {
  id: string;
  username: string;
  realname: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
  adminRole?: string;
  qualificationStatus?: string;
  blacklistReason?: string;
  pagePermissions?: string[];
  avatar?: string;
}

interface FilterState {
  role?: string;
  status?: string;
  isVerified?: boolean;
  dateRange?: [Dayjs, Dayjs] | null;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [assignRoleModalVisible, setAssignRoleModalVisible] = useState(false);
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [serverStats, setServerStats] = useState<any | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    role: undefined,
    status: undefined,
    isVerified: undefined,
    dateRange: undefined
  });

  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await AdminService.getUserList();
      // 用户列表响应

      if ((response as any).code === 200 && (response as any).data && (response as any).data.users) {
        setUsers((response as any).data.users);
      } else {
        message.error('获取用户列表失败：数据格式错误');
        setUsers([]); // 设置为空数组而不是模拟数据
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      message.error('无法连接到服务器，请检查网络连接或联系管理员');
      setUsers([]); // 设置为空数组而不是模拟数据
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 可选：加载后端统计数据用于更准确统计
  useEffect(() => {
    (async () => {
      try {
        const resp: any = await AdminService.getAdminStatistics();
        if (resp?.code === 200) {
          setServerStats(resp.data);
        }
      } catch (e) {
        // 忽略统计错误
      }
    })();
  }, []);

  const handleVerify = async (userId: string, approved: boolean) => {
    try {
      const action = approved ? '通过' : '拒绝';
      const response = await AdminService.auditUser(userId, {
        action: approved ? 'approve' : 'reject',
        isVerified: approved
      });

      if ((response as any).code === 200) {
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, isVerified: approved }
            : user
        ));
        message.success(`用户认证${action}成功`);
      } else {
        message.error(`用户认证${action}失败`);
      }
    } catch (error) {
      console.error('用户认证操作失败:', error);
      message.error('用户认证操作失败');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'frozen' : 'active';
      const action = newStatus === 'active' ? '启用' : '禁用';

      const response = await AdminService.updateUserStatus(userId, newStatus);

      if ((response as any).code === 200) {
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, status: newStatus }
            : user
        ));
        message.success(`用户${action}成功`);
      } else {
        message.error(`用户${action}失败`);
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleAddUser = () => {
    setAddUserModalVisible(true);
    form.resetFields();
  };

  const handleAssignRole = (user: User) => {
    setSelectedUser(user);
    setAssignRoleModalVisible(true);
    roleForm.setFieldsValue({ adminRole: user.adminRole });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserModalVisible(true);
    editForm.setFieldsValue({
      username: user.username,
      realname: user.realname,
      email: user.email,
      phone: user.phone,
      role: user.role,
      pagePermissions: user.pagePermissions
    });
  };

  const handleEditUserSubmit = async (values: any) => {
    if (selectedUser) {
      try {
        // 这里应该调用更新用户信息的API
        setUsers(users.map(user =>
          user.id === selectedUser.id
            ? { ...user, ...values }
            : user
        ));
        setEditUserModalVisible(false);
        message.success('用户信息更新成功');
      } catch (error) {
        console.error('更新用户信息失败:', error);
        message.error('更新用户信息失败');
      }
    }
  };

  const handleAddUserSubmit = async (values: any) => {
    try {
      const response = await AdminService.addUser(values);

      if ((response as any).code === 200) {
        if ((response as any).data && (response as any).data.user) {
          setUsers([...users, (response as any).data.user]);
        } else {
          // 如果后端没有返回用户数据，使用前端创建的用户对象
          const newUser: User = {
            id: Date.now().toString(),
            ...values,
            status: 'active',
            isVerified: false,
            createdAt: new Date().toLocaleDateString(),
            lastLogin: '-',
            pagePermissions: values.pagePermissions || []
          };
          setUsers([...users, newUser]);
        }
        setAddUserModalVisible(false);
        message.success('用户添加成功');

        // 重新加载用户列表，确保数据同步
        loadUsers();
      } else {
        message.error((response as any).message || '用户添加失败');
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      message.error('添加用户失败');
    }
  };

  const handleAssignRoleSubmit = async (values: any) => {
    if (selectedUser) {
      try {
        const response = await AdminService.assignUserRole(selectedUser.id, values.adminRole);

        if ((response as any).code === 200) {
          setUsers(users.map(user =>
            user.id === selectedUser.id
              ? { ...user, adminRole: values.adminRole }
              : user
          ));
          setAssignRoleModalVisible(false);
          message.success('角色分配成功');
        } else {
          message.error((response as any).message || '角色分配失败');
        }
      } catch (error) {
        console.error('分配角色失败:', error);
        message.error('分配角色失败');
      }
    }
  };

  const handleAddToBlacklist = async (userId: string) => {
    Modal.confirm({
      title: '确认加入黑名单？',
      content: '加入黑名单后用户将无法使用平台服务',
      onOk: async () => {
        try {
          const response = await AdminService.updateUserStatus(userId, 'blacklist', '管理员操作');

          if ((response as any).code === 200) {
            setUsers(users.map(user =>
              user.id === userId
                ? { ...user, status: 'blacklist', blacklistReason: '管理员操作' }
                : user
            ));
            message.success('用户已加入黑名单');
          } else {
            message.error((response as any).message || '加入黑名单失败');
          }
        } catch (error) {
          console.error('加入黑名单失败:', error);
          message.error('加入黑名单失败');
        }
      }
    });
  };

  const handleRemoveFromBlacklist = async (userId: string) => {
    Modal.confirm({
      title: '确认移出黑名单？',
      content: '移出黑名单后用户将可以正常使用平台服务',
      onOk: async () => {
        try {
          const response = await AdminService.updateUserStatus(userId, 'active');

          if ((response as any).code === 200) {
            setUsers(users.map(user =>
              user.id === userId
                ? { ...user, status: 'active', blacklistReason: undefined }
                : user
            ));
            message.success('用户已移出黑名单');
          } else {
            message.error((response as any).message || '移出黑名单失败');
          }
        } catch (error) {
          console.error('移出黑名单失败:', error);
          message.error('移出黑名单失败');
        }
      }
    });
  };

  const handleQualificationReview = async (userId: string, approved: boolean) => {
    const action = approved ? '通过' : '拒绝';
    Modal.confirm({
      title: `确认${action}护工资质认证？`,
      content: approved ? '通过后护工将可以接单服务' : '拒绝后护工需要重新提交认证材料',
      onOk: async () => {
        try {
          const response = await AdminService.auditUser(userId, {
            action: approved ? 'approve' : 'reject',
            qualificationStatus: approved ? 'approved' : 'rejected',
            status: approved ? 'active' : 'pending'
          });

          if ((response as any).code === 200) {
            setUsers(users.map(user =>
              user.id === userId
                ? {
                  ...user,
                  qualificationStatus: approved ? 'approved' : 'rejected',
                  status: approved ? 'active' : 'pending'
                }
                : user
            ));
            message.success(`护工资质认证${action}成功`);
          } else {
            message.error(`护工资质认证${action}失败`);
          }
        } catch (error) {
          console.error('护工资质认证操作失败:', error);
          message.error('护工资质认证操作失败');
        }
      }
    });
  };



  const columns: ColumnType<User>[] = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      sorter: (a: User, b: User) => a.id.localeCompare(b.id),
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (_, record: User) => (
        <Avatar
          src={record.avatar}
          icon={<UserOutlined />}
          size="large"
        />
      ),
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record: User) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.realname}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>@{record.username}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => {
        const roleMap: Record<string, { text: string; color: string }> = {
          nurse: { text: '护工用户', color: 'orange' },
          admin: { text: '管理员', color: 'red' }
        };
        const roleInfo = roleMap[role] || { text: role, color: 'default' };

        if (role === 'admin' && record.adminRole) {
          const adminRoleMap: Record<string, string> = {
            super_admin: '超级管理员',
            cs_manager: '客服主管',
            reviewer: '审核员',
            finance: '财务',
            system_admin: '系统管理员',
            content_manager: '内容管理员'
          };
          return (
            <div>
              <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
              <br />
              <Tag color="purple">{adminRoleMap[record.adminRole] || record.adminRole}</Tag>
            </div>
          );
        }

        return <Tag color={roleInfo.color}>{roleInfo.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
          active: { text: '正常', color: 'green' },
          pending: { text: '待审核', color: 'orange' },
          frozen: { text: '已冻结', color: 'red' },
          rejected: { text: '已拒绝', color: 'red' },
          blacklist: { text: '黑名单', color: 'red' }
        };
        const statusInfo = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '认证状态',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified: boolean) => (
        <Tag color={isVerified ? 'green' : 'red'}>
          {isVerified ? '已认证' : '未认证'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: User) => {
        const items = [
          {
            key: 'view',
            label: '查看详情',
            icon: <EyeOutlined />,
            onClick: () => handleViewDetails(record)
          },
          {
            key: 'edit',
            label: '编辑信息',
            icon: <EditOutlined />,
            onClick: () => handleEditUser(record)
          }
        ];

        if (record.role === 'admin') {
          items.push({
            key: 'role',
            label: '分配角色',
            icon: <TeamOutlined />,
            onClick: () => handleAssignRole(record)
          });
        }

        if (record.status === 'pending') {
          items.push(
            {
              key: 'approve',
              label: '通过审核',
              icon: <CheckCircleOutlined />,
              onClick: () => handleVerify(record.id, true)
            },
            {
              key: 'reject',
              label: '拒绝审核',
              icon: <CloseCircleOutlined />,
              onClick: () => handleVerify(record.id, false)
            }
          );
        }

        if (record.role === 'nurse' && record.qualificationStatus === 'pending') {
          items.push(
            {
              key: 'cert_approve',
              label: '通过认证',
              icon: <SafetyCertificateOutlined />,
              onClick: () => handleQualificationReview(record.id, true)
            },
            {
              key: 'cert_reject',
              label: '拒绝认证',
              icon: <CloseCircleOutlined />,
              onClick: () => handleQualificationReview(record.id, false)
            }
          );
        }

        if (record.status === 'active') {
          items.push(
            {
              key: 'freeze',
              label: '冻结用户',
              icon: <LockOutlined />,
              onClick: () => handleToggleStatus(record.id, record.status)
            },
            {
              key: 'blacklist',
              label: '加入黑名单',
              icon: <StopOutlined />,
              onClick: () => handleAddToBlacklist(record.id)
            }
          );
        }

        if (record.status === 'frozen') {
          items.push({
            key: 'unfreeze',
            label: '解冻用户',
            icon: <UnlockOutlined />,
            onClick: () => handleToggleStatus(record.id, record.status)
          });
        }

        if (record.status === 'blacklist') {
          items.push({
            key: 'remove_blacklist',
            label: '移出黑名单',
            icon: <UnlockOutlined />,
            onClick: () => handleRemoveFromBlacklist(record.id)
          });
        }

        return (
          <Dropdown
            menu={{
              items: items.map(item => ({
                ...item,
                onClick: undefined
              })),
              onClick: ({ key }) => {
                const item = items.find(i => i.key === key);
                if (item?.onClick) {
                  item.onClick();
                }
              }
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="small"
            />
          </Dropdown>
        );
      }
    }

  ];

  // 搜索和筛选逻辑
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      role: undefined,
      status: undefined,
      isVerified: undefined,
      dateRange: undefined
    });
    setSearchText('');
    searchForm.resetFields();
  };

  // 批量操作
  const handleBatchStatusChange = async (status: string) => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要操作的用户');
      return;
    }

    Modal.confirm({
      title: `确认批量${status === 'active' ? '启用' : '禁用'}用户？`,
      content: `将对选中的 ${selectedRows.length} 个用户进行${status === 'active' ? '启用' : '禁用'}操作`,
      onOk: async () => {
        try {
          for (const userId of selectedRows) {
            await AdminService.updateUserStatus(userId, status);
          }
          setUsers(users.map(user =>
            selectedRows.includes(user.id)
              ? { ...user, status }
              : user
          ));
          setSelectedRows([]);
          message.success(`批量${status === 'active' ? '启用' : '禁用'}成功`);
        } catch (error) {
          message.error(`批量操作失败: ${error}`);
        }
      }
    });
  };

  const handleBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('请先选择要删除的用户');
      return;
    }

    Modal.confirm({
      title: '确认批量删除用户？',
      content: `将删除选中的 ${selectedRows.length} 个用户，此操作不可恢复`,
      type: 'warning',
      onOk: async () => {
        try {
          // 调用删除API
          await AdminService.deleteUsers(selectedRows);
          setUsers(users.filter(user => !selectedRows.includes(user.id)));
          setSelectedRows([]);
          message.success('批量删除成功');
        } catch (error) {
          message.error(`批量删除失败: ${error}`);
        }
      }
    });
  };

  // 导出功能
  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      '用户ID': user.id,
      '用户名': user.username,
      '真实姓名': user.realname,
      '邮箱': user.email,
      '手机号': user.phone,
      '角色': user.role,
      '状态': user.status,
      '认证状态': user.isVerified ? '已认证' : '未认证',
      '注册时间': user.createdAt,
      '最后登录': user.lastLogin
    }));

    // 这里应该实现真正的导出逻辑
    // 导出数据
    message.success('导出功能开发中...');
  };

  const stats = useMemo(() => ({
    total: serverStats?.users?.total ?? users.length,
    active: serverStats?.users?.active ?? users.filter(u => u.status === 'active').length,
    pending: serverStats?.users?.pending ?? users.filter(u => u.status === 'pending').length,
    frozen: users.filter(u => u.status === 'frozen').length,
    blacklist: users.filter(u => u.status === 'blacklist').length,
    admin: users.filter(u => u.role === 'admin').length,
    nurse: serverStats?.roles?.nurse ?? users.filter(u => u.role === 'nurse').length,
    elderly: serverStats?.roles?.elderly ?? users.filter(u => u.role === 'elderly').length,
    family: serverStats?.roles?.family ?? users.filter(u => u.role === 'family').length
  }), [users, serverStats]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 标签页筛选
      let tabFilter = true;
      if (currentTab === 'admin') tabFilter = user.role === 'admin';
      else if (currentTab === 'nurse') tabFilter = user.role === 'nurse';
      else if (currentTab === 'elderly') tabFilter = user.role === 'elderly';
      else if (currentTab === 'family') tabFilter = user.role === 'family';
      else if (currentTab === 'pending') tabFilter = user.status === 'pending';
      else if (currentTab === 'blacklist') tabFilter = user.status === 'blacklist';

      // 文本搜索
      const searchFilter = !searchText ||
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.realname.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone.includes(searchText) ||
        user.id.includes(searchText);

      // 高级筛选
      const roleFilter = !filters.role || user.role === filters.role;
      const statusFilter = !filters.status || user.status === filters.status;
      const verifiedFilter = filters.isVerified === undefined || user.isVerified === filters.isVerified;

      // 日期筛选
      let dateFilter = true;
      if (filters.dateRange && filters.dateRange.length === 2) {
        const userDate = new Date(user.createdAt);
        const startDate = filters.dateRange[0].startOf('day').toDate();
        const endDate = filters.dateRange[1].endOf('day').toDate();
        dateFilter = userDate >= startDate && userDate <= endDate;
      }

      return tabFilter && searchFilter && roleFilter && statusFilter && verifiedFilter && dateFilter;
    });
  }, [users, currentTab, searchText, filters]);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>用户管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadUsers}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddUser}>
            新增用户
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="总用户数"
              value={stats.total}
              suffix="人"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="管理员"
              value={stats.admin}
              suffix="人"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="护工"
              value={stats.nurse}
              suffix="人"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="老人用户"
              value={stats.elderly}
              suffix="人"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="待审核"
              value={stats.pending}
              suffix="人"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="黑名单"
              value={stats.blacklist}
              suffix="人"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item>
            <Input.Search
              placeholder="搜索用户名、姓名、邮箱、手机号"
              style={{ width: 300 }}
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Form.Item>
          <Form.Item label="角色">
            <Select
              placeholder="选择角色"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => handleFilterChange('role', value)}
            >
              <Option value="admin">管理员</Option>
              <Option value="nurse">护工</Option>
              <Option value="elderly">老人</Option>
              <Option value="family">家属</Option>
            </Select>
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="选择状态"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="active">正常</Option>
              <Option value="pending">待审核</Option>
              <Option value="frozen">已冻结</Option>
              <Option value="blacklist">黑名单</Option>
            </Select>
          </Form.Item>
          <Form.Item label="认证状态">
            <Select
              placeholder="认证状态"
              style={{ width: 120 }}
              allowClear
              onChange={(value) => handleFilterChange('isVerified', value)}
            >
              <Option value={true}>已认证</Option>
              <Option value={false}>未认证</Option>
            </Select>
          </Form.Item>
          <Form.Item label="注册时间">
            <RangePicker
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </Form.Item>
          <Form.Item>
            <Button onClick={handleClearFilters} icon={<ClearOutlined />}>
              清空筛选
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 批量操作栏 */}
      {selectedRows.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Alert
            message={
              <Space>
                <span>已选择 <strong>{selectedRows.length}</strong> 个用户</span>
                <Button size="small" onClick={() => setSelectedRows([])}>
                  取消选择
                </Button>
              </Space>
            }
            action={
              <Space>
                <Button
                  size="small"
                  onClick={() => handleBatchStatusChange('active')}
                >
                  批量启用
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBatchStatusChange('frozen')}
                >
                  批量冻结
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={handleBatchDelete}
                >
                  批量删除
                </Button>
              </Space>
            }
            type="info"
            showIcon
          />
        </Card>
      )}

      {/* 用户表格 */}
      <Card>
        <Tabs
          activeKey={currentTab}
          onChange={setCurrentTab}
          items={[
            { key: 'all', label: `全部用户 (${filteredUsers.length})` },
            { key: 'admin', label: `管理员 (${stats.admin})` },
            { key: 'nurse', label: `护工 (${stats.nurse})` },
            { key: 'elderly', label: `老人用户 (${stats.elderly})` },
            { key: 'family', label: `家属 (${stats.family})` },
            { key: 'pending', label: `待审核 (${stats.pending})` },
            { key: 'blacklist', label: `黑名单 (${stats.blacklist})` }
          ]}
        />

        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: (selectedRowKeys) => {
              setSelectedRows(selectedRowKeys as string[]);
            },
            getCheckboxProps: (record: User) => ({
              disabled: record.role === 'admin' && record.adminRole === 'super_admin',
            }),
          }}
          pagination={{
            total: filteredUsers.length,
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['10', '15', '20', '50']
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无用户数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>

      {/* 用户详情弹窗 */}
      <Modal
        title={
          <Space>
            <Avatar icon={<UserOutlined />} size="large" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {selectedUser?.realname}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                用户详情
              </div>
            </div>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setModalVisible(false);
            handleEditUser(selectedUser!);
          }}>
            编辑用户
          </Button>
        ]}
        width={800}
      >
        {selectedUser && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="用户ID" span={1}>
                <Text copyable>{selectedUser.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="用户名" span={1}>
                {selectedUser.username}
              </Descriptions.Item>
              <Descriptions.Item label="真实姓名" span={1}>
                {selectedUser.realname}
              </Descriptions.Item>
              <Descriptions.Item label="角色" span={1}>
                <Tag color={selectedUser.role === 'admin' ? 'red' : selectedUser.role === 'nurse' ? 'green' : 'blue'}>
                  {selectedUser.role === 'admin' ? '管理员' :
                    selectedUser.role === 'nurse' ? '护工' :
                      selectedUser.role === 'elderly' ? '老人用户' : '家属'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱" span={1}>
                <Text copyable>{selectedUser.email}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="手机号" span={1}>
                <Text copyable>{selectedUser.phone}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Tag color={
                  selectedUser.status === 'active' ? 'green' :
                    selectedUser.status === 'pending' ? 'orange' :
                      selectedUser.status === 'frozen' ? 'red' : 'red'
                }>
                  {selectedUser.status === 'active' ? '正常' :
                    selectedUser.status === 'pending' ? '待审核' :
                      selectedUser.status === 'frozen' ? '已冻结' : '黑名单'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="认证状态" span={1}>
                <Tag color={selectedUser.isVerified ? 'green' : 'red'}>
                  {selectedUser.isVerified ? '已认证' : '未认证'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间" span={1}>
                {selectedUser.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="最后登录" span={1}>
                {selectedUser.lastLogin}
              </Descriptions.Item>

              {selectedUser.adminRole && (
                <Descriptions.Item label="管理员角色" span={2}>
                  <Tag color="purple">
                    {selectedUser.adminRole === 'super_admin' ? '超级管理员' :
                      selectedUser.adminRole === 'cs_manager' ? '客服主管' :
                        selectedUser.adminRole === 'reviewer' ? '审核员' :
                          selectedUser.adminRole === 'finance' ? '财务' : selectedUser.adminRole}
                  </Tag>
                </Descriptions.Item>
              )}

              {selectedUser.qualificationStatus && (
                <Descriptions.Item label="护工资质" span={2}>
                  <Tag color={selectedUser.qualificationStatus === 'approved' ? 'green' : selectedUser.qualificationStatus === 'rejected' ? 'red' : 'orange'}>
                    {selectedUser.qualificationStatus === 'approved' ? '已认证' : selectedUser.qualificationStatus === 'rejected' ? '认证失败' : '待认证'}
                  </Tag>
                </Descriptions.Item>
              )}

              {selectedUser.blacklistReason && (
                <Descriptions.Item label="黑名单原因" span={2}>
                  <Text type="danger">{selectedUser.blacklistReason}</Text>
                </Descriptions.Item>
              )}

              {selectedUser.pagePermissions && selectedUser.pagePermissions.length > 0 && (
                <Descriptions.Item label="页面权限" span={2}>
                  <div>
                    {selectedUser.pagePermissions.map((permission, index) => (
                      <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                        {permission}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* 新增用户弹窗 */}
      <Modal
        title="新增用户"
        open={addUserModalVisible}
        onCancel={() => setAddUserModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddUserSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realname"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名!' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label="初始密码"
                rules={[
                  { required: true, message: '请输入初始密码!' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱!' },
                  { type: 'email', message: '请输入有效的邮箱地址!' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号!' },
                  { pattern: /^1\d{10}$/, message: '请输入11位手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="用户角色"
            rules={[{ required: true, message: '请选择用户角色!' }]}
          >
            <Select placeholder="请选择用户角色">
              <Option value="nurse">护工用户</Option>
              <Option value="elderly">老人用户</Option>
              <Option value="family">家属</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.role !== curr.role}>
            {({ getFieldValue }) => {
              const isAdminRole = getFieldValue('role') === 'admin';
              return (
                <>
                  {isAdminRole && (
                    <Form.Item
                      name="adminRole"
                      label="管理员角色"
                      rules={[{ required: true, message: '请选择管理员角色!' }]}
                    >
                      <Select placeholder="请选择管理员角色">
                        <Option value="super_admin">超级管理员</Option>
                        <Option value="cs_manager">客服主管</Option>
                        <Option value="reviewer">审核员</Option>
                        <Option value="finance">财务</Option>
                        <Option value="system_admin">系统管理员</Option>
                        <Option value="content_manager">内容管理员</Option>
                      </Select>
                    </Form.Item>
                  )}

                  {isAdminRole && (
                    <>
                      <Divider orientation="left">页面权限设置</Divider>
                      <Form.Item
                        name="pagePermissions"
                        label="可访问页面"
                      >
                        <TreeSelect
                          showSearch
                          style={{ width: '100%' }}
                          placeholder="请选择可访问的页面"
                          allowClear
                          multiple
                          treeDefaultExpandAll
                        >
                          <TreeNode value="dashboard" title="仪表盘" key="dashboard">
                            <TreeNode value="dashboard/users" title="用户管理" key="dashboard/users" />
                            <TreeNode value="dashboard/approve" title="审核控制" key="dashboard/approve" />
                            <TreeNode value="dashboard/orders" title="订单管理" key="dashboard/orders" />
                            <TreeNode value="dashboard/payments" title="支付结算" key="dashboard/payments" />
                            <TreeNode value="dashboard/services" title="服务管理" key="dashboard/services" />
                            <TreeNode value="dashboard/disputes" title="纠纷处理" key="dashboard/disputes" />
                            <TreeNode value="dashboard/reviews-complaints" title="评价与投诉" key="dashboard/reviews-complaints" />
                            <TreeNode value="dashboard/data-summary" title="数据汇总" key="dashboard/data-summary" />
                            <TreeNode value="dashboard/settings" title="系统设置" key="dashboard/settings" />
                            <TreeNode value="dashboard/announcements" title="内容管理" key="dashboard/announcements" />
                            <TreeNode value="dashboard/support-tickets" title="客服工单" key="dashboard/support-tickets" />
                            <TreeNode value="dashboard/config" title="基础配置" key="dashboard/config" />
                          </TreeNode>
                        </TreeSelect>
                      </Form.Item>
                    </>
                  )}
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色分配弹窗 */}
      <Modal
        title="分配管理员角色"
        open={assignRoleModalVisible}
        onCancel={() => setAssignRoleModalVisible(false)}
        onOk={() => roleForm.submit()}
        width={500}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleAssignRoleSubmit}
        >
          <Form.Item
            name="adminRole"
            label="管理员角色"
            rules={[{ required: true, message: '请选择管理员角色!' }]}
          >
            <Select placeholder="请选择管理员角色">
              <Option value="super_admin">超级管理员</Option>
              <Option value="cs_manager">客服主管</Option>
              <Option value="reviewer">审核员</Option>
              <Option value="finance">财务</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户信息"
        open={editUserModalVisible}
        onCancel={() => setEditUserModalVisible(false)}
        onOk={() => editForm.submit()}
        width={700}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditUserSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名!' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="realname"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名!' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱!' },
                  { type: 'email', message: '请输入有效的邮箱地址!' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: '请输入手机号!' }]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="role"
            label="用户角色"
            rules={[{ required: true, message: '请选择用户角色!' }]}
          >
            <Select placeholder="请选择用户角色">
              <Option value="nurse">护工用户</Option>
              <Option value="elderly">老人用户</Option>
              <Option value="family">家属</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left">页面权限设置</Divider>

          <Form.Item
            name="pagePermissions"
            label="可访问页面"
          >
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              placeholder="请选择可访问的页面"
              allowClear
              multiple
              treeDefaultExpandAll
            >
              <TreeNode value="dashboard" title="仪表盘" key="dashboard">
                <TreeNode value="dashboard/users" title="用户管理" key="dashboard/users" />
                <TreeNode value="dashboard/approve" title="审核控制" key="dashboard/approve" />
                <TreeNode value="dashboard/orders" title="订单管理" key="dashboard/orders" />
                <TreeNode value="dashboard/payments" title="支付结算" key="dashboard/payments" />
                <TreeNode value="dashboard/services" title="服务管理" key="dashboard/services" />
                <TreeNode value="dashboard/disputes" title="纠纷处理" key="dashboard/disputes" />
                <TreeNode value="dashboard/reviews-complaints" title="评价与投诉" key="dashboard/reviews-complaints" />
                <TreeNode value="dashboard/data-summary" title="数据汇总" key="dashboard/data-summary" />
                <TreeNode value="dashboard/settings" title="系统设置" key="dashboard/settings" />
                <TreeNode value="dashboard/announcements" title="内容管理" key="dashboard/announcements" />
                <TreeNode value="dashboard/support-tickets" title="客服工单" key="dashboard/support-tickets" />
                <TreeNode value="dashboard/config" title="基础配置" key="dashboard/config" />
              </TreeNode>
            </TreeSelect>
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限分配弹窗已移至权限管理页面 */}
    </div>
  );
};

export default Users; 