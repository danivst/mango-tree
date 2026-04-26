/**
 * @file auth.ts
 * @description Authentication middleware and utilities for JWT-based authorization.
 * Provides request authentication and role-based access control with Cookie and Bearer support.
 *
 * Features:
 * - Dual-mode token extraction (HttpOnly Cookies first, Bearer header fallback)
 * - Automatic handling of CORS preflight (OPTIONS) requests
 * - Full integration with pino logger for security auditing
 * - Role-based access control (RBAC) via higher-order middleware
 * - Decodes and attaches JWT payload to the request object
 */

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import { RoleType } from "../enums/role-type";
import { JwtPayload, AuthRequest } from "../interfaces/auth";

/**
 * Authenticates incoming requests by verifying a JSON Web Token.
 * Searches for the token in the following order:
 * 1. `req.cookies.token` (Preferred for XSS resistance)
 * 2. `Authorization` header (Bearer scheme)
 *
 * Successful verification attaches the decoded payload to `req.user`.
 *
 * @param req - Express request object extended with user information
 * @param res - Express response object
 * @param next - Express next middleware function
 * @returns void
 * @throws {401} If no token is provided or the token is invalid/expired
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

  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    logger.warn({ path: req.path }, "[auth] No token provided");
    res.status(401).json({ message: "Unauthorized. Please sign up to continue." });
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
    
    res.status(401).json({ message: "Session expired. Please sign up again." });
    return;
  }
};

/**
 * Higher-order middleware that restricts access based on user roles.
 * Must be used AFTER the `auth` middleware to ensure `req.user` is populated.
 *
 * @param roles - Spread of allowed RoleType enums
 * @returns Middleware function to validate the user's role
 * @throws {403} If the user lacks the required role or is unauthenticated
 * @example
 * ```typescript
 * router.post("/admin-only", auth, requireRole(RoleType.ADMIN), controller);
 * router.get("/staff-area", auth, requireRole(RoleType.ADMIN, RoleType.STAFF), controller);
 * ```
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
