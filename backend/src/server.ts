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

const app: Application = express();

/**
 * Middleware configuration
 */

// CORS: Allow frontend origins to access the API
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Parse JSON request bodies with 10MB limit (for large base64 images)
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
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
 * Catches unhandled errors and returns appropriate responses.
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  console.error("Unhandled error:", { message: err.message, url: req.url });
  res.status(500).json({ message: "Internal server error" });
});

/**
 * Server startup
 * Connect to MongoDB first, then start listening on configured port.
 */
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
