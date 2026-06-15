import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { patientAuthAPI, doctorAuthAPI, adminAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

const API        = { patient: patientAuthAPI, doctor: doctorAuthAPI, admin: adminAuthAPI };
const LOGIN_PATH = { patient: '/patient/login', doctor: '/doctor/login', admin: '/admin/login' };

export default function ResetPasswordPage({ role = 'patient' }) {
  const [params]   = useSearchParams();
  const token      = params.get('token') || '';
  const email      = params.get('email') || '';
  const navigate   = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const invalid = !token || !email;

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await API[role].resetPassword({ email, token, password, password_confirmation: confirm });
      toast.success('Password reset. Please sign in.');
      navigate(LOGIN_PATH[role]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.');
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
          <h1 className="ap-heading">Set a new password</h1>

          {invalid ? (
            <>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6, marginBottom: 20 }}>
                This reset link is missing information or invalid. Please request a new one.
              </p>
              <Link to={`/${role}/forgot-password`} className="ap-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                Request new link
              </Link>
            </>
          ) : (
            <form onSubmit={submit} className="ap-form">
              <div className="ap-field">
                <label className="ap-label">New Password</label>
                <div className="ap-input-wrap">
                  <Lock size={14} className="ap-input-icon" />
                  <input className="ap-input" type={show ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="new-password" />
                  <button type="button" className="ap-eye" tabIndex={-1} onClick={() => setShow(p => !p)}>
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Confirm Password</label>
                <div className="ap-input-wrap">
                  <Lock size={14} className="ap-input-icon" />
                  <input className="ap-input" type={show ? 'text' : 'password'}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••" required autoComplete="new-password" />
                </div>
              </div>
              <button className="ap-btn" type="submit" disabled={loading}>
                {loading ? <span className="ap-spin" /> : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
