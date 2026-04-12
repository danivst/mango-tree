/**
 * @file logger.ts
 * @description Structured logging utility using pino.
 * Replaces console.log/error for production-ready audit trails.
 */

import pino from "pino";

/**
 * Core logging instance.
 * Configures logging levels, pretty-printing for development environments, 
 * and automatic redaction of sensitive security credentials (tokens, passwords).
 * * @example
 * ```typescript
 * logger.info("Server started on port 3000");
 * logger.error(err, "Critical system failure");
 * ```
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { 
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        }
      }
    : undefined,
  // Redact sensitive information from logs
  redact: ['req.headers.authorization', 'req.body.password', 'password', 'token'],
});

export default logger;