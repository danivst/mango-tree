import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import postRoutes from './routes/post-routes';
import categoryRoutes from './routes/category-routes';
import commentRoutes from './routes/comment-routes';
import reportRoutes from './routes/report-routes';
import userRoutes from './routes/user-routes';
import tagRoutes from './routes/tag-routes';
import notificationRoutes from './routes/notification-routes';
import authRoutes from './routes/auth-routes';
import adminRoutes from './routes/admin-routes';
import { connectDB } from './config/db';
import './config/env';

dotenv.config();

const app: Application = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // allow both origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

connectDB().then(() => console.log('MongoDB connected'));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});