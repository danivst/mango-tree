import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeLanguageProvider } from "./context/ThemeLanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AdminDataProvider } from "./context/AdminDataContext";
import { useRefresh } from "./context/RefreshContext";
import Login from "./pages/Login/Login";
import ResetPassword from "./pages/ResetPassword";
import SetupPassword from "./pages/SetupPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AdminRoute from "./components/AdminRoute";
import UserRoute from "./components/UserRoute";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/admin/Users";
import Admins from "./pages/admin/Admins"; // Import Admins page
import Tags from "./pages/admin/Tags";
import Categories from "./pages/admin/Categories";
import ToReview from "./pages/admin/ToReview";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/Settings";
import Home from "./pages/Home";
import BannedUsers from "./pages/admin/BannedUsers"; // Import BannedUsers
import Upload from "./pages/Upload"; // Import Upload
import Notifications from "./pages/Notifications"; // Import Notifications
import Post from "./pages/Post"; // Import Post
import ReportPostPreview from "./pages/admin/ReportPostPreview"; // Import ReportPostPreview
import Search from "./pages/Search"; // Import user-facing Search page
import UserProfile from "./pages/UserProfile"; // Import UserProfile page
import Account from "./pages/Account"; // Import Account page
import ActivityLog from "./pages/admin/ActivityLog"; // Import ActivityLog page
import Followers from "./pages/account/Followers"; // Import Followers page
import Following from "./pages/account/Following"; // Import Following page
import LandingPage from "./pages/LandingPage"; // Import LandingPage
import NotFound from "./pages/NotFound"; // Import 404 page

function App() {
  const { refreshTrigger } = useRefresh();

  return (
    <ThemeLanguageProvider>
      <NotificationProvider>
      <AdminDataProvider>
      <Router>
        <Routes>
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
          <Route path="/reset-password" element={<ResetPassword key={refreshTrigger} />} />
          <Route path="/setup-password" element={<SetupPassword key={refreshTrigger} />} />
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
            <Route path=":userId" element={<Followers key={refreshTrigger} />} />
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
            <Route path=":userId" element={<Following key={refreshTrigger} />} />
          </Route>
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
            <Route path="users" element={<Users key={refreshTrigger} />} />
            <Route path="admins" element={<Admins key={refreshTrigger} />} />
            <Route path="banned-users" element={<BannedUsers key={refreshTrigger} />} />{" "}
            {/* New route for BannedUsers */}
            <Route path="tags" element={<Tags key={refreshTrigger} />} />
            <Route path="categories" element={<Categories key={refreshTrigger} />} />
            <Route path="review" element={<ToReview key={refreshTrigger} />} />
            <Route path="review/:contentId" element={<ToReview key={refreshTrigger} />} />
            <Route path="reports" element={<Reports key={refreshTrigger} />} />
            <Route path="reports/:reportId" element={<Reports key={refreshTrigger} />} />
            <Route path="reports/:reportId/preview" element={<ReportPostPreview key={refreshTrigger} />} />
            <Route path="settings" element={<Settings key={refreshTrigger} />} />
            <Route path="logs" element={<ActivityLog key={refreshTrigger} />} />
            <Route
              index
              element={<Navigate to="/admin/dashboard/users" replace />}
            />
          </Route>
          {/* 404 catch-all route - redirect to login if not authenticated */}
          <Route path="*" element={<ProtectedRoute key={refreshTrigger}><NotFound /></ProtectedRoute>} />
        </Routes>
      </Router>
      </AdminDataProvider>
    </NotificationProvider>
    </ThemeLanguageProvider>
  );
}

export default App;
