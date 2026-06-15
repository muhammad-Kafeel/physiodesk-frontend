import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, CheckCircle, Clock, DollarSign,
  ChevronRight, Video, UserCheck, FileText, BookOpen,
  AlertTriangle, Info, Activity
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { doctorAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './DoctorDashboard.css';

const STATUS_STYLE = {
  pending:   { bg: 'var(--warning-light)', color: 'var(--warning)' },
  confirmed: { bg: 'var(--success-light)', color: 'var(--success)' },
  completed: { bg: 'var(--info-light)',    color: 'var(--info)'    },
  cancelled: { bg: 'var(--danger-light)', color: 'var(--danger)'  },
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appts,   setAppts]   = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      doctorAPI.getAppointments().catch(() => ({ data: { data: { data: [] } } })),
      doctorAPI.getMyProfile().catch(() => ({ data: { data: null } })),
    ]).then(([a, p]) => {
      setAppts(a.data.data.data || []);
      setProfile(p.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const today      = new Date().toISOString().split('T')[0];
  const hour       = new Date().getHours();
  const greeting   = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const upcoming   = appts.filter(a => ['pending','confirmed'].includes(a.status) && a.appointment_date >= today);
  const todayAppts = appts.filter(a => a.appointment_date === today);
  const completed  = appts.filter(a => a.status === 'completed').length;
  const pending    = appts.filter(a => a.status === 'pending').length;

  const totalEarnings = appts
    .filter(a => a.status === 'completed' && a.is_paid)
    .reduce((sum, a) => sum + Number(a.fee || 0), 0);

  return (
    <DashboardLayout>
      <div className="dd-wrap">

        {/* Welcome banner */}
        <div className="dd-banner">
          <div>
            <h1 className="dd-welcome">
              {greeting}, Dr. {user?.name?.split(' ')[0]}
            </h1>
            <p className="dd-sub">
              {profile?.is_verified
                ? `You have ${upcoming.length} upcoming appointment${upcoming.length !== 1 ? 's' : ''}.`
                : 'Your profile is pending admin verification.'}
            </p>
          </div>
          {!profile && (
            <Link to="/doctor/profile" className="btn-primary-pd">Complete Profile</Link>
          )}
        </div>

        {/* Profile incomplete warning */}
        {!profile && (
          <div className="dd-alert">
            <AlertTriangle size={16} />
            <span>Complete your doctor profile to start receiving appointments.</span>
            <Link to="/doctor/profile" className="dd-alert-link">Set up profile</Link>
          </div>
        )}

        {/* Verification pending warning */}
        {profile && !profile.is_verified && (
          <div className="dd-alert dd-alert-info">
            <Info size={16} />
            <span>Your profile is under review. Admin will verify it shortly.</span>
          </div>
        )}

        {/* Stats */}
        <div className="dd-stats">
          {[
            { label: 'Total Appointments', value: appts.length,    icon: <Calendar size={20}/>,    bg: 'var(--primary-light)', color: 'var(--primary)' },
            { label: 'Completed',          value: completed,        icon: <CheckCircle size={20}/>, bg: 'var(--success-light)', color: 'var(--success)' },
            { label: 'Pending Confirm',    value: pending,          icon: <Clock size={20}/>,       bg: 'var(--warning-light)', color: 'var(--warning)' },
            { label: 'Total Earnings',     value: `Rs. ${totalEarnings.toLocaleString()}`, icon: <Activity size={20}/>, bg: 'var(--teal-light)', color: 'var(--teal)' },
          ].map((s, i) => (
            <div key={i} className="dd-stat-card">
              <div className="dd-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div>
                <p className="dd-stat-val">{s.value}</p>
                <p className="dd-stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dd-grid">

          {/* Today's appointments */}
          <div className="dd-card">
            <div className="pd-section-head">
              <p className="pd-section-title">Today's Appointments</p>
              <Link to="/doctor/appointments" className="pd-view-all">View all <ChevronRight size={14}/></Link>
            </div>
            {loading ? <div className="pd-spinner" /> :
              todayAppts.length === 0 ? (
                <div className="pd-empty">
                  <Calendar size={40}/>
                  <p style={{ marginTop: 10 }}>No appointments today</p>
                </div>
              ) : (
                <div className="dd-appt-list">
                  {todayAppts.map(a => {
                    const s = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                    const pat = a.patient?.user || {};
                    return (
                      <div key={a.id} className="dd-appt-item">
                        <div className="dd-appt-avatar">{pat.name?.[0] || 'P'}</div>
                        <div className="dd-appt-info">
                          <p className="dd-appt-name">{pat.name || 'Patient'}</p>
                          <p className="dd-appt-meta">
                            {a.appointment_time} &middot; {a.type === 'video' ? 'Video Call' : 'In-person'}
                          </p>
                          {a.symptoms && (
                            <p className="dd-appt-symptoms">{a.symptoms.slice(0, 60)}...</p>
                          )}
                        </div>
                        <div className="dd-appt-right">
                          <span className="dd-status-badge" style={{ background: s.bg, color: s.color }}>
                            {a.status}
                          </span>
                          <p className="dd-appt-fee">Rs. {Number(a.fee).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            }
          </div>

          {/* Quick links */}
          <div className="dd-card">
            <p className="pd-section-title" style={{ marginBottom: 16 }}>Quick Actions</p>
            <div className="dd-quick-links">
              {[
                { to: '/doctor/profile',      icon: <UserCheck size={20}/>, label: 'My Profile',     sub: 'Edit info & time slots', bg: 'var(--primary-light)', color: 'var(--primary)' },
                { to: '/doctor/appointments', icon: <Calendar size={20}/>,  label: 'Appointments',   sub: 'Confirm & complete',     bg: 'var(--success-light)', color: 'var(--success)' },
                { to: '/doctor/blogs',        icon: <BookOpen size={20}/>,  label: 'Write Blogs',    sub: 'Share health tips',      bg: '#F5F3FF',              color: '#7C3AED' },
                { to: '/blogs',               icon: <FileText size={20}/>,  label: 'View All Blogs', sub: 'Published articles',     bg: 'var(--teal-light)',    color: 'var(--teal)' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="dd-quick-item">
                  <div className="dd-quick-icon" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                  <div>
                    <p className="dd-quick-label">{item.label}</p>
                    <p className="dd-quick-sub">{item.sub}</p>
                  </div>
                  <ChevronRight size={16} color="var(--gray-300)" style={{ marginLeft: 'auto' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming appointments */}
        {upcoming.length > 0 && (
          <div className="dd-card" style={{ marginTop: 20 }}>
            <div className="pd-section-head">
              <p className="pd-section-title">Upcoming Appointments</p>
              <Link to="/doctor/appointments" className="pd-view-all">View all <ChevronRight size={14}/></Link>
            </div>
            <div className="dd-upcoming-list">
              {upcoming.slice(0, 5).map(a => {
                const s   = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                const pat = a.patient?.user || {};
                return (
                  <div key={a.id} className="dd-upcoming-row">
                    <div className="dd-appt-avatar">{pat.name?.[0] || 'P'}</div>
                    <div className="dd-upcoming-info">
                      <p className="dd-appt-name">{pat.name || 'Patient'}</p>
                      <p className="dd-appt-meta">{a.appointment_date} at {a.appointment_time}</p>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gray-500)' }}>
                      {a.type === 'video' ? <><Video size={13}/> Video</> : 'In-person'}
                    </span>
                    <span className="dd-status-badge" style={{ background: s.bg, color: s.color }}>
                      {a.status}
                    </span>
                    <p className="dd-appt-fee">Rs. {Number(a.fee).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
