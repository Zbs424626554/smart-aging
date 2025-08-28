import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentTransaction extends Document {
  orderId: mongoose.Types.ObjectId;
  amount: number;
  payerId: mongoose.Types.ObjectId;
  payMethod: 'alipay' | 'wechat' | 'bank';
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
}

const paymentTransactionSchema = new Schema({
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  payerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payMethod: {
    type: String,
    enum: ['alipay', 'wechat', 'bank'],
    required: true
  },
  transactionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'payment_transactions'
});

paymentTransactionSchema.index({ orderId: 1 });
paymentTransactionSchema.index({ payerId: 1 });
paymentTransactionSchema.index({ status: 1 });
paymentTransactionSchema.index({ transactionId: 1 });
paymentTransactionSchema.index({ createdAt: -1 });

export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema); 