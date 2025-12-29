import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  createdAt: Date;
  likes: Types.ObjectId[]; // array of user IDs who liked
}

const commentSchema: Schema<IComment> = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Post'
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  text: {
    type: String,
    required: true,
    maxLength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }]
}, {
  timestamps: true
});

const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);

export default Comment;