/** 
 * @file ErrorBoundary.tsx 
 * @description Catch-all component for handling rendering errors and lazy-loading failures.
 */

import React from 'react';

/**
 * @interface ErrorBoundaryState
 * @description State for tracking caught errors.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * @class ErrorBoundary
 * @description Prevents app crashes by displaying a fallback UI when a child component fails.
 */
class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Updates state to render fallback UI on error.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Logs error details. Planned: Replace with central logger (Task 5.1).
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;