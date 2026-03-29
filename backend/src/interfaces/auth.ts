import { RoleType } from '../enums/role-type';
import { Request } from 'express';

/**
 * Payload structure for JWT tokens.
 * Contains user identity and role information for authentication.
 *
 * @property {string} userId - MongoDB ObjectId of the user
 * @property {string} [username] - Optional username for convenience
 * @property {RoleType} role - User's role (USER or ADMIN)
 */
export interface JwtPayload {
  userId: string;
  username?: string;
  role: RoleType;
}

/**
 * Extended Express Request interface with user authentication data.
 * The user property is populated by the auth middleware.
 *
 * @extends Request
 * @property {JwtPayload} [user] - Authenticated user payload from JWT token
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Response structure for refresh token operations.
 *
 * @property {string} token - New JWT access token
 */
export interface RefreshTokenResponse {
  token: string;
}