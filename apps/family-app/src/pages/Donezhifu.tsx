import React, { useEffect } from "react"
import { Result } from "antd-mobile"
import { useNavigate } from "react-router-dom"

export default function Donezhifu() {
  const navigate = useNavigate()

  useEffect(() => {
    // 三秒后跳转到订单页面
    const timer = setTimeout(() => {
      navigate("/orders") // 这里写你的订单页面路由
    }, 3000)

    return () => clearTimeout(timer) // 组件卸载时清除定时器
  }, [navigate])

  return (
    <div style={{ padding: 40 }}>
      <Result
        status="success"
        title="支付成功"
        description="3 秒后将跳转到订单页面"
      />
    </div>
  )
}
