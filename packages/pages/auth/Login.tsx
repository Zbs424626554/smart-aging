import React, { useState } from "react";
import { Form, Input, Button, message, Typography, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { AuthService, LoginParams } from "../../services/auth.service";

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
      console.log("登录响应:", response);

      // 保存用户信息到本地存储
      AuthService.saveUserInfo(response.data.token, response.data.user);

      message.success("登录成功");
      const role = response.data.user.role;
      console.log("用户角色:", role);

      const roleRedirectMap: Record<string, string> = {
        elderly: "http://localhost:5173/home/call",
        family: "http://localhost:5174/home",
        nurse: "http://localhost:5175/home",
      };

      const redirectUrl = roleRedirectMap[role];
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000); // 增加延迟时间，让用户看到成功消息
      } else {
        console.error("未知的用户角色:", role);
        message.error("用户角色无效");
      }
    } catch (error) {
      console.error("登录失败:", error);
      // 不要再弹 message.error，拦截器已经弹了
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card style={{ width: 330, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2} style={{ color: "#1890ff" }}>
            智慧养老平台
          </Title>
          <Text type="secondary">统一登录系统</Text>
        </div>

        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 2, message: "用户名至少2位" },
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
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少6位" },
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
              style={{ width: "100%" }}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Text type="secondary">
              还没有账号？{" "}
              <Link to="/register" style={{ color: "#1890ff" }}>
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
