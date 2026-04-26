/**
 * @file ReportPostPreview.tsx
 * @description Admin detailed view of a reported post, comment or user. 
 * Orchestrates data fetching and renders specific sub-views based on report type.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { adminAPI, Report, Category } from "../../../services/admin-api";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation, Language } from "../../../utils/translations";
import { postsAPI, usersAPI, UserProfile, Comment, Post as PostType } from "../../../services/api";
import api from "../../../services/api";
import { useSnackbar } from "../../../utils/snackbar";

import Snackbar from "../../../components/snackbar/Snackbar";
import Footer from "../../../components/global/Footer";
import GoBackButton from "../../../components/buttons/back/GoBackButton";
import ReportPostView from "./ReportView";
import ReportCommentView from "./ReportCommentView";
import ReportUserProfileView from "./ReportUserProfileView";

import "../../../styles/shared.css";
import "../../post/Post.css";
import "./ReportPostPreview.css";

const ReportPostPreview = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const { language } = useThemeLanguage();
  const t = (key: string) => getTranslation(language, key);
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  const [report, setReport] = useState<Report | null>(null);
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedUserCategoryId, setSelectedUserCategoryId] = useState<string | null>(null);

  const [showTranslation, setShowTranslation] = useState(false);
  const [translationCache, setTranslationCache] = useState<any>(null);
  const [translating, setTranslating] = useState(false);
  const [commentShowTranslation, setCommentShowTranslation] = useState(false);
  const [commentTranslationCache, setCommentTranslationCache] = useState<string | null>(null);
  const [commentTranslating, setCommentTranslating] = useState(false);

  useEffect(() => {
    if (reportId) fetchReportAndData();
  }, [reportId]);

  const fetchReportAndData = async () => {
    if (!reportId) return;
    try {
      const reports = await adminAPI.getReports();
      const currentReport = reports.find((r) => r._id === reportId);
      if (!currentReport) {
        showError(t("somethingWentWrong"));
        return;
      }
      setReport(currentReport);

      if (currentReport.targetType === "post") {
        const postData = await postsAPI.getPost(currentReport.targetId);
        setPost(postData);
      } else if (currentReport.targetType === "comment") {
        const commentData = await postsAPI.getComment(currentReport.targetId);
        setComments([commentData]);
      } else if (currentReport.targetType === "user") {
        const userData = await usersAPI.getUser(currentReport.targetId);
        setUser(userData);
        const postsResponse = await api.get<PostType[]>(`/posts/author/${currentReport.targetId}`);
        setUserPosts(postsResponse.data);
        const categoriesResponse = await api.get<Category[]>("/categories");
        setUserCategories(categoriesResponse.data);
      }
    } catch (error) {
      showError(t("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const detectLanguage = (text: string): "en" | "bg" => (/[а-яА-Я]/.test(text || "") ? "bg" : "en");

  const getCategoryDisplayName = (categoryName: string) => {
    const displayLang: Language = report?.targetType === "user" && user?.language === "bg" ? "bg" : language;
    const translated = getTranslation(displayLang, categoryName.toLowerCase());
    return translated !== categoryName.toLowerCase() ? translated : categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  };

  const handleTranslatePost = async () => {
    if (!post) return;
    if (showTranslation) { setShowTranslation(false); return; }
    if (translationCache || post.translations?.title?.[language]) {
      setTranslationCache(translationCache || {
        title: post.translations?.title?.[language],
        content: post.translations?.content?.[language],
        tags: post.translations?.tags?.[language],
      });
      setShowTranslation(true);
      return;
    }
    setTranslating(true);
    try {
      const response = await postsAPI.translatePost(post._id, language);
      setTranslationCache(response);
      setShowTranslation(true);
    } catch { showError(t("somethingWentWrong")); }
    finally { setTranslating(false); }
  };

  const handleTranslateComment = async (id: string) => {
    if (commentShowTranslation) { setCommentShowTranslation(false); return; }
    if (commentTranslationCache || comments[0]?.translations?.[language]) {
      setCommentTranslationCache(commentTranslationCache || comments[0].translations![language]);
      setCommentShowTranslation(true);
      return;
    }
    setCommentTranslating(true);
    try {
      const response = await postsAPI.translateComment(id, language);
      setCommentTranslationCache(response.text);
      setCommentShowTranslation(true);
    } catch { showError(t("somethingWentWrong")); }
    finally { setCommentTranslating(false); }
  };

  const specialCategories = useMemo(() => {
    const order = ["recipe", "question", "flex"];
    return userCategories
      .filter((cat) => order.includes(cat.name.toLowerCase()))
      .sort((a, b) => order.indexOf(a.name.toLowerCase()) - order.indexOf(b.name.toLowerCase()));
  }, [userCategories]);

  const filteredPosts = useMemo(() => {
    return selectedUserCategoryId ? userPosts.filter((p) => p.category?._id === selectedUserCategoryId) : userPosts;
  }, [userPosts, selectedUserCategoryId]);

  if (loading) return <div><div className="section-spacing"><GoBackButton /></div><div className="loading">{t("loading")}</div></div>;
  if (!report) return <div><div className="section-spacing"><GoBackButton /></div><div className="loading">{t("somethingWentWrong")}</div></div>;

  return (
    <div>
      <div className="mb-24"><GoBackButton /></div>
      {report.targetType === "post" && post && (
        <ReportPostView 
          post={post} language={language} t={t} showTranslation={showTranslation} translating={translating}
          translationCache={translationCache} currentImageIndex={currentImageIndex} onTranslate={handleTranslatePost}
          detectLanguage={detectLanguage} onSetImageIndex={setCurrentImageIndex} getCategoryDisplayName={getCategoryDisplayName}
          onNextImage={() => setCurrentImageIndex((p) => (p + 1) % post.image.length)}
          onPrevImage={() => setCurrentImageIndex((p) => (p - 1 + post.image.length) % post.image.length)}
        />
      )}
      {report.targetType === "comment" && comments[0] && (
        <ReportCommentView 
          comment={comments[0]} language={language} t={t} commentShowTranslation={commentShowTranslation}
          commentTranslating={commentTranslating} commentTranslationCache={commentTranslationCache}
          onTranslateComment={handleTranslateComment} detectLanguage={detectLanguage}
        />
      )}
      {report.targetType === "user" && user && (
        <ReportUserProfileView 
          user={user} userPosts={userPosts} filteredPosts={filteredPosts} specialCategories={specialCategories}
          selectedUserCategoryId={selectedUserCategoryId} language={language} onSelectCategory={setSelectedUserCategoryId}
          getCategoryDisplayName={getCategoryDisplayName} t={t}
        />
      )}
      <Snackbar message={snackbar.message} type={snackbar.type} open={snackbar.open} onClose={closeSnackbar} />
      <Footer />
    </div>
  );
};

export default ReportPostPreview;