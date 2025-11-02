import mongoose from 'mongoose';
import TagType from '../enums/tag-type.js';

const { Schema } = mongoose;

const tagSchema = new Schema({
  name: {
    type: String,
    enum: Object.values(TagType),
    required: true,
    trim: true
  }
});

export default mongoose.model('Tag', tagSchema);