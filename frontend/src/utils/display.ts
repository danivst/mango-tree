/**
 * @file display.ts
 * @description Display-related utility functions.
 * Provides helpers for formatting content for UI display,
 * including category/tag styling and time formatting.
 */

import type { Language } from './types';

/**
 * Styling information for categories
 */
export interface CategoryStyle {
  borderColor: string;
  backgroundColor: string;
  color: string;
}

/**
 * Mapping of category names to their display styles
 * Each category has a distinctive color scheme for visual identification.
 */
const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  flex: {
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
    color: '#1976D2'
  },
  recipe: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    color: '#388E3C'
  },
  question: {
    borderColor: '#9C27B0',
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    color: '#7B1FA2'
  }
};

/**
 * Get the display name for a category using translations.
 * Attempts to translate the category key; falls back to capitalized original name.
 *
 * @function getCategoryDisplayName
 * @param {string} categoryName - The category key (e.g., 'flex', 'recipe')
 * @param {(key: string) => string} t - Translation function
 * @returns {string} Display name (translated or capitalized)
 *
 * @example
 * ```typescript
 * const name = getCategoryDisplayName('flex', t); // May return "Recipes" if translated
 * ```
 */
export const getCategoryDisplayName = (
  categoryName: string,
  t: (key: string) => string
): string => {
  const translated = t(categoryName.toLowerCase());
  if (translated && translated !== categoryName.toLowerCase()) {
    return translated;
  }
  return categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
};

/**
 * Get styling object for a category based on its type.
 * Returns predefined color schemes for known categories, or null for unknown.
 *
 * @function getCategoryStyle
 * @param {string} categoryName - The category name/key
 * @returns {CategoryStyle | null} Style object or null
 *
 * @example
 * ```typescript
 * const style = getCategoryStyle('recipe');
 * // Returns { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#388E3C' }
 * ```
 */
export const getCategoryStyle = (
  categoryName: string
): CategoryStyle | null => {
  return CATEGORY_STYLES[categoryName.toLowerCase()] || null;
};

/**
 * Format a date/time as "time ago" string (relative time).
 * Provides human-readable time differences (e.g., "5 minutes ago").
 *
 * @function formatTimeAgo
 * @param {Date | string} date - The date to format
 * @param {'en' | 'bg'} language - Current UI language for localization
 * @param {(key: string) => string} t - Translation function
 * @returns {string} Formatted relative time string
 *
 * @example
 * ```typescript
 * formatTimeAgo(new Date(Date.now() - 300000), 'en', t); // "5 minutes ago"
 * formatTimeAgo(new Date(Date.now() - 300000), 'bg', t); // "преди 5 минути"
 * ```
 */
export const formatTimeAgo = (
  date: Date | string,
  language: Language,
  t: (key: string) => string
): string => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('justNow');
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    const unit = minutes === 1 ? t('minute') : t('minutes');
    return language === 'bg' ? `${t('ago')} ${minutes} ${unit}` : `${minutes} ${unit} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    const unit = hours === 1 ? t('hour') : t('hours');
    return language === 'bg' ? `${t('ago')} ${hours} ${unit}` : `${hours} ${unit} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    const unit = days === 1 ? t('day') : t('days');
    return language === 'bg' ? `${t('ago')} ${days} ${unit}` : `${days} ${unit} ago`;
  } else {
    return dateObj.toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};

/**
 * Truncate text with ellipsis if it exceeds max length.
 *
 * @function truncateText
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated or original text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate a URL-safe slug from text.
 * Lowercases, replaces spaces with hyphens, removes special characters.
 *
 * @function generateSlug
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-safe slug
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
