import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Clock, CheckCircle, AlertCircle, Upload, Stethoscope } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { doctorAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './DoctorProfilePage.css';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const SPECS = [
  'Physiotherapist','Orthopedic Surgeon','Neurologist','Sports Medicine',
  'Rheumatologist','Chiropractor','Physical Therapist','Pain Management',
];

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

  const [form, setForm] = useState({
    specialization: '', pmdc_number: '', experience_years: '',
    qualification: '', consultation_fee: '', gender: 'male',
    phone: '', city: '', bio: '', is_available: true,
  });

  useEffect(() => {
    doctorAPI.getMyProfile()
      .then(r => {
        const p = r.data.data;
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
          });
        }
      })
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
    try {
      const fd = buildFormData();
      if (profile) {
        /* PUT doesn't support multipart in some servers — use POST with _method */
        fd.append('_method', 'PUT');
        await doctorAPI.updateProfile(fd);
        toast.success('Profile updated successfully!');
      } else {
        await doctorAPI.createProfile(fd);
        toast.success('Profile created! Awaiting admin verification.');
      }
      const r = await doctorAPI.getMyProfile();
      setProfile(r.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

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

  const photoSrc = photoPreview
    || (profile?.profile_photo ? `http://localhost:8000/storage/${profile.profile_photo}` : null);

  if (loading) return <DashboardLayout><div className="pd-spinner" style={{ marginTop: 60 }} /></DashboardLayout>;

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
          {profile && (
            <span className={`dp-verify-badge ${profile.is_verified ? 'verified' : 'pending'}`}>
              {profile.is_verified ? <><CheckCircle size={14}/> Verified</> : <><AlertCircle size={14}/> Pending Verification</>}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="dp-tabs">
          {['profile','slots'].map(t => (
            <button key={t} className={`dp-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'profile' ? 'Profile Info' : 'Time Slots'}
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
                {profile?.is_verified && (
                  <div className="dp-avail-toggle">
                    <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>
                      Available for appointments
                    </label>
                    <input type="checkbox"
                      checked={form.is_available}
                      onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))}
                    />
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
                <input className="dp-input" value={form.pmdc_number}
                  onChange={e => setForm(p => ({ ...p, pmdc_number: e.target.value }))}
                  placeholder="e.g. PMDC-12345" required disabled={!!profile} />
                {profile && <p className="dp-hint">Cannot be changed after creation</p>}
              </div>
              <div className="dp-field">
                <label className="dp-label">Specialization *</label>
                <select className="dp-input" value={form.specialization}
                  onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))} required>
                  <option value="">Select specialization</option>
                  {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="dp-field">
                <label className="dp-label">Qualification *</label>
                <input className="dp-input" value={form.qualification}
                  onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))}
                  placeholder="e.g. MBBS, DPT, MSPT" required />
              </div>
              <div className="dp-field">
                <label className="dp-label">Experience (years) *</label>
                <input className="dp-input" type="number" min="0" max="60" value={form.experience_years}
                  onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} required />
              </div>
              <div className="dp-field">
                <label className="dp-label">Consultation Fee (PKR) *</label>
                <input className="dp-input" type="number" min="0" value={form.consultation_fee}
                  onChange={e => setForm(p => ({ ...p, consultation_fee: e.target.value }))} required />
              </div>
              <div className="dp-field">
                <label className="dp-label">Gender *</label>
                <select className="dp-input" value={form.gender}
                  onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} required>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="dp-field">
                <label className="dp-label">Phone</label>
                <input className="dp-input" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+92 3XX XXXXXXX" />
              </div>
              <div className="dp-field">
                <label className="dp-label">City</label>
                <input className="dp-input" value={form.city}
                  onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  placeholder="Lahore, Karachi..." />
              </div>
            </div>

            <div className="dp-field" style={{ marginTop: 4 }}>
              <label className="dp-label">Bio / About</label>
              <textarea className="dp-input dp-textarea" rows={4} value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Tell patients about your experience, approach, and expertise..." />
            </div>

            {/* Document uploads */}
            {!profile && (
              <div className="dp-grid-2" style={{ marginTop: 8 }}>
                <div className="dp-field">
                  <label className="dp-label">Degree Certificate</label>
                  <label className="dp-file-label">
                    <Upload size={14}/> {degreeFile ? degreeFile.name : 'Upload PDF/Image'}
                    <input type="file" accept=".pdf,image/*"
                      onChange={e => setDegreeFile(e.target.files[0])} hidden />
                  </label>
                </div>
                <div className="dp-field">
                  <label className="dp-label">License File</label>
                  <label className="dp-file-label">
                    <Upload size={14}/> {licenseFile ? licenseFile.name : 'Upload PDF/Image'}
                    <input type="file" accept=".pdf,image/*"
                      onChange={e => setLicenseFile(e.target.files[0])} hidden />
                  </label>
                </div>
              </div>
            )}

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

            {/* Slots list grouped by day */}
            <div className="dp-slot-groups">
              {DAYS.map(day => {
                const daySlots = (profile?.time_slots || []).filter(s => s.day_of_week === day);
                if (daySlots.length === 0) return null;
                return (
                  <div key={day} className="dp-day-group">
                    <p className="dp-day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</p>
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
      </div>
    </DashboardLayout>
  );
}
