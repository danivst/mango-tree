/**
 * @file role-type.ts
 * @description User role enumeration.
 * Defines the two possible roles in the application: regular USER and ADMIN.
 */

/**
 * User roles for access control.
 */
const RoleTypeValue = {
  /** Regular user with basic permissions */
  USER: "user" as const,
  /** Administrator with elevated permissions */
  ADMIN: "admin" as const,
};

export type RoleType = (typeof RoleTypeValue)[keyof typeof RoleTypeValue];

export { RoleTypeValue };
export default RoleTypeValue;
