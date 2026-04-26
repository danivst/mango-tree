/**
 * @file ShareButton.tsx
 * @description A multi-platform sharing component that provides a unified interface for 
 * distributing content. It supports the Web Share API (native mobile sharing), 
 * clipboard copying, email and various social media platforms (Twitter, Facebook, 
 * WhatsApp, Telegram, Reddit and Messenger).
 */

import { useState } from "react";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { useSnackbar } from "../../../utils/snackbar";
import Snackbar from "./../../snackbar/Snackbar";
import "./ShareButton.css";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

type ShareOption = "copy" | "email" | "twitter" | "facebook" | "whatsapp" | "telegram" | "reddit" | "messenger";

/**
 * ShareButton Component
 * @param {string} url - The URL to be shared
 * @param {string} title - The title of the content being shared
 * @param {string} [description] - Optional brief description of the content
 * @param {string} [className] - Optional CSS class for container styling
 * @example
 * ```tsx
 * <ShareButton 
 * url="[https://mangotreeofficial.com/posts/123](https://mangotreeofficial.com/posts/123)" 
 * title="Check out this recipe!" 
 * description="A delicious mango smoothie."
 * />
 * ```
 */
const ShareButton: React.FC<ShareButtonProps> = ({ url, title, description = "", className = "" }) => {
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { snackbar, showSuccess, showError, closeSnackbar } = useSnackbar();
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title: title,
    text: description,
    url: url,
  };

  /**
   * Triggers the native device share sheet if supported (mobile browsers).
   */
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Native share failed:", err);
        }
      }
    }
    setShowMenu(false);
  };

  /**
   * Copies the URL to the system clipboard and provides snackbar feedback.
   */
  const handleCopyLink = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        finalizeCopy();
        return;
      } catch (err) {
        if (import.meta.env.DEV) console.error("Modern copy failed:", err);
      }
    }

    // Works on HTTP and older mobiles
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      
      // Prevent scrolling and keep it off-screen
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        finalizeCopy();
      } else {
        throw new Error("execCommand unsuccessful");
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("Fallback copy failed:", err);
      showError(t("failedToCopyLink"));
    }
  };

  // Helper to handle the UI state after successful copy
  const finalizeCopy = () => {
    setCopied(true);
    showSuccess(t("linkCopiedSuccess"));
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  /**
   * Opens the default system email client with pre-filled subject and body.
   */
  const handleEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description}\n\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowMenu(false);
  };

  /**
   * Handles sharing via social media platform intent URLs.
   * @param platform - The target platform key
   */
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
            {'share' in navigator && (
              <button className="share-menu-item" onClick={handleNativeShare}>
                <span className="material-icons">send</span>
                <span>{t("shareNative")}</span>
              </button>
            )}
            <button className="share-menu-item" onClick={handleCopyLink}>
              <span className="material-icons">
                {copied ? "check" : "link"}
              </span>
              <span>{copied ? t("copied") : t("copyLink")}</span>
            </button>
            <button className="share-menu-item" onClick={handleEmail}>
              <span className="material-icons">email</span>
              <span>{t("shareEmail")}</span>
            </button>
            <div className="share-social-divider"></div>
            <button className="share-menu-item" onClick={() => handleSocialShare("twitter")}>
              <span className="material-icons">alt_route</span>
              <span>Twitter</span>
            </button>
            <button className="share-menu-item" onClick={() => handleSocialShare("whatsapp")}>
              <span className="material-icons">call</span>
              <span>WhatsApp</span>
            </button>
            <button className="share-menu-item" onClick={() => handleSocialShare("telegram")}>
              <span className="material-icons">send</span>
              <span>Telegram</span>
            </button>
            <button className="share-menu-item" onClick={() => handleSocialShare("reddit")}>
              <span className="material-icons">public</span>
              <span>Reddit</span>
            </button>
            <button className="share-menu-item" onClick={() => handleSocialShare("messenger")}>
              <span className="material-icons">chat</span>
              <span>Messenger</span>
            </button>
          </div>
        </>
      )}
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
