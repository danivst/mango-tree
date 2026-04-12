/**
 * @file auth-controller.ts
 * @description Central entry point for authentication logic. 
 * Aggregates and exports controllers for main account operations (registration/login), 
 * password management, and administrative account creation.
 */

export * from "./auth-main-controller";
export * from "./password-controller";
export * from "./admin-auth-controller";