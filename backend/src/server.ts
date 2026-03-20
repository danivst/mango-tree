import "./config/env";
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";

import postRoutes from "./routes/post-routes";
import categoryRoutes from "./routes/category-routes";
import commentRoutes from "./routes/comment-routes";
import reportRoutes from "./routes/report-routes";
import userRoutes from "./routes/user-routes";
import tagRoutes from "./routes/tag-routes";
import notificationRoutes from "./routes/notification-routes";
import authRoutes from "./routes/auth-routes";
import adminRoutes from "./routes/admin-routes";
import { connectDB } from "./config/db";

dotenv.config();

console.log("Starting server...");

const app: Application = express();

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"], // allow both frontend ports
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// Error handling middleware for JSON parse errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error("JSON parse error:", err.message);
    return res.status(400).json({ message: "Invalid JSON" });
  }
  next(err);
});

connectDB().then(() => console.log("MongoDB connected"));

// Test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ ok: true, message: 'Backend works!' });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
// app.use("/api/translate", translateRoute); // Commented out

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  res.status(500).json({ message: err.message });
});

const PORT: number = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Listening on all interfaces (0.0.0.0:${PORT})`);
});
