/**
 * @file auth.ts
 * @description Authentication middleware and utilities for JWT-based authorization.
 * Provides request authentication and role-based access control with Cookie and Bearer support.
 */

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { RoleType } from "../enums/role-type";
import { JwtPayload, AuthRequest } from "../interfaces/auth";

/**
 * Authenticates incoming requests.
 * Checks for token in HttpOnly Cookies (secure) or Bearer header (fallback).
 */
export const auth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  logger.info({ method: req.method, path: req.path }, "[auth] Middleware called");

  if (req.method === 'OPTIONS') {
    return next();
  }

  // 1. Try to read token from HttpOnly cookies (XSS-resistant path)
  // Note: Requires 'cookie-parser' to be configured in app/server.
  let token = req.cookies?.token;

  // 2. Legacy fallback to Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    logger.warn({ path: req.path }, "[auth] No token provided");
    res.status(401).json({ message: "Unauthorized. Please sign in to continue." });
    return;
  }

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
    
    // Return 401 on invalid/expired tokens so the frontend can redirect to login.
    res.status(401).json({ message: "Session expired. Please sign in again." });
    return;
  }
};

/**
 * Enforces role-based permissions.
 */
export const requireRole =
  (...roles: RoleType[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(
        { userId: req.user?.userId, requiredRoles: roles, userRole: req.user?.role },
        "[auth] Insufficient permissions"
      );
      res.status(403).json({ message: "You do not have permission to perform this action." });
      return;
    }
    next();
  };