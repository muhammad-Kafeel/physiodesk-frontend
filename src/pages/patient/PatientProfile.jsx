import { useState, useEffect } from 'react';
import { Save, Upload, User, Phone, MapPin, Heart, AlertCircle, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { patientAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './PatientProfile.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY_FORM = {
  phone: '', city: '', address: '',
  blood_group: '', weight: '', height: '',
  allergies: '', chronic_diseases: '',
  emergency_contact_name: '', emergency_contact_phone: '',
};

export default function PatientProfile() {
  const { user } = useAuth();
  const [searchParams]         = useSearchParams();
  const isWelcome              = searchParams.get('welcome') === '1';
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('personal');
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);

  const loadProfile = () => {
    setLoading(true);
    patientAPI.getMyProfile()
      .then(r => {
        const p = r.data.data;
        setProfile(p);
        if (p) {
          setForm({
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

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (profile) {
        // If there's a new photo, use FormData; otherwise JSON PUT is fine
        if (photoFile) {
          const fd = new FormData();
          Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
          fd.append('profile_photo', photoFile);
          fd.append('_method', 'PUT');
          // POST with _method spoofing for multipart
          await patientAPI.updateProfileWithPhoto(fd);
        } else {
          await patientAPI.updateProfile(form);
        }
        toast.success('Profile updated successfully!');
      } else {
        // Create — needs date_of_birth & gender (required by backend)
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
        fd.append('date_of_birth', '2000-01-01');
        fd.append('gender', 'male');
        if (photoFile) fd.append('profile_photo', photoFile);
        await patientAPI.createProfile(fd);
        toast.success('Profile created!');
      }
      setPhotoFile(null);
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const photoSrc = photoPreview
    || (profile?.profile_photo
      ? `http://localhost:8000/storage/${profile.profile_photo}`
      : null);

  const bmi = form.weight && form.height
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
    : null;

  const bmiLabel = bmi
    ? bmi < 18.5 ? { text: 'Underweight', color: '#3B82F6' }
    : bmi < 25   ? { text: 'Normal',      color: '#16A34A' }
    : bmi < 30   ? { text: 'Overweight',  color: '#F59E0B' }
    :              { text: 'Obese',        color: '#DC2626' }
    : null;

  if (loading) return (
    <DashboardLayout>
      <div className="pd-spinner" style={{ marginTop: 80 }} />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="pp-wrap">

        {/* Welcome banner for new registrations */}
        {isWelcome && (
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
                Complete your health profile below so doctors can give you the best care.
                It only takes 2 minutes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 18px' }}>
                <p style={{ fontSize: 20, fontWeight: 800 }}>1</p>
                <p style={{ fontSize: 11, opacity: .8 }}>Complete profile</p>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 18px' }}>
                <p style={{ fontSize: 20, fontWeight: 800 }}>2</p>
                <p style={{ fontSize: 11, opacity: .8 }}>Find a doctor</p>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '10px 18px' }}>
                <p style={{ fontSize: 20, fontWeight: 800 }}>3</p>
                <p style={{ fontSize: 11, opacity: .8 }}>Book appointment</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="pp-header">
          <h1 className="pp-title">My Profile</h1>
          <p className="pp-sub">Manage your personal and medical information</p>
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
              {!profile && (
                <span className="pp-badge pp-badge-warn">⚠️ Profile incomplete</span>
              )}
            </div>
          </div>

          <div className="pp-hero-stats">
            {[
              { label: 'Height', value: form.height ? `${form.height} cm` : '—' },
              { label: 'Weight', value: form.weight ? `${form.weight} kg` : '—' },
              { label: 'Blood', value: form.blood_group || '—' },
            ].map((s, i) => (
              <div key={i} className="pp-stat-box">
                <p className="pp-stat-val">{s.value}</p>
                <p className="pp-stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="pp-tabs">
          {[
            { key: 'personal',  label: '👤 Personal Info' },
            { key: 'medical',   label: '❤️ Medical Info' },
            { key: 'emergency', label: '🆘 Emergency Contact' },
          ].map(t => (
            <button key={t.key}
              className={`pp-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={save}>
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
                  <div className="pp-field">
                    <label className="pp-label"><Phone size={13} /> Phone Number</label>
                    <input className="pp-input" value={form.phone}
                      onChange={e => f('phone', e.target.value)}
                      placeholder="+92 3XX XXXXXXX" />
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
                    <input className="pp-input" value={form.emergency_contact_name}
                      onChange={e => f('emergency_contact_name', e.target.value)}
                      placeholder="Full name of emergency contact" />
                  </div>
                  <div className="pp-field">
                    <label className="pp-label">Contact Phone</label>
                    <input className="pp-input" value={form.emergency_contact_phone}
                      onChange={e => f('emergency_contact_phone', e.target.value)}
                      placeholder="+92 3XX XXXXXXX" />
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

            {/* Save */}
            <div className="pp-form-footer">
              <button type="submit" className="btn-primary-pd" disabled={saving}>
                {saving
                  ? <span className="auth-spinner" />
                  : <><Save size={15} /> {profile ? 'Save Changes' : 'Create Profile'}</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
