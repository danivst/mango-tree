/**
 * @file ThemeLanguageSettings.tsx
 * @description Component for user preferences regarding UI appearance and localization.
 */
import React from "react";
import CheckIcon from "@mui/icons-material/Check";
import { Theme, Language } from "../../utils/types";
import "./Settings.css";
import "../../styles/shared.css";

interface Props {
  theme: string;                
  setTheme: (t: any) => void; 
  language: string;       
  setLanguage: (l: any) => void; 
  t: (key: string) => string;
}

/**
 * @component ThemeLanguageSettings
 * @description UI section for updating theme and language preferences.
 */
const ThemeLanguageSettings: React.FC<Props> = ({ theme, setTheme, language, setLanguage, t }) => {
  const themes = [
    { id: "dark" as Theme, bg: "#000000", inner: "#1a1a1a" },
    { id: "purple" as Theme, bg: "#250B24", inner: "#361134" },
    { id: "cream" as Theme, bg: "#F1F0CC", inner: "#FCFBE4" },
    { id: "mango" as Theme, bg: "#FFFFFF", inner: "#FFFFFF", border: "#ffd151", accent: true },
    { id: "light" as Theme, bg: "#FFFFFF", inner: "#F5F5F5" },
  ];

  const languages = [
    { id: "en" as Language, flag: "🇬🇧", label: "english" },
    { id: "bg" as Language, flag: "🇧🇬", label: "bulgarian" }
  ];

  return (
    <>
      <div className="settings-section section-spaced">
        <h2 className="settings-section-title">{t("appTheme")}</h2>
        <div className="theme-selector">
          {themes.map((tm) => (
            <div 
              key={tm.id} 
              className={`theme-option ${theme === tm.id ? "active" : ""}`} 
              onClick={() => setTheme(tm.id)}
            >
              <div className="theme-preview" style={{ background: tm.bg, borderColor: theme === tm.id ? (tm.id === 'mango' ? '#E77728' : tm.inner) : "#ddd" }}>
                <div className="preview-inner" style={{ background: tm.inner, border: tm.border ? `2px solid ${tm.border}` : "none" }}></div>
              </div>
              <span className={tm.accent ? "text-accent" : ""}>{t(tm.id)}</span>
              {theme === tm.id && <CheckIcon className="theme-check" sx={{ fontSize: 16 }} />}
            </div>
          ))}
        </div>
      </div>
      <div className="settings-section section-spaced">
        <h2 className="settings-section-title">{t("language")}</h2>
        <div className="theme-selector grid-2">
          {languages.map((l) => (
            <div 
              key={l.id} 
              className={`theme-option ${language === l.id ? "active" : ""}`} 
              onClick={() => setLanguage(l.id)}
            >
              <div className="theme-preview" style={{ background: "#F1F0CC", borderColor: language === l.id ? "#E77728" : "#ddd" }}>
                <span className="flag-icon">{l.flag}</span>
              </div>
              <span>{t(l.label)}</span>
              {language === l.id && <CheckIcon className="theme-check" sx={{ fontSize: 16 }} />}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ThemeLanguageSettings;