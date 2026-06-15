/**
 * Guards.jsx
 *
 * Legacy guard components kept for any external usage.
 * Primary guards are in AppRouter.jsx (PatientRoute / DoctorRoute / AdminRoute).
 *
 * All guards now use portal-specific hooks so each portal's session is
 * checked in complete isolation from the others.
 */
import { Navigate, Outlet } from 'react-router-dom';
import { usePatientAuth, useDoctorAuth, useAdminAuth, useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';

// Requires a patient session
export const PatientOnlyRoute = () => {
  const { user, loading } = usePatientAuth();
  if (loading) return <Spinner fullPage />;
  if (!user)                   return <Navigate to="/patient/login"  replace />;
  if (user.role !== 'patient') return <Navigate to="/unauthorized"   replace />;
  return <Outlet />;
};

// Requires a doctor session
export const DoctorOnlyRoute = () => {
  const { user, loading } = useDoctorAuth();
  if (loading) return <Spinner fullPage />;
  if (!user)                  return <Navigate to="/doctor/login"  replace />;
  if (user.role !== 'doctor') return <Navigate to="/unauthorized"  replace />;
  return <Outlet />;
};

// Requires an admin session
export const AdminOnlyRoute = () => {
  const { user, loading } = useAdminAuth();
  if (loading) return <Spinner fullPage />;
  if (!user)                 return <Navigate to="/admin/login"  replace />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
};

// Requires login in any role — checks session for current portal from URL
export const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  return user ? <Outlet /> : <Navigate to="/patient/login" replace />;
};

// Redirect logged-in users away from guest-only pages
// useAuth() auto-selects the correct portal's session from the current URL
export const GuestRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullPage />;
  if (!user) return <Outlet />;
  if (user.role === 'admin')  return <Navigate to="/admin/dashboard"  replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/patient/dashboard" replace />;
};
