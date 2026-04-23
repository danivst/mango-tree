/**
 * @file server.ts
 * @description Main Express server entry point.
 * Configures middleware, connects to MongoDB, registers all API routes,
 * and starts the HTTP listener.
 *
 * @requires dotenv - Loads environment variables from .env
 * @requires express - Web framework
 * @requires cors - Cross-origin resource sharing
 * @requires connectDB - MongoDB connection utility
 */

import "./config/env";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { PORT } from "./config/env";
import { connectDB } from "./config/db";
import logger from "./utils/logger";
import { errorHandler } from "./middleware/error-middleware";

import authRoutes from "./routes/auth-routes";
import postRoutes from "./routes/post-routes";
import commentRoutes from "./routes/comment-routes";
import userRoutes from "./routes/user-routes";
import reportRoutes from "./routes/report-routes";
import categoryRoutes from "./routes/category-routes";
import tagRoutes from "./routes/tag-routes";
import notificationRoutes from "./routes/notification-routes";
import adminRoutes from "./routes/admin-routes";
import translateRoutes from "./routes/translate-routes";
import cookieParser from 'cookie-parser';

const app: Application = express();

app.use(cookieParser());

/**
 * Middleware configuration
 */

// CORS: Allow frontend origins to access the API
app.use(cors({
  origin: [
    "http://192.168.0.21:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Parse JSON request bodies with 10MB limit (for large base64 images)
app.use(express.json({ limit: '10mb' }));

// Structured request logging middleware using pino
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path }, `Incoming request`);
  next();
});

/**
 * API Routes
 * All routes prefixed with /api
 */

// Health check endpoint
app.get('/api/test', (req, res) =>
  res.json({ ok: true, message: 'Backend works!' })
);

// Router mounts
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/translate", translateRoutes);

/**
 * Global error handling middleware
 * Standardizes API error responses and integrates with pino logger.
 * Must be the LAST middleware in the express app stack.
 */
app.use(errorHandler);

/**
 * Server startup
 * Connect to MongoDB first, then start listening on configured port.
 */
connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error(error, "Failed to start server due to MongoDB connection error");
    process.exit(1);
  });

export default app;