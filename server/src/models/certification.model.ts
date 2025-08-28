import mongoose, { Schema, Document } from 'mongoose';

export interface ICertification extends Document {
  nurseId: mongoose.Types.ObjectId;     // 护工ID
  certType: 'nursing' | 'health' | 'other'; // 证书类型
  certNumber: string;    // 证书编号
  imageUrl: string;      // 证书照片URL
  verified: boolean;     // 是否通过验证
  verifiedBy?: mongoose.Types.ObjectId; // 审核人
  verifiedAt?: Date;     // 审核时间
}

const certificationSchema = new Schema({
  nurseId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certType: {
    type: String,
    enum: ['nursing', 'health', 'other'],
    required: true
  },
  certNumber: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'certifications'
});

// 创建索引
certificationSchema.index({ nurseId: 1 });
certificationSchema.index({ certType: 1 });
certificationSchema.index({ verified: 1 });
certificationSchema.index({ certNumber: 1 });

export const Certification = mongoose.model<ICertification>('Certification', certificationSchema); 