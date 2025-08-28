import mongoose, { Schema, Document } from 'mongoose';

export interface IApprove extends Document {
    nurseId: mongoose.Types.ObjectId;     // 护工ID
    nurseName: string;                    // 护工姓名
    idcard: string;                       // 身份证号
    certificateImage: string;             // 护理证和健康证图片
    idCardFront: string;                  // 身份证正面照片
    idCardBack?: string;                  // 身份证背面照片（可选）
    certificateType: 'nursing' | 'health' | 'both'; // 证书类型
    certificateNumber?: string;           // 证书编号
    status: 'pending' | 'approved' | 'rejected'; // 审核状态
    submitTime: Date;                     // 提交时间
    reviewTime?: Date;                    // 审核时间
    reviewBy?: mongoose.Types.ObjectId;   // 审核人ID
    rejectReason?: string;                // 拒绝原因
    remarks?: string;                     // 备注
}

const approveSchema = new Schema({
    nurseId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    nurseName: {
        type: String,
        required: false,
        trim: true
    },
    idcard: {
        type: String,
        required: false,
        trim: true
    },
    certificateImage: {
        type: String,
        required: false
    },
    idCardFront: {
        type: String,
        required: false
    },
    idCardBack: {
        type: String,
        required: false
    },
    certificateType: {
        type: String,
        enum: ['nursing', 'health', 'both'],
        required: false
    },
    certificateNumber: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submitTime: {
        type: Date,
        default: Date.now
    },
    reviewTime: {
        type: Date
    },
    reviewBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectReason: {
        type: String
    },
    remarks: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'approves'
});

// 创建索引
approveSchema.index({ nurseId: 1 });
approveSchema.index({ idcard: 1 });
approveSchema.index({ status: 1 });
approveSchema.index({ submitTime: -1 });
approveSchema.index({ nurseName: 1 });

export const Approve = mongoose.model<IApprove>('Approve', approveSchema);
