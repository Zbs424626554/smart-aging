import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  nurseId: mongoose.Types.ObjectId;
  serviceType: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'confirmed' | 'canceled';
  orderTime: Date;
  elderlyId: mongoose.Types.ObjectId;
  requirements: string;
  startTime?: Date;
  endTime?: Date;
  duration: number;
  price: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  address: {
    formatted: string;
    province: string;
    city: string;
    district: string;
    location: {
      type: 'Point';
      coordinates: [number, number];
    };
  };
  remarks: string;
  healthSnapshot?: {
    bloodPressure?: string;
    bloodSugar?: number;
  };
}

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nurseId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  serviceType: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'started', 'completed', 'confirmed', 'canceled'],
    default: 'pending'
  },
  orderTime: {
    type: Date,
    default: Date.now
  },
  elderlyId: {
    type: Schema.Types.ObjectId,
    ref: "Elder",
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  address: {
    formatted: {
      type: String
    },
    province: {
      type: String
    },
    city: {
      type: String
    },
    district: {
      type: String
    },
    location: {
      type: {
        type: String,
        default: 'Point'
      },
      coordinates: {
        type: [Number]
      }
    }
  },
  requirements: {
    type: String
  },
  healthSnapshot: {
    bloodPressure: {
      type: String
    },
    bloodSugar: {
      type: Number
    }
  }
}, {
  timestamps: true,
  collection: 'orders'
});

orderSchema.index({ userId: 1 });
orderSchema.index({ nurseId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderTime: -1 });
orderSchema.index({ 'address.location': '2dsphere' });

export const Order = mongoose.model<IOrder>('Order', orderSchema); 