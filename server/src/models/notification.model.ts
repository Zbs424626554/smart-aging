import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  type: 'order' | 'alert' | 'payment' | 'system';
  title: string;
  content: string;
  relatedId?: mongoose.Types.ObjectId;
  isRead: boolean;
  pushTime: Date;
}

const notificationSchema = new Schema({
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['order', 'alert', 'payment', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedId: {
    type: Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  },
  pushTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'notifications'
});

notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ pushTime: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema); 