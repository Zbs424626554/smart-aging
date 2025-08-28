# 前端架构说明

本文件说明智慧养老综合服务平台前端架构，包括各端技术栈、目录结构、角色分流、页面与接口关系。

## 技术栈
- 老人端、家属端、护工端：React + Vite + Ant Design/Ant Design Mobile
- 后台管理端：React + Vite + Ant Design
- 公共包：packages 目录下复用通用服务、工具、类型

## 目录结构
- apps/elderly-app/  老人端前端
- apps/family-app/   家属端前端
- apps/nurse-app/    护工端前端
- apps/admin-panel/  后台管理前端
- packages/          公共包（services、utils、types等）
- server/            后端API服务

## 角色分流
- 登录注册统一接口，登录后根据角色跳转到对应端口和首页：
  - elderly: http://localhost:5173/home
  - family:  http://localhost:5174/home
  - nurse:   http://localhost:5175/home
  - admin:   http://localhost:5176/dashboard
- 后台管理端登录注册独立实现，仅admin角色可访问

## 页面与接口关系
- 每个端的页面（pages/）通过 services/ 目录下的API服务调用后端接口
- 典型页面与接口：
  - 登录页：/api/auth/login
  - 注册页：/api/auth/register
  - 个人中心：/api/user/profile
  - 订单页：/api/order/list /api/order/detail
  - 健康数据页：/api/health/list /api/health/add
  - 消息通知页：/api/notification/list
  - 后台管理页：/api/admin/*

## 主要交互流程
- 登录注册 -> 角色分流 -> 进入各自首页
- 下单/接单/服务流程 -> 订单状态流转 -> 支付/评价
- 健康数据录入/查看 -> AI分析/预警
- 紧急呼叫 -> 后台/家属端/客服联动
- 后台管理端：用户/订单/服务/投诉/数据统计等全平台管理

---

详细接口说明请参考 `api-documentation.md`，数据库结构见 `database-design.md`。 