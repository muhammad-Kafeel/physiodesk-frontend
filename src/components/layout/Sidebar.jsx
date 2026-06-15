import { NavLink } from 'react-router-dom';
import { X, Home, User, Stethoscope, Calendar, Pill, ClipboardList,
  Building2, Package, BookOpen, AlertTriangle, UserCog,
  LayoutDashboard, Users, CreditCard, BarChart3, LogOut,
  ShieldCheck, HeartPulse } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const patientLinks = [
  { to: '/patient/dashboard',       icon: <Home size={16}/>,          label: 'Dashboard' },
  { to: '/patient/profile',         icon: <User size={16}/>,          label: 'My Profile' },
  { to: '/doctors',                 icon: <Stethoscope size={16}/>,   label: 'Find Doctors' },
  { to: '/patient/appointments',    icon: <Calendar size={16}/>,      label: 'Appointments' },
  { to: '/patient/prescriptions',   icon: <Pill size={16}/>,          label: 'Prescriptions' },
  { to: '/patient/medical-records', icon: <ClipboardList size={16}/>, label: 'Medical Records' },
  { to: '/pharmacy',                icon: <Building2 size={16}/>,     label: 'Pharmacy' },
  { to: '/patient/orders',          icon: <Package size={16}/>,       label: 'My Orders' },
  { to: '/blogs',                   icon: <BookOpen size={16}/>,      label: 'Blogs' },
  { to: '/patient/complaints',      icon: <AlertTriangle size={16}/>, label: 'Complaints' },
];

const doctorLinks = [
  { to: '/doctor/dashboard',    icon: <Home size={16}/>,        label: 'Dashboard' },
  { to: '/doctor/profile',      icon: <UserCog size={16}/>,     label: 'My Profile' },
  { to: '/doctor/appointments', icon: <Calendar size={16}/>,    label: 'Appointments' },
  { to: '/doctor/blogs',        icon: <BookOpen size={16}/>,    label: 'Blogs' },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: <LayoutDashboard size={16}/>, label: 'Dashboard' },
  { to: '/admin/users',        icon: <Users size={16}/>,           label: 'Users' },
  { to: '/admin/doctors',      icon: <Stethoscope size={16}/>,     label: 'Doctors' },
  { to: '/admin/medicines',    icon: <Pill size={16}/>,            label: 'Medicines' },
  { to: '/admin/orders',       icon: <Package size={16}/>,         label: 'Orders' },
  { to: '/admin/complaints',   icon: <AlertTriangle size={16}/>,   label: 'Complaints' },
  { to: '/admin/transactions', icon: <CreditCard size={16}/>,      label: 'Transactions' },
];

const roleColor = { patient: 'var(--primary)', doctor: 'var(--teal)', admin: '#334155' };

/**
 * Sidebar — fixed left column on desktop (≥769px), slide-in drawer on mobile.
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

  const roleLabel = isAdmin() ? 'Administrator' : isDoctor() ? 'Doctor' : 'Patient';
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="sb-overlay" onClick={onClose} aria-hidden="true" />}

      <aside className={`sb-sidebar ${open ? 'sb-sidebar--open' : ''}`}
        style={{ '--sb-accent': accent }}>

        {/* Mobile header inside drawer */}
        <div className="sb-drawer-head">
          <div className="sb-logo">
            <div className="sb-logo-mark" style={{ background: accent }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="7" y="2" width="2" height="12" rx="1" fill="white"/>
                <rect x="2" y="7" width="12" height="2" rx="1" fill="white"/>
              </svg>
            </div>
            <span className="sb-logo-name">PhysioDesk</span>
          </div>
          <button className="sb-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        {/* User pill */}
        <div className="sb-user">
          <div className="sb-avatar" style={{ background: accent }}>{initials}</div>
          <div className="sb-user-info">
            <span className="sb-user-name">{user?.name}</span>
            <span className="sb-user-role">{roleLabel}</span>
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
          <LogOut size={16} /> Sign out
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
