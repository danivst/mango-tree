/**
 * @file Home.tsx
 * @description Main feed page for authenticated users. 
 * Orchestrates dual-mode content delivery ("Followed" vs "Suggested"), 
 * real-time feed searching with debouncing, and infinite pagination.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../../../context/ThemeLanguageContext";
import { getTranslation } from "../../../utils/translations";
import { getCurrentUserId } from "../../../utils/auth";
import { postsAPI, Post } from "../../../services/api";
import PostCard from "../../../components/post/PostCard";
import UserSidebar from "../../../components/user/sidebar/UserSidebar";
import "../../../styles/shared.css";
import "./Home.css";
import Snackbar from "../../../components/snackbar/Snackbar";
import Footer from "../../../components/global/Footer";
import { useSnackbar } from "../../../utils/snackbar";

// MUI Icon Imports
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchOffIcon from '@mui/icons-material/SearchOff';

/**
 * @component Home
 * @description Main feed page showing posts from followed users and suggested posts.
 * Dual-mode feed: "Followed" (from users you follow) and "Suggested" (popular/recommended).
 * Supports infinite scroll, search within feed, and real-time post translation.
 *
 * Features:
 * - Tab switching between Followed and Suggested feeds
 * - Infinite scroll pagination (20 posts per page)
 * - Search posts within current feed
 * - Post translation toggle (via PostCard component)
 * - Empty state handling
 * - Error handling with snackbar
 * - Auto-refresh on route changes
 *
 * Route: /home and /home/suggested
 * Access: Authenticated users only
 * URL Params: ?search=... for initial search query
 *
 * @page
 * @requires useNavigate - Programmatic navigation
 * @requires useThemeLanguage - Language detection for translation
 * @requires postsAPI - Feed fetching, search, translation
 * @requires PostCard - Post preview component
 * @requires UserSidebar - Navigation sidebar
 * @returns {JSX.Element} The rendered Home feed component
 */
