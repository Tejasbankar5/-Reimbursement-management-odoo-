import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLogin, UserLogin } from './pages/Login';
import Signup from './pages/Signup';
import DashboardRouter from './pages/DashboardRouter';
import LandingPage from './pages/LandingPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function AppConfig() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — always accessible */}
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

        {/* Two separate login portals */}
        <Route path="/login/admin" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/login/user"  element={<PublicRoute><UserLogin /></PublicRoute>} />
        <Route path="/login"       element={<Navigate to="/login/user" replace />} />

        {/* Signup */}
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected dashboard — all sub-routes handled inside DashboardRouter */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />
        {/* Catch-all: if logged in go to dashboard, else go to landing */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppConfig />
    </AuthProvider>
  );
}

export default App;
