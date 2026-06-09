import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Video, ChevronRight, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { doctorAPI, appointmentAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './BookAppointment.css';

const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

export default function BookAppointment() {
  const { id }                    = useParams();
  const [doctor,   setDoctor]     = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [saving,   setSaving]     = useState(false);
  const [date,     setDate]       = useState('');
  const [time,     setTime]       = useState('');
  const [type,     setType]       = useState('video');
  const [symptoms, setSymptoms]   = useState('');
  const [notes,    setNotes]      = useState('');
  const { user }                  = useAuth();
  const navigate                  = useNavigate();

  // min date = today
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    doctorAPI.getById(id)
      .then(r => setDoctor(r.data.data))
      .catch(() => { toast.error('Doctor not found'); navigate('/doctors'); })
      .finally(() => setLoading(false));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!date) { toast.error('Please select a date'); return; }
    if (!time) { toast.error('Please select a time slot'); return; }
    setSaving(true);
    try {
      const res = await appointmentAPI.book({
        doctor_id: doctor.id,
        appointment_date: date,
        appointment_time: time,
        type,
        symptoms,
        notes,
      });
      toast.success('Appointment booked! Proceed to payment.');
      navigate(`/payment/appointment/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="pd-spinner" style={{marginTop:80}} /></Layout>;
  if (!doctor)  return null;

  const u = doctor.user || {};

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Breadcrumb */}
        <div className="dd-breadcrumb">
          <Link to="/">Home</Link><ChevronRight size={13} />
          <Link to="/doctors">Doctors</Link><ChevronRight size={13} />
          <Link to={`/doctors/${doctor.id}`}>Dr. {u.name}</Link><ChevronRight size={13} />
          <span>Book Appointment</span>
        </div>

        <div className="ba-layout">

          {/* Left — booking form */}
          <div className="ba-form-wrap">
            <div className="ba-form-card">
              <h2 className="ba-title">Book an Appointment</h2>
              <p className="ba-sub">Fill in the details below to schedule your consultation</p>

              <form onSubmit={submit}>

                {/* Consultation type */}
                <div className="ba-field">
                  <label className="ba-label">Consultation Type</label>
                  <div className="ba-type-row">
                    {[
                      { val:'video',     icon:<Video size={18} />,    label:'Video Call',   sub:'Online from home' },
                      { val:'in_person', icon:<Calendar size={18} />, label:'In Person',    sub:'Visit clinic' },
                    ].map(t => (
                      <button key={t.val} type="button"
                        className={`ba-type-card ${type === t.val ? 'active' : ''}`}
                        onClick={() => setType(t.val)}>
                        <div className="ba-type-icon">{t.icon}</div>
                        <p className="ba-type-label">{t.label}</p>
                        <p className="ba-type-sub">{t.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date picker */}
                <div className="ba-field">
                  <label className="ba-label"><Calendar size={14} /> Select Date</label>
                  <input
                    type="date" min={today}
                    value={date} onChange={e => setDate(e.target.value)}
                    className="ba-input" required
                  />
                </div>

                {/* Time slots */}
                <div className="ba-field">
                  <label className="ba-label"><Clock size={14} /> Select Time</label>
                  <div className="ba-times-grid">
                    {TIMES.map(t => (
                      <button key={t} type="button"
                        className={`ba-time-btn ${time === t ? 'active' : ''}`}
                        onClick={() => setTime(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms */}
                <div className="ba-field">
                  <label className="ba-label">Describe Your Symptoms <span className="ba-optional">(optional)</span></label>
                  <textarea
                    value={symptoms} onChange={e => setSymptoms(e.target.value)}
                    rows={3} placeholder="e.g. Lower back pain for 2 weeks, pain worsens when sitting..."
                    className="ba-textarea"
                  />
                </div>

                {/* Notes */}
                <div className="ba-field">
                  <label className="ba-label">Additional Notes <span className="ba-optional">(optional)</span></label>
                  <textarea
                    value={notes} onChange={e => setNotes(e.target.value)}
                    rows={2} placeholder="Any special requirements..."
                    className="ba-textarea"
                  />
                </div>

                {/* Note */}
                <div className="ba-notice">
                  <AlertCircle size={15} />
                  <p>Payment will be collected after the doctor confirms your appointment.</p>
                </div>

                <button type="submit" className="ba-submit" disabled={saving}>
                  {saving ? <span className="auth-spinner" /> : <><Calendar size={16} /> Confirm Booking</>}
                </button>
              </form>
            </div>
          </div>

          {/* Right — doctor summary */}
          <div className="ba-summary">
            <div className="ba-doctor-card">
              <p className="ba-summary-title">Booking Summary</p>
              <div className="ba-doc-info">
                {doctor.profile_photo
                  ? <img src={`http://localhost:8000/storage/${doctor.profile_photo}`} alt={u.name} className="ba-doc-photo" />
                  : <div className="ba-doc-placeholder">{u.name?.[0]}</div>
                }
                <div>
                  <p className="ba-doc-name">Dr. {u.name}</p>
                  <p className="ba-doc-spec">{doctor.specialization}</p>
                  <p className="ba-doc-qual">{doctor.qualification}</p>
                </div>
              </div>
              <div className="ba-summary-items">
                <div className="ba-summary-item">
                  <span>Consultation Type</span>
                  <span className="ba-summary-val">{type === 'video' ? '📹 Video Call' : '🏥 In Person'}</span>
                </div>
                <div className="ba-summary-item">
                  <span>Date</span>
                  <span className="ba-summary-val">{date || '—'}</span>
                </div>
                <div className="ba-summary-item">
                  <span>Time</span>
                  <span className="ba-summary-val">{time || '—'}</span>
                </div>
                <div className="ba-summary-divider" />
                <div className="ba-summary-item ba-summary-total">
                  <span>Consultation Fee</span>
                  <span className="ba-fee">Rs. {Number(doctor.consultation_fee).toLocaleString()}</span>
                </div>
              </div>
              <p className="ba-payment-note">💳 Payment via JazzCash, EasyPaisa, or Bank Transfer</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
