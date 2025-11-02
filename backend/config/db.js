const mongoose = require('mongoose');
require('dotenv').config();

const connectionString = process.env.MONGO_URI;

export const connectDB = async () => {
  try {
    await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (error) {
    process.exit(1);
  }
}