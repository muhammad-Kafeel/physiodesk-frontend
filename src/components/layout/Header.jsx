import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown, Menu, X, User, LogOut, LayoutDashboard, ShoppingBag, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const CITIES = ['Lahore','Karachi','Islamabad','Rawalpindi','Multan','Peshawar','Faisalabad','Quetta'];

export default function Header() {
  const [query,      setQuery]      = useState('');
  const [city,       setCity]       = useState('Lahore');
  const [cityOpen,   setCityOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown,   setDropdown]   = useState(null);
  const [userMenu,   setUserMenu]   = useState(false);
  const cityRef  = useRef(null);
  const userRef  = useRef(null);
  const navigate = useNavigate();

  const {
    user, logout,
    isPatient, isDoctor, isAdmin,
  } = useAuth();

  // Mode-switching removed in new portal-isolated auth model
  const isInPatientMode    = () => false;
  const switchToPatientMode = () => {};
  const switchToDoctorMode  = () => {};

  useEffect(() => {
    const handler = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) setCityOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/doctors?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await logout(); // AuthContext.logout() handles redirect internally
  };

  const getDashboardLink = () => {
    if (isAdmin())  return '/admin/dashboard';
    if (isDoctor()) return isInPatientMode() ? '/patient/dashboard' : '/doctor/dashboard';
    return '/patient/dashboard';
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'G';

  return (
    <>
      <header className="pd-header">

        {/* ── Top bar ── */}
        <div className="pd-header-top">
          <div className="pd-container pd-header-inner">

            {/* Logo */}
            <Link to="/" className="pd-logo">
              <div className="pd-logo-icon">P</div>
              <div>
                <span className="pd-logo-text">PhysioDesk</span>
                <span className="pd-logo-tagline">Virtual Clinic</span>
              </div>
            </Link>

            {/* Search bar */}
            <div className="pd-search-wrap">
              <div className="pd-city-picker" ref={cityRef} onClick={() => setCityOpen(p => !p)}>
                <MapPin size={13} />
                <span>{city}</span>
                <ChevronDown size={11} />
                {cityOpen && (
                  <ul className="pd-city-drop">
                    {CITIES.map(c => (
                      <li
                        key={c}
                        className={c === city ? 'active' : ''}
                        onClick={(e) => { e.stopPropagation(); setCity(c); setCityOpen(false); }}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="pd-divider" />
              <form onSubmit={handleSearch} className="pd-search-form">
                <Search size={14} className="pd-search-icon" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search Doctors, Specialties, Symptoms..."
                  className="pd-search-input"
                />
                <button type="submit" className="pd-search-btn">Search</button>
              </form>
            </div>

            {/* Right actions */}
            <div className="pd-header-actions">
              {user ? (
                <div className="pd-actions-logged-in">

                  {/* ── Mode switcher (doctors only) ── */}
                  {isDoctor() && (
                    isInPatientMode() ? (
                      <button
                        className="pd-mode-btn pd-mode-btn-doctor"
                        title="Switch back to Doctor Mode"
                        onClick={() => { switchToDoctorMode(); navigate('/doctor/dashboard'); }}
                      >
                        👨‍⚕️ Doctor Mode
                      </button>
                    ) : (
                      <button
                        className="pd-mode-btn pd-mode-btn-patient"
                        title="Switch to Patient Mode to book appointments"
                        onClick={() => { switchToPatientMode(); navigate('/patient/dashboard'); }}
                      >
                        🩺 Book as Patient
                      </button>
                    )
                  )}

                  {/* ── User dropdown ── */}
                  <div className="pd-user-menu" ref={userRef}>
                    <button className="pd-user-btn" onClick={() => setUserMenu(p => !p)}>
                      <div className="pd-avatar">{initials}</div>
                      <span className="pd-user-name">{user.name?.split(' ')[0]}</span>
                      <ChevronDown size={13} />
                    </button>

                    {userMenu && (
                      <div className="pd-user-drop">
                        <div className="pd-user-drop-header">
                          <div className="pd-avatar pd-avatar-lg">{initials}</div>
                          <div>
                            <p className="pd-user-drop-name">{user.name}</p>
                            <p className="pd-user-drop-role">
                              {isDoctor() && isInPatientMode() ? 'Doctor (Patient Mode)' : user.role}
                            </p>
                          </div>
                        </div>
                        <hr />
                        <Link to={getDashboardLink()} className="pd-drop-item" onClick={() => setUserMenu(false)}>
                          <LayoutDashboard size={15} /> Dashboard
                        </Link>
                        {(isPatient() || isInPatientMode()) && (
                          <>
                            <Link to="/patient/appointments" className="pd-drop-item" onClick={() => setUserMenu(false)}>
                              <Calendar size={15} /> My Appointments
                            </Link>
                            <Link to="/patient/orders" className="pd-drop-item" onClick={() => setUserMenu(false)}>
                              <ShoppingBag size={15} /> My Orders
                            </Link>
                            <Link to="/patient/prescriptions" className="pd-drop-item" onClick={() => setUserMenu(false)}>
                              <FileText size={15} /> Prescriptions
                            </Link>
                          </>
                        )}
                        <hr />
                        <button className="pd-drop-item pd-drop-logout" onClick={handleLogout}>
                          <LogOut size={15} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/register/doctor" className="pd-join-btn">Join as Doctor</Link>
                  <Link to="/patient/login" className="pd-login-btn">Login</Link>
                </>
              )}

              <button className="pd-hamburger" onClick={() => setMobileOpen(p => !p)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Nav bar ── */}
        <nav className="pd-nav">
          <div className="pd-container pd-nav-inner">
            {[
              {
                label: 'Find Doctors', key: 'doctors', links: [
                  { to: '/doctors',                       text: 'All Doctors' },
                  { to: '/doctors?spec=physiotherapist',  text: 'Physiotherapists' },
                  { to: '/doctors?spec=orthopedic',       text: 'Orthopedic Surgeons' },
                  { to: '/doctors?spec=neurologist',      text: 'Neurologists' },
                  { to: '/doctors?spec=sports-medicine',  text: 'Sports Medicine' },
                ],
              },
              {
                label: 'Pharmacy', key: 'pharmacy', links: [
                  { to: '/pharmacy',           text: 'All Medicines' },
                  { to: '/pharmacy?type=otc',  text: 'OTC Medicines' },
                  { to: '/pharmacy?type=rx',   text: 'Prescription Medicines' },
                ],
              },
            ].map(nav => (
              <div
                key={nav.key}
                className="pd-nav-item"
                onMouseEnter={() => setDropdown(nav.key)}
                onMouseLeave={() => setDropdown(null)}
              >
                <span className="pd-nav-link">
                  {nav.label} <ChevronDown size={11} />
                </span>
                {dropdown === nav.key && (
                  <div className="pd-drop">
                    {nav.links.map(l => (
                      <Link key={l.to} to={l.to} className="pd-drop-link">{l.text}</Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link to="/blogs" className="pd-nav-link-plain">Health Blogs</Link>
            <Link to="/blogs?type=success_story" className="pd-nav-link-plain">Success Stories</Link>
            {user && (isPatient() || isInPatientMode()) && (
              <Link to="/patient/complaints" className="pd-nav-link-plain">Complaints</Link>
            )}
          </div>
        </nav>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="pd-mobile-drop">
            {[
              ['/', 'Home'],
              ['/doctors', 'Find Doctors'],
              ['/pharmacy', 'Pharmacy'],
              ['/blogs', 'Health Blogs'],
              ...(user
                ? [[getDashboardLink(), 'Dashboard']]
                : [['/patient/login', 'Login'], ['/register', 'Register']]
              ),
            ].map(([to, label]) => (
              <Link
                key={to + label}
                to={to}
                className="pd-mobile-link"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {user && isDoctor() && (
              <button
                className="pd-mobile-link"
                style={{ color: isInPatientMode() ? '#0F766E' : '#1D4ED8' }}
                onClick={() => {
                  isInPatientMode() ? switchToDoctorMode() : switchToPatientMode();
                  navigate(isInPatientMode() ? '/doctor/dashboard' : '/patient/dashboard');
                  setMobileOpen(false);
                }}
              >
                {isInPatientMode() ? '👨‍⚕️ Switch to Doctor Mode' : '🩺 Book as Patient'}
              </button>
            )}
            {user && (
              <button className="pd-mobile-link pd-mobile-logout" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        )}

      </header>
    </>
  );
}
