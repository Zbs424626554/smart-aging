import React, { useEffect, useState } from "react";
import { Empty, DotLoading, Card, Tag, Divider, Tabs } from "antd-mobile";
import { http } from "../utils/request";

interface OrderItem {
  _id: string;
  userId: string;
  nurseId?: string;
  serviceName: string;
  status:
  | "pending" // 待派发
  | "assigned" // 已派发
  | "processing" // 进行中
  | "started" // 进行中
  | "completed" // 已完成
  | "cancelled" // 已取消
  | "disputed"; // 争议中
  orderTime: string;
  hours: number;
  elderlyId?: string;
  startTime?: string;
  endTime?: string;
  duration: number;
  price: number;
  paymentStatus: "unpaid" | "pending" | "paid" | "refunded";
  address?: string;
  remarks?: string;
  healthSnapshot?: {
    bloodPressure?: string;
    bloodSugar?: number;
  };
}

const Orders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  type FilterKey =
    | "all"
    | "pending"
    | "assigned"
    | "inprogress"
    | "completed"
    | "cancelled"
    | "disputed";
  const [activeTab, setActiveTab] = useState<FilterKey>("all");

  const statusText = (status: OrderItem["status"]) => {
    switch (status) {
      case "pending":
        return "待派发";
      case "assigned":
        return "已派发";
      case "processing":
        return "进行中";
      case "started":
        return "进行中";
      case "completed":
        return "已完成";
      case "cancelled":
        return "已取消";
      case "disputed":
        return "争议中";
      default:
        return status;
    }
  };

  const statusColor = (status: OrderItem["status"]) => {
    switch (status) {
      case "pending":
        return "warning" as const;
      case "assigned":
        return "primary" as const;
      case "processing":
        return "primary" as const;
      case "started":
        return "primary" as const;
      case "completed":
        return "success" as const;
      case "cancelled":
        return "danger" as const;
      case "disputed":
        return "warning" as const;
      default:
        return "default" as const;
    }
  };

  const paymentText = (payment: OrderItem["paymentStatus"]) => {
    switch (payment) {
      case "unpaid":
        return "未支付";
      case "pending":
        return "待支付";
      case "paid":
        return "已支付";
      case "refunded":
        return "已退款";
      default:
        return payment;
    }
  };

  const paymentColor = (payment: OrderItem["paymentStatus"]) => {
    switch (payment) {
      case "unpaid":
        return "warning" as const;
      case "paid":
        return "success" as const;
      case "refunded":
        return "default" as const;
      default:
        return "default" as const;
    }
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const formatPrice = (value?: number) => {
    const n = Number(value || 0);
    return `¥${n.toFixed(2)}`;
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await http.get<{ list: OrderItem[] }>("/elderorder/my");
      // 订单数据已获取
      setOrders(res.data.list || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const displayedOrders = orders
    .filter((order) => {
      return (
        order.elderlyId ==
        JSON.parse(localStorage.getItem("userInfo") || "{}")._id
      );
    })
    .filter((order) => {
      if (activeTab === "all") return true;
      if (activeTab === "inprogress") {
        return order.status === "processing" || order.status === "started";
      }
      return (
        order.status === (activeTab as Exclude<FilterKey, "all" | "inprogress">)
      );
    });

  const unpaidCount = orders
    .filter((order) => {
      return (
        order.elderlyId ==
        JSON.parse(localStorage.getItem("userInfo") || "{}")._id
      );
    })
    .filter(
      (o) => o.paymentStatus === "unpaid" || o.paymentStatus === "pending"
    ).length;

  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: "center" }}>
        <DotLoading />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#fff",
          boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ padding: 12, paddingBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>我的订单</div>
          <div style={{ marginTop: 6, color: "#8c8c8c", fontSize: 12 }}>
            共 {displayedOrders.length} 条 · 当前筛选 {displayedOrders.length}{" "}
            条 · 待支付 {""}
            {unpaidCount} 条
          </div>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as FilterKey)}
        >
          <Tabs.Tab title="全部" key="all" />
          <Tabs.Tab title="待派发" key="pending" />
          <Tabs.Tab title="已派发" key="assigned" />
          <Tabs.Tab title="进行中" key="inprogress" />
          <Tabs.Tab title="已完成" key="completed" />
          <Tabs.Tab title="已取消" key="cancelled" />
          <Tabs.Tab title="争议中" key="disputed" />
        </Tabs>
      </div>
      <div style={{ padding: 12 }}>
        {!displayedOrders.length ? (
          <Empty description="暂无订单" />
        ) : (
          displayedOrders.map((order) => (
            <Card
              key={order._id}
              style={{
                marginBottom: 12,
                border: "1px solid #ddd",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {order.serviceName}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Tag color={statusColor(order.status)}>
                      {statusText(order.status)}
                    </Tag>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#ff4d4f" }}
                  >
                    {formatPrice(order.price)}
                  </div>
                  <div style={{ color: "#999", fontSize: 12 }}>预估金额</div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {order.nurseId ? (
                  <Tag
                    color="default"
                    style={{ backgroundColor: "#fff", color: "#000" }}
                  >
                    护工ID：{order.nurseId}
                  </Tag>
                ) : null}
              </div>

              <Divider style={{ margin: "12px 0" }} />

              <div
                style={{
                  marginLeft: "-40px",
                  display: "grid",
                  gridTemplateColumns: "96px 1fr",
                  rowGap: 10,
                  columnGap: 8,
                  fontSize: 14,
                  color: "#555",
                }}
              >
                <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                  下单时间
                </div>
                <div>{formatDateTime(order.orderTime)}</div>
                {order.startTime ? (
                  <>
                    <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                      开始时间
                    </div>
                    <div>{formatDateTime(order.startTime)}</div>
                  </>
                ) : null}
                {order.endTime ? (
                  <>
                    <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                      结束时间
                    </div>
                    <div>{formatDateTime(order.endTime)}</div>
                  </>
                ) : null}
                <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                  服务时长
                </div>
                <div>{order.hours ? order.hours + "小时" : "暂定"}</div>
                <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                  支付状态
                </div>
                <div>
                  <Tag
                    color={paymentColor(order.paymentStatus)}
                    style={{ verticalAlign: "middle" }}
                  >
                    {paymentText(order.paymentStatus)}
                  </Tag>
                </div>
                <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                  服务地址
                </div>
                <div>{order.address || "-"}</div>
                {order.remarks ? (
                  <>
                    <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                      备注
                    </div>
                    <div>{order.remarks}</div>
                  </>
                ) : null}
                {order.healthSnapshot ? (
                  <>
                    <div style={{ color: "#8c8c8c", textAlign: "right" }}>
                      健康快照
                    </div>
                    <div>
                      {order.healthSnapshot.bloodPressure
                        ? `血压 ${order.healthSnapshot.bloodPressure} `
                        : ""}
                      {order.healthSnapshot.bloodSugar
                        ? `血糖 ${order.healthSnapshot.bloodSugar}`
                        : ""}
                    </div>
                  </>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;