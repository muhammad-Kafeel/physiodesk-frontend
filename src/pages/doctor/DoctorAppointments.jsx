import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar, Clock, Video, CheckCircle, FileText,
  ChevronDown, ChevronUp, User, MapPin, ClipboardList,
  History, X, AlertCircle, Pill
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
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

  // H4 — "Mark as completed" confirmation. Holds the appointment id being
  // confirmed; null when the dialog is closed.
  const [completeTarget, setCompleteTarget] = useState(null);

  // H4 — Deep-link from a notification: ?expand=ID auto-opens that row.
  // H4.1 — ?tab=pending|confirmed|completed|cancelled pre-selects a tab so
  // dashboard stat cards can deep-link straight into the filtered list.
  const [searchParams] = useSearchParams();

  // Apply ?tab from the URL on first render (and whenever it changes).
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.includes(t)) setTab(t);
  }, [searchParams]);

  // Patient history modal state
  const [histOpen,    setHistOpen]    = useState(false);
  const [histLoading, setHistLoading] = useState(false);
  const [histData,    setHistData]    = useState(null);
  const [histError,   setHistError]   = useState(null);

  useEffect(() => {
    doctorAPI.getAppointments()
      .then(r => setAppts(r.data.data.data || []))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  // H4 — If we arrived via a notification deep-link (?expand=123), auto-open
  // that appointment as soon as we have it in state. Runs once per id change.
  useEffect(() => {
    const expand = searchParams.get('expand');
    if (!expand || loading) return;
    const id = Number(expand);
    if (appts.some((a) => a.id === id)) {
      setExpanded(id);
    }
  }, [searchParams, loading, appts]);

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
    // H4 — No more window.confirm; we open our styled ConfirmDialog instead.
    // The actual completion runs in handleCompleteConfirmed below.
    setCompleteTarget(id);
  };

  const handleCompleteConfirmed = async () => {
    const id = completeTarget;
    if (!id) return;
    setActing(id);
    try {
      await doctorAPI.completeAppt(id);
      setAppts(p => p.map(a => a.id === id ? { ...a, status: 'completed' } : a));
      toast.success('Appointment marked as completed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    } finally {
      setActing(null);
      setCompleteTarget(null);
    }
  };

  const openHistory = async (patientId, currentApptId) => {
    setHistOpen(true);
    setHistLoading(true);
    setHistData(null);
    setHistError(null);
    try {
      const r = await doctorAPI.patientHistory(patientId);
      const data = r.data.data;
      // Hide the appointment currently expanded — the doctor is already looking at it.
      data.appointments = (data.appointments || []).filter(a => a.id !== currentApptId);
      setHistData(data);
    } catch (err) {
      setHistError(err.response?.data?.message || 'Failed to load patient history');
    } finally {
      setHistLoading(false);
    }
  };

  const closeHistory = () => {
    setHistOpen(false);
    setHistData(null);
    setHistError(null);
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
              <Calendar size={48}/>
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
                          <span>{a.type === 'video' ? <><Video size={12}/> Video</> : <><MapPin size={12}/> In-person</>}</span>
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
                            <p className="da-detail-title"><ClipboardList size={14}/> Clinical Info</p>
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
                            {a.is_paid ? <><CheckCircle size={12}/> Paid</> : <><Clock size={12}/> Payment Pending</>}
                          </span>
                          {a.video_room_id && (
                            <span className="da-room-id">Room: {a.video_room_id}</span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="da-actions">
                          {/* View patient history is available for ANY status — the doctor has had at least this one appointment with them. */}
                          <button className="da-btn-history"
                            onClick={() => openHistory(a.patient?.id, a.id)}>
                            <History size={14}/> Patient History
                          </button>
                          {a.status === 'pending' && (
                            <button className="da-btn-confirm"
                              onClick={() => confirmAppt(a.id)}
                              disabled={acting === a.id}>
                              {acting === a.id ? '...' : <><CheckCircle size={14}/> Confirm</>}
                            </button>
                          )}
                          {a.status === 'confirmed' && a.type === 'video' && a.video_room_id && (
                            <Link to={`/video-call/${a.id}`} className="da-btn-video">
                              <Video size={14}/> Join Video Call
                            </Link>
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
                            <span className="da-rx-done"><CheckCircle size={13}/> Prescription written</span>
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

      {/* ── Patient History Modal ── */}
      {histOpen && (
        <div className="da-hist-overlay" onClick={closeHistory}>
          <div className="da-hist-modal" onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="da-hist-head">
              <div>
                <p className="da-hist-title">
                  <History size={18}/> Patient History
                </p>
                {histData?.patient?.user?.name && (
                  <p className="da-hist-sub">{histData.patient.user.name}</p>
                )}
              </div>
              <button className="da-hist-close" onClick={closeHistory}>
                <X size={18}/>
              </button>
            </div>

            {/* Modal body */}
            <div className="da-hist-body">
              {histLoading && (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div className="pd-spinner"/>
                  <p style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-400)' }}>Loading history...</p>
                </div>
              )}

              {histError && !histLoading && (
                <div className="da-hist-error">
                  <AlertCircle size={20}/>
                  <p>{histError}</p>
                </div>
              )}

              {histData && !histLoading && (
                <>
                  {/* Stats summary */}
                  <div className="da-hist-stats">
                    <div className="da-hist-stat">
                      <p className="da-hist-stat-val">{histData.stats.total}</p>
                      <p className="da-hist-stat-lbl">Total visits</p>
                    </div>
                    <div className="da-hist-stat">
                      <p className="da-hist-stat-val" style={{ color: 'var(--success)' }}>{histData.stats.completed}</p>
                      <p className="da-hist-stat-lbl">Completed</p>
                    </div>
                    <div className="da-hist-stat">
                      <p className="da-hist-stat-val" style={{ color: 'var(--danger)' }}>{histData.stats.cancelled}</p>
                      <p className="da-hist-stat-lbl">Cancelled</p>
                    </div>
                    <div className="da-hist-stat">
                      <p className="da-hist-stat-val" style={{ fontSize: 14 }}>{histData.stats.first_seen || '—'}</p>
                      <p className="da-hist-stat-lbl">First seen</p>
                    </div>
                  </div>

                  {/* Patient meta */}
                  {(histData.patient?.phone || histData.patient?.city || histData.patient?.user?.email) && (
                    <div className="da-hist-meta">
                      {histData.patient.user?.email && (
                        <div className="da-hist-meta-row"><span>Email</span><span>{histData.patient.user.email}</span></div>
                      )}
                      {histData.patient.phone && (
                        <div className="da-hist-meta-row"><span>Phone</span><span>{histData.patient.phone}</span></div>
                      )}
                      {histData.patient.city && (
                        <div className="da-hist-meta-row"><span>City</span><span>{histData.patient.city}</span></div>
                      )}
                      {histData.patient.date_of_birth && (
                        <div className="da-hist-meta-row"><span>DOB</span><span>{histData.patient.date_of_birth}</span></div>
                      )}
                      {histData.patient.blood_group && (
                        <div className="da-hist-meta-row"><span>Blood group</span><span>{histData.patient.blood_group}</span></div>
                      )}
                    </div>
                  )}

                  {/* Appointments list */}
                  <p className="da-hist-section-title">Past consultations with you</p>

                  {histData.appointments.length === 0 ? (
                    <div className="pd-empty" style={{ padding: 30 }}>
                      <Calendar size={36}/>
                      <p style={{ marginTop: 10, fontSize: 13 }}>This is your first consultation with this patient.</p>
                    </div>
                  ) : (
                    <div className="da-hist-list">
                      {histData.appointments.map(a => {
                        const s = STATUS_STYLE[a.status] || STATUS_STYLE.pending;
                        return (
                          <div key={a.id} className="da-hist-item">
                            <div className="da-hist-item-head">
                              <div className="da-hist-item-date">
                                <Calendar size={13}/>
                                <strong>{a.appointment_date}</strong>
                                <span style={{ color: 'var(--gray-400)' }}>· {a.appointment_time}</span>
                                <span>· {a.type === 'video' ? 'Video' : 'In-person'}</span>
                              </div>
                              <span className="da-status-badge" style={{ background: s.bg, color: s.color }}>
                                {a.status}
                              </span>
                            </div>

                            {a.symptoms && (
                              <div className="da-hist-block">
                                <p className="da-hist-block-label">Symptoms</p>
                                <p className="da-hist-block-text">{a.symptoms}</p>
                              </div>
                            )}

                            {a.prescription && (
                              <div className="da-hist-block da-hist-block-rx">
                                <p className="da-hist-block-label"><Pill size={11}/> Prescription</p>
                                {a.prescription.diagnosis && (
                                  <p className="da-hist-block-text"><strong>Dx:</strong> {a.prescription.diagnosis}</p>
                                )}
                                {Array.isArray(a.prescription.medicines) && a.prescription.medicines.length > 0 && (
                                  <ul className="da-hist-meds">
                                    {a.prescription.medicines.map((m, i) => (
                                      <li key={i}><strong>{m.name}</strong> — {m.dosage} · {m.duration}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {a.notes && (
                              <p className="da-hist-notes"><em>Notes:</em> {a.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* H4 — "Mark as completed" confirmation. Replaces the old window.confirm.
          The action is irreversible (it ends the consultation), so the dialog
          spells out the consequences and uses the primary variant. */}
      <ConfirmDialog
        open={completeTarget !== null}
        title="Mark appointment as completed?"
        message="This ends the consultation. Neither you nor the patient will be able to join the video call after this, and you'll be able to write the prescription."
        confirmLabel="Mark Completed"
        cancelLabel="Keep Open"
        variant="primary"
        busy={acting === completeTarget}
        onConfirm={handleCompleteConfirmed}
        onCancel={() => setCompleteTarget(null)}
      />
    </DashboardLayout>
  );
}

