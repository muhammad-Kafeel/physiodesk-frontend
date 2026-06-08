import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, RoleRoute, GuestRoute } from './Guards';

// Auth pages
import LoginPage    from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Patient pages
import PatientDashboard   from '../pages/patient/PatientDashboard';
import PatientProfile     from '../pages/patient/PatientProfile';
import DoctorListing      from '../pages/patient/DoctorListing';
import DoctorDetail       from '../pages/patient/DoctorDetail';
import BookAppointment    from '../pages/patient/BookAppointment';
import MyAppointments     from '../pages/patient/MyAppointments';
import PaymentPage        from '../pages/patient/PaymentPage';
import PharmacyPage       from '../pages/patient/PharmacyPage';
import MyOrders           from '../pages/patient/MyOrders';
import MyPrescriptions    from '../pages/patient/MyPrescriptions';
import MedicalRecords     from '../pages/patient/MedicalRecords';
import ComplaintsPage     from '../pages/patient/ComplaintsPage';
import BlogsPage          from '../pages/patient/BlogsPage';
import BlogDetail         from '../pages/patient/BlogDetail';

// Doctor pages
import DoctorDashboard    from '../pages/doctor/DoctorDashboard';
import DoctorProfilePage  from '../pages/doctor/DoctorProfilePage';
import DoctorAppointments from '../pages/doctor/DoctorAppointments';
import WritePrescription  from '../pages/doctor/WritePrescription';
import DoctorBlogs        from '../pages/doctor/DoctorBlogs';

// Admin pages
import AdminDashboard     from '../pages/admin/AdminDashboard';
import ManageUsers        from '../pages/admin/ManageUsers';
import ManageDoctors      from '../pages/admin/ManageDoctors';
import ManageMedicines    from '../pages/admin/ManageMedicines';
import ManageOrders       from '../pages/admin/ManageOrders';
import ManageComplaints   from '../pages/admin/ManageComplaints';
import Transactions       from '../pages/admin/Transactions';

// Common
import NotFound      from '../pages/NotFound';
import Unauthorized  from '../pages/Unauthorized';
import LandingPage   from '../pages/LandingPage';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/"              element={<LandingPage />} />
      <Route path="/unauthorized"  element={<Unauthorized />} />

      {/* Guest only (redirect if logged in) */}
      <Route element={<GuestRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Patient routes */}
      <Route element={<RoleRoute role="patient" />}>
        <Route path="/patient/dashboard"    element={<PatientDashboard />} />
        <Route path="/patient/profile"      element={<PatientProfile />} />
        <Route path="/patient/appointments" element={<MyAppointments />} />
        <Route path="/patient/prescriptions"element={<MyPrescriptions />} />
        <Route path="/patient/medical-records" element={<MedicalRecords />} />
        <Route path="/patient/orders"       element={<MyOrders />} />
        <Route path="/patient/complaints"   element={<ComplaintsPage />} />
        <Route path="/doctors"              element={<DoctorListing />} />
        <Route path="/doctors/:id"          element={<DoctorDetail />} />
        <Route path="/book/:doctorId"       element={<BookAppointment />} />
        <Route path="/payment/:type/:id"    element={<PaymentPage />} />
        <Route path="/pharmacy"             element={<PharmacyPage />} />
        <Route path="/blogs"                element={<BlogsPage />} />
        <Route path="/blogs/:slug"          element={<BlogDetail />} />
      </Route>

      {/* Doctor routes */}
      <Route element={<RoleRoute role="doctor" />}>
        <Route path="/doctor/dashboard"    element={<DoctorDashboard />} />
        <Route path="/doctor/profile"      element={<DoctorProfilePage />} />
        <Route path="/doctor/appointments" element={<DoctorAppointments />} />
        <Route path="/doctor/prescribe/:appointmentId" element={<WritePrescription />} />
        <Route path="/doctor/blogs"        element={<DoctorBlogs />} />
      </Route>

      {/* Admin routes */}
      <Route element={<RoleRoute role="admin" />}>
        <Route path="/admin/dashboard"  element={<AdminDashboard />} />
        <Route path="/admin/users"      element={<ManageUsers />} />
        <Route path="/admin/doctors"    element={<ManageDoctors />} />
        <Route path="/admin/medicines"  element={<ManageMedicines />} />
        <Route path="/admin/orders"     element={<ManageOrders />} />
        <Route path="/admin/complaints" element={<ManageComplaints />} />
        <Route path="/admin/transactions" element={<Transactions />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
