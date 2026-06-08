import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

// Requires login — any role
export const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Requires specific role
export const RoleRoute = ({ role }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (!user)            return <Navigate to="/login"      replace />;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

// Redirect logged-in users away from login/register
export const GuestRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Outlet />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />;
  if (user.role === 'doctor')  return <Navigate to="/doctor/dashboard"  replace />;
  return <Navigate to="/patient/dashboard" replace />;
};
