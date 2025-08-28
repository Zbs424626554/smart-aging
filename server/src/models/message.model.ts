import mongoose, { Schema, Document } from "mongoose";

// 用户接口
export interface IMessage extends Document {
  users: [
    {
      realname?: string;
      username: string;
      role: string;
    },
  ];
  messages: [
    {
      sender: string;
      send_time: bigint;
      content: any;
      type: string;
      status: string;
      time: number;
      receiver: [string];
    },
  ];
}

// 用户信息Schema
const userSchema = new Schema(
  {
    realname: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["elderly", "family", "nurse", "admin"],
    },
  },
  { _id: false }
);

// 消息Schema
const messageItemSchema = new Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true,
    },
    send_time: {
      type: Number, // MongoDB不支持bigint，使用Number存储时间戳
      required: true,
      default: Date.now,
    },
    content: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      required: true,
      // 区分语音消息、语音通话、视频通话为不同类型
      enum: [
        "text",
        "image",
        "voice", // 语音消息
        "voice_call", // 语音通话记录
        "video_call", // 视频通话记录
        "video",
        "file",
        "location",
      ],
      default: "text",
    },
    status: {
      type: String,
      required: true,
      enum: ["unread", "read", "connect", "refusal", "cancel"],
      default: "unread",
    },
    time: {
      type: Number,
    },
    receiver: {
      type: [String],
    },
  },
  { _id: false }
);

// 主消息文档Schema
const messageSchema = new Schema(
  {
    users: {
      type: [userSchema],
      required: true,
      validate: {
        validator: function (v: any[]) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: "至少需要两个用户才能创建对话",
      },
    },
    messages: {
      type: [messageItemSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true, // 自动添加createdAt和updatedAt
    collection: "messages",
  }
);

// 添加索引优化查询性能
messageSchema.index({ "users.username": 1 });
messageSchema.index({ "messages.sender": 1 });
messageSchema.index({ "messages.send_time": -1 });
messageSchema.index({ createdAt: -1 });

// 静态方法：根据用户名查找对话
messageSchema.statics.findByUser = function (username) {
  return this.find({ "users.username": username }).sort({ updatedAt: -1 });
};

// 静态方法：查找两个用户之间的对话
messageSchema.statics.findConversation = function (user1, user2) {
  return this.findOne({
    "users.username": { $all: [user1, user2] },
    $expr: { $eq: [{ $size: "$users" }, 2] },
  });
};

// 实例方法：添加消息
messageSchema.methods.addMessage = function (messageData: any) {
  this.messages.push(messageData);
  return this.save();
};

// 导出模型
export const Message = mongoose.model("messages", messageSchema);
