/**
 * @file ThemeLanguageContext.tsx
 * @description React Context for managing application-wide theme and language settings.
 * Provides theme switching and internationalization across the entire app with persistence.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { setCookie, getCookie } from "../utils/cookies";
import { usersAPI, UserProfile } from "../services/api";
import { useAuth } from "../utils/useAuth";

/**
 * @enum Theme
 * @description Available color themes for the application.
 * Themes change the overall color scheme of the UI.
 *
 * @property {"dark"} dark - Dark mode: black background, light text
 * @property {"purple"} purple - Purple theme: dark purple background, light accent
 * @property {"cream"} cream - Cream theme: light yellow-beige background, dark text
 * @property {"light"} light - Light mode: white background, dark text
 * @property {"mango"} mango - Mango theme: white content, orange text, yellow-orange gradient sidebar
 */

export type Theme = "dark" | "purple" | "cream" | "light" | "mango";

/**
 * @enum Language
 * @description Supported languages for the application interface.
 * Currently supports English and Bulgarian.
 *
 * @property {"en"} en - English
 * @property {"bg"} bg - Bulgarian (Български)
 */

export type Language = "en" | "bg";

/**
 * @interface ThemeLanguageContextProps
 * @description Context API interface for theme and language management.
 * Provides current theme/language and setter functions with automatic cookie persistence.
 *
 * @property {Theme} theme - Current UI color theme
 * @property {(theme: Theme) => void} setTheme - Function to change theme (persists to cookie and syncs to backend if authenticated)
 * @property {(lang: Language) => void} setLanguage - Function to change language (persists to cookie and syncs to backend if authenticated)
 * @property {(theme: Theme) => void} setThemeImmediate - Set theme without syncing to backend (for initial load)
 * @property {(lang: Language) => void} setLanguageImmediate - Set language without syncing to backend (for initial load)
 */

interface ThemeLanguageContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  setThemeImmediate: (theme: Theme) => void;
  setLanguageImmediate: (lang: Language) => void;
}

const ThemeLanguageContext = createContext<
  ThemeLanguageContextProps | undefined
>(undefined);

