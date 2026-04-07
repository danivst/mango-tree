/**
 * @file snackbar.ts
 * @description Custom hook for managing snackbar/notification state.
 * Centralizes snackbar logic used across 24+ page components.
 *
 * Provides a consistent interface for showing success, error, and warning messages
 * with automatic state management. Replaces repetitive useState patterns.
 *
 * @example
 * ```typescript
 * const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
 *
 * // Show success message
 * showSuccess(t("successfullyLoggedIn"));
 *
 * // Show error message
 * showError(t("incorrectPassword"));
 *
 * // Close snackbar
 * closeSnackbar();
 * ```
 *
 * @interface SnackbarState
 * @property {boolean} open - Whether the snackbar is visible
 * @property {string} message - Message text to display
 * @property {"success" | "error" | "warning"} type - Visual style of snackbar
 */

import { useState, useCallback } from 'react';

export interface SnackbarState {
  open: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

/**
 * Custom hook for managing snackbar notifications.
 * Encapsulates state and helper functions for showing messages.
 *
 * @function useSnackbar
 * @returns {{
 *   snackbar: SnackbarState;
 *   showSnackbar: (message: string, type?: SnackbarState['type']) => void;
 *   showSuccess: (message: string) => void;
 *   showError: (message: string) => void;
 *   showWarning: (message: string) => void;
 *   closeSnackbar: () => void;
 * }}
 */
export const useSnackbar = () => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    type: 'success'
  });

  const showSnackbar = useCallback((message: string, type: SnackbarState['type'] = 'success') => {
    setSnackbar({ open: true, message, type });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showSnackbar(message, 'success');
  }, [showSnackbar]);

  const showError = useCallback((message: string) => {
    showSnackbar(message, 'error');
  }, [showSnackbar]);

  const showWarning = useCallback((message: string) => {
    showSnackbar(message, 'warning');
  }, [showSnackbar]);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    snackbar,
    showSnackbar,
    showSuccess,
    showError,
    showWarning,
    closeSnackbar
  };
};
