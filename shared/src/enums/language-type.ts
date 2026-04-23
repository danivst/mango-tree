/**
 * @file language-type.ts
 * @description Language preference enumeration.
 * Supported locales for the application interface and content.
 */

const LanguageTypeValue = {
  /** English language */
  EN: "en" as const,
  /** Bulgarian language */
  BG: "bg" as const,
};

export type LanguageType =
  (typeof LanguageTypeValue)[keyof typeof LanguageTypeValue];

export { LanguageTypeValue };
export default LanguageTypeValue;
