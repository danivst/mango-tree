const mongoose = require('mongoose');
const { Schema } = mongoose;

const avatarItemSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('AvatarItem', avatarItemSchema);