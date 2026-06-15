import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Video, ChevronRight, AlertCircle, MapPin, CreditCard } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { doctorAPI, appointmentAPI } from '../../api/services';
import { storageUrl } from '../../utils/helpers'; // F20
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './BookAppointment.css';

// F09 — Generate 30-min intervals between a start and end time string "HH:MM"
function generateSlots(startStr, endStr) {
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const slots = [];
  let cur = sh * 60 + sm;
  const end = eh * 60 + em;
  while (cur + 30 <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
    cur += 30;
  }
  return slots;
}

// Maps JS getDay() (0=Sun) to our day_of_week strings
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
  const [takenTimes, setTakenTimes] = useState([]);
  const { user }                  = useAuth();
  const navigate                  = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  // F24 — navigate is now in the dependency array
  useEffect(() => {
    if (!user) { navigate('/patient/login'); return; }
    doctorAPI.getById(id)
      .then(r => setDoctor(r.data.data))
      .catch(() => { toast.error('Doctor not found'); navigate('/doctors'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // F09 — Derive the doctor's full slot list for the chosen weekday (before removing
  // already-booked times), so we can tell "doesn't work this day" apart from "all booked".
  const daySlots = useMemo(() => {
    // The API serialises the relation as snake_case `time_slots`; the camelCase
    // fallback keeps this working if a future endpoint returns it differently.
    const slots = doctor?.time_slots || doctor?.timeSlots || [];
    if (!date || !slots.length) return [];
    const dayName = DAY_NAMES[new Date(date + 'T00:00:00').getDay()];
    const dayRows = slots.filter(
      s => s.day_of_week === dayName && s.is_available
    );
    const allTimes = [];
    dayRows.forEach(s => {
      generateSlots(s.start_time.slice(0, 5), s.end_time.slice(0, 5))
        .forEach(t => allTimes.push(t));
    });
    return [...new Set(allTimes)].sort();
  }, [date, doctor]);

  // Bookable times = the day's slots minus the ones already taken.
  const availableSlots = useMemo(
    () => daySlots.filter(t => !takenTimes.includes(t)),
    [daySlots, takenTimes]
  );

  // Clear selected time when date changes and slots differ
  useEffect(() => {
    if (time && !availableSlots.includes(time)) setTime('');
  }, [availableSlots]);

  // Pull already-booked times for the chosen date so taken slots aren't offered.
  // Falls back silently to the client-computed slots if the request fails.
  useEffect(() => {
    if (!date || !doctor) { setTakenTimes([]); return; }
    let cancelled = false;
    doctorAPI.getAvailability(doctor.id, date)
      .then(r => { if (!cancelled) setTakenTimes(r.data?.data?.taken || []); })
      .catch(() => { if (!cancelled) setTakenTimes([]); });
    return () => { cancelled = true; };
  }, [date, doctor]);

  const submit = async (e) => {
    e.preventDefault();
    if (!date) { toast.error('Please select a date'); return; }
    if (!time) { toast.error('Please select a time slot'); return; }
    setSaving(true);
    try {
      await appointmentAPI.book({
        doctor_id: doctor.id,
        appointment_date: date,
        appointment_time: time,
        type,
        symptoms,
        notes,
      });
      toast.success("Appointment requested! You'll be able to pay once the doctor confirms it.");
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="pd-spinner" style={{ marginTop: 80 }} /></Layout>;
  if (!doctor)  return null;

  const u = doctor.user || {};

  return (
    <Layout>
      <div className="pd-container pd-section">

        <div className="dd-breadcrumb">
          <Link to="/">Home</Link><ChevronRight size={13} />
          <Link to="/doctors">Doctors</Link><ChevronRight size={13} />
          <Link to={`/doctors/${doctor.id}`}>Dr. {u.name}</Link><ChevronRight size={13} />
          <span>Book Appointment</span>
        </div>

        <div className="ba-layout">
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
                      { val: 'video',     icon: <Video size={18} />,    label: 'Video Call',  sub: 'Online from home' },
                      { val: 'in_person', icon: <Calendar size={18} />, label: 'In Person',   sub: 'Visit clinic' },
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
                    value={date} onChange={e => { setDate(e.target.value); setTime(''); }}
                    className="ba-input" required
                  />
                </div>

                {/* F09 — Dynamic time slots from doctor's schedule */}
                <div className="ba-field">
                  <label className="ba-label"><Clock size={14} /> Select Time</label>
                  {!date ? (
                    <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Please select a date first.</p>
                  ) : daySlots.length === 0 ? (
                    <div className="ba-notice" style={{ marginTop: 0 }}>
                      <AlertCircle size={15} />
                      <p>Dr. {u.name} isn't available on this day. Please pick another date.</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="ba-notice" style={{ marginTop: 0 }}>
                      <AlertCircle size={15} />
                      <p>All time slots for this day are already booked. Please try another date.</p>
                    </div>
                  ) : (
                    <div className="ba-times-grid">
                      {availableSlots.map(t => (
                        <button key={t} type="button"
                          className={`ba-time-btn ${time === t ? 'active' : ''}`}
                          onClick={() => setTime(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Symptoms */}
                <div className="ba-field">
                  <label className="ba-label">Describe Your Symptoms <span className="ba-optional">(optional)</span></label>
                  <textarea
                    value={symptoms} onChange={e => setSymptoms(e.target.value)}
                    rows={3} placeholder="e.g. Lower back pain for 2 weeks..."
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

                <div className="ba-notice">
                  <AlertCircle size={15} />
                  <p>Payment will be collected after the doctor confirms your appointment.</p>
                </div>

                <button type="submit" className="ba-submit" disabled={saving || !time}>
                  {saving ? <span className="auth-spinner" /> : <><Calendar size={16} /> Confirm Booking</>}
                </button>
              </form>
            </div>
          </div>

          {/* Doctor summary */}
          <div className="ba-summary">
            <div className="ba-doctor-card">
              <p className="ba-summary-title">Booking Summary</p>
              <div className="ba-doc-info">
                {doctor.profile_photo
                  // F20 — Use storageUrl helper instead of hardcoded localhost
                  ? <img src={storageUrl(doctor.profile_photo)} alt={u.name} className="ba-doc-photo" />
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
                  <span>Type</span>
                  <span className="ba-summary-val">
                    {type === 'video' ? <><Video size={13} /> Video Call</> : <><MapPin size={13} /> In Person</>}
                  </span>
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
              <p className="ba-payment-note"><CreditCard size={13} /> JazzCash or Bank Transfer</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
