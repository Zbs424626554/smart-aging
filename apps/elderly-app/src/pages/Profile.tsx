import React, { useMemo, useState } from "react";
import { Typography, message } from "antd";
import { List, Divider, Button, Dialog, Input, Form } from "antd-mobile";
import { AuthService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import { http } from "../utils/request";

const DEFAULT_AVATAR = "/imgs/elderly.png";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [form] = Form.useForm();

  const displayName = useMemo(
    () => currentUser?.realname || currentUser?.username || "未登录用户",
    [currentUser]
  );
  const maskPhone = (value?: string): string => {
    if (!value) return "-";
    const digitsOnly = value.replace(/\D/g, "");
    const normalized =
      digitsOnly.length >= 11 ? digitsOnly.slice(-11) : digitsOnly;
    if (normalized.length < 7) return value;
    const prefix = normalized.slice(0, 3);
    const suffix = normalized.slice(-4);
    return `${prefix}****${suffix}`;
  };
  const phone = maskPhone(currentUser?.phone);

  const [avatarSrc, setAvatarSrc] = useState<string>(
    currentUser?.avatar && currentUser.avatar.trim() !== ""
      ? currentUser.avatar
      : DEFAULT_AVATAR
  );

  const showBasicInfo = () => {
    Dialog.show({
      title: "基础资料",
      content: (
        <div style={{ padding: "16px 0" }}>
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <img
                src={avatarSrc}
                onError={() => setAvatarSrc(DEFAULT_AVATAR)}
                alt="avatar"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#f5f5f5",
                }}
              />
              <div>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {displayName}
                </Typography.Title>
                <Typography.Paragraph
                  style={{ margin: 0, color: "#888", fontSize: "14px" }}
                >
                  {currentUser?.role === "elderly" ? "老年人用户" : "用户"}
                </Typography.Paragraph>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontSize: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ color: "#666" }}>用户名：</span>
              <span>{currentUser?.username || "-"}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ color: "#666" }}>真实姓名：</span>
              <span>{currentUser?.realname || "-"}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ color: "#666" }}>手机号码：</span>
              <span>{maskPhone(currentUser?.phone)}</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ color: "#666" }}>用户角色：</span>
              <span>
                {currentUser?.role === "elderly"
                  ? "老年人"
                  : currentUser?.role || "-"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span style={{ color: "#666" }}>注册时间：</span>
              <span>
                {currentUser?.createdTime
                  ? new Date(currentUser.createdTime).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>
        </div>
      ),
      closeOnMaskClick: true,
      closeOnAction: true,
      actions: [
        [
          {
            key: "close",
            text: "关闭",
          },
        ],
      ],
    });
  };

  const showAccountSecurity = () => {
    form.resetFields();
    Dialog.show({
      title: "账户与安全",
      content: (
        <div style={{ paddingTop: 12 }}>
          <Form form={form} layout="horizontal" footer={null}>
            <Form.Item
              name="oldPassword"
              label="旧密码"
              rules={[{ required: true, message: "请输入旧密码" }]}
            >
              <Input placeholder="请输入旧密码" type="password" clearable />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: "请输入新密码" },
                { min: 6, message: "新密码至少6位" },
              ]}
            >
              <Input placeholder="请输入新密码" type="password" clearable />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              rules={[{ required: true, message: "请再次输入新密码" }]}
            >
              <Input placeholder="请再次输入新密码" type="password" clearable />
            </Form.Item>
          </Form>
        </div>
      ),
      closeOnMaskClick: true,
      closeOnAction: true,
      actions: [
        [
          { key: "cancel", text: "取消" },
          {
            key: "save",
            text: "保存",
            bold: true,
            onClick: async () => {
              try {
                await form.validateFields();
                const { oldPassword, newPassword, confirmPassword } =
                  form.getFieldsValue();
                if (newPassword !== confirmPassword) {
                  message.error("两次输入的新密码不一致");
                  throw new Error("mismatch");
                }
                await http.post("/users/change-password", {
                  oldPassword,
                  newPassword,
                });
                setTimeout(() => {
                  message.success("密码修改成功，请重新登录");
                }, 200);
                setTimeout(() => {
                  AuthService.logout();
                }, 2000);
              } catch (err) {
                // 阻止弹窗关闭
                return Promise.reject(err);
              }
            },
          },
        ],
      ],
    });
  };

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <img
            src={avatarSrc}
            onError={() => setAvatarSrc(DEFAULT_AVATAR)}
            alt="avatar"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              objectFit: "cover",
              background: "#f5f5f5",
            }}
          />
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {displayName}
            </Typography.Title>
            <Typography.Paragraph style={{ margin: 0, color: "#888" }}>
              手机号：{phone}
            </Typography.Paragraph>
          </div>
        </div>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <List header="个人中心">
        <List.Item onClick={showBasicInfo}>基础资料</List.Item>
        <List.Item onClick={() => navigate("/health")}>健康档案</List.Item>
        <List.Item arrow={false} onClick={showAccountSecurity}>
          修改密码
        </List.Item>
      </List>

      <Divider style={{ margin: "12px 0" }} />

      <Button
        color="danger"
        fill="solid"
        block
        onClick={() => {
          AuthService.logout();
        }}
      >
        退出登录
      </Button>
    </div>
  );
};

export default Profile;
