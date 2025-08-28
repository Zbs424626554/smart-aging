import React, { useState } from "react";
import { Form, Input, Button, Toast, Selector, Card } from "antd-mobile";
import { UserOutline, LockOutline, PhoneFill } from "antd-mobile-icons";
import { useNavigate, Link } from "react-router-dom";
import { AuthService } from "../../services/auth.service";
import type { RegisterParams, UserRole } from "../../services/auth.service";

const roleOptions = [
  { label: "老人", value: "elderly" },
  { label: "家属", value: "family" },
  { label: "护工", value: "nurse" },
];

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("elderly");
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    if (!selectedRole) {
      Toast.show({ icon: "fail", content: "请选择用户角色" });
      return;
    }
    try {
      setLoading(true);
      const registerParams: RegisterParams = {
        role: selectedRole,
        username: values.username,
        password: values.password,
        phone: values.phone,
      };
      const response = await AuthService.register(registerParams);
      if (response.code === 200) {
        AuthService.saveUserInfo(response.data.token, response.data.user);
        Toast.show({ icon: "success", content: "注册成功" });
        setTimeout(() => {
          navigate("/login");
        }, 800);
      }
    } catch (error) {
      Toast.show({ icon: "fail", content: "注册失败，请检查输入信息" });
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
        padding: 0,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
          borderRadius: 0,
          boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
          padding: "19px 18px 5px 18px",
          border: "none",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            style={{
              fontSize: 28,
              color: "#1890ff",
              fontWeight: 800,
              letterSpacing: 2,
              lineHeight: 1.1,
              marginTop: 0,
            }}
          >
            智慧养老平台
          </div>
          <div style={{ color: "#888", marginTop: 4, fontSize: 16 }}>
            用户注册
          </div>
        </div>
        {/* 角色选择区自定义按钮组 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f7f8fa",
            borderRadius: 10,
            padding: "0 10px",
            height: 48,
            marginBottom: 18,
            width: 311.33,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <span
            style={{
              fontSize: 16,
              marginRight: 8,
              minWidth: 36,
              fontWeight: 18,
            }}
          >
            角色
          </span>
          <div style={{ display: "flex", flex: 1, gap: 8 }}>
            {roleOptions.map((option) => (
              <span
                key={option.value}
                onClick={() => setSelectedRole(option.value as UserRole)}
                style={{
                  padding: "6px 18px",
                  borderRadius: 8,
                  background:
                    selectedRole === option.value ? "#e6f0ff" : "transparent",
                  color: selectedRole === option.value ? "#1677ff" : "#333",
                  fontWeight: selectedRole === option.value ? 600 : 400,
                  border:
                    selectedRole === option.value
                      ? "1.5px solid #1677ff"
                      : "1.5px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {option.label}
              </span>
            ))}
          </div>
        </div>
        <Form
          layout="vertical"
          onFinish={onFinish}
          style={{ marginTop: 0 }}
          footer={
            <Button
              block
              color="primary"
              size="large"
              loading={loading}
              type="submit"
              style={{
                borderRadius: 24,
                fontWeight: 600,
                fontSize: 18,
                marginTop: 10,
                boxShadow: "0 2px 8px rgba(24,144,255,0.12)",
              }}
            >
              注册
            </Button>
          }
          initialValues={{}}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 2, message: "用户名至少2位" },
            ]}
            style={{ marginBottom: 18 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f7f8fa",
                borderRadius: 10,
                padding: "0 10px",
                height: 48,
              }}
            >
              <UserOutline style={{ fontSize: 20, marginRight: 8 }} />
              <Input
                placeholder="请输入用户名"
                clearable
                style={{
                  background: "transparent",
                  border: "none",
                  flex: 1,
                  height: 44,
                }}
              />
            </div>
          </Form.Item>
          <Form.Item
            name="phone"
            rules={[
              { required: true, message: "请输入手机号" },
              { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号" },
            ]}
            style={{ marginBottom: 18 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f7f8fa",
                borderRadius: 10,
                padding: "0 10px",
                height: 48,
              }}
            >
              <PhoneFill style={{ fontSize: 20, marginRight: 8 }} />
              <Input
                placeholder="请输入手机号"
                clearable
                style={{
                  background: "transparent",
                  border: "none",
                  flex: 1,
                  height: 44,
                }}
              />
            </div>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "请输入密码" },
              { min: 6, message: "密码至少6位" },
            ]}
            style={{ marginBottom: 18 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f7f8fa",
                borderRadius: 10,
                padding: "0 10px",
                height: 48,
              }}
            >
              <LockOutline style={{ fontSize: 20, marginRight: 8 }} />
              <Input
                type="password"
                placeholder="请输入密码"
                clearable
                style={{
                  background: "transparent",
                  border: "none",
                  flex: 1,
                  height: 44,
                }}
              />
            </div>
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "请确认密码" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致"));
                },
              }),
            ]}
            style={{ marginBottom: 18 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f7f8fa",
                borderRadius: 10,
                padding: "0 10px",
                height: 48,
              }}
            >
              <LockOutline style={{ fontSize: 20, marginRight: 8 }} />
              <Input
                type="password"
                placeholder="请确认密码"
                clearable
                style={{
                  background: "transparent",
                  border: "none",
                  flex: 1,
                  height: 44,
                }}
              />
            </div>
          </Form.Item>
        </Form>
        <div style={{ textAlign: "center", marginTop: 0 }}>
          <span style={{ color: "#888" }}>已有账号？</span>{" "}
          <Link to="/login" style={{ color: "#1890ff", fontWeight: 500 }}>
            立即登录
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
