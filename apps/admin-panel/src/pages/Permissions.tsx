import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  message,
  Card,
  Form,
  TreeSelect,
  Input
} from 'antd';
import {
  SettingOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getAllAvailablePages } from '../config/permissions';
import { AuthService } from '../services/AuthService';
import { AdminService } from '../services/AdminService';

const { TreeNode } = TreeSelect;

interface User {
  id: string;
  username: string;
  realname: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  adminRole?: string;
  pagePermissions?: string[];
}

const Permissions: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const resp: any = await AdminService.getUserList();
      const list: User[] = Array.isArray(resp?.data?.users)
        ? resp.data.users
        : [];
      setUsers(list);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissions = (user: User) => {
    setSelectedUser(user);
    setPermissionModalVisible(true);
    permissionForm.setFieldsValue({ pagePermissions: user.pagePermissions || [] });
  };

  const handleAssignPermissionsSubmit = async (values: any) => {
    if (!selectedUser) return;
    try {
      await AdminService.assignUserRole(
        selectedUser.id,
        selectedUser.adminRole || 'system_admin',
        values.pagePermissions || []
      );

      const updatedUser = {
        ...selectedUser,
        pagePermissions: values.pagePermissions || []
      };
      setUsers(users.map(u => (u.id === selectedUser.id ? updatedUser : u)));

      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.id === selectedUser.id) {
        AuthService.updateUserPermissions(values.pagePermissions || []);
      }

      setPermissionModalVisible(false);
      message.success('权限分配成功');
    } catch (e) {
      message.error('权限分配失败');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredUsers = users.filter(user => {
    if (!searchText) return true;
    
    return (
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.realname.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.role.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.adminRole && user.adminRole.toLowerCase().includes(searchText.toLowerCase()))
    );
  });

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'realname',
      key: 'realname',
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
            finance: '财务'
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
      title: '已分配权限',
      dataIndex: 'pagePermissions',
      key: 'pagePermissions',
      render: (pagePermissions: string[] | undefined) => {
        if (!pagePermissions || pagePermissions.length === 0) {
          return <Tag color="red">无权限</Tag>;
        }
        
        // 只显示前3个权限，如果有更多则显示"+N"
        const displayCount = 3;
        const displayPermissions = pagePermissions.slice(0, displayCount);
        const remaining = pagePermissions.length - displayCount;
        
        return (
          <>
            {displayPermissions.map(permission => (
              <Tag color="blue" key={permission}>
                {permission.replace('dashboard/', '')}
              </Tag>
            ))}
            {remaining > 0 && <Tag color="cyan">+{remaining}</Tag>}
          </>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Button 
          type="primary" 
          icon={<SettingOutlined />}
          onClick={() => handleAssignPermissions(record)}
        >
          分配权限
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>权限管理</h2>
      
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="搜索用户"
          allowClear
          enterButton={<SearchOutlined />}
          onSearch={handleSearch}
          style={{ maxWidth: 300 }}
        />
      </Card>
      
      <Card>
        <Table
          columns={columns}
          dataSource={filteredUsers}
          loading={loading}
          rowKey="id"
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
        />
      </Card>

      {/* 权限分配弹窗 */}
      <Modal
        title="分配页面权限"
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        onOk={() => permissionForm.submit()}
        width={700}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handleAssignPermissionsSubmit}
        >
          <p>选择可访问的页面：</p>
          <Form.Item name="pagePermissions">
            <TreeSelect
              showSearch
              style={{ width: '100%' }}
              styles={{
                popup: {
                  root: { maxHeight: 400, overflow: 'auto' }
                }
              }}
              placeholder="请选择可访问的页面"
              allowClear
              multiple
              treeDefaultExpandAll
            >
              <TreeNode value="dashboard" title="仪表盘" key="dashboard">
                <TreeNode value="dashboard/users" title="用户管理" key="dashboard/users" />
                <TreeNode value="dashboard/permissions" title="权限管理" key="dashboard/permissions" />
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
    </div>
  );
};

export default Permissions; 