import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ShoppingBag, FileText, Activity, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { appointmentAPI, patientAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import './PatientDashboard.css';

const STATUS_STYLE = {
  pending:     { bg:'#FEF9C3', color:'#CA8A04', icon:<Clock size={13}/> },
  confirmed:   { bg:'#DCFCE7', color:'#16A34A', icon:<CheckCircle size={13}/> },
  completed:   { bg:'#DBEAFE', color:'#2563EB', icon:<CheckCircle size={13}/> },
  cancelled:   { bg:'#FEE2E2', color:'#DC2626', icon:<XCircle size={13}/> },
  rescheduled: { bg:'#FEF9C3', color:'#CA8A04', icon:<Clock size={13}/> },
};

export default function PatientDashboard() {
  const { user }                    = useAuth();
  const [appts, setAppts]           = useState([]);
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentAPI.myAppointments().catch(() => ({ data:{ data:{ data:[] } } })),
      patientAPI.myProfile().catch(() => ({ data:{ data: null } })),
    ]).then(([a, p]) => {
      setAppts(a.data.data.data || []);
      setProfile(p.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const upcoming  = appts.filter(a => ['pending','confirmed'].includes(a.status)).slice(0,3);
  const completed = appts.filter(a => a.status === 'completed').length;

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Welcome banner */}
        <div className="pdb-banner">
          <div>
            <h1 className="pdb-welcome">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="pdb-sub">Manage your health journey from your personal dashboard</p>
          </div>
          <Link to="/doctors" className="btn-primary-pd">Book New Appointment</Link>
        </div>

        {/* Stats */}
        <div className="pdb-stats">
          {[
            { label:'Total Appointments', value: appts.length,                    icon:<Calendar size={20}/>,    bg:'#EFF6FF', color:'var(--primary)' },
            { label:'Completed',          value: completed,                        icon:<CheckCircle size={20}/>, bg:'#DCFCE7', color:'#16A34A' },
            { label:'Upcoming',           value: upcoming.length,                  icon:<Clock size={20}/>,       bg:'#FEF9C3', color:'#CA8A04' },
            { label:'Profile',            value: profile ? 'Complete' : 'Incomplete', icon:<Activity size={20}/>, bg:'#FDF4FF', color:'#7C3AED' },
          ].map((s,i) => (
            <div key={i} className="pdb-stat-card">
              <div className="pdb-stat-icon" style={{background:s.bg, color:s.color}}>{s.icon}</div>
              <div>
                <p className="pdb-stat-val">{s.value}</p>
                <p className="pdb-stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pdb-grid">
          {/* Upcoming appointments */}
          <div className="pdb-card">
            <div className="pd-section-head">
              <p className="pd-section-title">Upcoming Appointments</p>
              <Link to="/patient/appointments" className="pd-view-all">View all <ChevronRight size={14}/></Link>
            </div>
            {loading ? <div className="pd-spinner" /> :
             upcoming.length === 0 ? (
              <div className="pd-empty">
                <p style={{fontSize:36}}>📅</p>
                <p>No upcoming appointments</p>
                <Link to="/doctors" className="btn-primary-pd" style={{marginTop:12}}>Book Now</Link>
              </div>
            ) : (
              <div className="pdb-appt-list">
                {upcoming.map(a => {
                  const s = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                  return (
                    <div key={a.id} className="pdb-appt-item">
                      <div className="pdb-appt-avatar">{a.doctor?.user?.name?.[0] || 'D'}</div>
                      <div className="pdb-appt-info">
                        <p className="pdb-appt-doc">Dr. {a.doctor?.user?.name}</p>
                        <p className="pdb-appt-spec">{a.doctor?.specialization}</p>
                        <p className="pdb-appt-time">{a.appointment_date} · {a.appointment_time}</p>
                      </div>
                      <span className="pdb-appt-status" style={{background:s.bg, color:s.color}}>
                        {s.icon} {a.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="pdb-card">
            <p className="pd-section-title" style={{marginBottom:16}}>Quick Access</p>
            <div className="pdb-quick-links">
              {[
                { to:'/patient/prescriptions',   icon:<FileText size={20}/>,   label:'My Prescriptions', sub:'View & download',  bg:'#EFF6FF', color:'var(--primary)' },
                { to:'/pharmacy',                icon:<ShoppingBag size={20}/>,label:'Order Medicines',  sub:'OTC & Rx',         bg:'#F0FDFA', color:'var(--teal)' },
                { to:'/patient/orders',          icon:<ShoppingBag size={20}/>,label:'My Orders',        sub:'Track deliveries',  bg:'#FFF7ED', color:'#D97706' },
                { to:'/patient/medical-records', icon:<Activity size={20}/>,   label:'Medical Records',  sub:'Your health vault', bg:'#FDF4FF', color:'#7C3AED' },
                { to:'/blogs',                   icon:<FileText size={20}/>,   label:'Health Blogs',     sub:'Tips & articles',   bg:'#F0FDF4', color:'#16A34A' },
                { to:'/patient/complaints',      icon:<FileText size={20}/>,   label:'Complaints',       sub:'File or view',      bg:'#FEF2F2', color:'#DC2626' },
              ].map(item => (
                <Link key={item.to + item.label} to={item.to} className="pdb-quick-item">
                  <div className="pdb-quick-icon" style={{background:item.bg, color:item.color}}>{item.icon}</div>
                  <div>
                    <p className="pdb-quick-label">{item.label}</p>
                    <p className="pdb-quick-sub">{item.sub}</p>
                  </div>
                  <ChevronRight size={16} color="var(--gray-400)" style={{marginLeft:'auto'}} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Profile complete reminder */}
        {!profile && (
          <div className="pdb-profile-reminder">
            <div>
              <p className="pdb-reminder-title">Complete Your Profile</p>
              <p className="pdb-reminder-sub">Add your health details to get better treatment from doctors</p>
            </div>
            <Link to="/patient/profile" className="btn-primary-pd">Complete Now</Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
