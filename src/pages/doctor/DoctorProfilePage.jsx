import { useState, useEffect } from 'react';
import {
  Save, Plus, Trash2, Clock, CheckCircle, AlertCircle, Upload,
  Stethoscope, ShieldCheck, ShieldAlert, ShieldX, Copy, X, CalendarOff, Eye, EyeOff,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { doctorAPI } from '../../api/services';
import { storageUrl } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './DoctorProfilePage.css';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday'];
const SPECS = [
  'Physiotherapist','Orthopedic Surgeon','Neurologist','Sports Medicine',
  'Rheumatologist','Chiropractor','Physical Therapist','Pain Management',
];
const SLOT_DURATION_CHOICES = [15, 30, 45, 60]; // H2.#9 — fixed durations

export default function DoctorProfilePage() {
  const [searchParams]   = useSearchParams();
  const isWelcome        = searchParams.get('welcome') === '1';
  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [photoFile,  setPhotoFile]  = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [degreeFile, setDegreeFile] = useState(null);
  const [licenseFile,setLicenseFile]= useState(null);
  const [activeTab,  setActiveTab]  = useState('profile');

  /* Slot form */
  const [slotDay,    setSlotDay]    = useState('monday');
  const [slotStart,  setSlotStart]  = useState('09:00');
  const [slotEnd,    setSlotEnd]    = useState('10:00');
  const [addingSlot, setAddingSlot] = useState(false);

  /* H2.#9 — Copy-day and clear-day state */
  const [copySource,  setCopySource]  = useState('monday');
  const [copyTargets, setCopyTargets] = useState({ tuesday: true, wednesday: true, thursday: true, friday: true });
  const [copying,     setCopying]     = useState(false);
  const [clearDayTarget, setClearDayTarget] = useState(null); // confirm dialog

  /* H2.#10 — Leave (unavailable dates) state */
  const [unavailDates,    setUnavailDates]    = useState([]);
  const [leaveDate,       setLeaveDate]       = useState('');
  const [leaveReason,     setLeaveReason]     = useState('');
  const [leaveReasonPublic, setLeaveReasonPublic] = useState(false);
  const [addingLeave,     setAddingLeave]     = useState(false);
  const [deleteLeaveTarget, setDeleteLeaveTarget] = useState(null);

  /* H2.#13 — Resubmit verification */
  const [resubmitting, setResubmitting] = useState(false);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);

  const [form, setForm] = useState({
    specialization: '', pmdc_number: '', experience_years: '',
    qualification: '', consultation_fee: '', gender: 'male',
    phone: '', city: '', bio: '', is_available: true,
    slot_duration: 30, // H2.#9
  });

  /**
   * H2 — Field-level validation errors from the backend.
   *
   * Shape: { field_name: 'message string', ... }
   *
   * Laravel's validator returns errors as { field: [msg1, msg2] } and our
   * ApiResponse trait passes them through unchanged. We flatten to a single
   * string per field for display — the first error is the most relevant and
   * showing multiple at once is noise on a form that hasn't even been resaved.
   *
   * Cleared when:
   *   - The whole form is resaved (handleSubmit clears it before the new request)
   *   - The user edits the offending field (so the red message disappears as
   *     they fix things, not only on the next failed submit)
   */
  const [fieldErrors, setFieldErrors] = useState({});

  // Helper used by every input's onChange below — it both updates the form
  // state AND clears the corresponding inline error message. This is the
  // behaviour every real form has: edit a bad field, the red note vanishes.
  const setField = (name, value) => {
    setForm(p => ({ ...p, [name]: value }));
    setFieldErrors(prev => {
      if (!prev[name]) return prev; // no error to clear
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const hydrateFromProfile = (p) => {
    setProfile(p);
    if (p) {
      setForm({
        specialization:   p.specialization   || '',
        pmdc_number:      p.pmdc_number       || '',
        experience_years: p.experience_years  || '',
        qualification:    p.qualification     || '',
        consultation_fee: p.consultation_fee  || '',
        gender:           p.gender            || 'male',
        phone:            p.phone             || '',
        city:             p.city              || '',
        bio:              p.bio               || '',
        is_available:     p.is_available ?? true,
        slot_duration:    SLOT_DURATION_CHOICES.includes(Number(p.slot_duration)) ? Number(p.slot_duration) : 30,
      });
      // unavailable_dates may come in via the load relation OR as a separate fetch
      setUnavailDates(p.unavailable_dates || []);
    }
  };

  useEffect(() => {
    doctorAPI.getMyProfile()
      .then(r => hydrateFromProfile(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const buildFormData = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photoFile)   fd.append('profile_photo', photoFile);
    if (degreeFile)  fd.append('degree_file',   degreeFile);
    if (licenseFile) fd.append('license_file',  licenseFile);
    return fd;
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    // H2 — Reset inline errors at the start of every submit so old red
    // messages don't linger if the new attempt succeeds (or fails on
    // different fields).
    setFieldErrors({});
    try {
      const fd = buildFormData();
      if (profile) {
        await doctorAPI.updateProfile(fd);
        toast.success('Profile updated successfully!');
      } else {
        await doctorAPI.createProfile(fd);
        toast.success('Profile created! Awaiting admin verification.');
      }
      const r = await doctorAPI.getMyProfile();
      hydrateFromProfile(r.data.data);
      // Clear staged files so subsequent saves don't re-upload them
      setDegreeFile(null); setLicenseFile(null);
      setPhotoFile(null);  setPhotoPreview(null);
    } catch (err) {
      // H2 — Backend sends Laravel's per-field errors at err.response.data.errors
      // shaped as { field: [msg1, msg2] }. Flatten to first message per field
      // for display, then show a concise toast that tells the user where to look.
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const flat = {};
        Object.entries(apiErrors).forEach(([k, v]) => {
          flat[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setFieldErrors(flat);
        toast.error('Please fix the highlighted fields below.');
      } else {
        const msg = err.response?.data?.message || 'Failed to save profile';
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ── Slots: add / delete / copy / clear ─────────────────────────────── */

  const addSlot = async () => {
    if (!profile) { toast.error('Create your profile first'); return; }
    setAddingSlot(true);
    try {
      const res = await doctorAPI.addTimeSlot({ day_of_week: slotDay, start_time: slotStart, end_time: slotEnd });
      setProfile(p => ({ ...p, time_slots: [...(p.time_slots || []), res.data.data] }));
      toast.success('Time slot added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add slot');
    } finally {
      setAddingSlot(false);
    }
  };

  const deleteSlot = async (id) => {
    try {
      await doctorAPI.deleteTimeSlot(id);
      setProfile(p => ({ ...p, time_slots: p.time_slots.filter(s => s.id !== id) }));
      toast.success('Slot removed');
    } catch {
      toast.error('Failed to remove slot');
    }
  };

  // H2.#9 — Copy a source day's slots onto checked target days.
  const copyDay = async () => {
    const targets = Object.entries(copyTargets).filter(([, v]) => v).map(([k]) => k);
    if (targets.length === 0) { toast.error('Pick at least one target day'); return; }
    setCopying(true);
    try {
      const res = await doctorAPI.copyTimeSlots({ source_day: copySource, target_days: targets });
      const { inserted, skipped, time_slots } = res.data.data;
      setProfile(p => ({ ...p, time_slots }));
      toast.success(
        skipped > 0
          ? `Copied ${inserted}. Skipped ${skipped} (overlapping existing slots).`
          : `Copied ${inserted} slot(s).`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to copy slots');
    } finally {
      setCopying(false);
    }
  };

  const confirmClearDay = async () => {
    const day = clearDayTarget;
    if (!day) return;
    try {
      const res = await doctorAPI.clearDayTimeSlots({ day_of_week: day });
      setProfile(p => ({ ...p, time_slots: res.data.data.time_slots }));
      toast.success(res.data.message || `Cleared ${day}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear day');
    } finally {
      setClearDayTarget(null);
    }
  };

  /* ── Leave / unavailable dates ──────────────────────────────────────── */

  const addLeave = async () => {
    if (!leaveDate) { toast.error('Pick a date'); return; }
    setAddingLeave(true);
    try {
      const res = await doctorAPI.addUnavailableDate({
        date: leaveDate,
        reason: leaveReason || null,
        is_reason_public: leaveReasonPublic,
      });
      setUnavailDates(res.data.data.unavailable_dates || []);
      toast.success(res.data.message || 'Leave date added');
      setLeaveDate(''); setLeaveReason(''); setLeaveReasonPublic(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add leave');
    } finally {
      setAddingLeave(false);
    }
  };

  const confirmDeleteLeave = async () => {
    const id = deleteLeaveTarget;
    if (!id) return;
    try {
      const res = await doctorAPI.deleteUnavailableDate(id);
      setUnavailDates(res.data.data.unavailable_dates || []);
      toast.success('Leave date removed');
    } catch {
      toast.error('Failed to remove leave date');
    } finally {
      setDeleteLeaveTarget(null);
    }
  };

  /* ── Resubmit for verification ──────────────────────────────────────── */

  const doResubmit = async () => {
    setResubmitting(true);
    try {
      const res = await doctorAPI.resubmitVerification();
      hydrateFromProfile(res.data.data);
      toast.success(res.data.message || 'Resubmitted for verification');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setResubmitting(false);
      setShowResubmitConfirm(false);
    }
  };

  const photoSrc = photoPreview
    || (profile?.profile_photo ? storageUrl(profile.profile_photo) : null);

  if (loading) return <DashboardLayout><div className="pd-spinner" style={{ marginTop: 60 }} /></DashboardLayout>;

  /* Verification state derived from profile flags. The three cases are:
   *  - verified:  is_verified === true
   *  - rejected:  is_verified === false AND rejected_reason is set
   *  - pending:   is_verified === false AND no rejection reason
   */
  const isVerified = !!profile?.is_verified;
  const isRejected = !isVerified && !!profile?.rejected_reason;
  const isPending  = !isVerified && !isRejected && !!profile;

  return (
    <DashboardLayout>
      <div className="dp-wrap">

        {/* Welcome banner for new doctor registrations */}
        {isWelcome && (
          <div style={{
            background: 'linear-gradient(135deg, #0F766E, #0E7490)',
            borderRadius: 14, padding: '20px 24px',
            marginBottom: 20, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                Account created successfully!
              </p>
              <p style={{ fontSize: 13, opacity: .85 }}>
                Now complete your doctor profile below. Upload your PMDC license &amp; degree,
                set your fee, and submit for admin verification.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['Complete profile', 'Admin verifies (24–48 hr)', 'Go live!'].map((step, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 18px' }}>
                  <p style={{ fontSize: 20, fontWeight: 800 }}>{i + 1}</p>
                  <p style={{ fontSize: 11, opacity: .8 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="dp-header">
          <div>
            <h1 className="dp-title">Doctor Profile</h1>
            <p className="dp-sub">{profile ? 'Manage your professional information' : 'Complete your profile to start receiving patients'}</p>
          </div>
        </div>

        {/* H2.#13 — Verification status card. Always visible once a profile exists,
            with state-specific colour, message and call-to-action. */}
        {profile && (
          <div className={`dp-verify-card dp-verify-${isVerified ? 'ok' : isRejected ? 'rejected' : 'pending'}`}>
            <div className="dp-verify-icon">
              {isVerified  && <ShieldCheck size={22}/>}
              {isPending   && <ShieldAlert size={22}/>}
              {isRejected  && <ShieldX size={22}/>}
            </div>
            <div className="dp-verify-body">
              <p className="dp-verify-title">
                {isVerified  && 'Profile verified'}
                {isPending   && 'Pending verification'}
                {isRejected  && 'Verification rejected'}
              </p>
              <p className="dp-verify-msg">
                {isVerified  && 'You are visible to patients and can receive appointments.'}
                {isPending   && 'An admin is reviewing your documents. This usually takes 24–48 hours.'}
                {isRejected  && (
                  <>
                    <strong>Reason:</strong> {profile.rejected_reason}<br/>
                    Update the relevant fields / documents below and click <strong>Resubmit</strong>.
                  </>
                )}
              </p>
            </div>
            {isRejected && (
              <button
                className="btn-primary-pd"
                type="button"
                onClick={() => setShowResubmitConfirm(true)}
                disabled={resubmitting}
              >
                {resubmitting ? '…' : 'Resubmit for Verification'}
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="dp-tabs">
          {['profile','slots','leave'].map(t => (
            <button key={t} className={`dp-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'profile' ? 'Profile Info' : t === 'slots' ? 'Time Slots' : 'Leave / Unavailable'}
            </button>
          ))}
        </div>

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <form onSubmit={saveProfile} className="dp-form-card">

            {/* Photo */}
            <div className="dp-photo-row">
              <div className="dp-photo-wrap">
                {photoSrc
                  ? <img src={photoSrc} alt="Profile" className="dp-photo" />
                  : <div className="dp-photo-placeholder"><Stethoscope size={32} color="white"/></div>
                }
                <label className="dp-photo-upload">
                  <Upload size={14}/> Change Photo
                  <input type="file" accept="image/*" onChange={handlePhoto} hidden />
                </label>
              </div>
              <div className="dp-photo-info">
                <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Profile Photo</p>
                <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>JPG or PNG, max 2MB</p>

                {/* H2.#11 — Availability toggle is now ALWAYS visible, not gated on
                    verification. Pre-verified doctors can set it in advance so the
                    moment they're verified, the toggle's already where they want it. */}
                {profile && (
                  <div className="dp-avail-toggle">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                      Available for appointments
                    </label>
                    <input type="checkbox"
                      checked={form.is_available}
                      onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))}
                    />
                    {!isVerified && (
                      <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 4, gridColumn: '1 / -1' }}>
                        You'll only start receiving bookings once your profile is verified — but you can set this in advance.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="dp-divider" />

            {/* Fields */}
            <div className="dp-grid-2">
              <div className="dp-field">
                <label className="dp-label">Full Name</label>
                <input className="dp-input" value="(from your account)" disabled />
              </div>
              <div className="dp-field">
                <label className="dp-label">PMDC Number *</label>
                <input className={`dp-input ${fieldErrors.pmdc_number ? 'dp-input-error' : ''}`}
                  value={form.pmdc_number}
                  onChange={e => setField('pmdc_number', e.target.value)}
                  placeholder="e.g. PMDC-12345" required disabled={!!profile} />
                {fieldErrors.pmdc_number
                  ? <p className="dp-error">{fieldErrors.pmdc_number}</p>
                  : profile && <p className="dp-hint">Cannot be changed after creation</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">Specialization *</label>
                <select className={`dp-input ${fieldErrors.specialization ? 'dp-input-error' : ''}`}
                  value={form.specialization}
                  onChange={e => setField('specialization', e.target.value)} required>
                  <option value="">Select specialization</option>
                  {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.specialization && <p className="dp-error">{fieldErrors.specialization}</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">Qualification *</label>
                <input className={`dp-input ${fieldErrors.qualification ? 'dp-input-error' : ''}`}
                  value={form.qualification}
                  onChange={e => setField('qualification', e.target.value)}
                  placeholder="e.g. MBBS, DPT, MSPT" required />
                {fieldErrors.qualification && <p className="dp-error">{fieldErrors.qualification}</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">Experience (years) *</label>
                <input className={`dp-input ${fieldErrors.experience_years ? 'dp-input-error' : ''}`}
                  type="number" min="0" max="60" value={form.experience_years}
                  onChange={e => setField('experience_years', e.target.value)} required />
                {fieldErrors.experience_years && <p className="dp-error">{fieldErrors.experience_years}</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">Consultation Fee (PKR) *</label>
                <input className={`dp-input ${fieldErrors.consultation_fee ? 'dp-input-error' : ''}`}
                  type="number" min="0" value={form.consultation_fee}
                  onChange={e => setField('consultation_fee', e.target.value)} required />
                {fieldErrors.consultation_fee && <p className="dp-error">{fieldErrors.consultation_fee}</p>}
              </div>

              {/* H2.#9 — Slot duration. Affects how the booking grid is generated. */}
              <div className="dp-field">
                <label className="dp-label">Consultation length</label>
                <select
                  className="dp-input"
                  value={form.slot_duration}
                  onChange={e => setForm(p => ({ ...p, slot_duration: Number(e.target.value) }))}
                >
                  {SLOT_DURATION_CHOICES.map(d => (
                    <option key={d} value={d}>{d} minutes</option>
                  ))}
                </select>
                <p className="dp-hint">Patients will see bookable times every {form.slot_duration} minutes inside your available hours.</p>
              </div>

              <div className="dp-field">
                <label className="dp-label">Gender *</label>
                <select className={`dp-input ${fieldErrors.gender ? 'dp-input-error' : ''}`}
                  value={form.gender}
                  onChange={e => setField('gender', e.target.value)} required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.gender && <p className="dp-error">{fieldErrors.gender}</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">Phone</label>
                <input className={`dp-input ${fieldErrors.phone ? 'dp-input-error' : ''}`}
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                  placeholder="+92 3XX XXXXXXX" />
                {fieldErrors.phone && <p className="dp-error">{fieldErrors.phone}</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">City</label>
                <input className={`dp-input ${fieldErrors.city ? 'dp-input-error' : ''}`}
                  value={form.city}
                  onChange={e => setField('city', e.target.value)}
                  placeholder="Lahore, Karachi..." />
                {fieldErrors.city && <p className="dp-error">{fieldErrors.city}</p>}
              </div>
            </div>

            <div className="dp-field" style={{ marginTop: 4 }}>
              <label className="dp-label">Bio / About</label>
              <textarea className={`dp-input dp-textarea ${fieldErrors.bio ? 'dp-input-error' : ''}`}
                rows={4} value={form.bio}
                onChange={e => setField('bio', e.target.value)}
                placeholder="Tell patients about your experience, approach, and expertise..." />
              {fieldErrors.bio && <p className="dp-error">{fieldErrors.bio}</p>}
            </div>

            {/* Document uploads — available on both create and update */}
            <div className="dp-grid-2" style={{ marginTop: 8 }}>
              <div className="dp-field">
                <label className="dp-label">
                  Degree Certificate {!profile && <span style={{ color: 'var(--danger)' }}>*</span>}
                  {profile?.degree_file && (
                    <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 8, fontWeight: 600 }}>
                      ✓ Uploaded
                    </span>
                  )}
                </label>
                <label className={`dp-file-label ${fieldErrors.degree_file ? 'dp-input-error' : ''}`}>
                  <Upload size={14}/> {degreeFile ? degreeFile.name : profile ? 'Re-upload (optional)' : 'Upload PDF/Image'}
                  <input type="file" accept=".pdf,image/*"
                    onChange={e => { setDegreeFile(e.target.files[0]); setFieldErrors(p => { const n = { ...p }; delete n.degree_file; return n; }); }} hidden />
                </label>
                {fieldErrors.degree_file
                  ? <p className="dp-error">{fieldErrors.degree_file}</p>
                  : profile && <p className="dp-hint">Upload a new file only if your degree changed or admin requested it.</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">
                  License File {!profile && <span style={{ color: 'var(--danger)' }}>*</span>}
                  {profile?.license_file && (
                    <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 8, fontWeight: 600 }}>
                      ✓ Uploaded
                    </span>
                  )}
                </label>
                <label className={`dp-file-label ${fieldErrors.license_file ? 'dp-input-error' : ''}`}>
                  <Upload size={14}/> {licenseFile ? licenseFile.name : profile ? 'Re-upload (optional)' : 'Upload PDF/Image'}
                  <input type="file" accept=".pdf,image/*"
                    onChange={e => { setLicenseFile(e.target.files[0]); setFieldErrors(p => { const n = { ...p }; delete n.license_file; return n; }); }} hidden />
                </label>
                {fieldErrors.license_file
                  ? <p className="dp-error">{fieldErrors.license_file}</p>
                  : profile && <p className="dp-hint">Re-upload if your PMDC license has been renewed.</p>}
              </div>
            </div>

            <div className="dp-form-footer">
              <button type="submit" className="btn-primary-pd" disabled={saving}>
                {saving ? <span className="auth-spinner"/> : <><Save size={15}/> {profile ? 'Save Changes' : 'Create Profile'}</>}
              </button>
            </div>
          </form>
        )}

        {/* ── Time Slots Tab ── */}
        {activeTab === 'slots' && (
          <div className="dp-form-card">
            {!profile && (
              <div className="dd-alert">
                <AlertCircle size={16}/>
                <span>Please create your profile first before adding time slots.</span>
              </div>
            )}

            {/* Add slot form */}
            <div className="dp-slot-add">
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Add Availability Slot</p>
              <div className="dp-slot-row">
                <div className="dp-field" style={{ flex: 1 }}>
                  <label className="dp-label">Day</label>
                  <select className="dp-input" value={slotDay} onChange={e => setSlotDay(e.target.value)}>
                    {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div className="dp-field" style={{ flex: 1 }}>
                  <label className="dp-label">Start Time</label>
                  <input className="dp-input" type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} />
                </div>
                <div className="dp-field" style={{ flex: 1 }}>
                  <label className="dp-label">End Time</label>
                  <input className="dp-input" type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} />
                </div>
                <button className="btn-primary-pd" onClick={addSlot} disabled={addingSlot || !profile}
                  style={{ marginTop: 20 }}>
                  {addingSlot ? '...' : <><Plus size={15}/> Add</>}
                </button>
              </div>
            </div>

            {/* H2.#9 — Copy day block */}
            {profile && (
              <div className="dp-copy-block">
                <p className="dp-copy-title"><Copy size={14}/> Copy a day's slots to other days</p>
                <div className="dp-copy-grid">
                  <div className="dp-field">
                    <label className="dp-label">From</label>
                    <select className="dp-input" value={copySource} onChange={e => setCopySource(e.target.value)}>
                      {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="dp-field" style={{ gridColumn: '2 / span 2' }}>
                    <label className="dp-label">To</label>
                    <div className="dp-target-chips">
                      {DAYS.filter(d => d !== copySource).map(d => (
                        <label key={d} className={`dp-target-chip ${copyTargets[d] ? 'on' : ''}`}>
                          <input type="checkbox"
                            checked={!!copyTargets[d]}
                            onChange={e => setCopyTargets(p => ({ ...p, [d]: e.target.checked }))}
                          />
                          {d.charAt(0).toUpperCase() + d.slice(1, 3)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="btn-outline-pd"
                      onClick={() => setCopyTargets(Object.fromEntries(WEEKDAYS.filter(d => d !== copySource).map(d => [d, true])))}
                    >
                      All weekdays
                    </button>
                    <button type="button" className="btn-primary-pd" onClick={copyDay} disabled={copying}>
                      {copying ? '…' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Slots list grouped by day */}
            <div className="dp-slot-groups">
              {DAYS.map(day => {
                const daySlots = (profile?.time_slots || []).filter(s => s.day_of_week === day);
                if (daySlots.length === 0) return null;
                return (
                  <div key={day} className="dp-day-group">
                    <div className="dp-day-group-head">
                      <p className="dp-day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</p>
                      {/* H2.#9 — bulk clear-day */}
                      <button
                        type="button"
                        className="dp-day-clear"
                        onClick={() => setClearDayTarget(day)}
                        title="Clear all slots for this day"
                      >
                        <Trash2 size={12}/> Clear day
                      </button>
                    </div>
                    <div className="dp-day-slots">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="dp-slot-chip">
                          <Clock size={13} color="var(--teal)"/>
                          <span>{slot.start_time} – {slot.end_time}</span>
                          <button className="dp-slot-del" onClick={() => deleteSlot(slot.id)}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(profile?.time_slots || []).length === 0 && (
                <div className="pd-empty">
                  <Clock size={36}/>
                  <p>No time slots added yet</p>
                  <p style={{ fontSize: 12, marginTop: 6 }}>Add your available hours above</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Leave / Unavailable Tab ── H2.#10 */}
        {activeTab === 'leave' && (
          <div className="dp-form-card">
            {!profile && (
              <div className="dd-alert">
                <AlertCircle size={16}/>
                <span>Please create your profile first before adding leave dates.</span>
              </div>
            )}

            <div className="dp-slot-add">
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}><CalendarOff size={15} style={{ verticalAlign: 'middle' }}/> Mark a date as unavailable</p>
              <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 14 }}>
                Use this for vacation, conferences, or sick days. Patients won't be able to book on these dates. Any existing appointments will be notified to reschedule.
              </p>

              <div className="dp-leave-grid">
                <div className="dp-field">
                  <label className="dp-label">Date</label>
                  <input className="dp-input" type="date" value={leaveDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setLeaveDate(e.target.value)} />
                </div>
                <div className="dp-field">
                  <label className="dp-label">Reason <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="dp-input" value={leaveReason}
                    onChange={e => setLeaveReason(e.target.value)}
                    placeholder="e.g. Conference, vacation, public holiday" />
                </div>
                <div className="dp-field dp-leave-share">
                  <label className="dp-checkbox-row">
                    <input type="checkbox"
                      checked={leaveReasonPublic}
                      onChange={e => setLeaveReasonPublic(e.target.checked)}
                    />
                    {leaveReasonPublic ? <Eye size={14}/> : <EyeOff size={14}/>}
                    Show reason to patients
                  </label>
                  <p className="dp-hint">By default the reason is private to you. Tick this to let patients see it on your profile.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" className="btn-primary-pd" onClick={addLeave} disabled={addingLeave || !profile}>
                    {addingLeave ? '…' : <><Plus size={14}/> Add</>}
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="dp-leave-list">
              {unavailDates.length === 0 ? (
                <div className="pd-empty">
                  <CalendarOff size={36}/>
                  <p>No upcoming leave dates</p>
                  <p style={{ fontSize: 12, marginTop: 6 }}>Add dates above when you'll be unavailable</p>
                </div>
              ) : (
                unavailDates.map(row => (
                  <div key={row.id} className="dp-leave-row">
                    <div className="dp-leave-date">
                      <CalendarOff size={15}/>
                      {new Date(row.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="dp-leave-meta">
                      {row.reason ? (
                        <span>
                          {row.reason}
                          <span className={`dp-leave-visibility ${row.is_reason_public ? 'pub' : 'priv'}`}>
                            {row.is_reason_public ? <><Eye size={11}/> Visible to patients</> : <><EyeOff size={11}/> Private</>}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>No reason</span>
                      )}
                    </div>
                    <button className="dp-leave-del" onClick={() => setDeleteLeaveTarget(row.id)} title="Remove">
                      <X size={14}/>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Confirmation dialogs ───────────────────────────────────────── */}
      <ConfirmDialog
        open={clearDayTarget !== null}
        title={`Clear all slots for ${clearDayTarget ? clearDayTarget.charAt(0).toUpperCase() + clearDayTarget.slice(1) : ''}?`}
        message="This removes every time slot you have on this day. You'll need to add them again from scratch."
        confirmLabel="Yes, clear day"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmClearDay}
        onCancel={() => setClearDayTarget(null)}
      />

      <ConfirmDialog
        open={deleteLeaveTarget !== null}
        title="Remove this leave date?"
        message="Patients will once again be able to book appointments on this date according to your normal weekly availability."
        confirmLabel="Remove"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={confirmDeleteLeave}
        onCancel={() => setDeleteLeaveTarget(null)}
      />

      <ConfirmDialog
        open={showResubmitConfirm}
        title="Resubmit for verification?"
        message="Make sure you've updated whatever the admin asked for (usually your documents). The admin will be notified to re-review."
        confirmLabel="Yes, resubmit"
        cancelLabel="Not yet"
        variant="primary"
        busy={resubmitting}
        onConfirm={doResubmit}
        onCancel={() => setShowResubmitConfirm(false)}
      />
    </DashboardLayout>
  );
}
