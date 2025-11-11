import mongoose from 'mongoose';
import TagType from '../enums/tag-type.js';

const { Schema } = mongoose;

const tagSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: Object.values(TagType)
  }
});

export default mongoose.model('Tag', tagSchema);