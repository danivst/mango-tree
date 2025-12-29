import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  image: string[];
  authorId: Types.ObjectId;
  category: string; // or Types.ObjectId if you want a ref
  tags: string[];
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isApproved: boolean;
  isVisible: boolean;
}

const postSchema: Schema<IPost> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    type: [String],
    default: []
  },
  authorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  category: {
    type: String,
    required: true,
    trim: true,
    ref: 'Category'
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// update `updatedAt` on save
postSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Post: Model<IPost> = mongoose.model<IPost>('Post', postSchema);

export default Post;