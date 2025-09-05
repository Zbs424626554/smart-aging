import React, { useState, useEffect } from "react"
import { Button, Toast, Radio } from "antd-mobile"
import { useNavigate } from "react-router-dom"
import request from "../utils/request"
import { Dialog } from "antd-mobile"
export default function Gozhifu() {
  const navigate = useNavigate()
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [payMethod, setPayMethod] = useState("wechat")

  useEffect(() => {
    // 从 localStorage 取表单保存的订单
    const raw = localStorage.getItem("orderInfo")
    if (raw) {
      try {
        setOrderInfo(JSON.parse(raw))
      } catch {
        Toast.show({ icon: "fail", content: "订单数据错误" })
      }
    } else {
      Toast.show({ icon: "fail", content: "没有订单信息" })
    }
  }, [])

  const handlePay = async () => {
    if (!orderInfo) return
    try {
      setLoading(true)
      Toast.show({ icon: "loading", content: "正在支付..." })
      await new Promise(res => setTimeout(res, 2000)) // 模拟耗时

      // Toast.show({ icon: "success", content: "支付成功" })

      // 写数据库
      let res:{code:number}=await request.post("/orders/addOrder",orderInfo )
      if(res.code==200){
        await Dialog.alert({
          content: "支付成功，即将跳转...",
        })
      
        // 跳转
        navigate("/home/orders")
      }

    } finally {
      setLoading(false)
    }
  }

  if (!orderInfo) return <div>没有订单信息</div>

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* 顶部：收款方 + 金额 */}
      <div style={{ background: "#fff", padding: 30, textAlign: "center" }}>
        <h3 style={{ marginBottom: 10 }}>收款方：智慧养老服务中心</h3>
        <div style={{ fontSize: 36, fontWeight: "bold", color: "#ff4d4f" }}>
          ¥ {orderInfo.price}
        </div>
      </div>

      {/* 支付方式选择 */}
      <div style={{ margin: 15, background: "#fff", borderRadius: 8, padding: 16 }}>
        <h4 style={{ marginBottom: 10 }}>选择支付方式</h4>
        <Radio.Group value={payMethod} onChange={val => setPayMethod(val as string)}>
          <div style={payRow}><Radio value="wechat">微信支付</Radio></div>
          <div style={payRow}><Radio value="alipay">支付宝支付</Radio></div>
          <div style={payRow}><Radio value="bank">银行卡</Radio></div>
        </Radio.Group>
      </div>

      {/* 正常流式按钮 */}
      <div style={{ padding: 20 }}>
        <Button
          block
          color="primary"
          size="large"
          loading={loading}
          onClick={handlePay}
        >
          立即支付
        </Button>
      </div>
    </div>
  )
}

const payRow: React.CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid #f0f0f0"
}
