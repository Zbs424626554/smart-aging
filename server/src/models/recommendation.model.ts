import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceRecommendation extends Document {
  nurseId: mongoose.Types.ObjectId;
  elderlyId: mongoose.Types.ObjectId;
  score: number;
  reasons: string[];
  generatedAt: Date;
}

const serviceRecommendationSchema = new Schema({
  nurseId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  elderlyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reasons: {
    type: [String]
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'service_recommendations'
});

serviceRecommendationSchema.index({ nurseId: 1 });
serviceRecommendationSchema.index({ elderlyId: 1 });
serviceRecommendationSchema.index({ score: -1 });
serviceRecommendationSchema.index({ generatedAt: -1 });

export const ServiceRecommendation = mongoose.model<IServiceRecommendation>('ServiceRecommendation', serviceRecommendationSchema); 