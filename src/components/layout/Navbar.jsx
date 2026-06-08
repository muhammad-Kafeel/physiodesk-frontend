import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardLink = isAdmin()
    ? '/admin/dashboard'
    : isDoctor()
    ? '/doctor/dashboard'
    : '/patient/dashboard';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'linear-gradient(135deg,#1a73e8,#0d47a1)' }}>
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4" to={dashboardLink}>
          💊 PhysioDesk
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isPatient() && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/doctors">Find Doctors</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/pharmacy">Pharmacy</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/blogs">Blogs</Link></li>
              </>
            )}
            {isDoctor() && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/doctor/appointments">Appointments</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/doctor/blogs">Blogs</Link></li>
              </>
            )}
            {isAdmin() && (
              <>
                <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/admin/doctors">Doctors</Link></li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 small">
              {user?.name} &nbsp;
              <span className={`badge ${isAdmin() ? 'bg-danger' : isDoctor() ? 'bg-success' : 'bg-info'}`}>
                {user?.role}
              </span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
