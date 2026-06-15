import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { usePatientAuth } from '../../context/AuthContext';
import { patientAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

export default function PatientRegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', password_confirmation: '',
  });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = usePatientAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const { data } = await patientAuthAPI.register(form);
      const { user, token } = data.data;
      login(user, token);   // portal is implicit — this is usePatientAuth
      navigate('/patient/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) Object.values(errs).flat().forEach(m => toast.error(m));
      else toast.error(err.response?.data?.message || 'Registration failed');
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
          <h1 className="ap-heading">Create account</h1>

          <form onSubmit={submit} className="ap-form">
            <div className="ap-field">
              <label className="ap-label">Full name</label>
              <div className="ap-input-wrap">
                <User size={14} className="ap-input-icon" />
                <input className="ap-input" name="name" type="text"
                  value={form.name} onChange={handle}
                  placeholder="Ahmed Raza" required />
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-label">Email</label>
              <div className="ap-input-wrap">
                <Mail size={14} className="ap-input-icon" />
                <input className="ap-input" name="email" type="email"
                  value={form.email} onChange={handle}
                  placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>

            <div className="ap-field">
              <label className="ap-label">Phone <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
              <div className="ap-input-wrap">
                <Phone size={14} className="ap-input-icon" />
                <input className="ap-input" name="phone" type="tel"
                  value={form.phone} onChange={handle}
                  placeholder="+92-300-0000000" />
              </div>
            </div>

            <div className="ap-row">
              <div className="ap-field">
                <label className="ap-label">Password</label>
                <div className="ap-input-wrap">
                  <Lock size={14} className="ap-input-icon" />
                  <input className="ap-input" name="password"
                    type={show ? 'text' : 'password'}
                    value={form.password} onChange={handle}
                    placeholder="Min 8 chars" required />
                  <button type="button" className="ap-eye" tabIndex={-1}
                    onClick={() => setShow(p => !p)}>
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="ap-field">
                <label className="ap-label">Confirm</label>
                <div className="ap-input-wrap">
                  <Lock size={14} className="ap-input-icon" />
                  <input className="ap-input" name="password_confirmation"
                    type={show ? 'text' : 'password'}
                    value={form.password_confirmation} onChange={handle}
                    placeholder="Repeat" required />
                </div>
              </div>
            </div>

            <button className="ap-btn" type="submit" disabled={loading}>
              {loading ? <span className="ap-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="ap-footer-link">
            Already have an account? <Link to="/patient/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
