/**
 * @file language-type.ts
 * @description Shared language values.
 */

const LanguageTypeValue = {
  EN: "en" as const,
  BG: "bg" as const,
};

export type LanguageType =
  (typeof LanguageTypeValue)[keyof typeof LanguageTypeValue];

export { LanguageTypeValue };
export default LanguageTypeValue;
