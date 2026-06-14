import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const patientLinks = [
  { to: '/patient/dashboard',       icon: '🏠', label: 'Dashboard' },
  { to: '/patient/profile',         icon: '👤', label: 'My Profile' },
  { to: '/doctors',                 icon: '🩺', label: 'Find Doctors' },
  { to: '/patient/appointments',    icon: '📅', label: 'Appointments' },
  { to: '/patient/prescriptions',   icon: '💊', label: 'Prescriptions' },
  { to: '/patient/medical-records', icon: '📋', label: 'Medical Records' },
  { to: '/pharmacy',                icon: '🏥', label: 'Pharmacy' },
  { to: '/patient/orders',          icon: '📦', label: 'My Orders' },
  { to: '/blogs',                   icon: '📝', label: 'Blogs' },
  { to: '/patient/complaints',      icon: '⚠️',  label: 'Complaints' },
];

const doctorLinks = [
  { to: '/doctor/dashboard',    icon: '🏠', label: 'Dashboard' },
  { to: '/doctor/profile',      icon: '👨‍⚕️', label: 'My Profile' },
  { to: '/doctor/appointments', icon: '📅', label: 'Appointments' },
  { to: '/doctor/blogs',        icon: '📝', label: 'Blogs' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: '📊', label: 'Dashboard' },
  { to: '/admin/users',        icon: '👥', label: 'Users' },
  { to: '/admin/doctors',      icon: '🩺', label: 'Doctors' },
  { to: '/admin/medicines',    icon: '💊', label: 'Medicines' },
  { to: '/admin/orders',       icon: '📦', label: 'Orders' },
  { to: '/admin/complaints',   icon: '⚠️',  label: 'Complaints' },
  { to: '/admin/transactions', icon: '💳', label: 'Transactions' },
];

const roleColor = { patient: 'var(--primary)', doctor: 'var(--teal)', admin: '#334155' };

/**
 * Sidebar — renders as a fixed left column on desktop (≥769px)
 * and as a slide-in drawer on mobile, toggled by DashboardLayout.
 *
 * Props:
 *   open       {boolean} — mobile drawer open state
 *   onClose    {fn}      — called when overlay or X is clicked
 */
const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { isAdmin, isDoctor, portal, user, logout } = useAuth();

  const links = isAdmin() ? adminLinks : isDoctor() ? doctorLinks : patientLinks;
  const accent = roleColor[portal] || roleColor.patient;

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="sb-overlay" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`sb-sidebar ${open ? 'sb-sidebar--open' : ''}`}
        style={{ '--sb-accent': accent }}>

        {/* Mobile header inside drawer */}
        <div className="sb-drawer-head">
          <div className="sb-logo">
            <div className="sb-logo-icon">P</div>
            <span className="sb-logo-name">PhysioDesk</span>
          </div>
          <button className="sb-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* User pill */}
        <div className="sb-user">
          <div className="sb-avatar">{user?.name?.slice(0, 2).toUpperCase() || 'U'}</div>
          <div className="sb-user-info">
            <span className="sb-user-name">{user?.name}</span>
            <span className="sb-user-role">{portal}</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sb-nav">
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sb-link ${isActive ? 'sb-link--active' : ''}`}
              onClick={onClose}
            >
              <span className="sb-link-icon">{icon}</span>
              <span className="sb-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout at bottom */}
        <button className="sb-logout" onClick={handleLogout}>
          <span>🚪</span> Sign out
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
