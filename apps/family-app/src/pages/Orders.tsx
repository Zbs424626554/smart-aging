import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import styles from "./Orders.module.css"
import request from "../utils/request"
import dayjs from "dayjs"

interface Order {
  _id: string
  orderNo?: string
  status: "published" | "assigned" | "in_progress" | "completed"
  price: string
  address: string
  scheduledStartTime?: string
  scheduledEndTime?: string
  createdAt: string
}

// 前端临时生成短订单号
const formatOrderNo = (id: string) => {
  if (!id) return ""
  return id.slice(-8).toUpperCase()
}
const formatDate = (date?: string) => {
  if (!date) return "-"
  const d = dayjs(date)
  return d.hour() === 0 && d.minute() === 0
    ? d.format("YYYY-MM-DD") // 只有日期
    : d.format("YYYY-MM-DD HH:mm") // 日期+时间
}
const Orders: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<
    "all" | "published" | "assigned" | "in_progress" | "completed"
  >("all")
  const [orders, setOrders] = useState<Order[]>([])

  // 拉取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await request.get("/orders/getOrders")
        if (res.code === 200) {
          setOrders(res.data)
        }
      } catch (err) {
        console.error("获取订单失败", err)
      }
    }
    fetchOrders()
  }, [])

  // 筛选
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders
    return orders.filter(o => o.status === activeTab)
  }, [activeTab, orders])

  // 状态标签
  const statusChip = (status: Order["status"]) => {
    const map: Record<Order["status"], string> = {
      published: "待分配",
      assigned: "已分配",
      in_progress: "进行中",
      completed: "已完成",
    }
    return (
      <span className={`${styles.statusChip} ${styles[`status_${status}`]}`}>
        {map[status]}
      </span>
    )
  }

  return (
    <div className={styles.orders}>
      {/* 顶部标题 */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitle}>订单管理</div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: "all", label: "全部" },
          { key: "published", label: "待分配" },
          { key: "assigned", label: "已分配" },
          { key: "in_progress", label: "进行中" },
          { key: "completed", label: "已完成" },
        ].map(t => (
          <button
            key={t.key}
            className={`${styles.tabBtn} ${
              activeTab === (t.key as any) ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className={styles.ordersList}>
        {filteredOrders.map(o => (
          <div className={styles.orderCard} key={o._id}>
            {/* 头部 */}
            <div className={styles.cardHeader}>
              <div className={styles.leftMeta}>
                <div className={styles.orderNo}>
                  订单号：{o.orderNo || formatOrderNo(o._id)}
                </div>
                <div className={styles.createdAt}>
                  {dayjs(o.createdAt).format("YYYY-MM-DD HH:mm")}
                </div>
              </div>
              <div className={styles.rightMeta}>
                {statusChip(o.status)}
                <div className={styles.amount}>¥{o.price}</div>
              </div>
            </div>

            {/* 内容 */}
            <div className={styles.cardBody}>
            <div className={styles.infoItem}>
  <span>预约时间：</span>
  {o.scheduledStartTime
    ? `${formatDate(o.scheduledStartTime)} ~ ${
        o.scheduledEndTime ? formatDate(o.scheduledEndTime) : ""
      }`
    : "-"}
</div>

              <div className={styles.infoItem}>
                <span>地址：</span>{o.address}
              </div>
            </div>

            {/* 底部 */}
            <div className={styles.cardFooter}>
              <button
                className={styles.detailBtn}
                onClick={() => navigate(`/orders/${o._id}`)}
              >
                查看详情
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className={styles.emptyBox}>暂无订单</div>
        )}
      </div>
    </div>
  )
}

export default Orders
