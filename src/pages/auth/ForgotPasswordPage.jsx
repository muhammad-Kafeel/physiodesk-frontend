import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { patientAuthAPI, doctorAuthAPI, adminAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

const API        = { patient: patientAuthAPI, doctor: doctorAuthAPI, admin: adminAuthAPI };
const LOGIN_PATH = { patient: '/patient/login', doctor: '/doctor/login', admin: '/admin/login' };

export default function ForgotPasswordPage({ role = 'patient' }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API[role].forgotPassword({ email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <Link to="/" className="ap-panel" style={{ textDecoration: 'none' }}>
        <div className="ap-wordmark">
          <div className="ap-wordmark-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="12" y="3" width="2" height="20" rx="1" fill="white"/>
              <rect x="3" y="12" width="20" height="2" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="ap-wordmark-name">PhysioDesk</span>
        </div>
      </Link>

      <div className="ap-side">
        <div className="ap-box">
          {sent ? (
            <>
              <h1 className="ap-heading">Check your email</h1>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 20 }}>
                If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
                The link expires in 60 minutes.
              </p>
              <Link to={LOGIN_PATH[role]} className="ap-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="ap-heading">Forgot password</h1>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 16 }}>
                Enter the email for your {role} account and we'll send you a reset link.
              </p>
              <form onSubmit={submit} className="ap-form">
                <div className="ap-field">
                  <label className="ap-label">Email</label>
                  <div className="ap-input-wrap">
                    <Mail size={14} className="ap-input-icon" />
                    <input className="ap-input" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required autoComplete="email" />
                  </div>
                </div>
                <button className="ap-btn" type="submit" disabled={loading}>
                  {loading ? <span className="ap-spin" /> : 'Send reset link'}
                </button>
              </form>
              <p className="ap-footer-link">
                <Link to={LOGIN_PATH[role]}>
                  <ArrowLeft size={12} style={{ verticalAlign: 'middle' }} /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
