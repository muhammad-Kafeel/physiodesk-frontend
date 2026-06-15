import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../context/AuthContext';
import { adminAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

// This page is not linked from any public page — direct URL only: /admin/login
export default function AdminLoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminAuthAPI.login(form);
      const { user, token } = data.data;
      login(user, token);   // portal is implicit — this is useAdminAuth
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <div className="ap-panel ap-panel--slate">
        <div className="ap-wordmark">
          <div className="ap-wordmark-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="12" y="3" width="2" height="20" rx="1" fill="white"/>
              <rect x="3" y="12" width="20" height="2" rx="1" fill="white"/>
            </svg>
          </div>
          <span className="ap-wordmark-name">PhysioDesk</span>
        </div>
      </div>

      <div className="ap-side">
        <div className="ap-box ap-box--slate">
          <h1 className="ap-heading">Sign in</h1>

          <form onSubmit={submit} className="ap-form">
            <div className="ap-field">
              <label className="ap-label">Email</label>
              <div className="ap-input-wrap">
                <Mail size={14} className="ap-input-icon" />
                <input className="ap-input" name="email" type="email"
                  value={form.email} onChange={handle}
                  placeholder="admin@physiodesk.com" required autoComplete="off" />
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-label">Password</label>
              <div className="ap-input-wrap">
                <Lock size={14} className="ap-input-icon" />
                <input className="ap-input" name="password"
                  type={show ? 'text' : 'password'}
                  value={form.password} onChange={handle}
                  placeholder="••••••••" required autoComplete="off" />
                <button type="button" className="ap-eye" tabIndex={-1}
                  onClick={() => setShow(p => !p)}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button className="ap-btn ap-btn--slate" type="submit" disabled={loading}>
              {loading ? <span className="ap-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="ap-footer-link" style={{ marginTop: 4, textAlign: 'center' }}>
            <Link to="/admin/forgot-password">Forgot password?</Link>
          </p>
          <p className="ap-admin-note">
            Authorised personnel only. All actions are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
