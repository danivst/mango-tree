/**
 * @file debounce.ts
 * @description Debounce and throttle utilities for performance optimization.
 * Prevents functions from being called too frequently by delaying execution.
 *
 * Includes both utility functions and custom React hooks for common patterns.
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a function call.
 * Delays execution until after wait milliseconds have elapsed since the last call.
 *
 * @function debounce
 * @template T - Function type (extends (...args: any[]) => any)
 * @param {(args: any[]) => void} func - Function to debounce
 * @param {number} wait - Milliseconds to wait after last call
 * @param {boolean} [immediate=false] - If true, call on first instead of last
 * @returns {(...args: Parameters<T>) => void} Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query) => {
 *   searchAPI(query);
 * }, 300);
 *
 * // This will only execute 300ms after the last call
 * input.onChange = (e) => debouncedSearch(e.target.value);
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    const later = () => {
      timeoutId = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };

    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(later, wait);

    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Throttle a function call.
 * Ensures function is called at most once per specified interval.
 *
 * @function throttle
 * @template T - Function type
 * @param {T} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {(...args: Parameters<T>) => void} Throttled function
 *
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number = 0;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = Date.now();

    if (now - lastRan >= limit) {
      lastRan = now;
      func.apply(context, args);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        lastRan = Date.now();
        func.apply(context, args);
      }, limit - (now - lastRan));
    }
  };
}

/**
 * React hook for debouncing a value.
 * Returns a debounced version of the value that only updates after the delay.
 *
 * @function useDebounce
 * @template T - Value type
 * @param {T} value - Value to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {T} Debounced value
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * // Effect runs 300ms after searchQuery stops changing
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     search(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for debouncing a callback function.
 * Returns a debounced version of the callback that delays execution.
 *
 * @function useDebouncedCallback
 * @template T - Function parameters and return type
 * @param {(args: any[]) => any} callback - Function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {(...args: any[]) => void} Debounced callback
 *
 * @example
 * ```typescript
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   searchAPI(query);
 * }, 300);
 *
 * input.onChange = (e) => handleSearch(e.target.value);
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutState] = useState<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const newTimeout = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimeoutState(newTimeout);
  };
}
