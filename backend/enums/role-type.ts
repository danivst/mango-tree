const RoleTypeValue = {
  USER: 'user' as const,
  ADMIN: 'admin' as const
};

export type RoleType = typeof RoleTypeValue[keyof typeof RoleTypeValue];

export default RoleTypeValue;