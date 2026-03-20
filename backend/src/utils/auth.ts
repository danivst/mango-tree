import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { RoleType } from '../enums/role-type';

/* ---------- JWT PAYLOAD ---------- */
export interface JwtPayload {
  userId: string;
  username?: string;
  role: RoleType;
}

/* ---------- AUTH REQUEST ---------- */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/* ---------- AUTH MIDDLEWARE ---------- */
export const auth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("[auth] Middleware called for:", req.method, req.path);

  // Allow OPTIONS requests (CORS preflight) to pass through without auth
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("[auth] No token provided");
    return res
      .status(401)
      .json({ message: 'No token, authorization denied' });
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
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

/* ---------- ROLE-BASED GUARD ---------- */
export const requireRole =
  (...roles: RoleType[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };