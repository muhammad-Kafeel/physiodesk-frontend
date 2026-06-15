import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, ChevronRight, CheckCircle, Clock,
  AlertCircle, Loader, Smartphone, Building, Upload,
  Video, MapPin, Lock, Calendar
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { appointmentAPI, paymentAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './PaymentPage.css';

// Appointments support JazzCash (instant) or Bank Transfer (verified by admin).
// COD applies only to pharmacy orders, never to appointments.
const METHODS = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    color: '#EF4444',
    bg: '#FEF2F2',
    icon: <Smartphone size={22} color="#EF4444"/>,
    badge: 'Recommended',
    description: 'Pay instantly using your JazzCash mobile wallet',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: <Building size={22} color="#2563EB"/>,
    badge: null,
    description: 'Transfer to our bank account, then upload your receipt for verification',
  },
];

export default function PaymentPage() {
  const { appointmentId }             = useParams();
  const navigate                      = useNavigate();
  const jazzFormRef                   = useRef(null);
  const [appointment, setAppointment] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [method,      setMethod]      = useState('jazzcash');
  const [ref,         setRef]         = useState('');
  const [receipt,     setReceipt]     = useState(null);
  const [paying,      setPaying]      = useState(false);
  const [jazzFields,  setJazzFields]  = useState(null);
  const [jazzEndpoint,setJazzEndpoint]= useState('');
  // form | redirecting | success | pending_verification | awaiting
  const [pageState,   setPageState]   = useState('form');

  useEffect(() => {
    appointmentAPI.getById(appointmentId)
      .then(r => {
        const appt = r.data.data;
        setAppointment(appt);
        if (appt.is_paid) { setPageState('success'); return; }
        // Flow: payment unlocks the consult only AFTER the doctor confirms.
        if (appt.status !== 'confirmed') { setPageState('awaiting'); return; }
      })
      .catch(() => { toast.error('Appointment not found'); navigate('/patient/appointments'); })
      .finally(() => setLoading(false));
  }, []);

  // Auto-submit the hidden JazzCash form once its fields are ready.
  useEffect(() => {
    if (jazzFields && jazzFormRef.current) {
      const t = setTimeout(() => jazzFormRef.current && jazzFormRef.current.submit(), 500);
      return () => clearTimeout(t);
    }
  }, [jazzFields]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      if (method === 'jazzcash') {
        const res = await paymentAPI.initiateJazzCashAppointment(appointmentId);
        const { endpoint, fields } = res.data.data;
        setJazzEndpoint(endpoint);
        setJazzFields(fields);
        setPageState('redirecting');
      } else {
        // Bank transfer — submit reference + optional receipt for admin verification.
        if (!ref.trim()) {
          toast.error('Please enter your bank transaction reference number');
          setPaying(false);
          return;
        }
        const form = new FormData();
        form.append('method', 'bank');
        form.append('reference_number', ref);
        if (receipt) form.append('receipt', receipt);

        await paymentAPI.payAppointment(appointmentId, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // It is NOT paid yet — an admin must verify the transfer first.
        setPageState('pending_verification');
        toast.success('Bank transfer submitted for verification.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Try again.');
      setPaying(false);
    }
  };

  if (loading) return <Layout><div className="pd-spinner" style={{ marginTop:80 }}/></Layout>;

  /* ── PAID (JazzCash completed) ───────────────────────── */
  if (pageState === 'success') return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-result-icon pay-success-icon">
            <CheckCircle size={60} color="var(--success)"/>
          </div>
          <h2 className="pay-result-title">Payment Successful</h2>
          <p className="pay-result-sub">
            Your payment is confirmed. You can now join the consultation at the scheduled time.
          </p>
          <div className="pay-result-actions">
            <Link to="/patient/appointments" className="btn-primary-pd">
              <Calendar size={15}/> View My Appointments
            </Link>
            <Link to="/" className="btn-outline-pd">Back to Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );

  /* ── BANK TRANSFER SUBMITTED — awaiting admin verification ─────────── */
  if (pageState === 'pending_verification') return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-redirecting-icon">
            <Clock size={52} color="var(--primary)"/>
          </div>
          <h2 className="pay-result-title">Payment Pending Verification</h2>
          <p className="pay-result-sub">
            Thanks — we've received your bank transfer details. Our team will verify the payment,
            usually within a few hours. Your appointment is confirmed once the funds are verified,
            and you'll be able to join the call then.
          </p>
          <div className="pay-result-actions">
            <Link to="/patient/appointments" className="btn-primary-pd">
              <Calendar size={15}/> View My Appointments
            </Link>
            <Link to="/" className="btn-outline-pd">Back to Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );

  /* ── NOT YET CONFIRMED BY DOCTOR ─────────────────────── */
  if (pageState === 'awaiting') return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-redirecting-icon">
            <Clock size={52} color="var(--primary)"/>
          </div>
          <h2 className="pay-result-title">Awaiting Doctor Confirmation</h2>
          <p className="pay-result-sub">
            Your appointment request has been sent to the doctor. Once they confirm it, you'll be
            able to pay and unlock your consultation. We'll let you know as soon as it's confirmed.
          </p>
          <div className="pay-result-actions">
            <Link to="/patient/appointments" className="btn-primary-pd">
              <Calendar size={15}/> View My Appointments
            </Link>
            <Link to="/" className="btn-outline-pd">Back to Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );

  /* ── REDIRECTING TO JAZZCASH ─────────────────────────── */
  if (pageState === 'redirecting') return (
    <Layout>
      {jazzFields && (
        <form ref={jazzFormRef} method="POST" action={jazzEndpoint} style={{ display:'none' }}>
          {Object.entries(jazzFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}
        </form>
      )}
      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-redirecting-icon">
            <Loader size={52} color="var(--primary)" className="pay-spin"/>
          </div>
          <h2 className="pay-result-title">Redirecting to JazzCash...</h2>
          <p className="pay-result-sub">
            You are being securely redirected to the JazzCash payment portal. Do not close this tab.
          </p>
          <div className="pay-secure-note">
            <Lock size={14}/> Secured by JazzCash · 256-bit Encryption
          </div>
        </div>
      </div>
    </Layout>
  );

  const doc = appointment?.doctor?.user || {};

  /* ── PAYMENT FORM ────────────────────────────────────── */
  return (
    <Layout>
      <div className="pd-container pd-section">

        <div className="dd-breadcrumb" style={{ marginBottom:20 }}>
          <Link to="/patient/appointments">My Appointments</Link>
          <ChevronRight size={13}/>
          <span>Payment</span>
        </div>

        <div className="pay-layout">

          {/* Form */}
          <div className="pay-form-card">
            <h2 className="ba-title"><CreditCard size={20}/> Complete Payment</h2>
            <p className="ba-sub">Choose your preferred payment method to unlock your consultation</p>

            <form onSubmit={handlePayment}>

              <div className="ba-field">
                <label className="ba-label">Payment Method</label>
                <div className="pay-methods">
                  {METHODS.map(m => (
                    <button key={m.id} type="button"
                      className={`pay-method-card ${method === m.id ? 'active' : ''}`}
                      style={method === m.id ? { borderColor: m.color, background: m.bg } : {}}
                      onClick={() => setMethod(m.id)}>
                      <div className="pay-method-left">
                        <span className="pay-method-icon">{m.icon}</span>
                        <div>
                          <div className="pay-method-label">
                            {m.label}
                            {m.badge && <span className="pay-method-badge">{m.badge}</span>}
                          </div>
                          <div className="pay-method-desc">{m.description}</div>
                        </div>
                      </div>
                      {method === m.id && <CheckCircle size={18} color={m.color}/>}
                    </button>
                  ))}
                </div>
              </div>

              {method === 'jazzcash' && (
                <div className="pay-instructions" style={{ background:'#FEF2F2', borderColor:'#FECACA' }}>
                  <AlertCircle size={15} color="#EF4444"/>
                  <div>
                    <p className="pay-inst-title">How JazzCash Payment Works</p>
                    <p className="pay-inst-text">
                      Click the button below. You will be securely redirected to JazzCash.
                      Enter your mobile number and approve the payment. You will be returned here automatically.
                    </p>
                  </div>
                </div>
              )}

              {method === 'bank' && (
                <>
                  <div className="pay-instructions">
                    <AlertCircle size={15}/>
                    <div>
                      <p className="pay-inst-title">Bank Transfer Details</p>
                      <p className="pay-inst-text">
                        Bank: {import.meta.env.VITE_BANK_NAME || 'HBL'} &nbsp;|&nbsp;
                        Account: {import.meta.env.VITE_BANK_ACCOUNT || '—'} &nbsp;|&nbsp;
                        Title: {import.meta.env.VITE_BANK_TITLE || 'PhysioDesk Pvt Ltd'}
                      </p>
                      <p className="pay-inst-text">Amount: <strong>Rs. {Number(appointment?.fee).toLocaleString()}</strong></p>
                      <p className="pay-inst-text" style={{ marginTop:6, color:'var(--gray-500)' }}>
                        Note: bank transfers are confirmed after our team verifies the funds — usually within a few hours.
                      </p>
                    </div>
                  </div>

                  <div className="ba-field">
                    <label className="ba-label">Transaction Reference Number *</label>
                    <input value={ref} onChange={e => setRef(e.target.value)}
                      placeholder="Enter reference number from your bank"
                      className="ba-input" required />
                  </div>

                  <div className="ba-field">
                    <label className="ba-label"><Upload size={14}/> Upload Receipt <span className="ba-optional">(recommended)</span></label>
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setReceipt(e.target.files?.[0] || null)}
                      className="ba-input" />
                    {receipt && <p className="pay-inst-text" style={{ marginTop:6 }}>Selected: {receipt.name}</p>}
                  </div>
                </>
              )}

              <button type="submit" className="ba-submit" disabled={paying}>
                {paying ? <span className="auth-spinner"/> :
                  method === 'jazzcash'
                    ? <><Smartphone size={16}/> Pay Rs. {Number(appointment?.fee).toLocaleString()} with JazzCash</>
                    : <><Building size={16}/> Submit Bank Transfer</>
                }
              </button>
            </form>
          </div>

          {/* Summary */}
          <div className="pay-summary-card">
            <p className="ba-summary-title">Appointment Summary</p>
            <div className="ba-doc-info">
              <div className="ba-doc-placeholder">{doc.name?.[0] || 'D'}</div>
              <div>
                <p className="ba-doc-name">Dr. {doc.name}</p>
                <p className="ba-doc-spec">{appointment?.doctor?.specialization}</p>
              </div>
            </div>
            <div className="ba-summary-items">
              <div className="ba-summary-item">
                <span>Date</span>
                <span className="ba-summary-val">{appointment?.appointment_date}</span>
              </div>
              <div className="ba-summary-item">
                <span>Time</span>
                <span className="ba-summary-val">{appointment?.appointment_time}</span>
              </div>
              <div className="ba-summary-item">
                <span>Type</span>
                <span className="ba-summary-val" style={{ display:'flex', alignItems:'center', gap:5 }}>
                  {appointment?.type === 'video'
                    ? <><Video size={13}/> Video Call</>
                    : <><MapPin size={13}/> In-Person</>}
                </span>
              </div>
              <div className="ba-summary-item">
                <span>Status</span>
                <span className="pd-badge pd-badge-warning">{appointment?.status}</span>
              </div>
              <div className="ba-summary-divider"/>
              <div className="ba-summary-item ba-summary-total">
                <span>Total Amount</span>
                <span className="ba-fee">Rs. {Number(appointment?.fee).toLocaleString()}</span>
              </div>
            </div>
            <div className="pay-secure-note" style={{ marginTop:16 }}>
              <Lock size={13}/> All transactions are encrypted and secure
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
