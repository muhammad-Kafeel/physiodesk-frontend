import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, CheckCircle, FileText, ChevronDown, ChevronUp, User } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { doctorAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './DoctorAppointments.css';

const TABS = ['all','pending','confirmed','completed','cancelled'];
const STATUS_STYLE = {
  pending:   { bg: '#FEF9C3', color: '#CA8A04' },
  confirmed: { bg: '#DCFCE7', color: '#16A34A' },
  completed: { bg: '#DBEAFE', color: '#2563EB' },
  cancelled: { bg: '#FEE2E2', color: '#DC2626' },
  rescheduled:{ bg:'#FEF9C3', color:'#CA8A04' },
};

export default function DoctorAppointments() {
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [acting,   setActing]   = useState(null); // id being confirmed/completed

  useEffect(() => {
    doctorAPI.getAppointments()
      .then(r => setAppts(r.data.data.data || []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? appts : appts.filter(a => a.status === tab);

  const confirmAppt = async (id) => {
    setActing(id);
    try {
      await doctorAPI.confirmAppt(id);
      setAppts(p => p.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
      toast.success('Appointment confirmed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setActing(null);
    }
  };

  const completeAppt = async (id) => {
    setActing(id);
    try {
      await doctorAPI.completeAppt(id);
      setAppts(p => p.map(a => a.id === id ? { ...a, status: 'completed' } : a));
      toast.success('Appointment marked as completed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="da-wrap">

        {/* Header */}
        <div className="da-header">
          <div>
            <h1 className="da-title">My Appointments</h1>
            <p className="da-sub">Manage patient appointments, confirm, complete, and write prescriptions</p>
          </div>
          <div className="da-count-badge">{appts.length} total</div>
        </div>

        {/* Tabs */}
        <div className="da-tabs">
          {TABS.map(t => {
            const count = t === 'all' ? appts.length : appts.filter(a => a.status === t).length;
            return (
              <button key={t} className={`da-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="da-tab-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? <div className="pd-spinner" /> :
          filtered.length === 0 ? (
            <div className="pd-empty">
              <p style={{ fontSize: 40 }}>📅</p>
              <p>No {tab === 'all' ? '' : tab} appointments</p>
            </div>
          ) : (
            <div className="da-list">
              {filtered.map(a => {
                const s   = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                const pat = a.patient?.user || {};
                const open = expanded === a.id;

                return (
                  <div key={a.id} className={`da-card ${open ? 'open' : ''}`}>

                    {/* Main row */}
                    <div className="da-card-main" onClick={() => setExpanded(open ? null : a.id)}>
                      <div className="da-pat-avatar">{pat.name?.[0] || 'P'}</div>

                      <div className="da-pat-info">
                        <p className="da-pat-name">{pat.name || 'Patient'}</p>
                        <div className="da-meta-row">
                          <span><Calendar size={12}/> {a.appointment_date}</span>
                          <span><Clock size={12}/> {a.appointment_time}</span>
                          <span>{a.type === 'video' ? <><Video size={12}/> Video</> : '🏥 In-person'}</span>
                        </div>
                      </div>

                      <div className="da-card-right">
                        <span className="da-status-badge" style={{ background: s.bg, color: s.color }}>
                          {a.status}
                        </span>
                        <p className="da-fee">Rs. {Number(a.fee).toLocaleString()}</p>
                      </div>

                      <button className="da-expand-btn">
                        {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {open && (
                      <div className="da-expanded">
                        <div className="da-detail-grid">
                          {/* Patient info */}
                          <div className="da-detail-section">
                            <p className="da-detail-title"><User size={14}/> Patient Details</p>
                            <div className="da-detail-rows">
                              <div className="da-detail-row"><span>Name</span><span>{pat.name || '—'}</span></div>
                              <div className="da-detail-row"><span>Email</span><span>{pat.email || '—'}</span></div>
                              {a.patient?.phone && <div className="da-detail-row"><span>Phone</span><span>{a.patient.phone}</span></div>}
                              {a.patient?.city  && <div className="da-detail-row"><span>City</span><span>{a.patient.city}</span></div>}
                            </div>
                          </div>

                          {/* Symptoms & notes */}
                          <div className="da-detail-section">
                            <p className="da-detail-title">📋 Clinical Info</p>
                            {a.symptoms ? (
                              <div className="da-symptoms-box">
                                <p className="da-symptoms-label">Symptoms</p>
                                <p className="da-symptoms-text">{a.symptoms}</p>
                              </div>
                            ) : <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No symptoms reported</p>}
                            {a.notes && (
                              <div className="da-symptoms-box" style={{ marginTop: 8, background: '#FFFBEB' }}>
                                <p className="da-symptoms-label">Notes</p>
                                <p className="da-symptoms-text">{a.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Payment status */}
                        <div className="da-pay-row">
                          <span className={`da-pay-badge ${a.is_paid ? 'paid' : 'unpaid'}`}>
                            {a.is_paid ? '✅ Paid' : '⏳ Payment Pending'}
                          </span>
                          {a.video_room_id && (
                            <span className="da-room-id">Room: {a.video_room_id}</span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="da-actions">
                          {a.status === 'pending' && (
                            <button className="da-btn-confirm"
                              onClick={() => confirmAppt(a.id)}
                              disabled={acting === a.id}>
                              {acting === a.id ? '...' : <><CheckCircle size={14}/> Confirm</>}
                            </button>
                          )}
                          {a.status === 'confirmed' && (
                            <button className="da-btn-complete"
                              onClick={() => completeAppt(a.id)}
                              disabled={acting === a.id}>
                              {acting === a.id ? '...' : <><CheckCircle size={14}/> Mark Completed</>}
                            </button>
                          )}
                          {a.status === 'completed' && !a.prescription && (
                            <Link to={`/doctor/write-prescription/${a.id}`} className="da-btn-rx">
                              <FileText size={14}/> Write Prescription
                            </Link>
                          )}
                          {a.status === 'completed' && a.prescription && (
                            <span className="da-rx-done">✅ Prescription written</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </DashboardLayout>
  );
}
