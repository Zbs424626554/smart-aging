import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthRecord extends Document {
  elderlyId: mongoose.Types.ObjectId;
  recordType: 'bloodPressure' | 'bloodSugar' | 'medication' | 'other';
  value: string;
  measuredAt: Date;
  recordedBy: mongoose.Types.ObjectId;
  aiWarningLevel?: 0 | 1 | 2 | 3;
  trendAnalysis?: string;
}

const healthRecordSchema = new Schema({
  elderlyId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  recordType: { 
    type: String, 
    enum: ['bloodPressure', 'bloodSugar', 'medication', 'other'],
    required: true
  },
  value: { 
    type: String, 
    required: true
  },
  measuredAt: { 
    type: Date, 
    required: true
  },
  recordedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  aiWarningLevel: { 
    type: Number, 
    enum: [0, 1, 2, 3]
  },
  trendAnalysis: { 
    type: String
  }
}, { 
  timestamps: true,
  collection: 'health_records'
});

healthRecordSchema.index({ elderlyId: 1 });
healthRecordSchema.index({ recordType: 1 });
healthRecordSchema.index({ measuredAt: -1 });
healthRecordSchema.index({ recordedBy: 1 });

export const HealthRecord = mongoose.model<IHealthRecord>('HealthRecord', healthRecordSchema); 