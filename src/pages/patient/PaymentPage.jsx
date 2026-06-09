import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { appointmentAPI, paymentAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './PaymentPage.css';

const METHODS = [
  { id:'jazzcash',  label:'JazzCash',  color:'#EF4444', bg:'#FEF2F2', icon:'📱', hint:'Send to: 0300-0000000 | Account: PhysioDesk' },
  { id:'easypaisa', label:'EasyPaisa', color:'#16A34A', bg:'#F0FDF4', icon:'💚', hint:'Send to: 0333-0000000 | Account: PhysioDesk' },
  { id:'bank',      label:'Bank Transfer', color:'#2563EB', bg:'#EFF6FF', icon:'🏦', hint:'HBL: 0123-4567890 | Title: PhysioDesk Pvt Ltd' },
  { id:'cod',       label:'Cash on Delivery', color:'#D97706', bg:'#FFFBEB', icon:'💵', hint:'Pay when doctor joins the session' },
];

export default function PaymentPage() {
  const { appointmentId }               = useParams();
  const [appointment, setAppointment]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [method, setMethod]             = useState('jazzcash');
  const [ref, setRef]                   = useState('');
  const [paying, setPaying]             = useState(false);
  const [paid, setPaid]                 = useState(false);
  const navigate                        = useNavigate();

  useEffect(() => {
    appointmentAPI.getById(appointmentId)
      .then(r => setAppointment(r.data.data))
      .catch(() => { toast.error('Appointment not found'); navigate('/patient/appointments'); })
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const submit = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await paymentAPI.payAppointment(appointmentId, { method, reference_number: ref });
      setPaid(true);
      toast.success('Payment successful!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Layout><div className="pd-spinner" style={{marginTop:80}} /></Layout>;

  if (paid) return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pay-success">
          <CheckCircle size={64} color="#16A34A" />
          <h2>Payment Successful!</h2>
          <p>Your appointment has been confirmed. The doctor will join at the scheduled time.</p>
          <div className="pay-success-actions">
            <Link to="/patient/appointments" className="btn-primary-pd">View Appointments</Link>
            <Link to="/" className="btn-outline-pd">Back to Home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );

  const doc  = appointment?.doctor?.user || {};
  const sel  = METHODS.find(m => m.id === method);

  return (
    <Layout>
      <div className="pd-container pd-section">

        <div className="dd-breadcrumb">
          <Link to="/patient/appointments">My Appointments</Link>
          <ChevronRight size={13} />
          <span>Payment</span>
        </div>

        <div className="pay-layout">

          {/* Payment form */}
          <div className="pay-form-card">
            <h2 className="ba-title"><CreditCard size={20} /> Complete Payment</h2>
            <p className="ba-sub">Choose your preferred payment method</p>

            <form onSubmit={submit}>
              {/* Method selection */}
              <div className="ba-field">
                <label className="ba-label">Payment Method</label>
                <div className="pay-methods">
                  {METHODS.map(m => (
                    <button key={m.id} type="button"
                      className={`pay-method-card ${method === m.id ? 'active' : ''}`}
                      style={method === m.id ? { borderColor: m.color, background: m.bg } : {}}
                      onClick={() => setMethod(m.id)}>
                      <span className="pay-method-icon">{m.icon}</span>
                      <span className="pay-method-label">{m.label}</span>
                      {method === m.id && <span className="pay-method-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              {sel && method !== 'cod' && (
                <div className="pay-instructions">
                  <AlertCircle size={15} />
                  <div>
                    <p className="pay-inst-title">Payment Instructions</p>
                    <p className="pay-inst-text">{sel.hint}</p>
                    <p className="pay-inst-text">Amount: <strong>Rs. {Number(appointment?.fee).toLocaleString()}</strong></p>
                  </div>
                </div>
              )}

              {/* Reference number */}
              {method !== 'cod' && (
                <div className="ba-field">
                  <label className="ba-label">Transaction Reference Number</label>
                  <div className="auth-input-wrap">
                    <CreditCard size={15} className="auth-input-icon" />
                    <input
                      value={ref} onChange={e => setRef(e.target.value)}
                      placeholder="Enter transaction ID from your payment app"
                      style={{flex:1, border:'none', outline:'none', padding:'10px 0', fontSize:'13px'}}
                    />
                  </div>
                  <p className="pay-ref-hint">Enter the transaction ID you received after payment</p>
                </div>
              )}

              <button type="submit" className="ba-submit" disabled={paying}>
                {paying
                  ? <span className="auth-spinner" />
                  : <><CheckCircle size={16} /> Confirm Payment — Rs. {Number(appointment?.fee).toLocaleString()}</>
                }
              </button>
            </form>
          </div>

          {/* Order summary */}
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
                <span className="ba-summary-val" style={{textTransform:'capitalize'}}>{appointment?.type}</span>
              </div>
              <div className="ba-summary-item">
                <span>Status</span>
                <span className={`pd-badge ${appointment?.status === 'confirmed' ? 'pd-badge-success' : 'pd-badge-warning'}`}>
                  {appointment?.status}
                </span>
              </div>
              <div className="ba-summary-divider" />
              <div className="ba-summary-item ba-summary-total">
                <span>Total Amount</span>
                <span className="ba-fee">Rs. {Number(appointment?.fee).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
