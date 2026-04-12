/**
 * @file declarations.d.ts
 * @description Type declarations for non-code assets.
 * This file allows TypeScript to recognize and import various static file formats
 * (images and stylesheets) as valid modules without throwing compilation errors.
 */

/**
 * Declaration for PNG image files.
 * @example
 * ```typescript
 * import logo from './assets/logo.png';
 * // logo is a string containing the path or base64 data
 * ```
 */
declare module '*.png' {
  const value: string;
  export default value;
}

/**
 * Declaration for JPG image files.
 */
declare module '*.jpg' {
  const value: string;
  export default value;
}

/**
 * Declaration for JPEG image files.
 */
declare module '*.jpeg' {
  const value: string;
  export default value;
}

/**
 * Declaration for SVG image files.
 */
declare module '*.svg' {
  const value: string;
  export default value;
}

/**
 * Declaration for GIF image files.
 */
declare module '*.gif' {
  const value: string;
  export default value;
}

/**
 * Declaration for CSS stylesheet files.
 * Allows importing CSS files for side-effects (styling).
 */
declare module "*.css";