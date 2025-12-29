import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.MONGO_URI as string;

if (!connectionString) {
  throw new Error('MONGO_URI is not defined in environment variables');
}

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(connectionString);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed', error);
    process.exit(1);
  }
};