import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, ShoppingBag, AlertTriangle, TrendingUp,
  ChevronRight, CheckCircle, Stethoscope, Pill, Activity, Radio
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EmailVerificationBanner from '../../components/common/EmailVerificationBanner';
import { adminAPI, adminAuthAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout><div className="pd-spinner" style={{marginTop:60}}/></DashboardLayout>;
  if (!data)   return <DashboardLayout><div className="pd-empty"><p>Failed to load dashboard data.</p></div></DashboardLayout>;

  const { totals, recent_appointments, recent_payments, low_stock_medicines, pending_doctors } = data;

  const STATS = [
    { label:'Total Users',      value: totals.users,        icon:<Users size={20}/>,        bg:'var(--primary-light)', color:'var(--primary)' },
    { label:'Doctors',          value: totals.doctors,      icon:<Stethoscope size={20}/>,   bg:'var(--teal-light)',    color:'var(--teal)' },
    { label:'Appointments',     value: totals.appointments, icon:<Calendar size={20}/>,      bg:'#F5F3FF',              color:'#7C3AED' },
    { label:'Total Revenue',    value:`Rs. ${Number(totals.revenue).toLocaleString()}`, icon:<TrendingUp size={20}/>, bg:'var(--success-light)', color:'var(--success)' },
    { label:'Orders',           value: totals.orders,       icon:<ShoppingBag size={20}/>,   bg:'#FFF7ED',              color:'#D97706' },
    { label:'Open Complaints',  value: totals.complaints,   icon:<AlertTriangle size={20}/>, bg:'var(--danger-light)',  color:'var(--danger)' },
  ];

  return (
    <DashboardLayout>
      <div className="ad-wrap">

        {/* ── Email verification banner ── */}
        <EmailVerificationBanner
          user={user}
          resendFn={adminAuthAPI.resendVerification}
        />

        {/* Banner */}
        <div className="ad-banner">
          <div>
            <h1 className="ad-title">Admin Dashboard</h1>
            <p className="ad-sub">Real-time overview of PhysioDesk platform activity</p>
          </div>
          <div className="ad-live-badge">
            <span className="ad-live-dot"/>
            Live
          </div>
        </div>

        {/* Stats */}
        <div className="ad-stats">
          {STATS.map((s, i) => (
            <div key={i} className="ad-stat-card">
              <div className="ad-stat-icon" style={{background:s.bg, color:s.color}}>{s.icon}</div>
              <div>
                <p className="ad-stat-val">{s.value}</p>
                <p className="ad-stat-label">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="ad-grid">

          {/* Pending doctor verifications */}
          <div className="ad-card">
            <div className="pd-section-head">
              <p className="pd-section-title">Pending Verifications</p>
              <Link to="/admin/doctors" className="pd-view-all">Manage <ChevronRight size={14}/></Link>
            </div>
            {pending_doctors.length === 0 ? (
              <div className="pd-empty">
                <CheckCircle size={36}/>
                <p style={{marginTop:10}}>All doctors are verified</p>
              </div>
            ) : pending_doctors.map(d => (
              <div key={d.id} className="ad-doc-row">
                <div className="ad-avatar">{d.user?.name?.[0] || 'D'}</div>
                <div className="ad-row-info">
                  <p className="ad-row-name">Dr. {d.user?.name}</p>
                  <p className="ad-row-sub">{d.specialization} &middot; PMDC: {d.pmdc_number}</p>
                </div>
                <Link to="/admin/doctors" className="ad-action-link">Review</Link>
              </div>
            ))}
          </div>

          {/* Low stock alert */}
          <div className="ad-card">
            <div className="pd-section-head">
              <p className="pd-section-title">Low Stock Medicines</p>
              <Link to="/admin/medicines" className="pd-view-all">Manage <ChevronRight size={14}/></Link>
            </div>
            {low_stock_medicines.length === 0 ? (
              <div className="pd-empty">
                <CheckCircle size={36}/>
                <p style={{marginTop:10}}>All stock levels are healthy</p>
              </div>
            ) : low_stock_medicines.map(m => (
              <div key={m.id} className="ad-med-row">
                <div className="ad-med-icon"><Pill size={16}/></div>
                <div className="ad-row-info">
                  <p className="ad-row-name">{m.name}</p>
                  <p className="ad-row-sub">{m.category}</p>
                </div>
                <span className="ad-stock-badge">{m.quantity} left</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent appointments */}
        <div className="ad-card" style={{marginTop:20}}>
          <div className="pd-section-head">
            <p className="pd-section-title">Recent Appointments</p>
            <span className="ad-sub-note">Latest 5</span>
          </div>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Patient</th><th>Doctor</th><th>Date</th><th>Type</th><th>Status</th><th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {recent_appointments.map(a => (
                  <tr key={a.id}>
                    <td>{a.patient?.user?.name || '—'}</td>
                    <td>Dr. {a.doctor?.user?.name || '—'}</td>
                    <td>{a.appointment_date}</td>
                    <td style={{ textTransform:'capitalize' }}>{a.type}</td>
                    <td><span className={`ad-status ad-status-${a.status}`}>{a.status}</span></td>
                    <td>Rs. {Number(a.fee).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent payments */}
        <div className="ad-card" style={{marginTop:20}}>
          <div className="pd-section-head">
            <p className="pd-section-title">Recent Transactions</p>
            <Link to="/admin/transactions" className="pd-view-all">View all <ChevronRight size={14}/></Link>
          </div>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr><th>Patient</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recent_payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.patient?.user?.name || '—'}</td>
                    <td>Rs. {Number(p.amount).toLocaleString()}</td>
                    <td style={{textTransform:'capitalize'}}>{p.method}</td>
                    <td><span className={`ad-status ad-status-${p.status}`}>{p.status}</span></td>
                    <td>{new Date(p.created_at).toLocaleDateString('en-PK')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