/**
 * @file ThemeLanguageContext.tsx
 * @description React Context for managing application-wide theme and language settings.
 * Provides theme switching and internationalization across the entire app.
 *
 * Features:
 * - Client-side preferences persisted in cookies (1-year expiry)
 * - Server-side user preferences sync when user logs in (overrides cookie)
 * - Automatic CSS custom properties (--theme-bg, --theme-accent, --theme-text, etc.) applied to document root
 * - HTML lang attribute updates for accessibility and localization
 * - Backend API sync for authenticated users (users.updateProfile)
 *
 * Theme System:
 * Each theme maps to specific CSS variables set on :root:
 *   --theme-bg: Main background color
 *   --theme-accent: Secondary background (cards, buttons)
 *   --theme-text: Primary text color
 *   --theme-sidebar-bg: Optional sidebar background (overrides main for mango theme)
 *
 * Language System:
 * - Sets <html lang="..."> attribute
 * - Used by translation utility to determine which language string to return
 *
 * Sync Behavior:
 * - On mount: if user is logged in, fetch saved preferences from backend (overrides cookie)
 * - On change: setter updates state, writes cookie, and if authenticated, sends PATCH /users/:id to persist
 *
 * @component
 * @requires useState - Theme and language state with lazy initializers (cookie read)
 * @requires useEffect - Three effects: fetch user prefs, apply theme CSS, apply language attribute
 * @requires usersAPI - For syncing preferences to backend when authenticated
 * @requires setCookie/getCookie - Cookie persistence (1 year)
 */

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  /**
   * Theme state initialization: check cookie first, fallback to 'cream'
   * Uses lazy initializer function to only read cookie on initial render (performance).
   */
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = getCookie("appTheme") as Theme | null;
    return saved || "mango";
  });

  /**
   * Language state initialization: check cookie first, fallback to 'en'
   */
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = getCookie("appLanguage") as Language | null;
    return saved || "en";
  });

  /**
   * Effect: Fetch user preferences from backend on mount.
   * If user is logged in and has saved theme/language in profile, override cookie preferences.
   * Silent failure: logs error but continues with cookie/defaults.
   */
  useEffect(() => {
    const fetchUserPreferences = async () => {
      // Only fetch if user is authenticated
      if (!isAuthenticated) {
        return;
      }
      try {
        const user: UserProfile = await usersAPI.getCurrentUser();
        // If user has saved preferences, use them (override cookie)
        if (user.theme) {
          setThemeState(user.theme as Theme);
        }
        if (user.language) {
          setLanguageState(user.language as Language);
        }
      } catch (error) {
        console.log(
          "[ThemeLanguage] Error fetching preferences, using defaults",
        );
      }
    };

    fetchUserPreferences();
  }, []);

  /**
   * Effect: Apply theme CSS variables to document root when theme changes.
   * Maps each theme to specific color values for CSS custom properties.
   * These variables are used throughout the app via var(--theme-bg) etc.
   */
  useEffect(() => {
    setCookie("appTheme", theme, 365); // Persist for 1 year
    const root = document.documentElement;
    switch (theme) {
      case "dark":
        root.style.setProperty("--theme-bg", "#000000");
        root.style.setProperty("--theme-accent", "#1a1a1a");
        root.style.setProperty("--theme-text", "#FFFFFF");
        root.style.removeProperty("--theme-sidebar-bg");
        break;
      case "purple":
        root.style.setProperty("--theme-bg", "#250B24");
        root.style.setProperty("--theme-accent", "#361134");
        root.style.setProperty("--theme-text", "#F1F0CC");
        root.style.removeProperty("--theme-sidebar-bg");
        break;
      case "cream":
        root.style.setProperty("--theme-bg", "#F1F0CC");
        root.style.setProperty("--theme-accent", "#FCFBE4");
        root.style.setProperty("--theme-text", "#250B24");
        root.style.removeProperty("--theme-sidebar-bg");
        break;
      case "light":
        root.style.setProperty("--theme-bg", "#FFFFFF");
        root.style.setProperty("--theme-accent", "#F5F5F5");
        root.style.setProperty("--theme-text", "#000000");
        root.style.removeProperty("--theme-sidebar-bg");
        break;
      case "mango":
        root.style.setProperty("--theme-bg", "#FFFFFF"); // White background for main content
        root.style.setProperty("--theme-accent", "#FFFFFF"); // White for cards, buttons
        root.style.setProperty("--theme-text", "#E77728"); // Orange for text
        root.style.setProperty(
          "--theme-sidebar-bg",
          "linear-gradient(to bottom, #ffd151, #ffbc40)",
        ); // Yellow-orange gradient for sidebar
        break;
    }
  }, [theme]);

  /**
   * Effect: Apply language to document and persist to cookie.
   * Updates HTML lang attribute for accessibility and localization.
   */
  useEffect(() => {
    setCookie("appLanguage", language, 365); // Persist for 1 year
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  /**
   * Syncs user preferences to backend API.
   * Called whenever theme or language changes (if user is authenticated).
   * Uses 'as any' cast because UserProfile expects different types (backend types differ from frontend).
   *
   * @param {Object} updates - Contains theme and/or language to sync
   * @param {Theme} [updates.theme] - Optional theme to update
   * @param {Language} [updates.language] - Optional language to update
   */
  const syncPreferenceToBackend = async (updates: {
    theme?: Theme;
    language?: Language;
  }) => {
    try {
      await usersAPI.updateProfile({
        theme: updates.theme,
        language: updates.language,
      } as any);
    } catch (error) {
      console.error(
        "[ThemeLanguage] Failed to sync preference to backend:",
        error,
      );
      // Non-critical: continue; cookie already saved
    }
  };

  /**
   * Theme setter wrapper that syncs to backend if authenticated.
   * Updates local state and persists cookie; then async sync to server if logged in.
   *
   * @param {Theme} t - New theme value
   */
  const setTheme = (t: Theme) => {
    setThemeState(t);
    // Sync to backend if user is authenticated
    if (isAuthenticated) {
      syncPreferenceToBackend({ theme: t });
    }
  };

  /**
   * Theme setter that does NOT sync to backend.
   * Used for initial preference loading after login to avoid logging spurious changes.
   *
   * @param {Theme} t - New theme value
   */
  const setThemeImmediate = (t: Theme) => {
    setThemeState(t);
    // Note: Cookie is still set by the effect hook listening to theme changes
  };

  /**
   * Language setter wrapper that syncs to backend if authenticated.
   * Updates local state and persists cookie; then async sync to server if logged in.
   *
   * @param {Language} l - New language value
   */
  const setLanguage = (l: Language) => {
    setLanguageState(l);
    // Sync to backend if user is authenticated
    if (isAuthenticated) {
      syncPreferenceToBackend({ language: l });
    }
  };

  /**
   * Language setter that does NOT sync to backend.
   * Used for initial preference loading after login to avoid logging spurious changes.
   *
   * @param {Language} l - New language value
   */
  const setLanguageImmediate = (l: Language) => {
    setLanguageState(l);
    // Note: Cookie is still set by the effect hook listening to language changes
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        setThemeImmediate,
        setLanguageImmediate,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

/**
 * Custom hook for consuming ThemeLanguageContext.
 * Ensures hook is used within ThemeLanguageProvider, throws error otherwise.
 *
 * @returns {ThemeLanguageContextProps} Context value with theme and language
 */
export const useThemeLanguage = () => {
  const ctx = useContext(ThemeLanguageContext);
  if (!ctx)
    throw new Error(
      "useThemeLanguage must be used within ThemeLanguageProvider",
    );
  return ctx;
};
