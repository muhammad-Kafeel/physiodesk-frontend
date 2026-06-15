import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

/**
 * Navbar — shown at the top of every dashboard page.
 * On desktop it is a simple top-bar (the Sidebar handles navigation).
 * On mobile, the hamburger is in DashboardLayout's mobile-bar instead,
 * so the Navbar stays minimal: logo + user info + logout.
 */
const Navbar = () => {
  const { user, logout, isAdmin, isDoctor, portal } = useAuth();

  const dashboardLink =
    isAdmin()  ? '/admin/dashboard'  :
    isDoctor() ? '/doctor/dashboard' :
                 '/patient/dashboard';

  const roleLabel = isAdmin() ? 'Admin Portal' : isDoctor() ? 'Doctor Portal' : 'Patient Portal';
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const portalColor = {
    patient : 'var(--primary)',
    doctor  : 'var(--teal)',
    admin   : '#334155',
  }[portal] || 'var(--primary)';

  return (
    <nav className="nb-nav">
      <Link to={dashboardLink} className="nb-logo">
        <div className="nb-logo-mark" style={{ background: portalColor }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="8" y="2" width="2" height="14" rx="1" fill="white"/>
            <rect x="2" y="8" width="14" height="2" rx="1" fill="white"/>
          </svg>
        </div>
        <div>
          <span className="nb-logo-name">PhysioDesk</span>
          <span className="nb-logo-role" style={{ color: portalColor }}>{roleLabel}</span>
        </div>
      </Link>

      <div className="nb-right">
        <span className="nb-greeting">
          {user?.name?.split(' ')[0]}
        </span>
        <div className="nb-avatar" style={{ background: portalColor }}>
          {initials}
        </div>
        <button className="nb-logout" onClick={() => logout()}>
          <LogOut size={14}/> Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
