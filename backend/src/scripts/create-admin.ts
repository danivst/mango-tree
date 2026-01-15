import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user';
import { MONGO_URI } from '../config/env';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected');

    const adminEmail = 'admin@mangotree.com';
    const adminPassword = 'Admin123!@#';
    const adminUsername = 'admin';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin account already exists!');
      console.log('Email:', adminEmail);
      console.log('Username:', existingAdmin.username);
      console.log('Password:', adminPassword);
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });

    console.log('✅ Admin account created successfully!');
    console.log('Email:', adminEmail);
    console.log('Username:', adminUsername);
    console.log('Password:', adminPassword);
    console.log('\nYou can now login with these credentials.');

    await mongoose.disconnect();
  } catch (error: any) {
    console.error('Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
