import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import postRoutes from './routes/post-routes.js';
import categoryRoutes from './routes/category-routes.js';
import commentRoutes from './routes/comment-routes.js';
import reportRoutes from './routes/report-routes.js';
import userRoutes from './routes/user-routes.js';
import tagRoutes from './routes/tag-routes.js';
import notificationRoutes from './routes/notification-routes.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});