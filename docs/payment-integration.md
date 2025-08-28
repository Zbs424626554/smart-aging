# 支付功能集成说明

## 功能概述

本项目已集成支付宝沙箱支付功能，包括：

1. **支付功能** - 订单支付页面
2. **退款功能** - 订单退款申请页面
3. **支付状态查询** - 实时查询支付状态
4. **退款状态查询** - 查询退款处理进度

## 文件结构

### 前端文件
- `apps/family-app/src/services/payment.service.ts` - 支付服务
- `apps/family-app/src/pages/Payment.tsx` - 支付页面
- `apps/family-app/src/pages/Payment.module.css` - 支付页面样式
- `apps/family-app/src/pages/Refund.tsx` - 退款页面
- `apps/family-app/src/pages/Refund.module.css` - 退款页面样式
- `apps/family-app/src/pages/Orders.tsx` - 订单页面（已集成支付/退款按钮）

### 后端文件
- `server/src/routes/payment.routes.ts` - 支付相关API路由
- `server/src/index.ts` - 主入口文件（已注册支付路由）

## API接口

### 支付相关
- `POST /api/payment/create` - 创建支付订单
- `GET /api/payment/status/:orderId` - 查询支付状态
- `POST /api/payment/refund` - 申请退款
- `GET /api/payment/refund/status/:refundNo` - 查询退款状态

## 使用流程

### 1. 支付流程
1. 用户在订单页面点击"立即支付"按钮
2. 跳转到支付页面 (`/home/payment`)
3. 显示订单信息和支付宝沙箱支付选项
4. 用户点击"立即支付"按钮
5. 调用后端API创建支付订单
6. 显示支付结果（成功/失败）
7. 支付成功后自动跳转回订单页面

### 2. 退款流程
1. 用户在订单页面点击"申请退款"按钮
2. 跳转到退款页面 (`/home/refund`)
3. 用户选择退款原因
4. 点击"确认申请退款"按钮
5. 调用后端API申请退款
6. 显示退款申请结果
7. 申请成功后自动跳转回订单页面

## 支付宝沙箱配置

当前使用的是模拟的支付宝沙箱环境，包括：

- **沙箱网关**: `https://openapi.alipaydev.com/gateway.do`
- **应用ID**: `mock` (模拟)
- **支付方式**: 网页支付 (`alipay.trade.page.pay`)

## 测试数据

### 支付测试
- 成功率: 90%
- 支付延迟: 1秒
- 交易号格式: `ALIPAY{timestamp}{random}`

### 退款测试
- 成功率: 95%
- 退款延迟: 1.5秒
- 退款号格式: `REFUND{timestamp}{random}`

## 状态说明

### 支付状态
- `pending` - 待支付
- `paid` - 已支付
- `failed` - 支付失败
- `cancelled` - 已取消

### 退款状态
- `pending` - 退款中
- `completed` - 退款完成
- `failed` - 退款失败

## 注意事项

1. **认证要求**: 所有支付相关API都需要用户认证
2. **错误处理**: 前端包含完整的错误处理和重试机制
3. **用户体验**: 包含倒计时、加载状态、自动跳转等优化
4. **响应式设计**: 支持移动端和桌面端显示

## 扩展功能

如需接入真实的支付宝支付，需要：

1. 申请支付宝开放平台账号
2. 获取真实的AppID和密钥
3. 配置支付宝沙箱环境
4. 实现支付宝回调处理
5. 更新支付服务中的配置

## 开发调试

### 前端调试
```bash
cd elder_care/apps/family-app
npm run dev
```

### 后端调试
```bash
cd elder_care/server
npm run dev
```

### 测试支付流程
1. 启动前后端服务
2. 登录用户账号
3. 进入订单页面
4. 点击"立即支付"测试支付功能
5. 点击"申请退款"测试退款功能
