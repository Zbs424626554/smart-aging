import React, { useState } from 'react';
import { Form, Input, Button, message, Typography, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService, LoginParams } from '../../services/auth.service';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      // 服务器支持 username 或 phone 登录，这里使用 username
      const loginParams: LoginParams = {
        username: values.username,
        password: values.password,
      };
      const response = await AuthService.login(loginParams);
      console.log('登录响应:', response);

      // 注意：统一登录页不在本端写入 localStorage，避免跨端污染。
      // 仅根据角色做跨端跳转，并通过 URL 传递 ssoToken 由目标端落地后写入本地。

      message.success('登录成功');
      const role = response.data.user.role;
      console.log('用户角色:', role);

      // 根据当前访问的主机与端口动态计算重定向地址
      const { protocol, hostname, port } = window.location;
      const base = `${protocol}//${hostname}`;
      const isDevPort = /^(5173|5174|5175|5176)$/.test(port || "");
      const isReverseProxyPort = /^(444|4445|446)$/.test(port || "");

      // 允许通过环境变量覆盖（生产部署时可分别配置各端域名）
      const envMap: Record<string, string | undefined> = {
        elderly: (import.meta as any).env?.VITE_REDIRECT_ELDERLY,
        family: (import.meta as any).env?.VITE_REDIRECT_FAMILY,
        nurse: (import.meta as any).env?.VITE_REDIRECT_NURSE,
      };

      const devMap: Record<string, string> = {
        elderly: `${base}:5173/`,
        family: `${base}:5174/`,
        nurse: `${base}:5175/`,
      };

      // 反代端口映射（同一台机器多端口）
      const reversePortMap: Record<string, string> = {
        elderly: '4445',
        family: '444',
        nurse: '446',
      };

      const roleRedirectMap: Record<string, string> = {
        elderly: envMap.elderly
          || (isDevPort ? devMap.elderly : isReverseProxyPort ? `${base}:${reversePortMap.elderly}/` : `${base}/`),
        family: envMap.family
          || (isDevPort ? devMap.family : isReverseProxyPort ? `${base}:${reversePortMap.family}/` : `${base}/`),
        nurse: envMap.nurse
          || (isDevPort ? devMap.nurse : isReverseProxyPort ? `${base}:${reversePortMap.nurse}/` : `${base}/`),
      };

      const redirectUrl = roleRedirectMap[role];
      if (redirectUrl) {
        setTimeout(() => {
          // 通过 URL 参数将 token 传递给目标端，目标端 RootRedirect 读取后写入 localStorage 并清理URL
          const url = new URL(redirectUrl);
          url.searchParams.set('ssoToken', response.data.token);
          window.location.href = url.toString();
        }, 1000); // 增加延迟时间，让用户看到成功消息
      } else {
        console.error('未知的用户角色:', role);
        message.error('用户角色无效');
      }
    } catch (error) {
      console.error('登录失败:', error);
      // 不要再弹 message.error，拦截器已经弹了
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            智慧养老平台
          </Title>
          <Text type="secondary">统一登录系统</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 2, message: '用户名至少2位' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名或手机号"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              还没有账号？{' '}
              <Link to="/register" style={{ color: '#1890ff' }}>
                立即注册
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 