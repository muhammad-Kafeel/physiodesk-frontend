import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Auth pages ─────────────────────────────────────────────────────────────
import PatientLoginPage    from '../pages/auth/PatientLoginPage';
import DoctorLoginPage     from '../pages/auth/DoctorLoginPage';
import AdminLoginPage      from '../pages/auth/AdminLoginPage';
import RegisterChoicePage  from '../pages/auth/RegisterChoicePage';
import PatientRegisterPage from '../pages/auth/PatientRegisterPage';
import DoctorRegisterPage  from '../pages/auth/DoctorRegisterPage';

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

// ── Video call ──────────────────────────────────────────────────────────────
import VideoCallPage from '../pages/VideoCallPage';

// ═══════════════════════════════════════════════════════════════════════════════
//  Route guards
// ═══════════════════════════════════════════════════════════════════════════════

function Spinner() {
  return <div className="pd-spinner" style={{ marginTop: 100 }} />;
}

/**
 * GuestRoute  —  blocks access if the user is already authenticated.
 * Redirects them to their own portal's dashboard, not a generic home.
 * `portal` prop restricts which logged-in role gets redirected away.
 * e.g. a logged-in PATIENT visiting /doctor/login should NOT be redirected.
 */
function GuestRoute({ children, portal = null }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;

  if (user) {
    // If a portal restriction is set, only redirect the matching role
    if (portal && user.role !== portal) return children;
    // Redirect to the correct dashboard
    if (user.role === 'admin')  return <Navigate to="/admin/dashboard"   replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard"  replace />;
    return <Navigate to="/patient/dashboard" replace />;
  }

  return children;
}

/**
 * PatientRoute  —  requires auth AND role=patient.
 * A doctor's token gets a 403 from the API anyway, but we also block the UI.
 */
function PatientRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)               return <Navigate to="/patient/login"  replace />;
  if (user.role !== 'patient') return <Navigate to="/unauthorized" replace />;
  return children;
}

/**
 * DoctorRoute  —  requires auth AND role=doctor.
 */
function DoctorRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)              return <Navigate to="/doctor/login"   replace />;
  if (user.role !== 'doctor') return <Navigate to="/unauthorized" replace />;
  return children;
}

/**
 * AdminRoute  —  requires auth AND role=admin.
 */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)             return <Navigate to="/admin/login"    replace />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />;
  return children;
}

/**
 * AnyAuthRoute  —  requires login (any valid role).
 * Used for routes like video calls that both doctor and patient access.
 * Redirects unauthenticated users to the patient login (most common entry).
 */
function AnyAuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/patient/login" replace />;
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

      {/* ── Legacy /login redirect → patient login ─────────────────────────
          Old bookmarks / emails pointing to /login land on the patient portal.
          Doctors and admins use /doctor/login and /admin/login.
      ── */}
      <Route path="/login" element={<Navigate to="/patient/login" replace />} />

      {/* ── Patient auth ── */}
      <Route path="/patient/login"
        element={<GuestRoute portal="patient"><PatientLoginPage /></GuestRoute>} />

      {/* ── Doctor auth ── */}
      <Route path="/doctor/login"
        element={<GuestRoute portal="doctor"><DoctorLoginPage /></GuestRoute>} />

      {/* ── Admin auth (not linked publicly) ── */}
      <Route path="/admin/login"
        element={<GuestRoute portal="admin"><AdminLoginPage /></GuestRoute>} />

      {/* ── Registration ── */}
      <Route path="/register"
        element={<GuestRoute><RegisterChoicePage /></GuestRoute>} />
      <Route path="/register/patient"
        element={<GuestRoute portal="patient"><PatientRegisterPage /></GuestRoute>} />
      <Route path="/register/doctor"
        element={<GuestRoute portal="doctor"><DoctorRegisterPage /></GuestRoute>} />

      {/* ── Video call — any authenticated role ── */}
      <Route path="/video-call/:appointmentId"
        element={<AnyAuthRoute><VideoCallPage /></AnyAuthRoute>} />

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
