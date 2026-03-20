import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeLanguageProvider } from "./context/ThemeLanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AdminDataProvider } from "./context/AdminDataContext";
import Login from "./pages/Login";
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
import Followers from "./pages/account/Followers"; // Import Followers page
import Following from "./pages/account/Following"; // Import Following page
import LandingPage from "./pages/LandingPage"; // Import LandingPage

function App() {
  return (
    <ThemeLanguageProvider>
      <NotificationProvider>
      <AdminDataProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Home />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/home/suggested"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Home />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Upload />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Settings />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Notifications />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Search />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/posts/:id"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Post />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <UserProfile />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Account />
                </UserRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/followers"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Followers />
                </UserRoute>
              </ProtectedRoute>
            }
          >
            <Route path=":userId" element={<Followers />} />
          </Route>
          <Route
            path="/account/following"
            element={
              <ProtectedRoute>
                <UserRoute>
                  <Following />
                </UserRoute>
              </ProtectedRoute>
            }
          >
            <Route path=":userId" element={<Following />} />
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
            <Route path="users" element={<Users />} />
            <Route path="admins" element={<Admins />} />
            <Route path="banned-users" element={<BannedUsers />} />{" "}
            {/* New route for BannedUsers */}
            <Route path="tags" element={<Tags />} />
            <Route path="categories" element={<Categories />} />
            <Route path="review" element={<ToReview />} />
            <Route path="review/:contentId" element={<ToReview />} />
            <Route path="reports" element={<Reports />} />
            <Route path="reports/:reportId" element={<Reports />} />
            <Route path="reports/:reportId/preview" element={<ReportPostPreview />} />
            <Route path="settings" element={<Settings />} />
            <Route
              index
              element={<Navigate to="/admin/dashboard/users" replace />}
            />
          </Route>
        </Routes>
      </Router>
      </AdminDataProvider>
    </NotificationProvider>
    </ThemeLanguageProvider>
  );
}

export default App;
