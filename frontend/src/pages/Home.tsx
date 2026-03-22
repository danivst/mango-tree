import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useThemeLanguage } from "../context/ThemeLanguageContext";
import { getTranslation } from "../utils/translations";
import { getToken } from "../utils/auth";
import { postsAPI, Post } from "../services/api";
import PostCard from "../components/PostCard";
import UserSidebar from "../components/UserSidebar";
import "./admin/AdminPages.css";
import Snackbar from "../components/Snackbar";

const Home = () => {
  const { language } = useThemeLanguage();
  const navigate = useNavigate();

  // Memoize translations function
  const t = useCallback((key: string) => getTranslation(language, key), [language]);

  // Get current user ID from token (memoized)
  const currentUserId = useMemo(() => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch {
      return null;
    }
  }, []);

  // Feed state
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedPage, setFeedPage] = useState(0);
  const [activeSection, setActiveSection] = useState<'followed' | 'suggested'>(
    location.pathname === '/home/suggested' ? 'suggested' : 'followed'
  );
  const [hasFollowedPosts, setHasFollowedPosts] = useState(false);
  const initialActiveSectionRef = useRef<'followed' | 'suggested'>(activeSection);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: "success" | "error";
  }>({ open: false, message: "", type: "success" });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle search query changes
  useEffect(() => {
    console.log('[Home] Search effect - debouncedSearchQuery:', debouncedSearchQuery, 'searchQuery:', searchQuery);

    if (debouncedSearchQuery.trim() === "") {
      // Clear search results when query is empty
      console.log('[Home] Search query empty, clearing results');
      setSearchResults([]);
      setSearchHasMore(false);
      setSearchPage(0);
      setIsSearching(false);
      return;
    }

    // We have a search query, set searching to true
    console.log('[Home] Setting isSearching=true and fetching results');
    setIsSearching(true);

    // Reset and fetch new search results
    const fetchSearchResults = async () => {
      try {
        setSearchLoading(true);
        setSearchPage(0);
        const response = await postsAPI.searchPosts(debouncedSearchQuery, 20, 0);
        console.log('[Home] Search results received:', response.posts.length, 'posts');
        setSearchResults(response.posts);
        setSearchHasMore(response.hasMore);
      } catch (error: any) {
        console.error("[Home] Search failed:", error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || t("searchFailed") || "Search failed",
          type: "error",
        });
      } finally {
        setSearchLoading(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchQuery, t]);

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
      console.error("Failed to load followed posts:", error);
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
      console.error("Failed to load suggested posts:", error);
      setFeedPosts([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Load initial feed
  const loadInitialFeed = useCallback(async () => {
    console.log('[Home] loadInitialFeed: Starting initial feed load');
    setFeedLoading(true);
    try {
      const followedResponse = await postsAPI.getFollowedPosts(20, 0);
      console.log('[Home] loadInitialFeed: Got followed posts:', followedResponse.posts.length);

      setHasFollowedPosts(followedResponse.posts.length > 0);

      // Use the initial active section from ref to respect the route at mount time
      const initialSection = initialActiveSectionRef.current;
      if (initialSection === 'followed') {
        if (followedResponse.posts.length > 0) {
          setFeedPosts(followedResponse.posts);
          setFeedHasMore(followedResponse.hasMore);
          setActiveSection('followed');
          console.log('[Home] loadInitialFeed: Showing followed posts');
        } else {
          // No followed posts, switch to suggested
          setActiveSection('suggested');
          const suggestedResponse = await postsAPI.getSuggestedPosts(20, 0);
          console.log('[Home] loadInitialFeed: Got suggested posts (fallback):', suggestedResponse.posts.length);
          setFeedPosts(suggestedResponse.posts);
          setFeedHasMore(suggestedResponse.hasMore);
          console.log('[Home] loadInitialFeed: Showing suggested posts (fallback)');
        }
      } else {
        // initialSection === 'suggested'
        const suggestedResponse = await postsAPI.getSuggestedPosts(20, 0);
        console.log('[Home] loadInitialFeed: Got suggested posts:', suggestedResponse.posts.length);
        setFeedPosts(suggestedResponse.posts);
        setFeedHasMore(suggestedResponse.hasMore);
        console.log('[Home] loadInitialFeed: Showing suggested posts');
      }
      setFeedPage(0);
    } catch (error) {
      console.error("Failed to load initial feed:", error);
      setSnackbar({
        open: true,
        message: t("failedLoadFeed") || "Failed to load feed",
        type: "error",
      });
    } finally {
      setFeedLoading(false);
      console.log('[Home] loadInitialFeed: Finished');
    }
  }, [t]);

  // Load more feed posts
  const loadMoreFeed = useCallback(async () => {
    if (feedLoading || !feedHasMore || isSearching) return;

    try {
      setFeedLoading(true);
      const nextPage = feedPage + 1;
      const limit = 20;

      let newPosts: Post[] = [];

      if (activeSection === 'followed') {
        const response = await postsAPI.getFollowedPosts(limit, nextPage * limit);
        newPosts = response.posts;
        setFeedHasMore(response.hasMore);
      } else {
        const response = await postsAPI.getSuggestedPosts(limit, nextPage * limit);
        newPosts = response.posts;
        setFeedHasMore(response.hasMore);
      }

      // Deduplicate before adding
      setFeedPosts(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const uniqueNew = newPosts.filter(p => !existingIds.has(p._id));
        return [...prev, ...uniqueNew];
      });

      setFeedPage(nextPage);
    } catch (error) {
      console.error("Failed to load more posts:", error);
      setSnackbar({
        open: true,
        message: t("failedLoadMore") || "Failed to load more posts",
        type: "error",
      });
    } finally {
      setFeedLoading(false);
    }
  }, [feedPage, feedLoading, feedHasMore, isSearching, activeSection, t]);

  // Load more search results
  const loadMoreSearch = useCallback(async () => {
    if (searchLoading || !searchHasMore || !isSearching) return;

    try {
      setSearchLoading(true);
      const nextPage = searchPage + 1;
      const limit = 20;

      const response = await postsAPI.searchPosts(debouncedSearchQuery, limit, nextPage * limit);

      // Deduplicate
      setSearchResults(prev => {
        const existingIds = new Set(prev.map(p => p._id));
        const uniqueNew = response.posts.filter(p => !existingIds.has(p._id));
        return [...prev, ...uniqueNew];
      });

      setSearchHasMore(response.hasMore);
      setSearchPage(nextPage);
    } catch (error) {
      console.error("Failed to load more search results:", error);
      setSnackbar({
        open: true,
        message: t("failedLoadMore") || "Failed to load more results",
        type: "error",
      });
    } finally {
      setSearchLoading(false);
    }
  }, [searchPage, searchLoading, searchHasMore, isSearching, debouncedSearchQuery, t]);

  // Switch section handler
  const handleSectionSwitch = useCallback((section: 'followed' | 'suggested') => {
    if (section === activeSection) return;

    setActiveSection(section);
    setFeedPosts([]);
    setFeedPage(0);
    setFeedHasMore(true);

    // Navigate to update URL
    if (section === 'followed') {
      navigate('/home');
    } else {
      navigate('/home/suggested');
    }

    if (section === 'followed') {
      loadFollowedPosts();
    } else {
      loadSuggestedPosts();
    }
  }, [activeSection, loadFollowedPosts, loadSuggestedPosts, navigate]);

  // Load initial feed when user logs in
  useEffect(() => {
    console.log('[Home] useEffect for initial feed - currentUserId:', currentUserId, 'isSearching:', isSearching);
    if (currentUserId && !isSearching) {
      console.log('[Home] Calling loadInitialFeed');
      loadInitialFeed();
    }
  }, [currentUserId, isSearching, loadInitialFeed]);

  // Refs to hold latest values for observer callback
  const loadMoreFeedRef = useRef(loadMoreFeed);
  const loadMoreSearchRef = useRef(loadMoreSearch);
  const feedLoadingRef = useRef(feedLoading);
  const feedHasMoreRef = useRef(feedHasMore);
  const searchLoadingRef = useRef(searchLoading);
  const searchHasMoreRef = useRef(searchHasMore);
  const isSearchingRef = useRef(isSearching);

  // Update refs when state/function changes
  useEffect(() => { loadMoreFeedRef.current = loadMoreFeed; }, [loadMoreFeed]);
  useEffect(() => { loadMoreSearchRef.current = loadMoreSearch; }, [loadMoreSearch]);
  useEffect(() => { feedLoadingRef.current = feedLoading; }, [feedLoading]);
  useEffect(() => { feedHasMoreRef.current = feedHasMore; }, [feedHasMore]);
  useEffect(() => { searchLoadingRef.current = searchLoading; }, [searchLoading]);
  useEffect(() => { searchHasMoreRef.current = searchHasMore; }, [searchHasMore]);
  useEffect(() => { isSearchingRef.current = isSearching; }, [isSearching]);

  // Stable sentinel ref and observer
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (isSearchingRef.current) {
            if (!searchLoadingRef.current && searchHasMoreRef.current) {
              loadMoreSearchRef.current();
            }
          } else {
            if (!feedLoadingRef.current && feedHasMoreRef.current) {
              loadMoreFeedRef.current();
            }
          }
        }
      },
      { threshold: 1.0 }
    );

    observerRef.current.observe(node);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Run once on mount


  // Loading spinner
  const LoadingSpinner = () => (
    <div className="admin-loading" style={{ padding: "20px" }}>
      <span className="material-icons" style={{ animation: "spin 1s linear infinite", fontSize: "32px" }}>
        refresh
      </span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // No results component
  const NoResults = ({ message }: { message: string }) => (
    <div className="admin-loading" style={{ padding: "40px", textAlign: "center" }}>
      <span className="material-icons" style={{ fontSize: "48px", opacity: 0.5, marginBottom: "16px" }}>
        search_off
      </span>
      <p style={{ margin: 0, fontSize: "16px", color: "var(--theme-text)" }}>
        {message}
      </p>
    </div>
  );

  // Render search results
  if (isSearching) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <UserSidebar />
        <div className="admin-page" style={{ flex: 1 }}>
          <div className="admin-page-header">
            <h1 className="admin-page-title">
              {t("searchResults") || "Search Results"}
            </h1>
            <div className="admin-page-actions">
              <input
                type="text"
                className="admin-search-input"
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
            <NoResults message={t("noSearchResults") || "No posts found"} />
          ) : (
            <>
              <p style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8, marginBottom: "16px" }}>
                {t("foundPosts") || "Found posts"} {searchResults.length} {t("posts")}
              </p>
              <div className="admin-cards-grid">
                {searchResults.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
              {searchLoading && <LoadingSpinner />}
              {!searchLoading && searchHasMore && <div ref={sentinelRef} style={{ height: "20px" }} />}
              {!searchHasMore && searchResults.length > 0 && (
                <div className="admin-loading" style={{ padding: "20px" }}>
                  {t("noMorePosts") || "No more posts"}
                </div>
              )}
            </>
          )}

          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            open={snackbar.open}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          />
        </div>
      </div>
    );
  }

  // Render personalized feed
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <UserSidebar />
      <div className="admin-page" style={{ flex: 1 }}>
        <div className="admin-page-header">
          <h1 className="admin-page-title">{t("home") || "Home"}</h1>
          <div className="admin-page-actions">
            <input
              type="text"
              className="admin-search-input"
              placeholder={t("search") + "..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Section Tabs (only show if user has followed posts) */}
        {hasFollowedPosts && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginBottom: "24px",
              borderBottom: "2px solid var(--theme-text)",
              paddingBottom: "12px",
            }}
          >
            <button
              onClick={() => handleSectionSwitch('followed')}
              style={{
                padding: "10px 20px",
                border: activeSection === 'followed' ? "2px solid var(--theme-text)" : "none",
                borderRadius: "8px",
                background: activeSection === 'followed' ? "transparent" : "transparent",
                color: "var(--theme-text)",
                fontFamily: "Poppins, sans-serif",
                fontSize: "14px",
                fontWeight: activeSection === 'followed' ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: activeSection === 'followed' ? 1 : 0.6,
              }}
            >
              {t("postsFromFollowed") || "Posts from people you follow"}
            </button>
            <button
              onClick={() => handleSectionSwitch('suggested')}
              style={{
                padding: "10px 20px",
                border: activeSection === 'suggested' ? "2px solid var(--theme-text)" : "none",
                borderRadius: "8px",
                background: activeSection === 'suggested' ? "transparent" : "transparent",
                color: "var(--theme-text)",
                fontFamily: "Poppins, sans-serif",
                fontSize: "14px",
                fontWeight: activeSection === 'suggested' ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: activeSection === 'suggested' ? 1 : 0.6,
              }}
            >
              {t("suggestedForYou") || "Suggested for you"}
            </button>
          </div>
        )}

        {/* Feed Content */}
        {feedLoading && feedPosts.length === 0 ? (
          <LoadingSpinner />
        ) : feedPosts.length === 0 && !feedLoading ? (
          <NoResults
            message={
              hasFollowedPosts
                ? t("noSuggestedPosts") || "No suggested posts available"
                : t("noFollowedPosts") || "You're not following anyone yet. Follow users to see their posts here."
            }
          />
        ) : (
          <>
            {!hasFollowedPosts && (
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--theme-text)", marginBottom: "16px" }}>
                  {t("welcome") || "Welcome to MangoTree!"}
                </h2>
                <p style={{ fontSize: "14px", color: "var(--theme-text)", opacity: 0.8, lineHeight: 1.6 }}>
                  {t("welcomeMessage") || "Follow users to see their posts here, or browse suggested content below."}
                </p>
              </div>
            )}

            <div className="admin-cards-grid">
              {feedPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>

            {feedLoading && <LoadingSpinner />}
            {!feedLoading && feedHasMore && <div ref={sentinelRef} style={{ height: "20px" }} />}
            {!feedHasMore && feedPosts.length > 0 && (
              <div className="admin-loading" style={{ padding: "20px" }}>
                {t("noMorePosts") || "No more posts"}
              </div>
            )}
          </>
        )}

        <Snackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      </div>
    </div>
  );
};

export default Home;
