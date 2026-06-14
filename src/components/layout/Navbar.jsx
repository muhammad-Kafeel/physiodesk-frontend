import { Link } from 'react-router-dom';
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

  const roleLabel = isAdmin() ? 'Admin' : isDoctor() ? 'Doctor' : 'Patient';
  const initials  = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const portalColor = {
    patient : 'var(--primary)',
    doctor  : 'var(--teal)',
    admin   : '#334155',
  }[portal] || 'var(--primary)';

  return (
    <nav className="nb-nav">
      <Link to={dashboardLink} className="nb-logo">
        <div className="nb-logo-icon" style={{ background: portalColor }}>P</div>
        <span className="nb-logo-name">PhysioDesk</span>
        <span className="nb-logo-role" style={{ color: portalColor }}>{roleLabel}</span>
      </Link>

      <div className="nb-right">
        <span className="nb-greeting">
          {user?.name?.split(' ')[0]}
        </span>
        <div className="nb-avatar" style={{ background: portalColor }}>
          {initials}
        </div>
        <button className="nb-logout" onClick={() => logout()}>
          Sign out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
