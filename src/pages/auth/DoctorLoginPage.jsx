import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doctorAuthAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './AuthPages.css';

export default function DoctorLoginPage() {
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
      const { data } = await doctorAuthAPI.login(form);
      const { user, token } = data.data;
      login(user, token, 'doctor');
      toast.success(`Welcome, Dr. ${user.name.split(' ')[0]}!`);
      navigate(user.doctor ? '/doctor/dashboard' : '/doctor/profile?welcome=1');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <Link to="/" className="ap-panel ap-panel--teal" style={{ textDecoration: 'none' }}>
        <div className="ap-wordmark">
          <div className="ap-wordmark-icon">P</div>
          <span className="ap-wordmark-name">PhysioDesk</span>
        </div>
      </Link>

      <div className="ap-side">
        <div className="ap-box ap-box--teal">
          <h1 className="ap-heading">Sign in</h1>

          <form onSubmit={submit} className="ap-form">
            <div className="ap-field">
              <label className="ap-label">Email</label>
              <div className="ap-input-wrap">
                <Mail size={14} className="ap-input-icon" />
                <input className="ap-input" name="email" type="email"
                  value={form.email} onChange={handle}
                  placeholder="doctor@example.com" required autoComplete="email" />
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

            <button className="ap-btn ap-btn--teal" type="submit" disabled={loading}>
              {loading ? <span className="ap-spin" /> : 'Sign in'}
            </button>
          </form>

          <p className="ap-footer-link">
            No account? <Link to="/register/doctor">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
