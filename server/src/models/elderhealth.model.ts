import mongoose, { Schema, Document } from "mongoose";

export interface IElderHealthArchive extends Document {
  elderID: mongoose.Types.ObjectId;
  name?: string;
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
  useMedication?: Array<{ name: string; time: string }>;
  // 生命体征（可选）
  bloodPressure?: string; // e.g. "120/80"
  bloodSugar?: number;    // mmol/L
  heartRate?: number;     // bpm
  oxygenLevel?: number;   // %
  temperature?: number;   // ℃
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
          time: { type: String, required: true },
          _id: false,
        },
      ],
      required: false,
      default: [],
    },
    // 生命体征字段（允许为空）
    bloodPressure: { type: String, required: false },
    bloodSugar: { type: Number, required: false, min: 0, max: 50 },
    heartRate: { type: Number, required: false, min: 0, max: 300 },
    oxygenLevel: { type: Number, required: false, min: 0, max: 100 },
    temperature: { type: Number, required: false, min: 30, max: 45 },
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
