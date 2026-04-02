import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import GlobalLoadingSpinner from './components/GlobalLoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import UserManagementPage from './features/users/UserManagementPage';
import DashboardPage from './features/dashboard/DashboardPage';
import { Role } from './types/role';
import './App.css';

// Placeholder components
const Profile = () => <div className="p-8">Profile Page (Protected)</div>;

function App({ Router = BrowserRouter }: { Router?: React.ComponentType<{ children: React.ReactNode }> }) {
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
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={[Role.Admin, Role.SuperAdmin]}>
              <Layout>
                <UserManagementPage />
              </Layout>
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
