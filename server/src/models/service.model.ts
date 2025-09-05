import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceType extends Document {
  name: string;
  price: number;
  priceUnit: string;
  description: string;
  category: string;
  subcategory?: string;
  status: 'active' | 'disabled';
  requirements?: string[];
  imageUrl?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const serviceTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  priceUnit: {
    type: String,
    required: true,
    enum: ['小时', '次', '天', '月']
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['生活照料', '医疗护理', '康复护理', '心理护理', '精神关怀', '家政服务', '饮食服务', '紧急救援']
  },
  subcategory: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  requirements: {
    type: [String],
    default: []
  },
  imageUrl: {
    type: String
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'services'
});

serviceTypeSchema.index({ category: 1 });
serviceTypeSchema.index({ status: 1 });

export const ServiceType = mongoose.model<IServiceType>('Service', serviceTypeSchema); 