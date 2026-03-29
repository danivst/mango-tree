/**
 * @file auth.ts
 * @description Authentication middleware and utilities for JWT-based authorization.
 * Provides request authentication and role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RoleType } from '../enums/role-type';
import { JwtPayload, AuthRequest } from '../interfaces/auth';

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header and attaches user payload to request.
 * Allows OPTIONS requests to pass through for CORS preflight.
 *
 * @param req - Express request (typed as AuthRequest after middleware)
 * @param res - Express response
 * @param next - Express next function
 * @returns 401 if no token, 403 if invalid token, or calls next() if valid
 */
export const auth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.log("[auth] Middleware called for:", req.method, req.path);

  // Allow OPTIONS requests (CORS preflight) to pass through without auth
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("[auth] No token provided");
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    console.log("[auth] Token valid, user:", decoded.userId);
    req.user = decoded;
    next();
  } catch (err: any) {
    console.log("[auth] Token invalid:", err.message);
    res.status(403).json({ message: 'Invalid or expired token' });
    return;
  }
};

/**
 * Role-based access control middleware factory.
 * Creates a middleware that requires the user to have one of the specified roles.
 *
 * @param roles - Allowed roles (variadic)
 * @returns Middleware function that checks user role
 *
 * @example
 * ```typescript
 * router.get('/admin', requireRole(RoleType.ADMIN), adminHandler);
 * ```
 */
export const requireRole =
  (...roles: RoleType[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }
    next();
  };
