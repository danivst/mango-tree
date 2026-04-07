import { useState } from "react";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { useSnackbar } from "../utils/snackbar";
import Snackbar from "./Snackbar";
import "./ShareButton.css";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

type ShareOption = "copy" | "email" | "twitter" | "facebook" | "whatsapp" | "telegram" | "reddit" | "messenger";

const ShareButton: React.FC<ShareButtonProps> = ({ url, title, description = "", className = "" }) => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { snackbar, showSuccess, closeSnackbar } = useSnackbar();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title,
    text: description,
    url: url,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Native share failed:", err);
      }
    }
    setShowMenu(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showSuccess(t("linkCopiedSuccess"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showSuccess(t("failedToCopyLink"));
    }
    setShowMenu(false);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowMenu(false);
  };

  const handleSocialShare = (platform: ShareOption) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case "reddit":
        shareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case "messenger":
        //fb-messenger://share/?link=${encodedUrl}
        // Fallback to web if app not installed: use Facebook share dialog with redirect to messenger
        shareUrl = `fb-messenger://share/?link=${encodedUrl}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
    setShowMenu(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  return (
    <div className={`share-button-container ${className}`}>
      <button className="btn-share" onClick={toggleMenu} title={t("share")}>
        <span className="material-icons">share</span>
      </button>

      {showMenu && (
        <>
          <div className="share-menu-backdrop" onClick={closeMenu}></div>
          <div className="share-menu">
            {/* Native Share (if available) */}
            {navigator.share && (
              <button className="share-menu-item" onClick={handleNativeShare}>
                <span className="material-icons">send</span>
                <span>{t("shareNative")}</span>
              </button>
            )}

            {/* Copy Link */}
            <button className="share-menu-item" onClick={handleCopyLink}>
              <span className="material-icons">
                {copied ? "check" : "link"}
              </span>
              <span>{copied ? t("copied") : t("copyLink")}</span>
            </button>

            {/* Email */}
            <button className="share-menu-item" onClick={handleEmail}>
              <span className="material-icons">email</span>
              <span>{t("shareEmail")}</span>
            </button>

            {/* Social */}
            <div className="share-social-divider"></div>

            {/* Twitter */}
            <button className="share-menu-item" onClick={() => handleSocialShare("twitter")}>
              <span className="material-icons">alt_route</span>
              <span>Twitter</span>
            </button>

            {/* WhatsApp */}
            <button className="share-menu-item" onClick={() => handleSocialShare("whatsapp")}>
              <span className="material-icons">call</span>
              <span>WhatsApp</span>
            </button>

            {/* Telegram */}
            <button className="share-menu-item" onClick={() => handleSocialShare("telegram")}>
              <span className="material-icons">send</span>
              <span>Telegram</span>
            </button>

            {/* Reddit */}
            <button className="share-menu-item" onClick={() => handleSocialShare("reddit")}>
              <span className="material-icons">public</span>
              <span>Reddit</span>
            </button>

            {/* Messenger */}
            <button className="share-menu-item" onClick={() => handleSocialShare("messenger")}>
              <span className="material-icons">chat</span>
              <span>Messenger</span>
            </button>
          </div>
        </>
      )}

      {/* Snackbar for copy feedback */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={closeSnackbar}
      />
    </div>
  );
};

export default ShareButton;
