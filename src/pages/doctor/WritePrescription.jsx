import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, FileText, ChevronLeft, Download, Video, MapPin, Info, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { appointmentAPI, prescriptionAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './WritePrescription.css';

const EMPTY_MED = { name: '', dosage: '', duration: '', notes: '' };

export default function WritePrescription() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [appt,        setAppt]    = useState(null);
  const [existing,    setExisting]= useState(null);
  const [loading,     setLoading] = useState(true);
  const [saving,      setSaving]  = useState(false);

  const [diagnosis,      setDiagnosis]     = useState('');
  const [medicines,      setMedicines]     = useState([{ ...EMPTY_MED }]);
  const [instructions,   setInstructions]  = useState('');
  const [followUpNotes,  setFollowUpNotes] = useState('');
  const [followUpDate,   setFollowUpDate]  = useState('');

  useEffect(() => {
    appointmentAPI.getById(id)
      .then(r => {
        const a = r.data.data;
        setAppt(a);
        if (a.prescription) {
          const rx = a.prescription;
          setExisting(rx);
          setDiagnosis(rx.diagnosis || '');
          setMedicines(rx.medicines || [{ ...EMPTY_MED }]);
          setInstructions(rx.instructions || '');
          setFollowUpNotes(rx.follow_up_notes || '');
          setFollowUpDate(rx.follow_up_date || '');
        }
      })
      .catch(() => { toast.error('Appointment not found'); navigate('/doctor/appointments'); })
      .finally(() => setLoading(false));
  }, [id]);

  const addMed    = () => setMedicines(p => [...p, { ...EMPTY_MED }]);
  const removeMed = (i) => setMedicines(p => p.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) =>
    setMedicines(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const submit = async (e) => {
    e.preventDefault();
    if (existing) { toast.info('Prescription already written.'); return; }
    if (!diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
    const validMeds = medicines.filter(m => m.name.trim() && m.dosage.trim() && m.duration.trim());
    if (validMeds.length === 0) { toast.error('Add at least one complete medicine'); return; }

    setSaving(true);
    try {
      await prescriptionAPI.create(id, {
        diagnosis,
        medicines: validMeds,
        instructions,
        follow_up_notes: followUpNotes,
        follow_up_date:  followUpDate || undefined,
      });
      toast.success('Prescription saved successfully!');
      navigate('/doctor/appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><div className="pd-spinner" style={{ marginTop: 60 }}/></DashboardLayout>;

  const pat = appt?.patient?.user || {};
  const doc = appt?.doctor?.user  || {};

  return (
    <DashboardLayout>
      <div className="wp-wrap">

        {/* Back link */}
        <Link to="/doctor/appointments" className="wp-back">
          <ChevronLeft size={16}/> Back to Appointments
        </Link>

        {/* Header */}
        <div className="wp-header">
          <div>
            <h1 className="wp-title">Write Prescription</h1>
            <p className="wp-sub">Appointment #{id} · {appt?.appointment_date} at {appt?.appointment_time}</p>
          </div>
          {existing && (
            <a href={`http://localhost:8000/api/prescriptions/${existing.id}/download`}
              target="_blank" rel="noreferrer" className="wp-download-btn">
              <Download size={15}/> Download PDF
            </a>
          )}
        </div>

        {/* Patient info card */}
        <div className="wp-patient-card">
          <div className="wp-patient-avatar">{pat.name?.[0] || 'P'}</div>
          <div>
            <p className="wp-patient-name">{pat.name || 'Patient'}</p>
            <p className="wp-patient-sub">{pat.email}</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>Consultation Type</p>
            <p style={{ fontSize: 13, fontWeight: 700, display:'flex', alignItems:'center', gap:5 }}>
              {appt?.type === 'video' ? <><Video size={13}/> Video</> : <><MapPin size={13}/> In-person</>}
            </p>
          </div>
        </div>

        {/* Already written notice */}
        {existing && (
          <div className="wp-notice wp-notice-info">
            <Info size={14}/> A prescription has already been written for this appointment. Shown below (read-only).
          </div>
        )}

        {/* Symptoms reminder */}
        {appt?.symptoms && (
          <div className="wp-notice wp-notice-warn">
            <span style={{ fontWeight: 700 }}>Patient reported symptoms:</span> {appt.symptoms}
          </div>
        )}

        {/* Prescription form */}
        <form onSubmit={submit} className="wp-form">

          {/* Prescription letterhead */}
          <div className="wp-letterhead">
            <div className="wp-lh-left">
              <p className="wp-lh-clinic">PhysioDesk Virtual Clinic</p>
              <p className="wp-lh-doc">Dr. {doc.name}</p>
              <p className="wp-lh-spec">{appt?.doctor?.specialization}</p>
            </div>
            <div className="wp-lh-right">
              <p className="wp-lh-date">Date: {new Date().toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })}</p>
              <p className="wp-lh-rx-no">Rx #{id}</p>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="wp-field">
            <label className="wp-label">Diagnosis *</label>
            <textarea
              className="wp-input wp-textarea" rows={3} required
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="e.g. Lumbar disc herniation with radiculopathy..."
              disabled={!!existing}
            />
          </div>

          {/* Medicines */}
          <div className="wp-medicines-section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <label className="wp-label" style={{ margin:0 }}>
                <FileText size={14}/> Medicines *
              </label>
              {!existing && (
                <button type="button" className="wp-add-med-btn" onClick={addMed}>
                  <Plus size={14}/> Add Medicine
                </button>
              )}
            </div>

            <div className="wp-med-list">
              {medicines.map((med, i) => (
                <div key={i} className="wp-med-row">
                  <div className="wp-med-num">{i + 1}</div>
                  <div className="wp-med-fields">
                    <input
                      className="wp-input" placeholder="Medicine name *"
                      value={med.name}
                      onChange={e => updateMed(i, 'name', e.target.value)}
                      disabled={!!existing}
                    />
                    <input
                      className="wp-input" placeholder="Dosage * (e.g. 500mg twice daily)"
                      value={med.dosage}
                      onChange={e => updateMed(i, 'dosage', e.target.value)}
                      disabled={!!existing}
                    />
                    <input
                      className="wp-input" placeholder="Duration * (e.g. 7 days)"
                      value={med.duration}
                      onChange={e => updateMed(i, 'duration', e.target.value)}
                      disabled={!!existing}
                    />
                    <input
                      className="wp-input" placeholder="Notes (optional)"
                      value={med.notes}
                      onChange={e => updateMed(i, 'notes', e.target.value)}
                      disabled={!!existing}
                    />
                  </div>
                  {!existing && medicines.length > 1 && (
                    <button type="button" className="wp-del-med" onClick={() => removeMed(i)}>
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="wp-field">
            <label className="wp-label">General Instructions</label>
            <textarea
              className="wp-input wp-textarea" rows={3}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Rest, avoid heavy lifting, apply ice 3x daily..."
              disabled={!!existing}
            />
          </div>

          {/* Follow-up */}
          <div className="wp-grid-2">
            <div className="wp-field">
              <label className="wp-label">Follow-up Notes</label>
              <textarea
                className="wp-input wp-textarea" rows={2}
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                placeholder="Follow-up recommendations..."
                disabled={!!existing}
              />
            </div>
            <div className="wp-field">
              <label className="wp-label">Follow-up Date</label>
              <input
                type="date" className="wp-input"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={!!existing}
              />
            </div>
          </div>

          {/* Footer */}
          {!existing && (
            <div className="wp-footer">
              <Link to="/doctor/appointments" className="btn-outline-pd">Cancel</Link>
              <button type="submit" className="btn-primary-pd" disabled={saving}>
                {saving ? <span className="auth-spinner"/> : <><Save size={15}/> Save Prescription</>}
              </button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
