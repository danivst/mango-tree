import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";

interface GoBackButtonProps {
  className?: string;
}

const GoBackButton = ({ className = "" }: GoBackButtonProps) => {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);

  return (
    <button
      onClick={() => navigate(-1)}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        border: "2px solid var(--theme-text)",
        borderRadius: "12px",
        background: "transparent",
        color: "var(--theme-text)",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: 500,
      }}
    >
      <span className="material-icons" style={{ fontSize: "18px" }}>
        arrow_back
      </span>
      {t("goBack") || "Go Back"}
    </button>
  );
};

export default GoBackButton;
