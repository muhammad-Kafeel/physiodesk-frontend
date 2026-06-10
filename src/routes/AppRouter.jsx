import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Public pages
import LandingPage       from '../pages/LandingPage';
import LoginPage         from '../pages/auth/LoginPage';
import RegisterPage      from '../pages/auth/RegisterPage';
import DoctorListing     from '../pages/patient/DoctorListing';
import DoctorDetail      from '../pages/patient/DoctorDetail';
import BlogsPage         from '../pages/patient/BlogsPage';
import PharmacyPage      from '../pages/patient/PharmacyPage';
import NotFound          from '../pages/NotFound';
import Unauthorized      from '../pages/Unauthorized';

// Patient pages
import PatientDashboard  from '../pages/patient/PatientDashboard';
import PatientProfile    from '../pages/patient/PatientProfile';
import BookAppointment   from '../pages/patient/BookAppointment';
import PaymentPage       from '../pages/patient/PaymentPage';
import MyAppointments    from '../pages/patient/MyAppointments';
import MyOrders          from '../pages/patient/MyOrders';
import MyPrescriptions   from '../pages/patient/MyPrescriptions';
import MedicalRecords    from '../pages/patient/MedicalRecords';
import ComplaintsPage    from '../pages/patient/ComplaintsPage';

// Doctor pages
import DoctorDashboard    from '../pages/doctor/DoctorDashboard';
import DoctorProfilePage  from '../pages/doctor/DoctorProfilePage';
import DoctorAppointments from '../pages/doctor/DoctorAppointments';
import WritePrescription  from '../pages/doctor/WritePrescription';
import DoctorBlogs        from '../pages/doctor/DoctorBlogs';

// Admin pages
import AdminDashboard   from '../pages/admin/AdminDashboard';
import ManageUsers      from '../pages/admin/ManageUsers';
import ManageDoctors    from '../pages/admin/ManageDoctors';
import ManageMedicines  from '../pages/admin/ManageMedicines';
import ManageOrders     from '../pages/admin/ManageOrders';
import ManageComplaints from '../pages/admin/ManageComplaints';
import Transactions     from '../pages/admin/Transactions';

// Guards
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="pd-spinner" style={{ marginTop: 100 }} />;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="pd-spinner" style={{ marginTop: 100 }} />;
  return !user ? children : <Navigate to="/" replace />;
}

function RoleRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="pd-spinner" style={{ marginTop: 100 }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<LandingPage />} />
      <Route path="/doctors"     element={<DoctorListing />} />
      <Route path="/doctors/:id" element={<DoctorDetail />} />
      <Route path="/pharmacy"    element={<PharmacyPage />} />
      <Route path="/blogs"       element={<BlogsPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Auth */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Patient */}
      <Route path="/patient/dashboard"       element={<PrivateRoute><PatientDashboard /></PrivateRoute>} />
      <Route path="/patient/profile"         element={<PrivateRoute><PatientProfile /></PrivateRoute>} />
      <Route path="/patient/appointments"    element={<PrivateRoute><MyAppointments /></PrivateRoute>} />
      <Route path="/patient/orders"          element={<PrivateRoute><MyOrders /></PrivateRoute>} />
      <Route path="/patient/prescriptions"   element={<PrivateRoute><MyPrescriptions /></PrivateRoute>} />
      <Route path="/patient/medical-records" element={<PrivateRoute><MedicalRecords /></PrivateRoute>} />
      <Route path="/patient/complaints"      element={<PrivateRoute><ComplaintsPage /></PrivateRoute>} />
      <Route path="/book/:id"                element={<PrivateRoute><BookAppointment /></PrivateRoute>} />
      <Route path="/payment/appointment/:appointmentId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />

      {/* Doctor */}
      <Route path="/doctor/dashboard"              element={<RoleRoute role="doctor"><DoctorDashboard /></RoleRoute>} />
      <Route path="/doctor/profile"                element={<RoleRoute role="doctor"><DoctorProfilePage /></RoleRoute>} />
      <Route path="/doctor/appointments"           element={<RoleRoute role="doctor"><DoctorAppointments /></RoleRoute>} />
      <Route path="/doctor/write-prescription/:id" element={<RoleRoute role="doctor"><WritePrescription /></RoleRoute>} />
      <Route path="/doctor/blogs"                  element={<RoleRoute role="doctor"><DoctorBlogs /></RoleRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard"    element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
      <Route path="/admin/users"        element={<RoleRoute role="admin"><ManageUsers /></RoleRoute>} />
      <Route path="/admin/doctors"      element={<RoleRoute role="admin"><ManageDoctors /></RoleRoute>} />
      <Route path="/admin/medicines"    element={<RoleRoute role="admin"><ManageMedicines /></RoleRoute>} />
      <Route path="/admin/orders"       element={<RoleRoute role="admin"><ManageOrders /></RoleRoute>} />
      <Route path="/admin/complaints"   element={<RoleRoute role="admin"><ManageComplaints /></RoleRoute>} />
      <Route path="/admin/transactions" element={<RoleRoute role="admin"><Transactions /></RoleRoute>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
