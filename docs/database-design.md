# 数据库设计文档

## users 表
| 字段         | 类型       | 说明                |
| ------------ | ---------- | ------------------- |
| _id          | ObjectId   | 主键                |
| username     | string     | 用户名，唯一        |
| password     | string     | 密码（加密）        |
| phone        | string     | 手机号，唯一        |
| role         | string     | 用户角色（elderly/family/nurse/admin）|
| avatar       | string     | 头像                |
| realname     | string     | 真实姓名            |
| status       | boolean    | 状态                |
| createdTime  | Date       | 创建时间            |
| lastLogin    | Date       | 上次登录时间        |

## notifications 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| recipientId  | ObjectId     | 接收人（用户ID）    |
| senderId     | ObjectId     | 发送人（用户ID，可选）|
| type         | string       | 类型（order/alert/payment/system）|
| title        | string       | 标题                |
| content      | string       | 内容                |
| relatedId    | ObjectId     | 关联业务ID（可选）  |
| isRead       | boolean      | 是否已读            |
| pushTime     | Date         | 推送时间            |
| createdAt    | Date         | 创建时间（自动）    |
| updatedAt    | Date         | 更新时间（自动）    |

## health_warnings 表
| 字段             | 类型         | 说明                |
| ---------------- | ------------ | ------------------- |
| _id              | ObjectId     | 主键                |
| elderlyId        | ObjectId     | 老人用户ID          |
| metric           | string       | 指标（bloodPressure/bloodSugar）|
| currentValue     | string       | 当前值              |
| trend            | string       | 趋势（rising/falling/abnormal）|
| severity         | string       | 严重程度（low/medium/high）|
| suggestedActions | [string]     | 建议措施            |
| sentAt           | Date         | 发送时间            |
| createdAt        | Date         | 创建时间（自动）    |
| updatedAt        | Date         | 更新时间（自动）    |

## service_recommendations 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| nurseId      | ObjectId     | 护工ID              |
| elderlyId    | ObjectId     | 老人ID              |
| score        | number       | 推荐分数（0-100）   |
| reasons      | [string]     | 推荐理由            |
| generatedAt  | Date         | 生成时间            |
| createdAt    | Date         | 创建时间（自动）    |
| updatedAt    | Date         | 更新时间（自动）    |

## role_permissions 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| role         | string       | 角色（admin/cs/auditor/finance）|
| permissions  | 数组         | 权限数组（见下）    |
| createdAt    | Date         | 创建时间（自动）    |
| updatedAt    | Date         | 更新时间（自动）    |

- permissions:  
  - module: string（user/order/payment/nurse/content）
  - actions: [string]（create/read/update/delete/export）

## certifications 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| nurseId      | ObjectId     | 护工ID              |
| certType     | string       | 证书类型（nursing/health/other）|
| certNumber   | string       | 证书编号            |
| imageUrl     | string       | 证书图片URL         |
| verified     | boolean      | 是否通过验证        |
| verifiedBy   | ObjectId     | 审核人ID（可选）    |
| verifiedAt   | Date         | 审核时间（可选）    |
| createdAt    | Date         | 创建时间（自动）    |
| updatedAt    | Date         | 更新时间（自动）    |

## support_tickets 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| userId       | ObjectId     | 用户ID              |
| type         | string       | 类型（complaint/inquiry/emergency/other）|
| orderId      | ObjectId     | 关联订单ID（可选）  |
| content      | string       | 内容                |
| status       | string       | 状态（pending/in_progress/resolved/closed）|
| createdAt    | Date         | 创建时间            |
| resolvedAt   | Date         | 解决时间（可选）    |
| updatedAt    | Date         | 更新时间（自动）    |

## reviews 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| orderId      | ObjectId     | 订单ID              |
| reviewerId   | ObjectId     | 评论人ID            |
| revieweeId   | ObjectId     | 被评人ID            |
| rating       | number       | 评分（1-5）         |
| content      | string       | 评论内容            |
| createdAt    | Date         | 创建时间            |
| updatedAt    | Date         | 更新时间（自动）    |

## payment_transactions 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| orderId      | ObjectId     | 订单ID              |
| amount       | number       | 金额                |
| payerId      | ObjectId     | 支付人ID            |
| payMethod    | string       | 支付方式（alipay/wechat/bank）|
| transactionId| string       | 支付流水号          |
| status       | string       | 状态（pending/success/failed）|
| createdAt    | Date         | 创建时间            |
| updatedAt    | Date         | 更新时间（自动）    |

## emergency_alerts 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| userId       | ObjectId     | 用户ID              |
| triggerTime  | Date         | 触发时间            |
| location     | GeoJSON      | 位置（Point类型，coordinates为经纬度数组）|
| audioClip    | string       | 音频片段（可选）    |
| aiAnalysis   | string       | AI分析（可选）      |
| status       | string       | 状态（pending/handled/falseAlarm）|
| handledBy    | ObjectId     | 处理人ID（可选）    |
| createdAt    | Date         | 创建时间            |
| updatedAt    | Date         | 更新时间（自动）    |

## health_records 表
| 字段           | 类型         | 说明                |
| -------------- | ------------ | ------------------- |
| _id            | ObjectId     | 主键                |
| elderlyId      | ObjectId     | 老人ID              |
| recordType     | string       | 记录类型（bloodPressure/bloodSugar/medication/other）|
| value          | string       | 记录值              |
| measuredAt     | Date         | 测量时间            |
| recordedBy     | ObjectId     | 记录人ID            |
| aiWarningLevel | number       | AI预警等级（0-3，可选）|
| trendAnalysis  | string       | 趋势分析（可选）    |
| createdAt      | Date         | 创建时间            |
| updatedAt      | Date         | 更新时间            |

## orders 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| userId       | ObjectId     | 下单用户ID          |
| nurseId      | ObjectId     | 护工ID              |
| serviceType  | ObjectId     | 服务类型ID          |
| status       | string       | 订单状态（pending/accepted/started/completed/confirmed/canceled）|
| orderTime    | Date         | 下单时间            |
| startTime    | Date         | 服务开始时间        |
| endTime      | Date         | 服务结束时间        |
| duration     | number       | 服务时长            |
| price        | number       | 价格                |
| paymentStatus| string       | 支付状态（unpaid/paid/refunded）|
| address      | 对象         | 地址（含省市区、经纬度等）|
| remarks      | string       | 备注                |
| healthSnapshot| 对象        | 健康快照（血压/血糖）|
| createdAt    | Date         | 创建时间            |
| updatedAt    | Date         | 更新时间            |

## service_types 表
| 字段         | 类型         | 说明                |
| ------------ | ------------ | ------------------- |
| _id          | ObjectId     | 主键                |
| name         | string       | 服务名称            |
| basePrice    | number       | 基础价格            |
| description  | string       | 服务描述            |
| timeUnit     | string       | 计费单位（hour/visit）|
| category     | string       | 服务类别（daily/medical/emergency）|
| createdAt    | Date         | 创建时间            |
| updatedAt    | Date         | 更新时间            | 