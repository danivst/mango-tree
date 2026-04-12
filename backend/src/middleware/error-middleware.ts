/**
 * @file error-middleware.ts
 * @description Centralized error handling middleware.
 * Standardizes API error responses and integrates with the logger.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { IS_DEV } from '../config/env';

/**
 * Custom Error class for operational errors.
 * Used to differentiate between expected business errors and unexpected crashes.
 */
export class AppError extends Error {
  public status: number;
  public isOperational: boolean;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.isOperational = true; // Marks it as a handled business logic error

    // Capture the stack trace for easier debugging in dev
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware.
 * Captures all errors passed to next(), logs them, and returns a standardized JSON response.
 *
 * @param err - Error or AppError instance
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Standardized error response
 *
 * @example
 * ```json
 * @response
 * {
 * "success": false,
 * "error": "User not found",
 * "timestamp": "2023-10-27T10:00:00Z"
 * }
 * ```
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Determine the status code
  const status = err instanceof AppError ? err.status : 500;
  
  // Log the error (Structured Logging)
  if (status === 500) {
    logger.error(err, `[CRITICAL] ${req.method} ${req.path}`);
  } else {
    logger.warn({ path: req.path, message: err.message }, `[API_ERROR] ${status}`);
  }

  // Construct the response envelope (Task 8.4)
  const response = {
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    // Include stack trace only in development
    ...(IS_DEV && { stack: err.stack }),
  };

  res.status(status).json(response);
};