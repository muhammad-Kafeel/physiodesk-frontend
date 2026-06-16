import { useState, useEffect } from 'react';
import { Save, Upload, User, Phone, MapPin, Heart, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { patientAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { storageUrl } from '../../utils/helpers';
import { validatePakistaniPhone } from '../../utils/validation';
import { toast } from 'react-toastify';
import './PatientProfile.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STEPS = ['personal', 'medical', 'emergency'];
const STEP_LABELS = { personal: 'Personal Info', medical: 'Medical Info', emergency: 'Emergency Contact' };

const EMPTY_FORM = {
  date_of_birth: '', gender: '',
  phone: '', city: '', address: '',
  blood_group: '', weight: '', height: '',
  allergies: '', chronic_diseases: '',
  emergency_contact_name: '', emergency_contact_phone: '',
};

export default function PatientProfile() {
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome      = searchParams.get('welcome') === '1';

  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('personal');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [errors,       setErrors]       = useState({});

  // First-time = no profile row yet. Drives the stepper auto-advance & "Continue" button.
  const isFirstTime = !profile;

  const loadProfile = () => {
    setLoading(true);
    patientAPI.getMyProfile()
      .then(r => {
        const p = r.data.data;
        setProfile(p);
        if (p) {
          setForm({
            date_of_birth:           p.date_of_birth           || '',
            gender:                  p.gender                  || '',
            phone:                   p.phone                   || '',
            city:                    p.city                    || '',
            address:                 p.address                 || '',
            blood_group:             p.blood_group             || '',
            weight:                  p.weight                  || '',
            height:                  p.height                  || '',
            allergies:               p.allergies               || '',
            chronic_diseases:        p.chronic_diseases        || '',
            emergency_contact_name:  p.emergency_contact_name  || '',
            emergency_contact_phone: p.emergency_contact_phone || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []);

  const f = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: null }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Per-step validation ────────────────────────────────────────────────────
  // Returns { ok: bool, errors: {field: msg} }.
  // On first-time creation, personal step is strict (DOB/gender/phone required by backend).
  // On returning visits, fields are individually editable so we just validate filled ones.
  const validateStep = (step) => {
    const e = {};
    if (step === 'personal') {
      // DOB & gender are backend-required on CREATE only. On update they're not editable
      // anyway (we lock them in UI), so only check during first-time.
      if (isFirstTime) {
        if (!form.date_of_birth) e.date_of_birth = 'Date of birth is required';
        if (!form.gender)        e.gender        = 'Gender is required';
      }
      // Phone is optional in the schema, but if provided it must match PK format.
      // On first-time we require it because doctors need to reach the patient.
      const phoneErr = validatePakistaniPhone(form.phone, { required: isFirstTime });
      if (phoneErr) e.phone = phoneErr;
    }
    if (step === 'emergency') {
      // If user fills name OR phone, both should be present + valid.
      const hasName  = !!form.emergency_contact_name?.trim();
      const hasPhone = !!form.emergency_contact_phone?.trim();
      if (hasName && !hasPhone) e.emergency_contact_phone = 'Emergency phone is required';
      if (hasPhone && !hasName) e.emergency_contact_name  = 'Emergency contact name is required';
      if (hasPhone) {
        const ph = validatePakistaniPhone(form.emergency_contact_phone, { required: true });
        if (ph) e.emergency_contact_phone = ph;
      }
    }
    return { ok: Object.keys(e).length === 0, errors: e };
  };

  // ── Save logic ─────────────────────────────────────────────────────────────
  // First-time: each step does its own save. Personal step creates the profile row
  // (POST), subsequent steps PATCH it. After Emergency, redirect to dashboard.
  // Returning user: every "Save Changes" PUTs the current form and stays on the tab.
  const saveAndAdvance = async (e) => {
    e.preventDefault();
    const { ok, errors: stepErrors } = validateStep(activeTab);
    if (!ok) {
      setErrors(stepErrors);
      const firstMsg = Object.values(stepErrors)[0];
      if (firstMsg) toast.error(firstMsg);
      return;
    }

    setSaving(true);
    try {
      if (isFirstTime) {
        // First-time flow — on the FIRST step we POST (create); after that we PUT.
        // We always send the full form so partial data is preserved server-side.
        const isCreating = !profile;

        if (isCreating) {
          // Create requires date_of_birth + gender; we've validated those above.
          const fd = new FormData();
          Object.entries(form).forEach(([k, v]) => {
            if (v !== '' && v !== null) fd.append(k, v);
          });
          if (photoFile) fd.append('profile_photo', photoFile);
          await patientAPI.createProfile(fd);
        } else {
          // Subsequent step in first-time flow → PUT (no DOB/gender change).
          if (photoFile) {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
              // DOB & gender are locked after creation
              if (k === 'date_of_birth' || k === 'gender') return;
              if (v !== '' && v !== null) fd.append(k, v);
            });
            fd.append('profile_photo', photoFile);
            fd.append('_method', 'PUT');
            await patientAPI.updateProfileWithPhoto(fd);
          } else {
            const payload = { ...form };
            delete payload.date_of_birth;
            delete payload.gender;
            await patientAPI.updateProfile(payload);
          }
        }

        // Advance to next step OR finish
        const idx = STEPS.indexOf(activeTab);
        const last = idx === STEPS.length - 1;
        if (last) {
          toast.success('Profile complete! 🎉');
          // Reload then redirect to dashboard
          await new Promise(r => setTimeout(r, 300));
          navigate('/patient/dashboard');
          return;
        } else {
          toast.success(`${STEP_LABELS[activeTab]} saved`);
          setPhotoFile(null);
          // Reload profile so isFirstTime flips to false after step 1
          loadProfile();
          setActiveTab(STEPS[idx + 1]);
        }
      } else {
        // Returning user — single save, stay on the current tab.
        if (photoFile) {
          const fd = new FormData();
          Object.entries(form).forEach(([k, v]) => {
            if (k === 'date_of_birth' || k === 'gender') return;
            if (v !== '' && v !== null) fd.append(k, v);
          });
          fd.append('profile_photo', photoFile);
          fd.append('_method', 'PUT');
          await patientAPI.updateProfileWithPhoto(fd);
        } else {
          const payload = { ...form };
          delete payload.date_of_birth;
          delete payload.gender;
          await patientAPI.updateProfile(payload);
        }
        toast.success('Profile updated successfully!');
        setPhotoFile(null);
        loadProfile();
      }
    } catch (err) {
      // Surface backend field errors inline.
      const apiErrors = err.response?.data?.errors;
      if (apiErrors) {
        const flat = {};
        Object.entries(apiErrors).forEach(([k, v]) => { flat[k] = Array.isArray(v) ? v[0] : v; });
        setErrors(flat);
        toast.error(Object.values(flat)[0] || 'Please fix the errors below');
      } else {
        toast.error(err.response?.data?.message || 'Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const photoSrc = photoPreview
    || (profile?.profile_photo ? storageUrl(profile.profile_photo) : null);

  const bmi = form.weight && form.height
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
    : null;

  const bmiLabel = bmi
    ? bmi < 18.5 ? { text: 'Underweight', color: '#3B82F6' }
    : bmi < 25   ? { text: 'Normal',      color: '#16A34A' }
    : bmi < 30   ? { text: 'Overweight',  color: '#F59E0B' }
    :              { text: 'Obese',        color: '#DC2626' }
    : null;

  // Stepper progress (only meaningful during first-time flow; for returning users
  // we still show a progress bar that reflects how complete their profile is).
  const completedSteps = (() => {
    if (isFirstTime) return STEPS.indexOf(activeTab); // 0/1/2
    let c = 0;
    if (form.phone && form.city && form.date_of_birth) c++;
    if (form.blood_group || form.weight || form.height) c++;
    if (form.emergency_contact_name && form.emergency_contact_phone) c++;
    return c;
  })();
  const progressPct = Math.round((completedSteps / STEPS.length) * 100);

  if (loading) return (
    <DashboardLayout>
      <div className="pd-spinner" style={{ marginTop: 80 }} />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="pp-wrap">

        {/* Welcome banner for new registrations */}
        {isWelcome && isFirstTime && (
          <div style={{
            background: 'linear-gradient(135deg, #1D4ED8, #0369A1)',
            borderRadius: 14, padding: '20px 24px',
            marginBottom: 20, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                🎉 Welcome to PhysioDesk, {user?.name?.split(' ')[0]}!
              </p>
              <p style={{ fontSize: 13, opacity: .85 }}>
                Complete these 3 short steps so doctors can give you the best care.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="pp-header">
          <h1 className="pp-title">My Profile</h1>
          <p className="pp-sub">Manage your personal and medical information</p>
        </div>

        {/* ── Stepper / Progress ─────────────────────────────────────────────── */}
        <div className="pp-stepper" style={{
          background: 'white', borderRadius: 12,
          padding: '20px 24px', marginBottom: 20,
          border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 14,
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>
              {isFirstTime
                ? `Step ${STEPS.indexOf(activeTab) + 1} of ${STEPS.length}`
                : 'Profile Completion'}
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: progressPct === 100 ? '#16A34A' : 'var(--primary)' }}>
              {progressPct}%
            </p>
          </div>

          {/* Progress bar */}
          <div style={{
            height: 6, background: 'var(--gray-100)',
            borderRadius: 99, overflow: 'hidden', marginBottom: 14,
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct === 100
                ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                : 'linear-gradient(90deg, var(--primary), #38BDF8)',
              transition: 'width .4s ease',
            }} />
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {STEPS.map((s, i) => {
              const done    = i < completedSteps;
              const current = activeTab === s;
              return (
                <div key={s} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flex: 1, cursor: isFirstTime && !done && !current ? 'not-allowed' : 'pointer',
                  opacity: isFirstTime && i > STEPS.indexOf(activeTab) ? 0.5 : 1,
                }}
                onClick={() => {
                  // On first-time, prevent skipping ahead. On returning user, free navigation.
                  if (!isFirstTime || i <= STEPS.indexOf(activeTab)) setActiveTab(s);
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#16A34A' : current ? 'var(--primary)' : 'var(--gray-200)',
                    color: done || current ? 'white' : 'var(--gray-400)',
                    fontWeight: 800, fontSize: 12, marginBottom: 6,
                    transition: 'all .25s',
                  }}>
                    {done ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <p style={{
                    fontSize: 11, fontWeight: current ? 700 : 600,
                    color: current ? 'var(--primary)' : done ? '#16A34A' : 'var(--gray-500)',
                    textAlign: 'center',
                  }}>
                    {STEP_LABELS[s]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero card */}
        <div className="pp-hero">
          <div className="pp-photo-section">
            <div className="pp-avatar-wrap">
              {photoSrc
                ? <img src={photoSrc} alt="Profile" className="pp-avatar-img" />
                : <div className="pp-avatar-placeholder">{user?.name?.[0] || 'P'}</div>
              }
              <label className="pp-photo-btn" title="Change photo">
                <Upload size={14} />
                <input type="file" accept="image/*" onChange={handlePhoto} hidden />
              </label>
            </div>
          </div>

          <div className="pp-hero-info">
            <h2 className="pp-hero-name">{user?.name}</h2>
            <p className="pp-hero-email">{user?.email}</p>
            <div className="pp-hero-badges">
              {form.blood_group && (
                <span className="pp-badge pp-badge-red">🩸 {form.blood_group}</span>
              )}
              {form.city && (
                <span className="pp-badge pp-badge-blue">📍 {form.city}</span>
              )}
              {bmi && (
                <span className="pp-badge" style={{ background: 'rgba(255,255,255,.15)', color: 'white' }}>
                  BMI {bmi} · {bmiLabel.text}
                </span>
              )}
              {isFirstTime && (
                <span className="pp-badge pp-badge-warn">⚠️ Profile incomplete</span>
              )}
            </div>
          </div>

          <div className="pp-hero-stats">
            {[
              { label: 'Height', value: form.height ? `${form.height} cm` : '—' },
              { label: 'Weight', value: form.weight ? `${form.weight} kg` : '—' },
              { label: 'Blood',  value: form.blood_group || '—' },
            ].map((s, i) => (
              <div key={i} className="pp-stat-box">
                <p className="pp-stat-val">{s.value}</p>
                <p className="pp-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs — disabled-styled on first-time when ahead of current step */}
        <div className="pp-tabs">
          {STEPS.map((s, i) => {
            const disabled = isFirstTime && i > STEPS.indexOf(activeTab);
            return (
              <button key={s}
                type="button"
                className={`pp-tab ${activeTab === s ? 'active' : ''}`}
                disabled={disabled}
                style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                onClick={() => !disabled && setActiveTab(s)}>
                {s === 'personal'  && '👤 '}
                {s === 'medical'   && '❤️ '}
                {s === 'emergency' && '🆘 '}
                {STEP_LABELS[s]}
              </button>
            );
          })}
        </div>

        <form onSubmit={saveAndAdvance}>
          <div className="pp-form-card">

            {/* ── Personal Info ── */}
            {activeTab === 'personal' && (
              <div className="pp-section">
                <p className="pp-section-title"><User size={16} /> Personal Information</p>

                <div className="pp-readonly-row">
                  <div className="pp-readonly-field">
                    <label className="pp-label">Full Name</label>
                    <div className="pp-readonly-val">{user?.name}</div>
                  </div>
                  <div className="pp-readonly-field">
                    <label className="pp-label">Email Address</label>
                    <div className="pp-readonly-val">{user?.email}</div>
                  </div>
                </div>
                <p className="pp-readonly-note">
                  Name and email are linked to your account — contact support to change them.
                </p>

                <div className="pp-divider" />

                <div className="pp-grid-2">
                  {/* DOB */}
                  <div className="pp-field">
                    <label className="pp-label">📅 Date of Birth {isFirstTime && '*'}</label>
                    <input
                      className="pp-input"
                      type="date"
                      value={form.date_of_birth}
                      disabled={!isFirstTime}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                        .toISOString().split('T')[0]}
                      onChange={e => f('date_of_birth', e.target.value)}
                      style={errors.date_of_birth ? { borderColor: '#DC2626' } : {}}
                    />
                    {errors.date_of_birth && <p className="pp-hint" style={{ color: '#DC2626' }}>{errors.date_of_birth}</p>}
                    {!isFirstTime && <p className="pp-hint">Locked after creation. Contact support to change.</p>}
                  </div>

                  {/* Gender */}
                  <div className="pp-field">
                    <label className="pp-label">👤 Gender {isFirstTime && '*'}</label>
                    <select
                      className="pp-input"
                      value={form.gender}
                      disabled={!isFirstTime}
                      onChange={e => f('gender', e.target.value)}
                      style={errors.gender ? { borderColor: '#DC2626' } : {}}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <p className="pp-hint" style={{ color: '#DC2626' }}>{errors.gender}</p>}
                    {!isFirstTime && <p className="pp-hint">Locked after creation. Contact support to change.</p>}
                  </div>
                </div>

                <div className="pp-grid-2" style={{ marginTop: 16 }}>
                  <div className="pp-field">
                    <label className="pp-label"><Phone size={13} /> Phone Number {isFirstTime && '*'}</label>
                    <input
                      className="pp-input"
                      value={form.phone}
                      onChange={e => f('phone', e.target.value)}
                      placeholder="+923001234567 or 03001234567"
                      style={errors.phone ? { borderColor: '#DC2626' } : {}}
                    />
                    {errors.phone
                      ? <p className="pp-hint" style={{ color: '#DC2626' }}>{errors.phone}</p>
                      : <p className="pp-hint">Pakistani mobile only — used for appointment alerts.</p>
                    }
                  </div>
                  <div className="pp-field">
                    <label className="pp-label"><MapPin size={13} /> City</label>
                    <input className="pp-input" value={form.city}
                      onChange={e => f('city', e.target.value)}
                      placeholder="Lahore, Karachi, Islamabad..." />
                  </div>
                  <div className="pp-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="pp-label">Home Address</label>
                    <textarea className="pp-input pp-textarea" rows={2}
                      value={form.address}
                      onChange={e => f('address', e.target.value)}
                      placeholder="House #, Street, Area..." />
                  </div>
                </div>
              </div>
            )}

            {/* ── Medical Info ── */}
            {activeTab === 'medical' && (
              <div className="pp-section">
                <p className="pp-section-title"><Heart size={16} /> Medical Information</p>

                <div className="pp-grid-3">
                  <div className="pp-field">
                    <label className="pp-label">Blood Group</label>
                    <select className="pp-input" value={form.blood_group}
                      onChange={e => f('blood_group', e.target.value)}>
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pp-field">
                    <label className="pp-label">Weight (kg)</label>
                    <input className="pp-input" type="number" min="1" max="500"
                      value={form.weight} onChange={e => f('weight', e.target.value)}
                      placeholder="e.g. 70" />
                  </div>
                  <div className="pp-field">
                    <label className="pp-label">Height (cm)</label>
                    <input className="pp-input" type="number" min="1" max="300"
                      value={form.height} onChange={e => f('height', e.target.value)}
                      placeholder="e.g. 175" />
                  </div>
                </div>

                {/* BMI indicator */}
                {bmi && (
                  <div className="pp-bmi-card">
                    <div className="pp-bmi-left">
                      <p className="pp-bmi-val" style={{ color: bmiLabel.color }}>{bmi}</p>
                      <p className="pp-bmi-label">BMI</p>
                    </div>
                    <div className="pp-bmi-bar-wrap">
                      <div className="pp-bmi-bar">
                        <div className="pp-bmi-segment pp-bmi-under" />
                        <div className="pp-bmi-segment pp-bmi-normal" />
                        <div className="pp-bmi-segment pp-bmi-over" />
                        <div className="pp-bmi-segment pp-bmi-obese" />
                      </div>
                      <div className="pp-bmi-labels">
                        <span>Underweight</span><span>Normal</span>
                        <span>Overweight</span><span>Obese</span>
                      </div>
                    </div>
                    <span className="pp-bmi-badge"
                      style={{ background: bmiLabel.color + '20', color: bmiLabel.color }}>
                      {bmiLabel.text}
                    </span>
                  </div>
                )}

                <div className="pp-divider" />

                <div className="pp-grid-2">
                  <div className="pp-field">
                    <label className="pp-label">
                      <AlertCircle size={13} color="#DC2626" /> Known Allergies
                    </label>
                    <textarea className="pp-input pp-textarea" rows={3}
                      value={form.allergies} onChange={e => f('allergies', e.target.value)}
                      placeholder="e.g. Penicillin, Dust, Pollen, Latex..." />
                    <p className="pp-hint">List any medicines, foods, or environmental allergens</p>
                  </div>
                  <div className="pp-field">
                    <label className="pp-label">
                      <Heart size={13} color="#DC2626" /> Chronic Diseases
                    </label>
                    <textarea className="pp-input pp-textarea" rows={3}
                      value={form.chronic_diseases}
                      onChange={e => f('chronic_diseases', e.target.value)}
                      placeholder="e.g. Diabetes Type 2, Hypertension, Asthma..." />
                    <p className="pp-hint">Ongoing conditions your doctor should know about</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Emergency Contact ── */}
            {activeTab === 'emergency' && (
              <div className="pp-section">
                <p className="pp-section-title"><Users size={16} /> Emergency Contact</p>

                <div className="pp-emergency-info">
                  🆘 This person will be contacted in case of a medical emergency during your consultation.
                </div>

                <div className="pp-grid-2">
                  <div className="pp-field">
                    <label className="pp-label">Contact Name</label>
                    <input className="pp-input"
                      value={form.emergency_contact_name}
                      onChange={e => f('emergency_contact_name', e.target.value)}
                      placeholder="Full name of emergency contact"
                      style={errors.emergency_contact_name ? { borderColor: '#DC2626' } : {}} />
                    {errors.emergency_contact_name && (
                      <p className="pp-hint" style={{ color: '#DC2626' }}>{errors.emergency_contact_name}</p>
                    )}
                  </div>
                  <div className="pp-field">
                    <label className="pp-label">Contact Phone</label>
                    <input className="pp-input"
                      value={form.emergency_contact_phone}
                      onChange={e => f('emergency_contact_phone', e.target.value)}
                      placeholder="+923001234567 or 03001234567"
                      style={errors.emergency_contact_phone ? { borderColor: '#DC2626' } : {}} />
                    {errors.emergency_contact_phone
                      ? <p className="pp-hint" style={{ color: '#DC2626' }}>{errors.emergency_contact_phone}</p>
                      : <p className="pp-hint">Pakistani mobile only.</p>
                    }
                  </div>
                </div>

                {form.emergency_contact_name && form.emergency_contact_phone && (
                  <div className="pp-emergency-preview">
                    <div className="pp-em-avatar">
                      {form.emergency_contact_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="pp-em-name">{form.emergency_contact_name}</p>
                      <p className="pp-em-phone">{form.emergency_contact_phone}</p>
                    </div>
                    <span className="pp-em-badge">Emergency Contact</span>
                  </div>
                )}
              </div>
            )}

            {/* Save / Continue button */}
            <div className="pp-form-footer">
              <button type="submit" className="btn-primary-pd" disabled={saving}>
                {saving
                  ? <span className="auth-spinner" />
                  : isFirstTime
                    ? activeTab === 'emergency'
                      ? <><CheckCircle2 size={15} /> Finish Setup</>
                      : <><Save size={15} /> Save &amp; Continue</>
                    : <><Save size={15} /> Save Changes</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
