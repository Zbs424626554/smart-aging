import mongoose, { Schema, Document } from "mongoose";
// 老人健康档案

export interface IElderHealthArchive extends Document {
  elderID: mongoose.Types.ObjectId;
  name?: string;
  gender?: string;
  age?: number;
  phone?: string;
  address?: string;
  emcontact?: {
    username: string;
    phone: string;
    realname?: string;
  };
  medicals?: string[];
  allergies?: string[];
  // 兼容旧结构：time，新增结构：times[]
  useMedication?: Array<{ name: string; time?: string; times?: string[] }>;
  // 新增：体格信息
  heightCm?: number;
  weightKg?: number;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenLevel?: number;
  bloodSugar?: number;
}

const elderHealthArchiveSchema = new Schema(
  {
    elderID: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "secret"],
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    emcontact: {
      type: {
        username: { type: String },
        phone: { type: String },
        realname: { type: String },
      },
      _id: false,
    },
    medicals: {
      type: [String],
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    useMedication: {
      type: [
        {
          name: { type: String, required: true },
          // 旧字段，仅兼容
          time: { type: String, required: false },
          // 新字段：单个药品的多个时间
          times: { type: [String], required: false },
          _id: false,
        },
      ],
      required: false,
      default: [],
    },
    // 新增：身高（cm）与体重（kg）
    heightCm: {
      type: Number,
      min: 0,
      max: 300,
    },
    weightKg: {
      type: Number,
      min: 0,
      max: 500,
    },
    heartRate: {
      type: Number,
      min: 0,
      max: 300,
    },
    bloodPressure: {
      type: String,
      match: /^\d+\/\d+$/,
    },
    temperature: {
      type: Number,
      min: 30,
      max: 45,
    },
    oxygenLevel: {
      type: Number,
      min: 0,
      max: 100,
    },
    bloodSugar: {
      type: Number,
      min: 0,
      max: 50,
    },
  },
  {
    timestamps: true,
    collection: "elder_health_archives",
  }
);

elderHealthArchiveSchema.index({ elderID: 1 });
elderHealthArchiveSchema.index({ phone: 1 });
elderHealthArchiveSchema.index({ name: 1 });

export const ElderHealthArchive = mongoose.model<IElderHealthArchive>(
  "ElderHealthArchive",
  elderHealthArchiveSchema
);
