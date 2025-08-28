import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthWarning extends Document {
  elderlyId: mongoose.Types.ObjectId;
  metric: 'bloodPressure' | 'bloodSugar';
  currentValue: string;
  trend: 'rising' | 'falling' | 'abnormal';
  severity: 'low' | 'medium' | 'high';
  suggestedActions: string[];
  sentAt: Date;
}

const healthWarningSchema = new Schema({
  elderlyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metric: {
    type: String,
    enum: ['bloodPressure', 'bloodSugar'],
    required: true
  },
  currentValue: {
    type: String,
    required: true
  },
  trend: {
    type: String,
    enum: ['rising', 'falling', 'abnormal'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  suggestedActions: {
    type: [String]
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'health_warnings'
});

healthWarningSchema.index({ elderlyId: 1 });
healthWarningSchema.index({ metric: 1 });
healthWarningSchema.index({ severity: 1 });
healthWarningSchema.index({ sentAt: -1 });

export const HealthWarning = mongoose.model<IHealthWarning>('HealthWarning', healthWarningSchema); 