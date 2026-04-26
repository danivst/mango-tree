/**
 * @file post-controller.ts
 * @description Central entry point for Post-related logic. 
 * Aggregates and exports controllers for core CRUD operations, feed generation 
 * (home, followed, and suggested) and social interactions like liking and translations.
 */

export * from "./post-crud-controller";
export * from "./post-feed-controller";
export * from "./post-interaction-controller";