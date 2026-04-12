/**
 * @file App.tsx
 * @description Main application entry point and root routing configuration.
 * Orchestrates the application's React Router hierarchy, global Context Providers
 * (Theme, Notifications, Admin Data), and route-level access control (Public,
 * Protected, Admin, and User routes).
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { ThemeLanguageProvider } from "./context/ThemeLanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AdminDataProvider } from "./context/AdminDataContext";
import { useRefresh } from "./context/RefreshContext";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import PublicRoute from "./components/routes/PublicRoute";
import AdminRoute from "./components/admin/route/AdminRoute";
import UserRoute from "./components/user/route/UserRoute";
import ErrorBoundary from "./components/global/ErrorBoundary";

// Defined routes with lazy loading for code-splitting and performance optimization
// Public / Login
const Login = lazy(() => import("./pages/login/Login"));
const ResetPassword = lazy(
  () => import("./pages/login/password/reset/ResetPassword"),
);
const SetupPassword = lazy(
  () => import("./pages/login/password/setup/SetupPassword"),
);
const LandingPage = lazy(
  () => import("./pages/global/landing-page/LandingPage"),
);

// User Pages
const Home = lazy(() => import("./pages/user/home/Home"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const Upload = lazy(() => import("./pages/user/upload/Upload"));
const Notifications = lazy(
  () => import("./pages/user/notifications/Notifications"),
);
const Post = lazy(() => import("./pages/post/Post"));
const Search = lazy(() => import("./pages/user/search/Search"));
const UserProfile = lazy(() => import("./pages/user/profile/UserProfile"));
const Account = lazy(() => import("./pages/user/account/Account"));
const Followers = lazy(
  () => import("./pages/user/account/followers/Followers"),
);
const Following = lazy(
  () => import("./pages/user/account/following/Following"),
);

// Admin Pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Users = lazy(() => import("./pages/admin/users/Users"));
const Admins = lazy(() => import("./pages/admin/admins/Admins"));
const Tags = lazy(() => import("./pages/admin/tags/Tags"));
const Categories = lazy(() => import("./pages/admin/categories/Categories"));
const ToReview = lazy(() => import("./pages/admin/reviews/ToReview"));
const Reports = lazy(() => import("./pages/admin/reports/Reports"));
const ReportPostPreview = lazy(
  () => import("./pages/admin/reports/ReportPostPreview"),
);
const BannedUsers = lazy(
  () => import("./pages/admin/banned-users/BannedUsers"),
);
const ActivityLog = lazy(() => import("./pages/admin/logs/ActivityLog"));

// Global
const NotFound = lazy(() => import("./pages/global/not-found/NotFound"));

function App() {
  const { refreshTrigger } = useRefresh();

  return (
    <ErrorBoundary>
      <ThemeLanguageProvider>
        <NotificationProvider>
          <AdminDataProvider>
            <Router>
              {/* Suspense fallback prevents the app from crashing while loading chunks */}
              <Suspense
                fallback={<div className="loading-screen">Loading...</div>}
              >
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route
                    path="/"
                    element={
                      <PublicRoute key={refreshTrigger}>
                        <LandingPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <PublicRoute key={refreshTrigger}>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/signin"
                    element={
                      <PublicRoute key={refreshTrigger}>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPassword key={refreshTrigger} />}
                  />
                  <Route
                    path="/setup-password"
                    element={<SetupPassword key={refreshTrigger} />}
                  />

                  {/* USER ROUTES */}
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Home />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/home/suggested"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Home />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Upload />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Settings />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Notifications />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Search />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/posts/:id"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Post />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/users/:id"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <UserProfile />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Account />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  />

                  {/* Nested User Routes */}
                  <Route
                    path="/account/followers"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Followers />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path=":userId"
                      element={<Followers key={refreshTrigger} />}
                    />
                  </Route>

                  <Route
                    path="/account/following"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <UserRoute>
                          <Following />
                        </UserRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path=":userId"
                      element={<Following key={refreshTrigger} />}
                    />
                  </Route>

                  {/* ADMIN DASHBOARD (Nested) */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminRoute>
                          <Dashboard />
                        </AdminRoute>
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="users"
                      element={<Users key={refreshTrigger} />}
                    />
                    <Route
                      path="admins"
                      element={<Admins key={refreshTrigger} />}
                    />
                    <Route
                      path="banned-users"
                      element={<BannedUsers key={refreshTrigger} />}
                    />
                    <Route
                      path="tags"
                      element={<Tags key={refreshTrigger} />}
                    />
                    <Route
                      path="categories"
                      element={<Categories key={refreshTrigger} />}
                    />
                    <Route
                      path="review"
                      element={<ToReview key={refreshTrigger} />}
                    />
                    <Route
                      path="review/:contentId"
                      element={<ToReview key={refreshTrigger} />}
                    />
                    <Route
                      path="reports"
                      element={<Reports key={refreshTrigger} />}
                    />
                    <Route
                      path="reports/:reportId"
                      element={<Reports key={refreshTrigger} />}
                    />
                    <Route
                      path="reports/:reportId/preview"
                      element={<ReportPostPreview key={refreshTrigger} />}
                    />
                    <Route
                      path="settings"
                      element={<Settings key={refreshTrigger} />}
                    />
                    <Route
                      path="logs"
                      element={<ActivityLog key={refreshTrigger} />}
                    />
                    <Route
                      index
                      element={<Navigate to="/admin/dashboard/users" replace />}
                    />
                  </Route>

                  {/* 404 CATCH-ALL */}
                  <Route
                    path="*"
                    element={
                      <ProtectedRoute key={refreshTrigger}>
                        <NotFound />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </Router>
          </AdminDataProvider>
        </NotificationProvider>
      </ThemeLanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
