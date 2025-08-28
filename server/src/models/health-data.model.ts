import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthData extends Document {
  elderlyId: mongoose.Types.ObjectId;
  elderlyName: string;
  heartRate: number;
  bloodPressure: string;
  temperature: number;
  oxygenLevel: number;
  bloodSugar: number;
  lastUpdate: Date;
  status: 'normal' | 'warning' | 'danger';
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
}

const healthDataSchema = new Schema({
  elderlyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  elderlyName: {
    type: String,
    required: true
  },
  heartRate: {
    type: Number,
    required: true,
    min: 0,
    max: 300
  },
  bloodPressure: {
    type: String,
    required: true,
    match: /^\d+\/\d+$/
  },
  temperature: {
    type: Number,
    required: true,
    min: 30,
    max: 45
  },
  oxygenLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  bloodSugar: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'danger'],
    default: 'normal'
  },
  notes: {
    type: String
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'health_data'
});

// 索引
healthDataSchema.index({ elderlyId: 1 });
healthDataSchema.index({ lastUpdate: -1 });
healthDataSchema.index({ status: 1 });
healthDataSchema.index({ recordedBy: 1 });

export const HealthData = mongoose.model<IHealthData>('HealthData', healthDataSchema);
