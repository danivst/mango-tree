/**
 * @file auth.ts
 * @description Authentication middleware and utilities for JWT-based authorization.
 * Provides request authentication and role-based access control.
 */

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { RoleType } from "../enums/role-type";
import { JwtPayload, AuthRequest } from "../interfaces/auth";

/**
 * Authenticates incoming requests via JWT.
 * Validates the Bearer token in the Authorization header. On success, attaches user payload to the request.
 *
 * @param req - AuthRequest (Express request with user property)
 * @param res - Express response object
 * @param next - Express next function
 * @returns void
 * @throws {UnauthorizedError} 401 if token is missing
 * @throws {ForbiddenError} 403 if token is invalid or expired
 *
 * @example
 * ```typescript
 * router.get("/profile", auth, profileHandler);
 * ```
 */
export const auth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  logger.info({ method: req.method, path: req.path }, "[auth] Middleware called");

  // Allow OPTIONS requests (CORS preflight) to pass through without auth
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ path: req.path }, "[auth] No token provided");
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    logger.debug({ userId: decoded.userId }, "[auth] Token valid");
    req.user = decoded;
    next();
  } catch (err: any) {
    logger.warn({ error: err.message }, "[auth] Token invalid or expired");
    res.status(403).json({ message: 'Invalid or expired token' });
    return;
  }
};

/**
 * Enforces role-based permissions.
 * Factory function that returns a middleware checking if req.user.role matches allowed values.
 *
 * @param roles - List of RoleType enums allowed to access the route
 * @returns Middleware function
 * @throws {ForbiddenError} 403 if user role is insufficient
 *
 * @example
 * ```typescript
 * router.delete("/user/:id", auth, requireRole(RoleType.ADMIN), deleteHandler);
 * ```
 */
export const requireRole =
  (...roles: RoleType[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn({ userId: req.user?.userId, role: req.user?.role, required: roles }, "Access denied: insufficient permissions");
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    next();
  };