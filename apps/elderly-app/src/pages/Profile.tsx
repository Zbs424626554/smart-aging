import React, { useEffect, useMemo, useState } from "react";
import { Typography, message } from "antd";
import { List, Divider, Button, Dialog, Input, Form } from "antd-mobile";
import { AuthService } from "../services/auth.service";
import { ElderHealthService } from "../services/elderhealth.service";
import { useNavigate } from "react-router-dom";
import { http } from "../utils/request";


const DEFAULT_AVATAR = "/imgs/elderly.png";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [form] = Form.useForm();
  const [healthForm] = Form.useForm();

  // 健康状态
  type LatestHealth = {
    id?: string;
    heartRate: number | string;
    bloodPressure: string; // 如 120/80
    temperature: number | string; // 摄氏度
    oxygenLevel: number | string; // %
    bloodSugar: number | string; // mmol/L
    lastUpdate?: string;
    status?: string;
  } | null;
  const [latestHealth, setLatestHealth] = useState<LatestHealth>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(false);

  // 用药时间（归一化为每种药的多个时间）
  type Medication = { name: string; times: string[] };
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loadingMeds, setLoadingMeds] = useState<boolean>(false);
  const [now, setNow] = useState<Date>(new Date());

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

  // 工具：判断值是否为空（undefined/null/空字符串）
  const isBlank = (v: any): boolean =>
    v === undefined || v === null || (typeof v === "string" && String(v).trim() === "");

  // 定时刷新当前时间，用于判断用药是否即将到点
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // 进入页面后加载：从 elderhealth 档案一次性获取健康状态与用药时间
  useEffect(() => {
    const loadArchive = async () => {
      try {
        setLoadingHealth(true);
        setLoadingMeds(true);
        const archive = await ElderHealthService.getMyArchive();
        if (archive) {
          setLatestHealth({
            heartRate: archive.heartRate ?? "",
            bloodPressure: archive.bloodPressure || "",
            temperature: archive.temperature ?? "",
            oxygenLevel: archive.oxygenLevel ?? "",
            bloodSugar: archive.bloodSugar ?? "",
            lastUpdate: archive.updatedAt,
          });
          // 兼容旧数据结构：{name,time} 或 {name,times[]}
          const raw = (archive.useMedication || []) as any[];
          const nameToTimes = new Map<string, Set<string>>();
          for (const item of raw) {
            const nm = (item?.name || "").trim();
            if (!nm) continue;
            const set = nameToTimes.get(nm) || new Set<string>();
            if (Array.isArray(item?.times)) {
              for (const t of item.times) if (t) set.add(String(t));
            }
            if (item?.time) set.add(String(item.time));
            nameToTimes.set(nm, set);
          }
          const meds: Medication[] = Array.from(nameToTimes.entries()).map(
            ([name, set]) => ({ name, times: Array.from(set).sort() })
          );
          setMedications(meds);
        } else {
          setLatestHealth(null);
          setMedications([]);
        }
      } catch (err) {
        message.error("获取健康档案失败");
      } finally {
        setLoadingHealth(false);
        setLoadingMeds(false);
      }
    };

    loadArchive();
  }, [currentUser?.id]);

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
              <span style={{ color: "#666" }}>昵称：</span>
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

  const showHealthEditor = () => {
    healthForm.resetFields();
    Dialog.show({
      title: "修改健康状态",
      content: (
        <div style={{ paddingTop: 12 }}>
          <Form
            form={healthForm}
            layout="horizontal"
            footer={null}
            initialValues={{
              bloodPressure: latestHealth?.bloodPressure || "",
              bloodSugar: latestHealth?.bloodSugar ?? undefined,
              oxygenLevel: latestHealth?.oxygenLevel ?? undefined,
              temperature: latestHealth?.temperature ?? undefined,
              heartRate: latestHealth?.heartRate ?? undefined,
            }}
          >
            <Form.Item
              name="bloodPressure"
              label="血压"
              style={{ "--prefix-width": "65px" } as any}
              rules={[
                { required: true, message: "请输入血压" },
                {
                  pattern: /^\d{2,3}\/\d{2,3}$/,
                  message: "血压格式应按照 120/80 填写",
                },
              ]}
            >
              <Input placeholder="单位：mmHg" clearable />
            </Form.Item>
            <Form.Item
              name="bloodSugar"
              label="血糖"
              style={{ "--prefix-width": "65px" } as any}
              rules={[{ required: true, message: "请输入血糖" }]}
            >
              <Input type="number" placeholder="单位：mmol/L" clearable />
            </Form.Item>
            <Form.Item
              name="oxygenLevel"
              label="血氧"
              style={{ "--prefix-width": "65px" } as any}
              rules={[{ required: true, message: "请输入血氧" }]}
            >
              <Input type="number" placeholder="单位：%" clearable />
            </Form.Item>
            <Form.Item
              name="temperature"
              label="体温"
              style={{ "--prefix-width": "65px" } as any}
              rules={[{ required: true, message: "请输入体温" }]}
            >
              <Input type="number" placeholder="单位：℃" clearable />
            </Form.Item>
            <Form.Item
              name="heartRate"
              label="心率"
              style={{ "--prefix-width": "65px" } as any}
              rules={[{ required: true, message: "请输入心率" }]}
            >
              <Input type="number" placeholder="单位：bpm" clearable />
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
                await healthForm.validateFields();
                const values = healthForm.getFieldsValue();
                const payload = {
                  bloodPressure: values.bloodPressure,
                  bloodSugar: Number(values.bloodSugar),
                  oxygenLevel: Number(values.oxygenLevel),
                  temperature: Number(values.temperature),
                  heartRate: Number(values.heartRate),
                };

                // 保存到 elderhealth 档案（单一数据源）
                // 兼容已挂载的 ZBS 路由
                await http.post(`/elderhealth/vitals`, {
                  elderID: currentUser?.id,
                  name: displayName,
                  heartRate: payload.heartRate,
                  bloodPressure: payload.bloodPressure,
                  temperature: payload.temperature,
                  oxygenLevel: payload.oxygenLevel,
                  bloodSugar: payload.bloodSugar,
                });

                // 前端状态刷新
                setLatestHealth({
                  heartRate: payload.heartRate,
                  bloodPressure: payload.bloodPressure,
                  temperature: payload.temperature,
                  oxygenLevel: payload.oxygenLevel,
                  bloodSugar: payload.bloodSugar,
                  lastUpdate: new Date().toISOString(),
                });

                message.success("已保存");
              } catch (err) {
                return Promise.reject(err);
              }
            },
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
              width: 78,
              height: 78,
              borderRadius: "50%",
              objectFit: "cover",
              background: "#f5f5f5",
            }}
          />
          <div>
            <Typography.Title level={4} style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              {displayName}
            </Typography.Title>
            <Typography.Paragraph style={{ margin: 0, color: "#555", fontSize: 20, lineHeight: 1.6 }}>
              手机号：{phone}
            </Typography.Paragraph>
          </div>
        </div>
      </div>

      {/* 健康状态卡片 */}
      <Divider style={{ margin: "12px 0" }} />
      <div
        onClick={showHealthEditor}
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
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Typography.Title level={5} style={{ margin: 0, fontSize: 26 }}>
            健康状态
          </Typography.Title>
          <span style={{ color: "#888", fontSize: 18 }}>
            {(() => {
              if (loadingHealth) return "获取中…";
              const hasVitals = !!latestHealth && (
                !isBlank(latestHealth.bloodPressure) ||
                !isBlank(latestHealth.bloodSugar) ||
                !isBlank(latestHealth.oxygenLevel) ||
                !isBlank(latestHealth.temperature) ||
                !isBlank(latestHealth.heartRate)
              );
              if (hasVitals && latestHealth?.lastUpdate) {
                return new Date(latestHealth.lastUpdate).toLocaleString();
              }
              return "未更新数据";
            })()}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <HealthItem
            label="血压"
            value={
              latestHealth?.bloodPressure
                ? `${latestHealth.bloodPressure} mmHg`
                : "-"
            }
          />
          <HealthItem
            label="血糖"
            value={
              latestHealth?.bloodSugar
                ? `${latestHealth.bloodSugar} mmol/L`
                : "-"
            }
          />
          <HealthItem
            label="血氧"
            value={
              latestHealth?.oxygenLevel ? `${latestHealth.oxygenLevel}%` : "-"
            }
          />
          <HealthItem
            label="体温"
            value={
              latestHealth?.temperature ? `${latestHealth.temperature} °C` : "-"
            }
          />
          <HealthItem
            label="心率"
            value={
              latestHealth?.heartRate ? `${latestHealth.heartRate} bpm` : "-"
            }
          />
        </div>
      </div>

      {/* 用药时间提醒卡片 */}
      <Divider style={{ margin: "12px 0" }} />
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
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Typography.Title level={5} style={{ margin: 0, fontSize: 26 }}>
            用药时间
          </Typography.Title>
          <span style={{ color: "#888", fontSize: 18 }}>
            {loadingMeds
              ? "获取中…"
              : medications.length === 0
                ? "暂无设置"
                : `${medications.length} 项`}
          </span>
        </div>

        {medications.length === 0 ? (
          <div style={{ color: "#999", fontSize: 16, padding: "8px 0" }}>
            暂无用药设置
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            {medications.map((m, idx) => {
              const times = (m.times || [])
                .map((t) => String(t))
                .filter(Boolean);

              // 计算最近一次（下一次）服药时间
              const toMinutes = (t: string): number => {
                const [h, m] = t.split(":").map((x) => Number(x));
                return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
              };
              const fromMinutes = (mins: number): string => {
                const h = Math.floor(mins / 60)
                  .toString()
                  .padStart(2, "0");
                const m = (mins % 60).toString().padStart(2, "0");
                return `${h}:${m}`;
              };

              const parsed = times.map(toMinutes).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              let nextMinutes: number | null = null;
              for (const v of parsed) {
                if (v >= nowMinutes) {
                  nextMinutes = v;
                  break;
                }
              }
              if (nextMinutes === null && parsed.length > 0) {
                // 如果今天已过，则显示明日的第一条
                nextMinutes = parsed[0];
              }

              // 计算是否即将到点（仅针对最近一次）
              let dueSoon = false;
              if (nextMinutes !== null) {
                const target = new Date(now);
                target.setHours(Math.floor(nextMinutes / 60), nextMinutes % 60, 0, 0);
                // 若已过今天，目标为明天同一时间
                if (nextMinutes < nowMinutes) {
                  target.setDate(target.getDate() + 1);
                }
                const diffMs = target.getTime() - now.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                dueSoon = diffMin >= 0 && diffMin < 15;
              }

              const displayTime = nextMinutes !== null ? fromMinutes(nextMinutes) : times[0] || "--:--";

              return (
                <MedicationItem
                  key={idx}
                  name={m.name}
                  times={m.times}
                  dueSoon={dueSoon}
                  displayTime={displayTime}
                />
              );
            })}
          </div>
        )}
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <List header="个人中心">
        <List.Item onClick={showBasicInfo}>基础资料</List.Item>
        <List.Item onClick={() => navigate("/home/health")}>健康档案</List.Item>
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
        style={{
          marginBottom: 30,
        }}
      >
        退出登录
      </Button>

      {/* 绑定表单实例以消除未连接警告 */}
      <Form form={form} style={{ display: "none" }} />
      <Form form={healthForm} style={{ display: "none" }} />
    </div>
  );
};

export default Profile;