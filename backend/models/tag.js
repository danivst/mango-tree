const mongoose = require('mongoose');
const { default: TagType } = require('../enums/tag-type');
const { Schema } = mongoose;

const tagSchema = new Schema({
  name: {
    type: TagType,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('Tag', tagSchema);