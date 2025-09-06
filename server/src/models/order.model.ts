import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;          // 家属用户ID
  elderlyId: mongoose.Types.ObjectId;       // 老人ID
  serviceId: mongoose.Types.ObjectId;       // 服务类型ID

  status: "published" | "assigned" | "in_progress" | "completed"; // 状态

  regionManager?: string;                   // 区域负责人姓名
  nurseId?: mongoose.Types.ObjectId;        // 护工ID

  scheduledStartTime: Date;                 // 订单预约开始时间
  scheduledEndTime: Date;                   // 订单预约结束时间
  actualStartTime?: Date;                   // 实际开始时间
  actualEndTime?: Date;                     // 实际结束时间

  price: string;                            // 服务价格（字符串）

  address: string;                          // 地址信息

}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    elderlyId: { type: Schema.Types.ObjectId, ref: "User" },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },

    status: {
      type: String,
      enum: ["published", "assigned", "in_progress", "completed"],
      default: "published",
    },

    regionManager: { type: String, default: 'admin1' },
    nurseId: { type: Schema.Types.ObjectId, ref: "User", default: null },

    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    actualStartTime: { type: Date, default: null },
    actualEndTime: { type: Date, default: null },
    price: { type: String },
    address: { type: String },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ elderlyId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ scheduledStartTime: -1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
