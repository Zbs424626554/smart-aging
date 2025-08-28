import mongoose, { Schema, Document } from "mongoose";
// 老人健康档案

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
