import mongoose, { Schema, Document } from "mongoose";
// 社区（社区帖子）

export interface ICommunityPost extends Document {
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  content: string;
  images?: string[];
  videos?: string[];
  publishedAt?: Date;
  likes: mongoose.Types.ObjectId[];
  comments: Array<{
    userId: mongoose.Types.ObjectId;
    username: string;
    content: string;
    createdAt?: Date;
  }>;
}

const commentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const communityPostSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    content: { type: String, required: true },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    publishedAt: { type: Date, default: Date.now },
    likes: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    comments: { type: [commentSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "community_posts",
  }
);

communityPostSchema.index({ authorId: 1, createdAt: -1 });
communityPostSchema.index({ authorName: 1 });
communityPostSchema.index({ createdAt: -1 });

export const CommunityPost = mongoose.model<ICommunityPost>(
  "CommunityPost",
  communityPostSchema
);
