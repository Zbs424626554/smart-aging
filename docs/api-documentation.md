# API详细文档

本文件详细说明智慧养老综合服务平台各端主要API接口的路径、方法、参数、返回值、权限。

## 1. 登录注册
### 1.1 用户注册
- 接口：`POST /api/auth/register`
- 参数：username, password, phone, role（elderly/family/nurse）
- 返回：code, data: { user, token }
- 权限：公开

### 1.2 用户登录
- 接口：`POST /api/auth/login`
- 参数：username/phone, password
- 返回：code, data: { user, token }
- 权限：公开

### 1.3 获取用户信息
- 接口：`GET /api/auth/profile`
- 返回：用户详细信息
- 权限：登录后

## 2. 订单相关
### 2.1 创建订单
- 接口：`POST /api/order/create`
- 参数：详见数据库设计
- 权限：老人/家属端

### 2.2 订单列表
- 接口：`GET /api/order/list`
- 参数：role, userId, status, page, pageSize
- 权限：所有端

### 2.3 订单详情
- 接口：`GET /api/order/detail/:id`
- 权限：相关用户

## 3. 健康数据
### 3.1 添加健康记录
- 接口：`POST /api/health/add`
- 参数：elderlyId, recordType, value, measuredAt, recordedBy
- 权限：家属/护工端

### 3.2 查询健康记录
- 接口：`GET /api/health/list?elderlyId=xxx`
- 权限：老人/家属/护工

## 4. 紧急呼叫
- 接口：`POST /api/emergency/call`
- 参数：userId, location, audioClip
- 权限：老人端

## 5. 支付相关
- 接口：`POST /api/payment/pay`
- 参数：orderId, amount, payMethod
- 权限：家属端
- 接口：`POST /api/payment/withdraw`
- 参数：nurseId, amount
- 权限：护工端

## 6. 后台管理接口（仅 admin 角色）
- 用户管理：`GET /api/admin/user/list` `POST /api/admin/user/audit`
- 订单管理：`GET /api/admin/order/list`
- 服务内容管理：`GET /api/admin/service/list`
- 评价投诉管理：`GET /api/admin/review/list` `GET /api/admin/support/list`
- 数据统计：`GET /api/admin/statistics`
- 内容管理：`POST /api/admin/announcement`
- 客服工单：`GET /api/admin/support/list`
- 基础配置：`POST /api/admin/config`

---

详细数据库结构请参考 `database-design.md`。 