import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Video, Award, CheckCircle,
  ArrowLeft, Calendar, MessageSquare, ThumbsUp,
  User, Activity, Stethoscope
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { doctorAPI, reviewAPI, appointmentAPI } from '../../api/services';
import { storageUrl } from '../../utils/helpers'; // F20
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './DoctorDetail.css';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="dd2-stars">
      {[1,2,3,4,5].map(n => (
        <span key={n}
          className={`dd2-star ${n <= (hovered || value) ? 'filled' : ''} ${readonly ? 'readonly' : ''}`}
          onClick={() => !readonly && onChange && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function DoctorDetail() {
  const { id }        = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const [doctor,      setDoctor]      = useState(null);
  const [reviews,     setReviews]     = useState([]);
  const [myAppts,     setMyAppts]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('about');
  const [rating,      setRating]      = useState(0);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [selectedAppt,setSelectedAppt]= useState('');

  useEffect(() => {
    Promise.all([
      doctorAPI.getById(id),
      reviewAPI.getDoctorReviews(id),
    ]).then(([d, r]) => {
      setDoctor(d.data.data);
      setReviews(r.data.data.data || []);
    }).catch(() => navigate('/doctors'))
      .finally(() => setLoading(false));

    // Load patient's completed appointments with this doctor (for review form)
    if (user?.role === 'patient') {
      appointmentAPI.myAppointments()
        .then(r => {
          const completed = (r.data.data.data || []).filter(
            a => a.doctor_id == id && a.status === 'completed' && !a.review
          );
          setMyAppts(completed);
          if (completed.length > 0) setSelectedAppt(completed[0].id);
        })
        .catch(() => {});
    }
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating)        { toast.error('Please select a rating'); return; }
    if (!selectedAppt)  { toast.error('No eligible appointment found'); return; }
    setSubmitting(true);
    try {
      await reviewAPI.create(selectedAppt, { rating, comment });
      toast.success('Review submitted! Thank you.');
      setRating(0); setComment('');
      // Reload reviews
      const r = await reviewAPI.getDoctorReviews(id);
      setReviews(r.data.data.data || []);
      setMyAppts(p => p.filter(a => a.id != selectedAppt));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="dd2-skeleton">
          <div className="dd2-skel-card" />
          <div className="dd2-skel-body" />
        </div>
      </div>
    </Layout>
  );

  if (!doctor) return null;

  const photoSrc = doctor.profile_photo
    ? storageUrl(doctor.profile_photo)  // F20
    : null;

  const slotsByDay = DAYS.reduce((acc, day) => {
    const slots = (doctor.time_slots || []).filter(s => s.day_of_week === day);
    if (slots.length) acc[day] = slots;
    return acc;
  }, {});

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Back */}
        <button className="dd2-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Doctors
        </button>

        <div className="dd2-layout">

          {/* LEFT — Profile card */}
          <div className="dd2-left">
            <div className="dd2-profile-card">

              {/* Photo */}
              <div className="dd2-photo-wrap">
                {photoSrc
                  ? <img src={photoSrc} alt={doctor.user?.name} className="dd2-photo" />
                  : <div className="dd2-photo-placeholder"><Stethoscope size={40} color="white"/></div>
                }
                {doctor.is_verified && (
                  <span className="dd2-verified"><CheckCircle size={13}/> Verified</span>
                )}
              </div>

              {/* Info */}
              <h1 className="dd2-name">Dr. {doctor.user?.name}</h1>
              <p className="dd2-spec">{doctor.specialization}</p>
              <p className="dd2-qual">{doctor.qualification}</p>

              {/* Rating */}
              {avgRating && (
                <div className="dd2-rating-row">
                  <StarRating value={Math.round(avgRating)} readonly />
                  <span className="dd2-rating-val">{avgRating}</span>
                  <span className="dd2-rating-count">({reviews.length} reviews)</span>
                </div>
              )}

              {/* Tags */}
              <div className="dd2-tags">
                {doctor.experience_years && (
                  <span className="dd2-tag"><Award size={12}/> {doctor.experience_years}+ yrs exp</span>
                )}
                {doctor.city && (
                  <span className="dd2-tag"><MapPin size={12}/> {doctor.city}</span>
                )}
                <span className="dd2-tag"><Video size={12}/> Video & In-person</span>
              </div>

              <div className="dd2-divider" />

              {/* Fee & Book */}
              <div className="dd2-fee-row">
                <div>
                  <p className="dd2-fee-label">Consultation Fee</p>
                  <p className="dd2-fee-val">Rs. {Number(doctor.consultation_fee).toLocaleString()}</p>
                </div>
              </div>

              {user
                ? doctor.is_verified && doctor.is_available
                  ? <Link to={`/book/${id}`} className="btn-primary-pd dd2-book-btn">
                      <Calendar size={15}/> Book Appointment
                    </Link>
                  : <div className="dd2-unavailable">Currently unavailable</div>
                : <Link to="/login" className="btn-primary-pd dd2-book-btn">
                    Login to Book
                  </Link>
              }
            </div>
          </div>

          {/* RIGHT — Tabs */}
          <div className="dd2-right">

            {/* Tabs */}
            <div className="dd2-tabs">
              {[
                { key: 'about',        label: 'About',           icon: <User size={14}/> },
                { key: 'availability', label: 'Availability',    icon: <Clock size={14}/> },
                { key: 'reviews',      label: `Reviews (${reviews.length})`, icon: <Star size={14}/> },
              ].map(t => (
                <button key={t.key}
                  className={`dd2-tab ${tab === t.key ? 'active' : ''}`}
                  onClick={() => setTab(t.key)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── About Tab ── */}
            {tab === 'about' && (
              <div className="dd2-tab-content">
                {doctor.bio && (
                  <div className="dd2-section">
                    <p className="dd2-section-title">About</p>
                    <p className="dd2-bio">{doctor.bio}</p>
                  </div>
                )}

                <div className="dd2-section">
                  <p className="dd2-section-title">Professional Details</p>
                  <div className="dd2-details-grid">
                    {[
                      ['Specialization', doctor.specialization],
                      ['Qualification',  doctor.qualification],
                      ['Experience',     `${doctor.experience_years} years`],
                      ['PMDC Number',    doctor.pmdc_number],
                      ['Gender',         doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : '—'],
                      ['City',           doctor.city || '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="dd2-detail-row">
                        <span className="dd2-detail-label">{k}</span>
                        <span className="dd2-detail-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Availability Tab ── */}
            {tab === 'availability' && (
              <div className="dd2-tab-content">
                <p className="dd2-section-title">
                  <Clock size={15}/> Weekly Availability
                </p>
                {Object.keys(slotsByDay).length === 0 ? (
                  <div className="pd-empty" style={{ padding: '40px 0' }}>
                    <Clock size={32}/>
                    <p style={{ marginTop: 10 }}>No time slots added yet</p>
                  </div>
                ) : (
                  <div className="dd2-slots">
                    {DAYS.filter(d => slotsByDay[d]).map(day => (
                      <div key={day} className="dd2-slot-day">
                        <p className="dd2-slot-day-label">
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </p>
                        <div className="dd2-slot-chips">
                          {slotsByDay[day].map(slot => (
                            <span key={slot.id} className="dd2-slot-chip">
                              <Clock size={11}/> {slot.start_time} – {slot.end_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {doctor.is_verified && doctor.is_available && (
                  <div className="dd2-avail-cta">
                    <ThumbsUp size={16} color="#16A34A"/>
                    <span>Available for consultations</span>
                    {user
                      ? <Link to={`/book/${id}`} className="btn-primary-pd" style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 13 }}>
                          Book Now
                        </Link>
                      : <Link to="/login" className="btn-primary-pd" style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 13 }}>
                          Login to Book
                        </Link>
                    }
                  </div>
                )}
              </div>
            )}

            {/* ── Reviews Tab ── */}
            {tab === 'reviews' && (
              <div className="dd2-tab-content">

                {/* Summary */}
                {reviews.length > 0 && (
                  <div className="dd2-review-summary">
                    <div className="dd2-avg-score">
                      <p className="dd2-avg-num">{avgRating}</p>
                      <StarRating value={Math.round(avgRating)} readonly />
                      <p className="dd2-avg-count">{reviews.length} reviews</p>
                    </div>
                    <div className="dd2-rating-bars">
                      {[5,4,3,2,1].map(n => {
                        const count = reviews.filter(r => r.rating === n).length;
                        const pct   = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                          <div key={n} className="dd2-rating-bar-row">
                            <span className="dd2-rbar-label">{n} ★</span>
                            <div className="dd2-rbar-track">
                              <div className="dd2-rbar-fill" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="dd2-rbar-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Write review form — only for patients with completed appts */}
                {user?.role === 'patient' && myAppts.length > 0 && (
                  <div className="dd2-review-form">
                    <p className="dd2-section-title">
                      <MessageSquare size={15}/> Write a Review
                    </p>
                    <form onSubmit={submitReview}>
                      {myAppts.length > 1 && (
                        <div className="dd2-field">
                          <label className="dd2-label">Select Appointment</label>
                          <select className="dd2-input" value={selectedAppt}
                            onChange={e => setSelectedAppt(e.target.value)}>
                            {myAppts.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.appointment_date} at {a.appointment_time}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="dd2-field">
                        <label className="dd2-label">Your Rating *</label>
                        <StarRating value={rating} onChange={setRating} />
                      </div>
                      <div className="dd2-field">
                        <label className="dd2-label">Your Review</label>
                        <textarea className="dd2-input dd2-textarea" rows={4}
                          value={comment} onChange={e => setComment(e.target.value)}
                          placeholder="Share your experience with Dr. {doctor.user?.name}..." />
                      </div>
                      <button type="submit" className="btn-primary-pd" disabled={submitting}>
                        {submitting ? '...' : <><Star size={14}/> Submit Review</>}
                      </button>
                    </form>
                  </div>
                )}

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <div className="pd-empty" style={{ padding: '40px 0' }}>
                    <Star size={32}/>
                    <p style={{ marginTop: 10 }}>No reviews yet — be the first!</p>
                  </div>
                ) : (
                  <div className="dd2-reviews-list">
                    {reviews.map(r => (
                      <div key={r.id} className="dd2-review-card">
                        <div className="dd2-review-header">
                          <div className="dd2-reviewer-avatar">
                            {r.patient?.user?.name?.[0] || 'P'}
                          </div>
                          <div className="dd2-reviewer-info">
                            <p className="dd2-reviewer-name">
                              {r.patient?.user?.name || 'Patient'}
                            </p>
                            <p className="dd2-review-date">
                              {new Date(r.created_at).toLocaleDateString('en-PK', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}
                            </p>
                          </div>
                          <StarRating value={r.rating} readonly />
                        </div>
                        {r.comment && (
                          <p className="dd2-review-comment">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
