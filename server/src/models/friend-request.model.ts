import mongoose, { Schema, Document } from "mongoose";

export type FriendRequestStatus = "pending" | "approved" | "rejected";

export interface IFriendRequest extends Document {
  fromUserId: mongoose.Types.ObjectId;
  fromUsername: string;
  fromRealname?: string;
  toUserId: mongoose.Types.ObjectId;
  toUsername: string;
  toRealname?: string;
  message?: string;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromUsername: { type: String, required: true },
    fromRealname: { type: String, default: "" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUsername: { type: String, required: true },
    toRealname: { type: String, default: "" },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

// 避免同一对用户重复提交待处理申请
friendRequestSchema.index(
  { fromUserId: 1, toUserId: 1, status: 1 },
  { unique: false }
);

export const FriendRequest = mongoose.model<IFriendRequest>(
  "FriendRequest",
  friendRequestSchema
);