const Home = () => {
  const { language } = useThemeLanguage();
  const navigate = useNavigate();

  // Memoize translations function
  const t = useCallback(
    (key: string) => getTranslation(language, key),
    [language],
  );

  // Get current user ID from token
  const currentUserId = getCurrentUserId();

  // Feed state
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedPage, setFeedPage] = useState(0);
  const [activeSection, setActiveSection] = useState<"followed" | "suggested">(
    location.pathname === "/home/suggested" ? "suggested" : "followed",
  );
  const [hasFollowedPosts, setHasFollowedPosts] = useState(false);
  const initialActiveSectionRef = useRef<"followed" | "suggested">(
    activeSection,
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Snackbar
  const { snackbar, showError, closeSnackbar } = useSnackbar();

  // Debounce search input (500ms for better performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() === "") {
      // Clear search results when query is empty
      setSearchResults([]);
      setSearchHasMore(false);
      setSearchPage(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const fetchSearchResults = async () => {
      try {
        setSearchLoading(true);
        setSearchPage(0);
        const response = await postsAPI.searchPosts(
          debouncedSearchQuery,
          20,
          0,
        );
        setSearchResults(response.posts);
        setSearchHasMore(response.hasMore);
      } catch (error: any) {
        if (import.meta.env.DEV) {
          console.error("Search failed:", error);
        }
        showError(t("searchFailed"));
      } finally {
        setSearchLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchQuery, t, showError]);

  // Load followed posts
  const loadFollowedPosts = useCallback(async () => {
    try {
      setFeedLoading(true);
      const response = await postsAPI.getFollowedPosts(20, 0);
      setFeedPosts(response.posts);
      setFeedHasMore(response.hasMore);
      setHasFollowedPosts(response.posts.length > 0);
      setFeedPage(0);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load followed posts:", error);
      }
      setFeedPosts([]);
      setHasFollowedPosts(false);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Load suggested posts
  const loadSuggestedPosts = useCallback(async () => {
    try {
      setFeedLoading(true);
      const response = await postsAPI.getSuggestedPosts(20, 0);
      setFeedPosts(response.posts);
      setFeedHasMore(response.hasMore);
      setFeedPage(0);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load suggested posts:", error);
      }
      setFeedPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Load initial feed
  const loadInitialFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const followedResponse = await postsAPI.getFollowedPosts(20, 0);
      setHasFollowedPosts(followedResponse.posts.length > 0);

      const initialSection = initialActiveSectionRef.current;
      if (initialSection === "followed") {
        if (followedResponse.posts.length > 0) {
          setFeedPosts(followedResponse.posts);
          setFeedHasMore(followedResponse.hasMore);
          setActiveSection("followed");
        } else {
          setActiveSection("suggested");
          const suggestedResponse = await postsAPI.getSuggestedPosts(20, 0);
          setFeedPosts(suggestedResponse.posts);
          setFeedHasMore(suggestedResponse.hasMore);
        }
      } else {
        const suggestedResponse = await postsAPI.getSuggestedPosts(20, 0);
        setFeedPosts(suggestedResponse.posts);
        setFeedHasMore(suggestedResponse.hasMore);
      }
      setFeedPage(0);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load initial feed:", error);
      }
      showError(t("failedLoadFeed"));
    } finally {
      setFeedLoading(false);
    }
  }, [t, showError]);

  // Load more feed posts
  const loadMoreFeed = useCallback(async () => {
    if (feedLoading || !feedHasMore || isSearching) return;

    try {
      setFeedLoading(true);
      const nextPage = feedPage + 1;
      const limit = 20;

      let newPosts: Post[] = [];

      if (activeSection === "followed") {
        const response = await postsAPI.getFollowedPosts(
          limit,
          nextPage * limit,
        );
        newPosts = response.posts;
        setFeedHasMore(response.hasMore);
      } else {
        const response = await postsAPI.getSuggestedPosts(
          limit,
          nextPage * limit,
        );
        newPosts = response.posts;
        setFeedHasMore(response.hasMore);
      }

      setFeedPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const uniqueNew = newPosts.filter((p) => !existingIds.has(p._id));
        return [...prev, ...uniqueNew];
      });

      setFeedPage(nextPage);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load more feed posts:", error);
      }
      showError(t("failedLoadMore"));
    } finally {
      setFeedLoading(false);
    }
  }, [feedPage, feedLoading, feedHasMore, isSearching, activeSection, t, showError]);

  // Load more search results
  const loadMoreSearch = useCallback(async () => {
    if (searchLoading || !searchHasMore || !isSearching) return;

    try {
      setSearchLoading(true);
      const nextPage = searchPage + 1;
      const limit = 20;

      const response = await postsAPI.searchPosts(
        debouncedSearchQuery,
        limit,
        nextPage * limit,
      );

      setSearchResults((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const uniqueNew = response.posts.filter((p) => !existingIds.has(p._id));
        return [...prev, ...uniqueNew];
      });

      setSearchHasMore(response.hasMore);
      setSearchPage(nextPage);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load more search results:", error);
      }
      showError(t("failedLoadMore"));
    } finally {
      setSearchLoading(false);
    }
  }, [
    searchPage,
    searchLoading,
    searchHasMore,
    isSearching,
    debouncedSearchQuery,
    t,
    showError,
  ]);

  // Switch section handler
  const handleSectionSwitch = useCallback(
    (section: "followed" | "suggested") => {
      if (section === activeSection) return;

      setActiveSection(section);
      setFeedPosts([]);
      setFeedPage(0);
      setFeedHasMore(true);

      if (section === "followed") {
        navigate("/home");
        loadFollowedPosts();
      } else {
        navigate("/home/suggested");
        loadSuggestedPosts();
      }
    },
    [activeSection, loadFollowedPosts, loadSuggestedPosts, navigate],
  );

  useEffect(() => {
    if (currentUserId && !isSearching) {
      loadInitialFeed();
    }
  }, [currentUserId, isSearching, loadInitialFeed]);

  // Loading spinner sub-component
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <RefreshIcon className="spin" sx={{ fontSize: 32 }} />
    </div>
  );

  // No results sub-component
  const NoResults = ({ message }: { message: string }) => (
    <div className="no-results">
      <SearchOffIcon sx={{ fontSize: 48, opacity: 0.5 }} />
      <p className="no-results-message">{message}</p>
    </div>
  );

  // Search Mode View
  if (isSearching) {
    return (
      <div className="home-container">
        <UserSidebar />
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">{t("searchResults")}</h1>
            <div className="page-actions">
              <input
                type="text"
                className="search-input"
                placeholder={t("search") + "..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {searchLoading && searchResults.length === 0 ? (
            <LoadingSpinner />
          ) : searchResults.length === 0 ? (
            <NoResults message={t("noSearchResults")} />
          ) : (
            <>
              <p className="search-results-count">
                {t("foundPosts")} {searchResults.length} {t("posts")}
              </p>
              <div className="cards-grid">
                {searchResults.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
              {searchLoading && searchResults.length > 0 && <LoadingSpinner />}
              {!searchLoading && searchHasMore && (
                <button
                  className="load-more-button"
                  onClick={loadMoreSearch}
                  disabled={searchLoading}
                >
                  {t("loadMore")}
                </button>
              )}
              {!searchHasMore && searchResults.length > 0 && (
                <div className="no-more-posts">{t("noMorePosts")}</div>
              )}
            </>
          )}

          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            open={snackbar.open}
            onClose={closeSnackbar}
          />
          <Footer />
        </div>
      </div>
    );
  }

  // Personalized Feed View
  return (
    <div className="home-container">
      <UserSidebar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t("home")}</h1>
          <div className="page-actions">
            <input
              type="text"
              className="search-input"
              placeholder={t("search") + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {hasFollowedPosts && (
          <div className="feed-tabs">
            <button
              onClick={() => handleSectionSwitch("followed")}
              className={`tab-button ${activeSection === "followed" ? "active" : ""}`}
            >
              {t("postsFromFollowed")}
            </button>
            <button
              onClick={() => handleSectionSwitch("suggested")}
              className={`tab-button ${activeSection === "suggested" ? "active" : ""}`}
            >
              {t("suggestedForYou")}
            </button>
          </div>
        )}

        {feedLoading && feedPosts.length === 0 ? (
          <LoadingSpinner />
        ) : feedPosts.length === 0 && !feedLoading ? (
          <NoResults
            message={
              hasFollowedPosts ? t("noSuggestedPosts") : t("noFollowedPosts")
            }
          />
        ) : (
          <>
            {!hasFollowedPosts && (
              <div className="welcome-section">
                <h2 className="welcome-title">{t("welcome")}</h2>
                <p className="welcome-text">{t("welcomeMessage")}</p>
              </div>
            )}

            <div className="cards-grid">
              {feedPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>

            {feedLoading && feedPosts.length > 0 && <LoadingSpinner />}
            {!feedLoading && feedHasMore && (
              <button
                className="load-more-button"
                onClick={loadMoreFeed}
                disabled={feedLoading}
              >
                {t("loadMore")}
              </button>
            )}
            {!feedHasMore && feedPosts.length > 0 && (
              <div className="no-more-posts">{t("noMorePosts")}</div>
            )}
          </>
        )}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={closeSnackbar}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Home;