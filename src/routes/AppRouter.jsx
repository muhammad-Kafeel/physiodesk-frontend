import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, usePatientAuth, useDoctorAuth, useAdminAuth } from '../context/AuthContext';

// ── Auth pages ─────────────────────────────────────────────────────────────
import PatientLoginPage    from '../pages/auth/PatientLoginPage';
import DoctorLoginPage     from '../pages/auth/DoctorLoginPage';
import AdminLoginPage      from '../pages/auth/AdminLoginPage';
import RegisterChoicePage  from '../pages/auth/RegisterChoicePage';
import PatientRegisterPage from '../pages/auth/PatientRegisterPage';
import DoctorRegisterPage  from '../pages/auth/DoctorRegisterPage';
import ForgotPasswordPage  from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage   from '../pages/auth/ResetPasswordPage';
import EmailVerifiedPage   from '../pages/auth/EmailVerifiedPage';

// ── Public pages ────────────────────────────────────────────────────────────
import LandingPage   from '../pages/LandingPage';
import DoctorListing from '../pages/patient/DoctorListing';
import DoctorDetail  from '../pages/patient/DoctorDetail';
import BlogsPage     from '../pages/patient/BlogsPage';
import BlogDetail    from '../pages/patient/BlogDetail';
import PharmacyPage  from '../pages/patient/PharmacyPage';
import NotFound      from '../pages/NotFound';
import Unauthorized  from '../pages/Unauthorized';

// ── Patient pages ───────────────────────────────────────────────────────────
import PatientDashboard  from '../pages/patient/PatientDashboard';
import PatientProfile    from '../pages/patient/PatientProfile';
import BookAppointment   from '../pages/patient/BookAppointment';
import PaymentPage       from '../pages/patient/PaymentPage';
import MyAppointments    from '../pages/patient/MyAppointments';
import MyOrders          from '../pages/patient/MyOrders';
import MyPrescriptions   from '../pages/patient/MyPrescriptions';
import MedicalRecords    from '../pages/patient/MedicalRecords';
import ComplaintsPage    from '../pages/patient/ComplaintsPage';

// ── Doctor pages ────────────────────────────────────────────────────────────
import DoctorDashboard    from '../pages/doctor/DoctorDashboard';
import DoctorProfilePage  from '../pages/doctor/DoctorProfilePage';
import DoctorAppointments from '../pages/doctor/DoctorAppointments';
import WritePrescription  from '../pages/doctor/WritePrescription';
import DoctorBlogs        from '../pages/doctor/DoctorBlogs';

// ── Admin pages ─────────────────────────────────────────────────────────────
import AdminDashboard   from '../pages/admin/AdminDashboard';
import ManageUsers      from '../pages/admin/ManageUsers';
import ManageDoctors    from '../pages/admin/ManageDoctors';
import ManageMedicines  from '../pages/admin/ManageMedicines';
import ManageOrders     from '../pages/admin/ManageOrders';
import ManageComplaints from '../pages/admin/ManageComplaints';
import Transactions     from '../pages/admin/Transactions';

// ── Video call + Payment result ─────────────────────────────────────────────
import VideoCallPage    from '../pages/VideoCallPage';
import PaymentResultPage from '../pages/PaymentResultPage';

// ═══════════════════════════════════════════════════════════════════════════════
//  Route guards
// ═══════════════════════════════════════════════════════════════════════════════

function Spinner() {
  return <div className="pd-spinner" style={{ marginTop: 100 }} />;
}

/**
 * GuestRoute — blocks access if the user is already logged into THIS portal.
 *
 * With the new auth system, useAuth() (= usePortalAuth()) automatically
 * returns the correct portal's session based on the current URL.  No portal
 * prop is needed — a logged-in doctor visiting /patient/login gets the patient
 * session (which is empty) and sees the login form, exactly as intended.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    if (user.role === 'admin')  return <Navigate to="/admin/dashboard"   replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard"  replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }
  return children;
}

/**
 * PatientRoute — requires a valid patient session.
 * Reads from the PATIENT session only (usePatientAuth).
 * A doctor logged in on /doctor/* has NO session here → redirected to patient login.
 */
function PatientRoute({ children }) {
  const { user, loading } = usePatientAuth();
  if (loading) return <Spinner />;
  if (!user)                   return <Navigate to="/patient/login"  replace />;
  if (user.role !== 'patient') return <Navigate to="/unauthorized"   replace />;
  return children;
}

/**
 * DoctorRoute — requires a valid doctor session.
 * Reads from the DOCTOR session only (useDoctorAuth).
 * A patient logged in on /patient/* has NO session here → redirected to doctor login.
 */
function DoctorRoute({ children }) {
  const { user, loading } = useDoctorAuth();
  if (loading) return <Spinner />;
  if (!user)                  return <Navigate to="/doctor/login"  replace />;
  if (user.role !== 'doctor') return <Navigate to="/unauthorized"  replace />;
  return children;
}

/**
 * AdminRoute — requires a valid admin session.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAdminAuth();
  if (loading) return <Spinner />;
  if (!user)                 return <Navigate to="/admin/login"  replace />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return children;
}

/**
 * AnyAuthRoute — requires a valid session in EITHER patient OR doctor portal.
 * Used for shared routes like video calls.
 */
