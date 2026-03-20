import React, { createContext, useContext, useEffect, useState } from "react";
import { setCookie, getCookie } from "../utils/cookies"; // Import cookie utilities
import { usersAPI, UserProfile } from "../services/api";
import { getToken } from "../utils/auth";

export type Theme = "dark" | "purple" | "cream" | "light" | "mango";
export type Language = "en" | "bg";

interface ThemeLanguageContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const ThemeLanguageContext = createContext<
  ThemeLanguageContextProps | undefined
>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state from cookie as fallback
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = getCookie("appTheme") as Theme | null;
    return saved || "cream";
  });
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = getCookie("appLanguage") as Language | null;
    return saved || "en";
  });

  // Fetch user preferences from backend on mount (if logged in)
  useEffect(() => {
    const fetchUserPreferences = async () => {
      // Only fetch if there's a token (user might be logged in)
      if (!getToken()) {
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
        console.log("[ThemeLanguage] Error fetching preferences, using defaults");
      }
    };

    fetchUserPreferences();
  }, []);

  // Apply theme to document
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
        root.style.setProperty("--theme-sidebar-bg", "linear-gradient(to bottom, #ffd151, #ffbc40)"); // Yellow-orange gradient for sidebar
        break;
    }
  }, [theme]);

  // Apply language to document
  useEffect(() => {
    setCookie("appLanguage", language, 365); // Persist for 1 year
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  // Sync preference changes to backend (if logged in)
  const syncPreferenceToBackend = async (updates: { theme?: Theme; language?: Language }) => {
    try {
      await usersAPI.updateProfile({
        theme: updates.theme,
        language: updates.language,
      } as any);
    } catch (error) {
      console.error("[ThemeLanguage] Failed to sync preference to backend:", error);
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    // Sync to backend if user is logged in (has token)
    if (getToken()) {
      syncPreferenceToBackend({ theme: t });
    }
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    // Sync to backend if user is logged in (has token)
    if (getToken()) {
      syncPreferenceToBackend({ language: l });
    }
  };

  return (
    <ThemeLanguageContext.Provider
      value={{ theme, setTheme, language, setLanguage }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const ctx = useContext(ThemeLanguageContext);
  if (!ctx)
    throw new Error(
      "useThemeLanguage must be used within ThemeLanguageProvider",
    );
  return ctx;
};
