# API接口总览

本文件汇总智慧养老综合服务平台各端（老人端、家属端、护工端、后台管理端）主要API接口路径、用途、权限。

## 老人端 Elderly App
- 登录注册：`/api/auth/login` `/api/auth/register`
- 个人档案：`/api/user/profile`（GET/PUT）
- 服务浏览：`/api/service/list`
- 下单：`/api/order/create`
- 订单管理：`/api/order/list` `/api/order/detail/:id`
- 紧急呼叫：`/api/emergency/call`
- 消息通知：`/api/notification/list`
- 健康数据：`/api/health/list`

## 家属端 Family App
- 登录注册：`/api/auth/login` `/api/auth/register`
- 个人信息：`/api/user/profile`
- 绑定老人：`/api/family/bind`
- 发布需求/下单：`/api/order/create`
- 订单管理：`/api/order/list`
- 健康数据录入：`/api/health/add`
- 支付：`/api/payment/pay`
- 评价投诉：`/api/review/add` `/api/support/complaint`

## 护工端 Nurse App
- 登录注册：`/api/auth/login` `/api/auth/register`
- 资料认证：`/api/nurse/certification`
- 服务订单：`/api/order/available` `/api/order/accept`
- 我的订单：`/api/order/list`
- 服务记录：`/api/health/add`
- 收入管理：`/api/payment/withdraw`
- 评价申诉：`/api/review/list` `/api/support/appeal`

## 后台管理端 Admin Panel
- 用户管理：`/api/admin/user/list` `/api/admin/user/audit`
- 订单管理：`/api/admin/order/list`
- 服务内容管理：`/api/admin/service/list`
- 评价投诉管理：`/api/admin/review/list` `/api/admin/support/list`
- 数据统计：`/api/admin/statistics`
- 内容管理：`/api/admin/announcement`
- 客服工单：`/api/admin/support/list`
- 基础配置：`/api/admin/config`

---

详细接口参数、权限、返回值请参考 `api-documentation.md`。 