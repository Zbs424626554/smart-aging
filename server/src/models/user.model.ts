import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
// 用户数据表

// 用户接口
export interface IUser extends Document {
  username: string;
  password: string;
  phone: string;
  role: "elderly" | "family" | "nurse" | "admin";
  avatar?: string;
  realname?: string;
  friends?: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    relationship: string;
  }>;
  status: boolean;
  createdTime: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 用户Schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["elderly", "family", "nurse", "admin"],
  },
  avatar: {
    type: String,
    default: "",
  },
  realname: {
    type: String,
    default: "",
  },
  friends: {
    type: [
      new Schema(
        {
          userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
          username: { type: String, required: true },
          relationship: { type: String, required: true },
        },
        { _id: false }
      ),
    ],
    default: [],
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdTime: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

// 密码加密中间件
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码比较方法
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