function AnyAuthRoute({ children }) {
  const { user: pUser, loading: pLoading } = usePatientAuth();
  const { user: dUser, loading: dLoading } = useDoctorAuth();

  if (pLoading || dLoading) return <Spinner />;
  if (!pUser && !dUser)     return <Navigate to="/patient/login" replace />;
  return children;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Router
// ═══════════════════════════════════════════════════════════════════════════════
export default function AppRouter() {
  return (
    <Routes>

      {/* ── Public ── */}
      <Route path="/"             element={<LandingPage />} />
      <Route path="/doctors"      element={<DoctorListing />} />
      <Route path="/doctors/:id"  element={<DoctorDetail />} />
      <Route path="/pharmacy"     element={<PharmacyPage />} />
      <Route path="/blogs"        element={<BlogsPage />} />
      <Route path="/blogs/:slug"  element={<BlogDetail />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Legacy /login → patient login */}
      <Route path="/login" element={<Navigate to="/patient/login" replace />} />

      {/* ── Patient auth ── */}
      <Route path="/patient/login"
        element={<GuestRoute><PatientLoginPage /></GuestRoute>} />

      {/* ── Doctor auth ── */}
      <Route path="/doctor/login"
        element={<GuestRoute><DoctorLoginPage /></GuestRoute>} />

      {/* ── Admin auth (not linked publicly) ── */}
      <Route path="/admin/login"
        element={<GuestRoute><AdminLoginPage /></GuestRoute>} />

      {/* ── Registration ── */}
      <Route path="/register"
        element={<GuestRoute><RegisterChoicePage /></GuestRoute>} />
      <Route path="/register/patient"
        element={<GuestRoute><PatientRegisterPage /></GuestRoute>} />
      <Route path="/register/doctor"
        element={<GuestRoute><DoctorRegisterPage /></GuestRoute>} />

      {/* ── Password reset (per portal) ── */}
      <Route path="/patient/forgot-password" element={<GuestRoute><ForgotPasswordPage role="patient" /></GuestRoute>} />
      <Route path="/doctor/forgot-password"  element={<GuestRoute><ForgotPasswordPage role="doctor" /></GuestRoute>} />
      <Route path="/admin/forgot-password"   element={<GuestRoute><ForgotPasswordPage role="admin" /></GuestRoute>} />
      <Route path="/patient/reset-password"  element={<ResetPasswordPage role="patient" />} />
      <Route path="/doctor/reset-password"   element={<ResetPasswordPage role="doctor" />} />
      <Route path="/admin/reset-password"    element={<ResetPasswordPage role="admin" />} />

      {/* ── Email verification result ── */}
      <Route path="/email-verified" element={<EmailVerifiedPage />} />

      {/* ── Video call — patient OR doctor ── */}
      <Route path="/video-call/:appointmentId"
        element={<AnyAuthRoute><VideoCallPage /></AnyAuthRoute>} />

      {/* ── Payment result (JazzCash redirect) ── */}
      <Route path="/payment/result" element={<PaymentResultPage />} />

      {/* ── Patient routes ── */}
      <Route path="/patient/dashboard"       element={<PatientRoute><PatientDashboard /></PatientRoute>} />
      <Route path="/patient/profile"         element={<PatientRoute><PatientProfile /></PatientRoute>} />
      <Route path="/patient/appointments"    element={<PatientRoute><MyAppointments /></PatientRoute>} />
      <Route path="/patient/orders"          element={<PatientRoute><MyOrders /></PatientRoute>} />
      <Route path="/patient/prescriptions"   element={<PatientRoute><MyPrescriptions /></PatientRoute>} />
      <Route path="/patient/medical-records" element={<PatientRoute><MedicalRecords /></PatientRoute>} />
      <Route path="/patient/complaints"      element={<PatientRoute><ComplaintsPage /></PatientRoute>} />
      <Route path="/book/:id"                element={<PatientRoute><BookAppointment /></PatientRoute>} />
      <Route path="/payment/appointment/:appointmentId"
        element={<PatientRoute><PaymentPage /></PatientRoute>} />

      {/* ── Doctor routes ── */}
      <Route path="/doctor/dashboard"
        element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
      <Route path="/doctor/profile"
        element={<DoctorRoute><DoctorProfilePage /></DoctorRoute>} />
      <Route path="/doctor/appointments"
        element={<DoctorRoute><DoctorAppointments /></DoctorRoute>} />
      <Route path="/doctor/write-prescription/:id"
        element={<DoctorRoute><WritePrescription /></DoctorRoute>} />
      <Route path="/doctor/blogs"
        element={<DoctorRoute><DoctorBlogs /></DoctorRoute>} />

      {/* ── Admin routes ── */}
      <Route path="/admin/dashboard"
        element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users"
        element={<AdminRoute><ManageUsers /></AdminRoute>} />
      <Route path="/admin/doctors"
        element={<AdminRoute><ManageDoctors /></AdminRoute>} />
      <Route path="/admin/medicines"
        element={<AdminRoute><ManageMedicines /></AdminRoute>} />
      <Route path="/admin/orders"
        element={<AdminRoute><ManageOrders /></AdminRoute>} />
      <Route path="/admin/complaints"
        element={<AdminRoute><ManageComplaints /></AdminRoute>} />
      <Route path="/admin/transactions"
        element={<AdminRoute><Transactions /></AdminRoute>} />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
