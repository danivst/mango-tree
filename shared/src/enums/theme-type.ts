/**
 * @file theme-type.ts
 * @description Shared theme values.
 */

const ThemeTypeValue = {
  DARK: "dark" as const,
  PURPLE: "purple" as const,
  CREAM: "cream" as const,
  LIGHT: "light" as const,
  MANGO: "mango" as const,
};

export type ThemeType = (typeof ThemeTypeValue)[keyof typeof ThemeTypeValue];

export { ThemeTypeValue };
export default ThemeTypeValue;
