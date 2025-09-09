import mongoose, { Schema, Document } from 'mongoose';

export interface IEmergencyAlert extends Document {
  userId: mongoose.Types.ObjectId;
  triggerTime: Date;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  audioClip?: string;
  transcript?: string;
  aiAnalysis?: string;
  status: 'pending' | 'handled' | 'falseAlarm';
  handledBy?: mongoose.Types.ObjectId;
  elderlyName?: string;
  contactName?: string;
  contactPhone?: string;
  callStatus?: 'ringing' | 'connected' | 'ended' | 'not_answered';
  createdAt: Date;
  updatedAt: Date;
}

const emergencyAlertSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  triggerTime: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  audioClip: {
    type: String
  },
  transcript: {
    type: String
  },
  aiAnalysis: {
    type: String
  },
  elderlyName: {
    type: String
  },
  contactName: {
    type: String
  },
  contactPhone: {
    type: String
  },
  callStatus: {
    type: String,
    enum: ['ringing', 'connected', 'ended', 'not_answered'],
    default: undefined
  },
  status: {
    type: String,
    enum: ['pending', 'handled', 'falseAlarm'],
    default: 'pending'
  },
  handledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'emergency_alerts'
});

emergencyAlertSchema.index({ userId: 1 });
emergencyAlertSchema.index({ status: 1 });
emergencyAlertSchema.index({ triggerTime: -1 });
emergencyAlertSchema.index({ 'location': '2dsphere' });

export const EmergencyAlert = mongoose.model<IEmergencyAlert>('EmergencyAlert', emergencyAlertSchema); 