import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const patientLinks = [
  { to: '/patient/dashboard',      icon: '🏠', label: 'Dashboard' },
  { to: '/patient/profile',        icon: '👤', label: 'My Profile' },
  { to: '/doctors',                icon: '🩺', label: 'Find Doctors' },
  { to: '/patient/appointments',   icon: '📅', label: 'Appointments' },
  { to: '/patient/prescriptions',  icon: '💊', label: 'Prescriptions' },
  { to: '/patient/medical-records',icon: '📋', label: 'Medical Records' },
  { to: '/pharmacy',               icon: '🏥', label: 'Pharmacy' },
  { to: '/patient/orders',         icon: '📦', label: 'My Orders' },
  { to: '/blogs',                  icon: '📝', label: 'Blogs' },
  { to: '/patient/complaints',     icon: '⚠️',  label: 'Complaints' },
];

const doctorLinks = [
  { to: '/doctor/dashboard',    icon: '🏠', label: 'Dashboard' },
  { to: '/doctor/profile',      icon: '👨‍⚕️', label: 'My Profile' },
  { to: '/doctor/appointments', icon: '📅', label: 'Appointments' },
  { to: '/doctor/blogs',        icon: '📝', label: 'Blogs' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: '📊', label: 'Dashboard' },
  { to: '/admin/users',        icon: '👥', label: 'Manage Users' },
  { to: '/admin/doctors',      icon: '🩺', label: 'Manage Doctors' },
  { to: '/admin/medicines',    icon: '💊', label: 'Medicines' },
  { to: '/admin/orders',       icon: '📦', label: 'Orders' },
  { to: '/admin/complaints',   icon: '⚠️',  label: 'Complaints' },
  { to: '/admin/transactions', icon: '💳', label: 'Transactions' },
];

const Sidebar = () => {
  const { isAdmin, isDoctor, isPatient } = useAuth();
  const links = isAdmin() ? adminLinks : isDoctor() ? doctorLinks : patientLinks;

  return (
    <div
      className="d-flex flex-column py-3 px-2"
      style={{ width: '220px', minHeight: '100vh', background: '#f8f9fa', borderRight: '1px solid #dee2e6' }}
    >
      {links.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `d-flex align-items-center gap-2 px-3 py-2 mb-1 rounded text-decoration-none fw-medium
             ${isActive ? 'bg-primary text-white' : 'text-secondary'}`
          }
          style={{ fontSize: '0.92rem' }}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default Sidebar;
