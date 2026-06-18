import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Save, FileText, ChevronLeft, Download, Video, MapPin, Info, AlertCircle, Edit3, Lock, Clock, FileEdit, Send } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { appointmentAPI, prescriptionAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './WritePrescription.css';

const EMPTY_MED = { name: '', dosage: '', duration: '', notes: '' };
const EDIT_WINDOW_HOURS = 24;

/** Compute lock metadata client-side from prescription.created_at as a fallback
 *  when the backend's lock payload isn't present (e.g. older serialised responses). */
function deriveLock(rx) {
  if (rx?.lock) return rx.lock;
  if (!rx?.created_at) return { is_locked: true, editable_until: null, edit_window_hours: EDIT_WINDOW_HOURS };
  const created = new Date(rx.created_at);
  const until   = new Date(created.getTime() + EDIT_WINDOW_HOURS * 60 * 60 * 1000);
  return {
    is_locked: until.getTime() < Date.now(),
    editable_until: until.toISOString(),
    edit_window_hours: EDIT_WINDOW_HOURS,
  };
}

/** Format "3h 12m left" until editable_until expires. */
function formatTimeLeft(iso) {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export default function WritePrescription() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [appt,        setAppt]    = useState(null);
  const [existing,    setExisting]= useState(null);
  const [lock,        setLock]    = useState(null);    // { is_locked, editable_until, edit_window_hours }
  const [editMode,    setEditMode]= useState(false);   // true when user clicked "Edit" on an unlocked Rx
  const [loading,     setLoading] = useState(true);
  const [saving,      setSaving]  = useState(false);

  // H4 — Draft-related local state. `isDraft` is derived from existing.status.
  // `finalizing` tracks the spinner on the Finalize button independently so it
  // doesn't conflict with the Save-Draft spinner. `showFinalConfirm` opens the
  // "are you sure you want to send to patient?" dialog.
  const [finalizing,       setFinalizing]       = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);

  const [diagnosis,      setDiagnosis]     = useState('');
  const [medicines,      setMedicines]     = useState([{ ...EMPTY_MED }]);
  const [instructions,   setInstructions]  = useState('');
  const [followUpNotes,  setFollowUpNotes] = useState('');
  const [followUpDate,   setFollowUpDate]  = useState('');

  const hydrateForm = (rx) => {
    setDiagnosis(rx.diagnosis || '');
    setMedicines(rx.medicines && rx.medicines.length ? rx.medicines : [{ ...EMPTY_MED }]);
    setInstructions(rx.instructions || '');
    setFollowUpNotes(rx.follow_up_notes || '');
    setFollowUpDate(rx.follow_up_date || '');
  };

  useEffect(() => {
    appointmentAPI.getById(id)
      .then(r => {
        const a = r.data.data;
        setAppt(a);
        if (a.prescription) {
          const rx = a.prescription;
          setExisting(rx);
          setLock(deriveLock(rx));
          hydrateForm(rx);
        }
      })
      .catch(() => { toast.error('Appointment not found'); navigate('/doctor/appointments'); })
      .finally(() => setLoading(false));
  }, [id]);

  const addMed    = () => setMedicines(p => [...p, { ...EMPTY_MED }]);
  const removeMed = (i) => setMedicines(p => p.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) =>
    setMedicines(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  // Authenticated PDF download (a raw <a> link carries no token and 500s).
  const downloadRx = async (rxId) => {
    try {
      const res = await prescriptionAPI.downloadPdf(rxId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${rxId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download PDF');
    }
  };

  const cancelEdit = () => {
    // Re-hydrate from existing to drop any unsaved edits.
    if (existing) hydrateForm(existing);
    setEditMode(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    // Default submit path = finalize (or update an already-finalized one).
    return saveOrFinalize({ asDraft: false });
  };

  /**
   * H4 — Unified save path used by both "Save Draft" and "Finalize".
   *
   *   asDraft=true   create-as-draft OR update-existing-draft (stays on page)
   *   asDraft=false  create-finalized | finalize-a-draft | edit-finalized
   *                  (navigates back to appointments on success)
   *
   * The backend enforces the actual transition rules — the frontend just sends
   * the intended status. Keeping all five flows in one function avoids the
   * subtle drift that two near-identical handlers would accumulate over time.
   */
  const saveOrFinalize = async ({ asDraft }) => {
    if (!diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
    const validMeds = medicines.filter(m => m.name.trim() && m.dosage.trim() && m.duration.trim());
    if (validMeds.length === 0) { toast.error('Add at least one complete medicine'); return; }

    if (asDraft) setSaving(true); else setFinalizing(true);
    try {
      const payload = {
        diagnosis,
        medicines: validMeds,
        instructions,
        follow_up_notes: followUpNotes,
        follow_up_date:  followUpDate || undefined,
        status: asDraft ? 'draft' : 'finalized',
      };

      if (existing) {
        // Updating an existing prescription — either a draft (no lock) or a
        // recently-finalized one (within the 24h window).
        const res = await prescriptionAPI.update(existing.id, payload);
        const updated = res.data.data;
        setExisting(updated);
        setLock(deriveLock(updated));
        hydrateForm(updated);
        setEditMode(false);

        if (asDraft) {
          toast.success('Draft saved. Only you can see this until you finalize it.');
        } else {
          toast.success(
            existing.status === 'draft'
              ? 'Prescription finalized and sent to the patient.'
              : 'Prescription updated successfully!'
          );
          navigate('/doctor/appointments');
        }
      } else {
        // First-time create.
        const res = await prescriptionAPI.create(id, payload);
        const created = res.data.data;
        if (asDraft) {
          // Stay on this page so the doctor can keep editing. Swap into
          // "existing draft" mode so subsequent saves take the update path.
          setExisting(created);
          setLock(deriveLock(created));
          hydrateForm(created);
          toast.success('Draft saved. Come back anytime to finish it.');
        } else {
          toast.success('Prescription saved successfully!');
          navigate('/doctor/appointments');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
      setFinalizing(false);
      setShowFinalConfirm(false);
    }
  };

  if (loading) return <DashboardLayout><div className="pd-spinner" style={{ marginTop: 60 }}/></DashboardLayout>;

  const pat = appt?.patient?.user || {};
  const doc = appt?.doctor?.user  || {};

  // H4 — Draft awareness. A draft is always editable by the owning doctor,
  // so isReadOnly / canEdit only apply to FINALIZED prescriptions.
  const isDraft    = existing?.status === 'draft';
  const isReadOnly = !!existing && !isDraft && !editMode;
  const canEdit    = !!existing && !isDraft && lock && !lock.is_locked;

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
            <h1 className="wp-title">
              {existing
                ? (isDraft
                  ? 'Prescription (Draft)'
                  : (editMode ? 'Edit Prescription' : 'Prescription'))
                : 'Write Prescription'}
            </h1>
            <p className="wp-sub">Appointment #{id} · {appt?.appointment_date} at {appt?.appointment_time}</p>
          </div>
          {existing && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canEdit && !editMode && (
                <button type="button" onClick={() => setEditMode(true)} className="wp-edit-btn">
                  <Edit3 size={15}/> Edit
                </button>
              )}
              {/* H4 — PDF download only makes sense for finalized prescriptions.
                  A draft PDF doesn't exist on the backend (drafts are 404 for
                  patients), so we hide the button entirely. */}
              {!isDraft && (
                <button type="button" onClick={() => downloadRx(existing.id)} className="wp-download-btn">
                  <Download size={15}/> Download PDF
                </button>
              )}
            </div>
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

        {/* Edit-window status banner */}
        {existing && !isDraft && lock && !lock.is_locked && !editMode && (
          <div className="wp-notice wp-notice-warn" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={14}/>
            <span>
              You can still edit this prescription for <strong>{formatTimeLeft(lock.editable_until)}</strong>.
              After that it's permanently locked.
            </span>
          </div>
        )}

        {existing && !isDraft && lock?.is_locked && (
          <div className="wp-notice wp-notice-info" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={14}/>
            <span>This prescription is locked (edit window expired). Contact admin if a correction is needed.</span>
          </div>
        )}

        {existing && editMode && !isDraft && (
          <div className="wp-notice" style={{ background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Edit3 size={14}/>
            <span>Editing mode — make your changes and click <strong>Save Changes</strong>.</span>
          </div>
        )}

        {/* H4 — Draft banner. Only the doctor can see this prescription right now.
            We make the language explicit so there's no doubt: nothing has been
            sent to the patient yet. The clock starts when the doctor finalizes. */}
        {existing && isDraft && (
          <div className="wp-notice" style={{ background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileEdit size={14}/>
            <span>
              <strong>Draft — not yet sent.</strong> Only you can see this. Keep editing as long as you need; click
              <strong> Finalize &amp; Send</strong> when you're done.
            </span>
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
              disabled={isReadOnly}
            />
          </div>

          {/* Medicines */}
          <div className="wp-medicines-section">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <label className="wp-label" style={{ margin:0 }}>
                <FileText size={14}/> Medicines *
              </label>
              {!isReadOnly && (
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
                      disabled={isReadOnly}
                    />
                    <input
                      className="wp-input" placeholder="Dosage * (e.g. 500mg twice daily)"
                      value={med.dosage}
                      onChange={e => updateMed(i, 'dosage', e.target.value)}
                      disabled={isReadOnly}
                    />
                    <input
                      className="wp-input" placeholder="Duration * (e.g. 7 days)"
                      value={med.duration}
                      onChange={e => updateMed(i, 'duration', e.target.value)}
                      disabled={isReadOnly}
                    />
                    <input
                      className="wp-input" placeholder="Notes (optional)"
                      value={med.notes}
                      onChange={e => updateMed(i, 'notes', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  {!isReadOnly && medicines.length > 1 && (
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
              disabled={isReadOnly}
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
                disabled={isReadOnly}
              />
            </div>
            <div className="wp-field">
              <label className="wp-label">Follow-up Date</label>
              <input
                type="date" className="wp-input"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Footer — only show form actions when editable */}
          {!isReadOnly && (
            <div className="wp-footer">
              {editMode ? (
                <button type="button" className="btn-outline-pd" onClick={cancelEdit}>Cancel</button>
              ) : (
                <Link to="/doctor/appointments" className="btn-outline-pd">Cancel</Link>
              )}

              {/* H4 — Three possible right-side buttons depending on context:
                  - New / existing draft → [Save as Draft] + [Finalize & Send]
                  - Editing finalized      → [Save Changes]
                  The Finalize button opens a confirmation dialog because it's
                  irreversible (patient gets notified + email, edit clock starts). */}
              {(isDraft || !existing) ? (
                <>
                  <button
                    type="button"
                    className="btn-outline-pd"
                    onClick={() => saveOrFinalize({ asDraft: true })}
                    disabled={saving || finalizing}
                  >
                    {saving ? <span className="auth-spinner"/> : <><Save size={15}/> Save as Draft</>}
                  </button>
                  <button
                    type="button"
                    className="btn-primary-pd"
                    onClick={() => setShowFinalConfirm(true)}
                    disabled={saving || finalizing}
                  >
                    {finalizing
                      ? <span className="auth-spinner"/>
                      : <><Send size={15}/> Finalize &amp; Send</>
                    }
                  </button>
                </>
              ) : (
                <button type="submit" className="btn-primary-pd" disabled={saving || finalizing}>
                  {(saving || finalizing)
                    ? <span className="auth-spinner"/>
                    : <><Save size={15}/> Save Changes</>
                  }
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* H4 — Finalize confirmation. Spell out that this sends the prescription
          to the patient and starts the 24h edit window. */}
      <ConfirmDialog
        open={showFinalConfirm}
        title="Finalize and send to patient?"
        message="The patient will receive an email and an in-app notification, and the prescription will appear in their account. You can still edit it for 24 hours after this."
        confirmLabel="Yes, send to patient"
        cancelLabel="Keep as draft"
        variant="primary"
        busy={finalizing}
        onConfirm={() => saveOrFinalize({ asDraft: false })}
        onCancel={() => setShowFinalConfirm(false)}
      />
    </DashboardLayout>
  );
}
