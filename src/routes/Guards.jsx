/**
 * Guards.jsx
 *
 * These guard components are retained for any legacy usage across the codebase,
 * but the primary routing guards are now defined inline in AppRouter.jsx using
 * portal-aware PatientRoute / DoctorRoute / AdminRoute components.
 *
 * All guards read from AuthContext which uses pd_token / pd_user / pd_portal.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

// Requires login — any role
export const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  return user ? <Outlet /> : <Navigate to="/patient/login" replace />;
};

// Requires a specific role — redirects to the role's own login page on failure
export const RoleRoute = ({ role }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;

  const loginPaths = { patient: '/patient/login', doctor: '/doctor/login', admin: '/admin/login' };
  if (!user)            return <Navigate to={loginPaths[role] ?? '/patient/login'} replace />;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

// Redirect logged-in users away from guest-only pages
export const GuestRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Outlet />;
  if (user.role === 'admin')  return <Navigate to="/admin/dashboard"  replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
};
