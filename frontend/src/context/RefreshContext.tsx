/**
 * @file RefreshContext.tsx
 * @description React Context providing a global trigger mechanism to refresh data in various components.
 * Typically used to synchronize UI updates across separate layout parts (e.g., sidebar click refreshing a main feed).
 */

import { createContext, useContext, useState, ReactNode } from 'react';

/**
 * @interface RefreshContextType
 * @description Context API interface for global refresh management.
 *
 * @property {number} refreshTrigger - A counter that increments each time a refresh is requested.
 * @property {() => void} triggerRefresh - Function to increment the counter and notify listeners.
 */
interface RefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType | null>(null);

/**
 * @component RefreshProvider
 * @description Provider component for the RefreshContext.
 *
 * @param {Object} props - Component properties.
 * @param {ReactNode} props.children - Child components to be wrapped by the provider.
 * @returns {JSX.Element} The context provider component.
 */
export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /**
   * Increments the refresh counter.
   * Components using `useRefresh` and watching `refreshTrigger` in a useEffect
   * will be notified of the change.
   */
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

/**
 * Custom hook for consuming RefreshContext.
 *
 * @function useRefresh
 * @returns {RefreshContextType} The current refresh state and trigger function.
 * @throws {Error} If used outside of a RefreshProvider.
 *
 * @example
 * ```typescript
 * const { refreshTrigger, triggerRefresh } = useRefresh();
 * const handleButtonClick = () => triggerRefresh();
 * useEffect(() => {
 *   if (refreshTrigger > 0) {
 *     fetchData();
 *   }
 * }, [refreshTrigger]);
 * ```
 */
export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};
