import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CreditCard, ChevronRight, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { appointmentAPI, paymentAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './PaymentPage.css';

const METHODS = [
  {
    id: 'jazzcash',
    label: 'JazzCash',
    color: '#EF4444',
    bg: '#FEF2F2',
    icon: '📱',
    badge: 'Recommended',
    description: 'Pay instantly using your JazzCash mobile wallet',
  },
  {
    id: 'bank',
    label: 'Bank Transfer',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: '🏦',
    badge: null,
    description: 'Transfer to our HBL account and enter reference',
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: '💵',
    badge: null,
    description: 'Pay cash when doctor joins the session',
  },
];

export default function PaymentPage() {
  const { appointmentId }             = useParams();
  const [searchParams]                = useSearchParams();
  const navigate                      = useNavigate();
  const jazzFormRef                   = useRef(null);
  const [appointment, setAppointment] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [method,      setMethod]      = useState('jazzcash');
  const [ref,         setRef]         = useState('');
  const [paying,      setPaying]      = useState(false);
  const [jazzFields,  setJazzFields]  = useState(null);
  const [jazzEndpoint,setJazzEndpoint]= useState('');
  const [pageState,   setPageState]   = useState('form'); // 'form' | 'success' | 'failed' | 'redirecting'

  // Check if coming back from JazzCash callback
  useEffect(() => {
    const status  = searchParams.get('jazzcash');
    const txn     = searchParams.get('txn');
    const rrn     = searchParams.get('rrn');
    const reason  = searchParams.get('reason');

    if (status === 'success') {
      setPageState('success');
      return;
    }
    if (status === 'failed') {
      setPageState('failed');
      toast.error(reason || 'Payment failed. Please try again.');
      return;
    }

    // Normal load — fetch appointment
    appointmentAPI.getById(appointmentId)
      .then(r => setAppointment(r.data.data))
      .catch(() => { toast.error('Appointment not found'); navigate('/patient/appointments'); })
      .finally(() => setLoading(false));
  }, []);

  // Auto-submit the JazzCash form after fields are ready
  useEffect(() => {
    if (jazzFields && jazzFormRef.current) {
      setTimeout(() => {
        jazzFormRef.current.submit();
      }, 500); // small delay so user sees the redirect message
    }
  }, [jazzFields]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaying(true);

    try {
      if (method === 'jazzcash') {
        // Step 1: Get JazzCash form fields from backend
        const res = await paymentAPI.initiateJazzCashAppointment(appointmentId);
        const { endpoint, fields } = res.data.data;

        setJazzEndpoint(endpoint);
        setJazzFields(fields);
        setPageState('redirecting');

      } else {
        // Manual payment (bank/cod)
        if (method === 'bank' && !ref.trim()) {
          toast.error('Please enter your bank transaction reference number');
          setPaying(false);
          return;
        }
        await paymentAPI.payAppointment(appointmentId, { method, reference_number: ref });
        setPageState('success');
        toast.success('Payment recorded successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed. Try again.');
      setPaying(false);
    }
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────────────────
  if (pageState === 'success') return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-result-icon pay-success-icon">
            <CheckCircle size={56} color="#16A34A"/>
          </div>
          <h2 className="pay-result-title">Payment Successful! 🎉</h2>
          <p className="pay-result-sub">
            Your appointment is confirmed. The doctor will join at the scheduled time.
          </p>
          <div className="pay-result-actions">
            <Link to="/patient/appointments" className="btn-primary-pd">
              📅 View My Appointments
            </Link>
            <Link to="/" className="btn-outline-pd">Back to Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );

  // ── FAILED SCREEN ──────────────────────────────────────────────────────────
  if (pageState === 'failed') return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-result-icon pay-failed-icon">
            <XCircle size={56} color="#DC2626"/>
          </div>
          <h2 className="pay-result-title">Payment Failed</h2>
          <p className="pay-result-sub">
            {searchParams.get('reason') || 'Your payment was not completed.'}
          </p>
          <div className="pay-result-actions">
            <button className="btn-primary-pd" onClick={() => setPageState('form')}>
              🔄 Try Again
            </button>
            <Link to="/patient/appointments" className="btn-outline-pd">
              My Appointments
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );

  // ── REDIRECTING TO JAZZCASH ────────────────────────────────────────────────
  if (pageState === 'redirecting') return (
    <Layout>
      {/* Hidden form that auto-submits to JazzCash */}
      {jazzFields && (
        <form
          ref={jazzFormRef}
          method="POST"
          action={jazzEndpoint}
          style={{ display: 'none' }}
        >
          {Object.entries(jazzFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      <div className="pd-container pd-section">
        <div className="pay-result-card">
          <div className="pay-redirecting-icon">
            <Loader size={52} color="#014E78" className="pay-spin"/>
          </div>
          <h2 className="pay-result-title">Redirecting to JazzCash...</h2>
          <p className="pay-result-sub">
            Please wait. You are being securely redirected to the JazzCash payment portal.
            Do not close this tab.
          </p>
          <div className="pay-jazzcash-logo">📱 JazzCash Secure Payment</div>
        </div>
      </div>
    </Layout>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (loading) return <Layout><div className="pd-spinner" style={{ marginTop: 80 }}/></Layout>;

  const doc = appointment?.doctor?.user || {};

  // ── PAYMENT FORM ───────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="pd-container pd-section">

        {/* Breadcrumb */}
        <div className="dd-breadcrumb">
          <Link to="/patient/appointments">My Appointments</Link>
          <ChevronRight size={13}/>
          <span>Payment</span>
        </div>

        <div className="pay-layout">

          {/* ── Payment form ── */}
          <div className="pay-form-card">
            <h2 className="ba-title">
              <CreditCard size={20}/> Complete Payment
            </h2>
            <p className="ba-sub">Choose your preferred payment method</p>

            <form onSubmit={handlePayment}>

              {/* Method selection */}
              <div className="ba-field">
                <label className="ba-label">Payment Method</label>
                <div className="pay-methods">
                  {METHODS.map(m => (
                    <button
                      key={m.id} type="button"
                      className={`pay-method-card ${method === m.id ? 'active' : ''}`}
                      style={method === m.id
                        ? { borderColor: m.color, background: m.bg }
                        : {}}
                      onClick={() => setMethod(m.id)}
                    >
                      <div className="pay-method-left">
                        <span className="pay-method-icon">{m.icon}</span>
                        <div>
                          <div className="pay-method-label">
                            {m.label}
                            {m.badge && (
                              <span className="pay-method-badge">{m.badge}</span>
                            )}
                          </div>
                          <div className="pay-method-desc">{m.description}</div>
                        </div>
                      </div>
                      {method === m.id && (
                        <CheckCircle size={18} color={m.color}/>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* JazzCash info */}
              {method === 'jazzcash' && (
                <div className="pay-jazzcash-info">
                  <AlertCircle size={15} color="#EF4444"/>
                  <div>
                    <p className="pay-inst-title">How JazzCash Payment Works</p>
                    <p className="pay-inst-text">
                      1. Click "Pay with JazzCash" below.<br/>
                      2. You will be redirected to the JazzCash secure payment page.<br/>
                      3. Enter your JazzCash mobile number and complete the payment.<br/>
                      4. You will be automatically redirected back here with confirmation.
                    </p>
                  </div>
                </div>
              )}

              {/* Bank transfer info */}
              {method === 'bank' && (
                <div className="pay-instructions">
                  <AlertCircle size={15}/>
                  <div>
                    <p className="pay-inst-title">Bank Transfer Details</p>
                    <p className="pay-inst-text">
                      Bank: HBL | Account: 0123-456789-01 | Title: PhysioDesk Pvt Ltd
                    </p>
                    <p className="pay-inst-text">
                      Amount: <strong>Rs. {Number(appointment?.fee).toLocaleString()}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Bank reference input */}
              {method === 'bank' && (
                <div className="ba-field">
                  <label className="ba-label">Transaction Reference Number *</label>
                  <input
                    value={ref}
                    onChange={e => setRef(e.target.value)}
                    placeholder="Enter reference number from your bank"
                    style={{
                      width: '100%', border: '1.5px solid var(--gray-200)',
                      borderRadius: 8, padding: '10px 14px',
                      fontSize: 13, outline: 'none',
                    }}
                    required
                  />
                </div>
              )}

              {/* COD info */}
              {method === 'cod' && (
                <div className="pay-instructions" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
                  <span style={{ fontSize: 20 }}>💵</span>
                  <div>
                    <p className="pay-inst-title">Cash on Delivery</p>
                    <p className="pay-inst-text">
                      Payment will be collected at the time of your consultation.
                      No upfront payment required.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button type="submit" className="ba-submit" disabled={paying}>
                {paying ? (
                  <span className="auth-spinner"/>
                ) : method === 'jazzcash' ? (
                  <>📱 Pay Rs. {Number(appointment?.fee).toLocaleString()} with JazzCash</>
                ) : method === 'bank' ? (
                  <>🏦 Confirm Bank Payment — Rs. {Number(appointment?.fee).toLocaleString()}</>
                ) : (
                  <>💵 Confirm Cash on Delivery</>
                )}
              </button>
            </form>
          </div>

          {/* ── Summary sidebar ── */}
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
                <span className="ba-summary-val" style={{ textTransform: 'capitalize' }}>
                  {appointment?.type === 'video' ? '📹 Video Call' : '🏥 In-Person'}
                </span>
              </div>
              <div className="ba-summary-item">
                <span>Status</span>
                <span className="pd-badge pd-badge-warning">{appointment?.status}</span>
              </div>
              <div className="ba-summary-divider"/>
              <div className="ba-summary-item ba-summary-total">
                <span>Total Amount</span>
                <span className="ba-fee">
                  Rs. {Number(appointment?.fee).toLocaleString()}
                </span>
              </div>
            </div>

            {/* JazzCash secure badge */}
            {method === 'jazzcash' && (
              <div className="pay-secure-badge">
                🔒 Secured by JazzCash · 256-bit Encrypted
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
