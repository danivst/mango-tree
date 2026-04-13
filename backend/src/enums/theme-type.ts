/**
 * @file theme-type.ts
 * @description UI theme enumeration.
 * Defines the available color schemes for the application.
 */

const ThemeTypeValue = {
  /** Dark mode theme */
  DARK: 'dark' as const,
  /** Purple accent theme */
  PURPLE: 'purple' as const,
  /** Cream/Neutral theme */
  CREAM: 'cream' as const,
  /** Standard Light mode theme */
  LIGHT: 'light' as const,
  /** Default MangoTree brand theme */
  MANGO: 'mango' as const
};

export type ThemeType = typeof ThemeTypeValue[keyof typeof ThemeTypeValue];

export default ThemeTypeValue;