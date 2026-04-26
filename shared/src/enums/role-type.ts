/**
 * @file role-type.ts
 * @description Shared user role values.
 */

const RoleTypeValue = {
  USER: "user" as const,
  ADMIN: "admin" as const,
};

export type RoleType = (typeof RoleTypeValue)[keyof typeof RoleTypeValue];

export { RoleTypeValue };
export default RoleTypeValue;
