import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patientAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

export default function PatientLoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await patientAuthAPI.login(form);
      const { user, token } = data.data;
      login(user, token, 'patient');
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/patient/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <Link to="/" className="ap-panel" style={{ textDecoration: 'none' }}>
        <div className="ap-wordmark">
          <div className="ap-wordmark-icon">P</div>
          <span className="ap-wordmark-name">PhysioDesk</span>
        </div>
      </Link>

      <div className="ap-side">
        <div className="ap-box">
          <h1 className="ap-heading">Sign in</h1>

          <form onSubmit={submit} className="ap-form">
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
              <label className="ap-label">Password</label>
              <div className="ap-input-wrap">
                <Lock size={14} className="ap-input-icon" />
                <input className="ap-input" name="password"
                  type={show ? 'text' : 'password'}
                  value={form.password} onChange={handle}
                  placeholder="••••••••" required autoComplete="current-password" />
                <button type="button" className="ap-eye" tabIndex={-1}
                  onClick={() => setShow(p => !p)}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button className="ap-btn" type="submit" disabled={loading}>
              {loading ? <span className="ap-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="ap-footer-link">
            No account? <Link to="/register/patient">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
