import mongoose, { Document, Schema, Model } from 'mongoose';
import TagType from '../enums/tag-type';

export interface ITag extends Document {
  name: string;
  type?: keyof typeof TagType;
}

const tagSchema: Schema<ITag> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(TagType),
    required: false
  }
}, {
  timestamps: true
});

const Tag: Model<ITag> = mongoose.model<ITag>('Tag', tagSchema);

export default Tag;