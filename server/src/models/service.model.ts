import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceType extends Document {
  name: string;
  basePrice: number;
  description: string;
  timeUnit: 'hour' | 'visit';
  category: 'daily' | 'medical' | 'emergency';
}

const serviceTypeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timeUnit: {
    type: String,
    enum: ['hour', 'visit'],
    required: true
  },
  category: {
    type: String,
    enum: ['daily', 'medical', 'emergency'],
    required: true
  }
}, {
  timestamps: true,
  collection: 'service_types'
});

serviceTypeSchema.index({ name: 1 });
serviceTypeSchema.index({ category: 1 });

export const ServiceType = mongoose.model<IServiceType>('ServiceType', serviceTypeSchema); 