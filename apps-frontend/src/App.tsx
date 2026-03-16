import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GlobalLoadingSpinner from './components/GlobalLoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import UserManagementPage from './features/users/UserManagementPage';
import DashboardPage from './features/dashboard/DashboardPage';
import { Role } from './types/role';
import './App.css';

// Placeholder components
const Profile = () => <div className="p-8">Profile Page (Protected)</div>;

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <GlobalLoadingSpinner />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[Role.Admin, Role.SuperAdmin]}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
